const Values = module.exports.Values = {
    Temp: 0,
    Humidity: 1,
    Light: 2,
    Dimmer: 3,
    Pressure: 4,
    Forecast: 5,
    Rain: 6,
    RainRate: 7,
    Windspeed: 8,
    Gust: 9,
    Direction: 10,
    UV: 11,
    Weight: 12,
    Distance: 13,
    Impedance: 14,
    Armed: 15,
    Tripped: 16,
    Watt: 17,
    KWH: 18,
    SceneOn: 19,
    SceneOff: 20,
    Heater: 21,
    HeaterSwitchPower: 22,
    LightLevel: 23,
    Var1: 24,
    Var2: 25,
    Var3: 26,
    Var4: 27,
    Var5: 28,
    Up: 29,
    Down: 30,
    Stop: 31,
    IrSend: 32,
    IrReceive: 33,
    Flow: 34,
    Volume: 35,
    LockStatus: 36,
    DustLevel: 37,
    Voltage: 38,
    Current: 39
};

module.exports.convert = function(type, value) {
    switch(type) {
        case Values.Temp:
        case Values.Humidity:
            return parseFloat(value);
        case Values.Light:
            return value === '1' ? true : false;
        case Values.Dimmer:
            return parseInt(value);
        case Values.Pressure:
            return parseFloat(value);
        case Values.Forecast:
            return String(value);
        case Values.Rain:
        case Values.RainRate:
        case Values.Windspeed:
        case Values.Gust:
        case Values.Direction:
        case Values.UV:
        case Values.Weight:
        case Values.Distance:
        case Values.Impedance:
            return parseFloat(value);
        case Values.Armed:
        case Values.Tripped:
            return value === '1' ? true : false;
        case Values.Watt:
        case Values.KWH:
            return parseFloat(value);
        case Values.SceneOn:
        case Values.SceneOff:
            return String(value);
        case Values.Heater:
            return String(value);
        case Values.HeaterSwitchPower:
            return value === '1' ? true : false;
        case Values.LightLevel:
            return parseInt(value);
        case Values.Var1:
        case Values.Var2:
        case Values.Var3:
        case Values.Var4:
        case Values.Var5:
        case Values.Up:
        case Values.Down:
        case Values.Stop:
        case Values.IrSend:
        case Values.IrReceive:
            return value;
        case Values.Flow:
        case Values.Volume:
            return parseFloat(value);
        case Values.LockStatus:
            return value === '1' ? true : false;
        case Values.DustLevel:
        case Values.Voltage:
        case Values.Current:
            return parseFloat(value);
    }

    return value;
};
