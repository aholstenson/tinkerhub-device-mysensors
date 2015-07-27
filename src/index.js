const th = require('tinkerhub');
const controller = require('./controller');

const device = {
    metadata: {
        name: 'MySensors',

        type: 'bridge',

        capabilities: [ 'state' ]
    },

    state: function() {
        if(this._controller) {
            // TODO: Send back information about if we are succcessfully connected
            return {
                configured: true
            };
        } else {
            return {
                configured: false
            };
        }
    },

    _connect: function(data) {
        if(this._controller) {
            this._controller.close();
        }

        if(data.device) {
            this._controller = controller.serial(th.storage.sub('mysensors'), data.device);
        } else {
            this._controller = controller.remote(th.storage.sub('mysensors'), data.host, data.port);
        }
    },

    connectLocal: function(serialDevice) {
        const info = {
            device: serialDevice
        };

        th.storage.put('mysensors', info);
        this._connect(info);
    },

    connectNetwork: function(host, port) {
        const info = {
            host: host,
            port: port
        };

        th.storage.put('mysensors', info);
        this._connect(info);
    }
};

th.devices.register('mysensors:controller', device);

const connection = th.storage.get('mysensors');
if(connection) {
    device._connect(connection);
}
