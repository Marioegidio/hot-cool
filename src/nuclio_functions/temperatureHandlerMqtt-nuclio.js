var mqtt = require('mqtt');

const FUNCTION_NAME = "temperatureHandlerMqtt";
// TODO: SET HERE YOUR LOCAL IP
const IP = "YOUR_IP"
const CONDITIONER_TOPIC = "iot/devices/conditioner"
const THERMOSTAT_TOPIC = "iot/devices/thermostat"
const TABLET_TOPIC = "iot/devices/tablet"

// RANGE OF GOOD TEMPERATURE
const MAX_TEMPERATURE = 26
const MIN_TEMPERATURE = 22

// LEVEL 0 IS WHEN TEMPERATURE IS < 1 
const TEMPERATURE_L0 = 1
// LEVEL 1 IS WHEN TEMPERATURE IS BETWEEN 2 AND 5 
const TEMPERATURE_L1 = 5
// LEVEL 2 IS WHEN TEMPERATURE IS BETWEEN 6 AND 11 
const TEMPERATURE_L2 = 11
// LEVEL 3 IS WHEN TEMPERATURE IS BETWEEN 27 AND 34
const TEMPERATURE_L3 = 34
// LEVEL 4 IS WHEN TEMPERATURE IS BETWEEN 35 AND 40 
const TEMPERATURE_L4 = 40
// LEVEL 5 IS WHEN TEMPERATURE > 44 
const TEMPERATURE_L5 = 44

var options = {
    host: 'mqtt://' + IP,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'guest',
    password: 'guest',
};

var power = "0"
var description = "no"
var temperature = 25

async function send_to_one_topic_mqtt(topic, data) {
    var client = mqtt.connect("mqtt://" + IP, options);
    client.on('connect', function () {
        client.publish(topic, data, function () {
            client.end();
        });
    });
}
async function send_to_two_topic_mqtt(topic1, topic2, data1, data2) {
    var client = mqtt.connect("mqtt://" + IP, options);
    client.on('connect', function () {
        client.publish(topic1, data1, function () {
            client.publish(topic2, data2, function () {
                client.end();
            });
        });
    });
}
async function send_to_three_topic_mqtt(topic1, topic2, topic3, data1, data2, data3) {
    var client = mqtt.connect("mqtt://" + IP, options);
    client.on('connect', function () {
        client.publish(topic1, data1, function () {
            client.publish(topic2, data2, function () {
                client.publish(topic3, data3, function () {
                    client.end();
                });
            });
        });
    });
}

function bin2string(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

exports.handler = function (context, event) {
    var _event = JSON.parse(JSON.stringify(event));
    var _data = bin2string(_event.body.data);

    var temperature = Number(_data)
    if (_data.trim() == "") temperature = MAX_TEMPERATURE

    var power = "0"
    var description = "no"

    if (temperature <= MAX_TEMPERATURE && temperature >= MIN_TEMPERATURE) {
        // non devo fare nulla, al massimo stoppo tutto
        power = "0"
        description = "stop"

        dataTopic1 = "\n-> The temperature is good! [" + temperature + "°]\n   Stopping conditioner and radiators ..."
        dataTopic2 = temperature + "-" + power + "-" + description
        dataTopic3 = temperature + "-" + power + "-" + description

        send_to_three_topic_mqtt(TABLET_TOPIC, CONDITIONER_TOPIC, THERMOSTAT_TOPIC, dataTopic1, dataTopic2, dataTopic3);
        context.callback("feedback {temperature: " + temperature + ", power: " + power + ", description: " + description + "}")
    }
    else {

        // devo abbassare la temperatura    
        if (temperature > MAX_TEMPERATURE) {

            if (temperature < TEMPERATURE_L3)
                power = "1";
            else if (temperature < TEMPERATURE_L4)
                power = "2";
            else if (temperature < TEMPERATURE_L5)
                power = "3";
            else
                power = "4";

            dataTopic2 = "\n-> The temperature is too high! [" + temperature + "°]\n   Setting conditioner to power " + power + " ..."
            topic = CONDITIONER_TOPIC
            description = "down"
        }

        // devo alzare la temperatura
        else if (temperature < MIN_TEMPERATURE) {

            if (temperature > TEMPERATURE_L2)
                power = "1";
            else if (temperature > TEMPERATURE_L1)
                power = "2";
            else if (temperature > TEMPERATURE_L0)
                power = "3";
            else
                power = "4";

            dataTopic2 = "\n-> The temperature is too low! [" + temperature + "°]\n   Setting radiators to power " + power + " ..."
            topic = THERMOSTAT_TOPIC
            description = "up"
        }

        dataTopic1 = temperature + "-" + power + "-" + description
        send_to_two_topic_mqtt(topic, TABLET_TOPIC, dataTopic1, dataTopic2);
        context.callback("feedback {temperature: " + temperature + ", power: " + power + ", description: " + description + "}")

    }
}
