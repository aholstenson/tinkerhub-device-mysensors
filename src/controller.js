const SerialPort = require('serialport').SerialPort;
const net = require('net');
const sensorFactory = require('./sensor');
const debug = require('debug')('th.mysensors');

const BroadcastAddress = 255;
const NodeSensorId = 255;
const SensorTimeout = 7 * 24 * 60 * 60 * 1000;
const SensorLiveness = 60 * 60 * 1000;
const SensorDeviceTimeout = SensorLiveness * 2;

const Commands = {
    Presentation: 0,
    Set: 1,
    Req: 2,
    Internal: 3,
    Stream: 4
};

const InternalMessage = {
    BatteryLevel: 0,
    Time: 1,
    Version: 2,
    IdRequest: 3,
    IdResponse: 4,
    InclusionMode: 5,
    Config: 6,
    FindParent: 7,
    FindParentRepsonse: 8,
    LogMessage: 9,
    Children: 10,
    SketchName: 11,
    SketchVersion: 12,
    Reboot: 13
};

class Controller {
    constructor(storage, com) {
        this._storage = storage;
        this._buffer = [];
        this._sensors = this._storage.get('sensors') || {};
        this._nodes = this._storage.get('nodes') || {};
        this._devices = {};

        this._com = com;

        this._connect();

        setInterval(() => {
            this._storage.put('sensors', this._sensors);
            this._storage.put('nodes', this._nodes);
        }, 1000);

        this._bridgeSensors();
    }

    close() {
        this._com.disconnect(this._socket);
    }

    _connect() {
        this._socket = this._com.connect()
            .on('data', data => this._handleData(data))
    		.on('error', () => {
                console.log('Received an error from the socket');
                // TODO: Reconnect
                setTimeout(this._connect.bind(this), 5000);
            });
    }

    _handleData(data) {
        let str = data.toString();

        while(str.length) {
            const idx = str.indexOf('\n');
            if(idx === -1) {
                this._buffer.push(str);
                return;
            } else {
                const msg = this._buffer.join('') + str.substring(0, idx);
                this._buffer.length = 0;

                debug('Received', msg);
                const msgData = msg.split(';');
                this._message({
                    sender: parseInt(msgData[0]),
                    sensor: parseInt(msgData[1]),
                    command: parseInt(msgData[2]),
                    ack: parseInt(msgData[3]),
                    type: parseInt(msgData[4]),
                    payload: msgData[5]
                });

                str = str.substring(idx+1);
            }
        }
    }

    _message(msg) {
        // Update the lastSeen of the sender if needed
        const node = this._nodes[msg.sender] || (this._nodes[msg.sender] = {});
        const now = node.lastSeen = Date.now();
        if(! node.lastSeen || node.lastSeen + SensorLiveness < now) {
            node.lastSeen = now;
        }

        switch(msg.command) {
            case Commands.Presentation:
                this._handlePresentation(msg);
                break;
            case Commands.Set:
                const device = this._device(msg.sender, msg.sensor);
                if(device) device._receive(msg.type, msg.payload);
                break;
            case Commands.Req:
                break;
            case Commands.Internal:
                this._handleInternalMessage(msg);
                break;
            case Commands.Stream:
                break;
        }
    }

    _handleInternalMessage(msg) {
        switch(msg.type) {
            case InternalMessage.IdRequest:
                const nextId = this._findFreeId();
                this._sendMessage(BroadcastAddress, {
                    sensor: NodeSensorId,
                    command: Commands.Internal,
                    type: InternalMessage.IdResponse,
                    payload: nextId
                });
                break;
            case InternalMessage.Config:
                this._sendMessage(msg.sender, {
                    sensor: NodeSensorId,
                    command: Commands.Internal,
                    type: InternalMessage.Config,
                    payload: 'M' // always metric for now
                });
                break;
            case InternalMessage.Time:
                this._sendMessage(msg.sender, {
                    sensor: msg.sensor,
                    command: Commands.Internal,
                    type: InternalMessage.Time,
                    payload: Math.floor(Date.now() / 1000)
                });
                break;
            case InternalMessage.SketchName:
                const node = this._nodes[msg.sender] || (this._nodes[msg.sender] = {});
                node.name = msg.payload;
        }
    }

    _handlePresentation(msg) {
        const sensor = this._sensor(msg.sender, msg.sensor);
        if(! sensor) return;

        sensor.type = msg.type;
        if(msg.payload && ! msg.payload.match(/^[0-9]+(\.[0-9]+)$/)) {
            sensor.description = msg.payload;
        }

        this._bridgeSensor(sensor);
    }

    _sendMessage(destination, msg) {
        const encoded = destination.toString(10) + ';' +
            msg.sensor.toString(10) + ';' +
            msg.command.toString(10) + ';' +
            (msg.ack || 0).toString(10) + ';' +
            (msg.type || 0).toString(10) + ';' +
            (msg.payload || '') + '\n';

        debug('Sending', encoded);

        this._socket.write(encoded);
    }

    _findFreeId() {
        const now = Date.now();
        for(let i=1; i<255; i++) {
            if(! this._nodes[i] || now - this._nodes[i].lastSeen > SensorTimeout) {
                return i;
            }
        }

        return 255;
    }

    _sensor(node, id) {
        if(id === NodeSensorId) return null;

        const key = node + ':' + id;
        return this._sensors[key] || (this._sensors[key] = {
            node: node,
            id: id
        });
    }

    /**
     * Bridge all of the remembered sensors.
     */
    _bridgeSensors() {
        const now = Date.now();
        Object.keys(this._sensors).forEach(key => {
            const sensor = this._sensors[key];
            if(sensor.type) {
                const node = this._nodes[sensor.node];
                if(node.lastSeen + SensorDeviceTimeout > now) {
                    this._bridgeSensor(sensor);
                }
            }
        });
    }

    /**
     * Bridge the given sensor
     */
    _bridgeSensor(sensor) {
        console.log(sensor);

        const key = sensor.node + ':' + sensor.id;
        let device = this._devices[key];
        if(device) return device;

        const node = this._nodes[sensor.node];
        this._devices[key] = device = sensorFactory(this, node, sensor);
        return device;
    }

    _device(node, id) {
        return this._devices[node + ':' + id];
    }
}

module.exports.serial = function(storage, device, baud = 115200) {
    return new Controller(storage, {
        connect() {
            return new SerialPort(device, { baudrate: baud });
        },

        disconnect(socket) {
            socket.close();
        }
    });
};

module.exports.remote = function(storage, host, port) {
    return new Controller(storage, {
        connect() {
            const socket = net.connect(port, host);
            socket.setEncoding('ascii');
            return socket;
        },

        disconnect(socket) {
            socket.end();
        }
    });
};
