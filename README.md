Device for Tinkerhub that works as a controller for [MySensors](http://www.mysensors.org/).

Exposes a bridge device (with id `mysensors:controller`) that needs to be configured to use the correct MySensors gateway. This can be done with two actions on the device, `connectLocal(serialDevice)` or `connectNetwork(host, port)`.

When connected to a gateway this library will bridge all of the sensors creating individual devices for every node and sensors you have connected.
