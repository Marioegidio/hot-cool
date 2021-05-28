var mqtt = require('mqtt');
var ip = "192.168.1.7"
var count = 0;
var client = mqtt.connect("mqtt://" + ip, { clientId: "tablet", username: "guest", password: "guest" });
console.log("connected flag  " + client.connected);

client.on('message', function (topic, message, packet) {
    console.log("message is " + message);
    console.log("topic is " + topic);
});


client.on("connect", function () {
    console.log("connected  " + client.connected);
})

var topic = "iot/devices/tablet";
console.log("subscribing to topics");
client.subscribe(topic, { qos: 0 });