var mqtt = require('mqtt');

const FUNCTION_NAME = "temperatureHandlerMqtt";
const IP = "192.168.1.7"
const CONDITIONER_TOPIC = "iot/devices/conditioner"
const THERMOSTAT_TOPIC = "iot/devices/thermostat"
const TABLET_TOPIC = "iot/devices/tablet"

const MAX_TEMPERATURE = 26
const MIN_TEMPERATURE = 22
const TEMPERATURE_L1 = 5
const TEMPERATURE_L2 = 11
const TEMPERATURE_L3 = 34
const TEMPERATURE_L4 = 40

var options = {
    host: 'mqtt://192.168.1.7',
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'guest',
    password: 'guest',
};

var power = "0"
var description = "no"
var temperature = 25

async function send_to_one_topic_mqtt(topic, power, temperature, description) {
    var client = mqtt.connect("mqtt://" + IP, options);
    client.on('connect', function () {
        client.publish(topic, temperature + "-" + power + "-" + description, function () {
            client.end();
        });
    });
}
async function send_to_two_topic_mqtt(topic1, topic2, power, temperature, description) {
    var client = mqtt.connect("mqtt://" + IP, options);
    client.on('connect', function () {
        client.publish(topic1, temperature + "-" + power + "-" + description, function () {
            client.publish(topic2, temperature + "-" + power + "-" + description, function () {
                client.end();
            });
        });
    });
}
async function send_to_three_topic_mqtt(topic1, topic2, topic3, power, temperature, description) {
    var client = mqtt.connect("mqtt://" + IP, options);
    client.on('connect', function () {
        client.publish(topic1, temperature + "-" + power + "-" + description, function () {
            client.publish(topic2, temperature + "-" + power + "-" + description, function () {
                client.publish(topic3, temperature + "-" + power + "-" + description, function () {
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
        send_to_three_topic_mqtt(TABLET_TOPIC, CONDITIONER_TOPIC, THERMOSTAT_TOPIC, power, temperature, description);
        context.callback("feedback {temperature: " + temperature + ", power: " + power + ", description: " + description + "}")
    }
    else {

        // devo abbassare la temperatura    
        if (temperature > MAX_TEMPERATURE) {

            if (temperature < TEMPERATURE_L3)
                power = "1";
            else if (temperature < TEMPERATURE_L4)
                power = "2";
            else
                power = "3";

            topic = CONDITIONER_TOPIC
            description = "down"
        }

        // devo alzare la temperatura
        else if (temperature < MIN_TEMPERATURE) {

            if (temperature > TEMPERATURE_L2)
                power = "1";
            else if (temperature > TEMPERATURE_L1)
                power = "2";
            else
                power = "3";

            topic = THERMOSTAT_TOPIC
            description = "up"
        }

        send_to_two_topic_mqtt(topic, TABLET_TOPIC, power, temperature, description);
        context.callback("feedback {temperature: " + temperature + ", power: " + power + ", description: " + description + "}")

    }
}
