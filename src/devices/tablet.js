var mqtt = require('mqtt');
require('dotenv').config()

var clientId = "tablet"
var username = "guest"
var password = "guest"

var client = mqtt.connect("mqtt://" + process.env.IP, { clientId: clientId, username: username, password: password });
client.on('message', function (topic, message, packet) {
    // show the logs
    console.log(message.toString())
});

client.on("connect", function () {
    console.log("\nconnected  " + client.connected);
})

var topic = "iot/devices/tablet";
client.subscribe(topic, { qos: 2 });










