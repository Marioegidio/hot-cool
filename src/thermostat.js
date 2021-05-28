var mqtt = require('mqtt');

var ip = "192.168.1.7"
var clientId = "thermostat"
var username = "guest"
var password = "guest"
var isOn = false;

var client = mqtt.connect("mqtt://" + ip, { clientId: clientId, username: username, password: password });
console.log("connected flag  " + client.connected);

client.on('message', function (topic, message, packet) {
    console.log("topic is " + topic);
    console.log("packet is " + packet);
    console.log("message is " + message);
    if (!isOn && message != "0") isOn = true;
    switch (Number(message)) {
        case 1:
            console.log("radiators started with min power!");
            break;
        case 2:
            console.log("radiators started with medium power!");
            break;
        case 3:
            console.log("radiators started with max power!");
            break;
        default:
            if (isOn) {
                console.log("radiators stopped!");
                if (!isOn) isOn = true;
            }
            break;
    }
});

client.on("connect", function () {
    console.log("connected  " + client.connected);
})

var topic = "iot/devices/thermostat";
console.log("subscribing to topics");
client.subscribe(topic, { qos: 0 });