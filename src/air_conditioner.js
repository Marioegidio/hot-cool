var mqtt = require('mqtt');

var ip = "192.168.1.7"
var clientId = "conditioner"
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
            console.log("conditioner started with min power!");
            break;
        case 2:
            console.log("conditioner started with medium power!");
            break;
        case 3:
            console.log("conditioner started with max power!");
            break;
        default:
            if (isOn) {
                console.log("conditioner stopped!");
                isOn = false;
            }
            break;
    }
});

client.on("connect", function () {
    console.log("connected  " + client.connected);
})

var topic = "iot/devices/conditioner";
console.log("subscribing to topics");
client.subscribe(topic, { qos: 0 });