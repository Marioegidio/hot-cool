
var mqtt = require('mqtt');
require('dotenv').config()

var topic = "iot/sensors/temperature"
var connected = false;

var options = {
    port: 1883,
    host: "mqtt://" + process.env.IP,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'guest',
    password: 'guest',
};

var client = mqtt.connect("mqtt://" + process.env.IP, options);

client.on("connect", function () {
    connected = true;
    mainLoop();
})

function sendData() {
    var randomTemperature = Math.floor(Math.random() * 45)
    console.log("-> Sending temperature: " + randomTemperature)
    client.publish(topic, randomTemperature.toString());
}


function mainLoop() {
    sendData()
    setTimeout(mainLoop, 60000);
};













