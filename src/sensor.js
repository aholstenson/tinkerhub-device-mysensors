var th = require('tinkerhub');
var values = require('./values');

const types = {};
const customTypes = {};
const dummy = {
    _receive(valueType, value) {},

    _remove() {}
};

module.exports = function(controller, node, def) {
    const type = types[def.type];
    if(! type) return dummy;

    const instance = type(node, def);
    instance._device = th.devices.register('mysensors:' + def.node + ':' + def.id, instance);
    instance._remove = instance._device._remove.bind(instance._device);
    return instance;
};

module.exports.register = function(customId, factory) {
    customTypes[customId] = factory;
};

const Types = module.exports.Types = {
    Door: 0,
    Motion: 1,
    Smoke: 2,
    Light: 3,
    Dimmer: 4,
    Cover: 5,
    Temperature: 6,
    Humidity: 7,
    Barometer: 8,
    Wind: 9,
    Rain: 10,
    UV: 11,
    Weight: 12,
    Power: 13,
    Heater: 14,
    Distance: 15,
    LightLevel: 16,
    ArduinoNode: 17,
    ArduinoRelay: 18,
    Lock: 19,
    IR: 20,
    Water: 21,
    AirQuality: 22,
    Custom: 23,
    Dust: 24,
    SceneController: 25
};

function nameOfType(id) {
    for(let x in Types) {
        if(Types[x] === id) {
            return x;
        }
    }

    return null;
}

const singleValueType = function(node, def) {
    const name = (node.name ? node.name + ' - ' : '') +
        (def.description || nameOfType(def.type));
    return {
        metadata: {
            type: [ 'sensor' ],

            name: name,

            capabilities: [ 'nameable' ]
        },

        value: null,

        _receive(valueType, value) {
            value = values.convert(valueType, value);
            this.value = value;
            this._device.emit('value', value);
        }
    };
};

types[Types.Door] = singleValueType;
types[Types.Motion] = singleValueType;
types[Types.Smoke] = singleValueType;
types[Types.Light] = singleValueType;
types[Types.Dimmer] = singleValueType;
types[Types.Cover] = singleValueType;
types[Types.Temperature] = singleValueType;
types[Types.Humidity] = singleValueType;
types[Types.Barometer] = singleValueType;
types[Types.Wind] = singleValueType;
types[Types.Rain] = singleValueType;
types[Types.UV] = singleValueType;
types[Types.Power] = singleValueType;
// TODO: Heater
types[Types.Distance] = singleValueType;
types[Types.LightLevel] = singleValueType;
// Skipped ArduinoNode and Arduino Relay
// TODO: Lock
// TODO: IR
types[Types.Water] = singleValueType;
types[Types.AirQuality] = singleValueType;
// Skipped Custom
types[Types.Dust] = singleValueType;
// TODO: SceneController
