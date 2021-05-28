var mqtt = require('mqtt');
require('dotenv').config()

var clientId = "tablet"
var username = "guest"
var password = "guest"

var client = mqtt.connect("mqtt://" + process.env.IP, { clientId: clientId, username: username, password: password });
client.on('message', function (topic, message, packet) {

    var temperature = Number(message.toString().split("-")[0])
    var power = Number(message.toString().split("-")[1])
    var action = message.toString().split("-")[2]

    switch (action) {
        case "down":
            console.log("\n-> The temperature is too high! [" + temperature + "°]");
            console.log("   Setting conditioner to power " + power + " ...");
            break;
        case "up":
            console.log("\n-> The temperature is too low! [" + temperature + "°]");
            console.log("   Setting radiators to power " + power + " ...");
            break;
        case "stop":
            console.log("\n-> The temperature is good! [" + temperature + "°]");
            console.log("   Stopping conditioner and radiators ...");
            break;
    }

});

client.on("connect", function () {
    console.log("\nconnected  " + client.connected);
})

var topic = "iot/devices/tablet";
client.subscribe(topic, { qos: 2 });
















