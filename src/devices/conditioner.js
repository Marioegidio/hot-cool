var mqtt = require('mqtt');
var request = require('request')
require('dotenv').config()

var topicTemperature = "iot/sensors/temperature"
var clientId = "conditioner"
var username = "guest"
var password = "guest"
var isOn = false;

var client = mqtt.connect("mqtt://" + process.env.IP, { clientId: clientId, username: username, password: password });
// console.log("connected flag  " + client.connected);

client.on('message', function (topic, message, packet) {

    var temperature = Number(message.toString().split("-")[0])
    var power = Number(message.toString().split("-")[1])
    console.log("\n\n\ntemperature is " + temperature);
    console.log("power is " + power);

    if (!isOn && power != 0) isOn = true;
    switch (power) {
        case 1:
            console.log("\n-> conditioner started with min power!");
            changeTemperatureHandler(temperature, power)
            break;
        case 2:
            console.log("\n-> conditioner started with medium power!");
            changeTemperatureHandler(temperature, power)
            break;
        case 3:
            console.log("\n-> conditioner started with max power!");
            changeTemperatureHandler(temperature, power)
            sendMail(temperature, power)
            break;
        case 4:
            console.log("\n-> conditioner started with max power! (Attention temperature is to high)");
            changeTemperatureHandler(temperature, power)
            sendMail(temperature, power)
            break;
        default:
            if (isOn) {
                console.log("\n-> conditioner stopped!");
                isOn = false;
            }
            break;
    }
});

client.on("connect", function () {
    console.log("\nconnected  " + client.connected);
})

var topic = "iot/devices/conditioner";
client.subscribe(topic, { qos: 2 });



function sendMail(temperature, power) {

    request({
        url: ' https://maker.ifttt.com/trigger/triggerIotMail/with/key/' + process.env.IFTT_KEY,
        qs: {
            "value1": "conditioner",
            "value2": power,
            "value3": temperature,
        },
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        if (error) {
            //console.log(error);
        } else {
            //console.log(response.statusCode, body);
        }
    });
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function changeTemperatureHandler(temperature, power) {
    await sleep(4000 / power);
    changeTemperature(temperature, power)
}


function changeTemperature(temperature, power) {
    temperature = temperature - power
    client.publish(topicTemperature, temperature.toString());
}
