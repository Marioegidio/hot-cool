
# Serverless Computing for IoT


## Serverless

Serverless is a cloud execution model that enables a simpler, more cost-effective way to build and operate cloud-native applications. The serverless model requires no management and operation of infrastructure, giving developers more time to optimize code and develop innovative new features and functionality.

Serverless computing runs code on-demand only, typically in a stateless container, on a pre-request basis, and scales transparently with the number of requests being served. Serverless computing enables end users to pay only for resources being used, never paying for idle capacity.

<br>

## IoT

The Internet of Things is the concept of connecting any device (so long as it has an on/off switch) to the Internet and to other connected devices. The IoT is a giant network of connected things and people – all of which collect and share data about the way they are used and about the environment around them.

<br>

## Serverless Computing for IoT
Since, serverless technology uses parallel processing and serverless databases ensures that the functions closest to the end device are executed on priority. This makes serverless functions a natural fit for edge computing applications.

Serverless supports the protocols which IoT devices require in actual deployment conditions. For instance, many IoT devices with limited power, such as edge sensors, uses MQTT, a lightweight messaging protocol. All the functions including Lambda and Azure Function have been designed to publish to an MQTT topic.

In the IoT era, you cannot afford downtime, as there are many essential services that depend on the Web, and it will have real world consequences, which means they can come to a grinding halt. Therefore, IoT and serverless computing are a perfect combination.

<br>

# Hot&Cool installation

#### Project Structure

* **[Hot&Cool](#Hot&Cool)**
* **[Prerequisites](#prerequisites)**
* **[Installation](#installation)**

<br>



## Hot&Cool

The temperature example aims to demonstrate the potential of the suggested architecture to collect data from IoT sensors and logging this data on an external data  manager.

The application is composed by four functions:

* **[Consume Temperature Function](#consume-temperature-function)**, is triggered by a new MQTT message on the topic "iot/sensors/temperature".
* **[Send Random Temperature Function](#send-random-temperature-function)**, sends a new temperature value on the MQTT on the topic "iot/sensors/temperature".
* **[Logger](#logger)**, logs the invocation of the consume function, this functions is in waiting for a new messages on the queue AMQP "iot/logs". Is a JavaScript function for Node.js and is executed on an external machine. 
* **[IoT Client](#iot-client)**, a general purpose Android MQTT Client.

The first step to do is access to the Nuclio dashboard and create a new project named IOT-MQTT.


### Temperature Consume Function

The Temperature Consume Function is written in pure JavaScript and exploits the _amqplib_ JavaScript library to communicate on the "iot/logs" queue the invocation of the function. 
The JavaScript code is the following:
```javascript
var amqp = require('amqplib');
        var FUNCTION_NAME = "mqttconsume";
        function send_feedback(msg){
            var q = 'iot/logs';
            amqp.connect('amqp://guest:guest@172.16.15.52:5672').then(function(conn) {
                return conn.createChannel().then(function(ch) {
                    var ok = ch.assertQueue(q, {durable: false});
                    return ok.then(function(_qok) {
                    ch.sendToQueue(q, Buffer.from(msg));
                    console.log(" [x] Sent '%s'", msg);
                    return ch.close();
                    });
                }).finally(function() { 
                        conn.close();
                    });
            }).catch(console.warn);
        }

        function bin2string(array){
          var result = "";
          for(var i = 0; i < array.length; ++i){
            result+= (String.fromCharCode(array[i]));
          }
          return result;
        }

        exports.handler = function(context, event) {
            var _event = JSON.parse(JSON.stringify(event));
            var _data = bin2string(_event.body.data);

            context.callback("feedback "+_data);

            console.log("TRIGGER "+_data);
            send_feedback("Invoked Function MQTT: "+FUNCTION_NAME+" received "+_data);
        };
```

The function is deployed using the Docker compose specifics for Nuclio. This is achieved by define a new yaml file that declares all functions specifications and source code. The source code of the function (the JavaScript code) is encoded in base64 and copied in the attribute "functionSourceCode",  moreover, is defined a new trigger on the mqtt protocol that allows to automatically invoke the function when a new message is coming on the topic "iot/sensors/temperature". Since the functions exploits the amqplib in the "commands" attribute is added the command to install on Node.js the amqplib (npm install amqplib).

```yaml
apiVersion: "nuclio.io/v1"
kind: Function
metadata:
  name: mqttconsume
  namespace: nuclio
spec:
  handler: "main:handler"
  description: "Function the is called when a new message is arrived on the iot/sensors/temperature queue, //the function send back a feedback on the iot/logs queue."
  runtime: nodejs
  image: "nuclio/processor-mqttconsume:latest"
  minReplicas: 1
  maxReplicas: 1
  targetCPU: 75
  triggers:
    myMqttTrigger:
      kind: "mqtt"
      url: "guest:guest@172.16.15.52:1883"
      attributes:
          subscriptions:
          - topic: iot/sensors/temperature
            qos: 0
  build:
    functionSourceCode: dmFyIGFtcXAgPSByZXF1aXJlKCdhbXFwbGliJyk7CiAgICAgICAgdmFyIEZVTkNUSU9OX05BTUUgPSAibXF0dGNvbnN1bWUiOwogICAgICAgIGZ1bmN0aW9uIHNlbmRfZmVlZGJhY2sobXNnKXsKICAgICAgICAgICAgdmFyIHEgPSAnaW90L2xvZ3MnOwogICAgICAgICAgICBhbXFwLmNvbm5lY3QoJ2FtcXA6Ly9ndWVzdDpndWVzdEAxNzIuMTYuMTUuNTI6NTY3MicpLnRoZW4oZnVuY3Rpb24oY29ubikgewogICAgICAgICAgICAgICAgcmV0dXJuIGNvbm4uY3JlYXRlQ2hhbm5lbCgpLnRoZW4oZnVuY3Rpb24oY2gpIHsKICAgICAgICAgICAgICAgICAgICB2YXIgb2sgPSBjaC5hc3NlcnRRdWV1ZShxLCB7ZHVyYWJsZTogZmFsc2V9KTsKICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2sudGhlbihmdW5jdGlvbihfcW9rKSB7CiAgICAgICAgICAgICAgICAgICAgY2guc2VuZFRvUXVldWUocSwgQnVmZmVyLmZyb20obXNnKSk7CiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIiBbeF0gU2VudCAnJXMnIiwgbXNnKTsKICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2guY2xvc2UoKTsKICAgICAgICAgICAgICAgICAgICB9KTsKICAgICAgICAgICAgICAgIH0pLmZpbmFsbHkoZnVuY3Rpb24oKSB7IAogICAgICAgICAgICAgICAgICAgICAgICBjb25uLmNsb3NlKCk7CiAgICAgICAgICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIH0pLmNhdGNoKGNvbnNvbGUud2Fybik7CiAgICAgICAgfQoKICAgICAgICBmdW5jdGlvbiBiaW4yc3RyaW5nKGFycmF5KXsKICAgICAgICAgIHZhciByZXN1bHQgPSAiIjsKICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7ICsraSl7CiAgICAgICAgICAgIHJlc3VsdCs9IChTdHJpbmcuZnJvbUNoYXJDb2RlKGFycmF5W2ldKSk7CiAgICAgICAgICB9CiAgICAgICAgICByZXR1cm4gcmVzdWx0OwogICAgICAgIH0KCiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsKICAgICAgICAgICAgdmFyIF9ldmVudCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZXZlbnQpKTsKICAgICAgICAgICAgdmFyIF9kYXRhID0gYmluMnN0cmluZyhfZXZlbnQuYm9keS5kYXRhKTsKCiAgICAgICAgICAgIGNvbnRleHQuY2FsbGJhY2soImZlZWRiYWNrICIrX2RhdGEpOwoKICAgICAgICAgICAgY29uc29sZS5sb2coIlRSSUdHRVIgIitfZGF0YSk7CiAgICAgICAgICAgIHNlbmRfZmVlZGJhY2soIkludm9rZWQgRnVuY3Rpb24gTVFUVDogIitGVU5DVElPTl9OQU1FKyIgcmVjZWl2ZWQgIitfZGF0YSk7CiAgICAgICAgfTs=
    commands:
      - 'npm install mqtt'
    codeEntryType: sourceCode
  platform: {}
```

For deploying the function you can access, from the Nuclio dashboard, to the project IOT-MQTT and create new function. When the system ask to create new function you have to select the import form yaml, and load the file "iot/mqtt/temperature/amqpconsume.yaml". At this point the dashboard show you the function IDE where it is needed to deploy on the system the function pressing the button "Deploy".

The same procedure could be achieved but create new function and copy the JavaScript code in the edidor part, and create the new trigger for the MQTT messages.

### Send Random Temperature Function
The Send Random Temperature Function is written in pure JavaScript and exploits the _MQTT.js_ JavaScript library to communicate on the topic "iot/sensors/temperature".

The JavaScript code is the following:

```javascript
var mqtt = require('mqtt'), url = require('url');

var mqtt_url = url.parse(process.env.CLOUDAMQP_MQTT_URL || 'mqtt://guest:guest@172.16.15.52:1883');
var auth = (mqtt_url.auth || ':').split(':');
var url = "mqtt://" + mqtt_url.host;

var options = {
  port: mqtt_url.port,
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  username: auth[0],
  password: auth[1],
};

exports.handler = function(context, event) {
    var client = mqtt.connect(url, options);
    
    client.on('connect', function() {
        client.publish('iot/sensors/temperature', (Math.floor(Math.random()*30)).toString(), function() {
                    client.end(); 
                    context.callback('MQTT Message Sent');
                } );
                            
        });        
    
};
```
The function is deployed on Nuclio in the same way of the Consume Temperature Function. 

```yaml
apiVersion: "nuclio.io/v1"
kind: Function
metadata:
  name: mqttrandomtemperature
  namespace: nuclio
spec:
  handler: "main:handler"
  description: "Function to generate an event on the MQTT queue sending a temperature value."
  runtime: nodejs
  image: "nuclio/processor-mqtt-random-temperature:latest"
  minReplicas: 1
  maxReplicas: 1
  targetCPU: 75
  build:
    functionSourceCode: dmFyIG1xdHQgPSByZXF1aXJlKCdtcXR0JyksIHVybCA9IHJlcXVpcmUoJ3VybCcpOwoKdmFyIG1xdHRfdXJsID0gdXJsLnBhcnNlKHByb2Nlc3MuZW52LkNMT1VEQU1RUF9NUVRUX1VSTCB8fCAnbXF0dDovL2d1ZXN0Omd1ZXN0QDE3Mi4xNi4xNS41MjoxODgzJyk7CnZhciBhdXRoID0gKG1xdHRfdXJsLmF1dGggfHwgJzonKS5zcGxpdCgnOicpOwp2YXIgdXJsID0gIm1xdHQ6Ly8iICsgbXF0dF91cmwuaG9zdDsKCnZhciBvcHRpb25zID0gewogIHBvcnQ6IG1xdHRfdXJsLnBvcnQsCiAgY2xpZW50SWQ6ICdtcXR0anNfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnN1YnN0cigyLCA4KSwKICB1c2VybmFtZTogYXV0aFswXSwKICBwYXNzd29yZDogYXV0aFsxXSwKfTsKCmV4cG9ydHMuaGFuZGxlciA9IGZ1bmN0aW9uKGNvbnRleHQsIGV2ZW50KSB7CiAgICB2YXIgY2xpZW50ID0gbXF0dC5jb25uZWN0KHVybCwgb3B0aW9ucyk7CiAgICAKICAgIGNsaWVudC5vbignY29ubmVjdCcsIGZ1bmN0aW9uKCkgewogICAgICAgIGNsaWVudC5wdWJsaXNoKCdpb3Qvc2Vuc29ycy90ZW1wZXJhdHVyZScsIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMzApKS50b1N0cmluZygpLCBmdW5jdGlvbigpIHsKICAgICAgICAgICAgICAgICAgICBjbGllbnQuZW5kKCk7IAogICAgICAgICAgICAgICAgICAgIGNvbnRleHQuY2FsbGJhY2soJ01RVFQgTWVzc2FnZSBTZW50Jyk7CiAgICAgICAgICAgICAgICB9ICk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICB9KTsgICAgICAgIAogICAgCn07
    commands:
      - 'npm install mqtt'
    codeEntryType: sourceCode
  platform: {}

```
For deploying the function you can access, from the Nuclio dashboard, to the project IOT-MQTT and create new function. When the system ask to create new function you have to select the import form yaml, and load the file "iot/temperature/amqpevent.yaml". At this point the dashboard show you the function IDE where it is needed to deploy on the system the function pressing the button "Deploy".

The same procedure could be achieved but create new function and copy the JavaScript code in the edidor part.

**TIP** For invoking the function is possible to press the button "TEST" in the dashboard. Moreover, in Nuclio is possible to invoke function by generating an HTTP event, the following command invoke the function:
```
curl -X POST -H "Content-Type: application/text"  http://localhost:39823
```
Each function in Nuclio is identified by the serving port, you can see the serving port in the dashboard (change the port in the url http://localhost:PORT).

### Logger

The logger function is written in pure JavaScript and exploits the _amqplib_ JavaScript library to receive messages on the queue "iot/logs". 

```javascript
var amqp = require('amqplib');

amqp.connect('amqp://guest:guest@172.16.15.52:5672').then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  return conn.createChannel().then(function(ch) {

    var ok = ch.assertQueue('iot/logs', {durable: false});

    ok = ok.then(function(_qok) {
      return ch.consume('iot/logs', function(msg) {
        console.log(" [x] Received '%s'", msg.content.toString());
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' [*] Waiting for messages. To exit press CTRL+C');
    });
  });
}).catch(console.warn);
```

In order to execute this function is require Node.js and the amqlib library. The following commands execute the logger:

```sh
$ npm install amqplib
$ node logger.js
```

### IoT Client

The IoT Client could be written in any language for any platform that support the MQTT protocol. For this example we have used a general purpose  [MQTT Android Client](https://play.google.com/store/apps/details?id=in.dc297.mqttclpro). In this app you can connect to the RabbitMQ broker using the protocol MQTT (just create new connection to the IP where the RabbitMQ are running). After created the connection you can easily send values on some topic.
<p align="center"><img src="/assets/mqtt_android.png" width="500"/></p>

<br>

## Prerequisites
- OS: 
    - Ubuntu 18.04 LTS
- Software:
    - Docker and Docker Compose (Application containers engine)
    - Nuclio (Serverless computing provider)
    - RabbitMQ (AMQP and MQTT message broker)
    - Node.js

<br>

## Installation

This project is made on top of one local machine an Linux Ubuntu 18.04 LTS machine. 

<br>

### Docker

Docker is a tool designed to make it easier to create, deploy, and run applications by using containers.
 

### Install Docker using the Docker CE installation [guide](https://docs.docker.com/engine/install/ubuntu/).

<br>

#### Set up the repository:

- Update the apt package index and install packages to allow apt to use a repository over HTTPS:

    ```sh
    $ sudo apt-get update

    $ sudo apt-get install \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    ```

- Add Docker’s official GPG key:

    ```sh
    $ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    ```

- Use the following command to set up the stable repository. To add the nightly or test repository, add the word nightly or test (or both) after the word stable in the commands below. Learn about nightly and test channels.

    ```sh
    $echo \
    "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    ```
<br>

#### Install Docker Engine:

- Update the apt package index, and install the latest version of Docker Engine and containerd, or go to the next step to install a specific version:
  
    ```sh
    $ sudo apt-get update
    $ sudo apt-get install docker-ce docker-ce-cli containerd.io
    ```
    
    <br>

<!-- ---------------------------------------------------------------------------------------------------------------------------- -->
<!-- ### Docker Compose

Compose is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file to configure your application’s services.

Install Docker Compose using the Docker Compose installation [guide](https://docs.docker.com/compose/install/#install-compose).

```sh
$ sudo curl -L "https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
$ sudo chmod +x /usr/local/bin/docker-compose
``` -->

------------------------------------------------------------------------------------------------------------------------------
### Nuclio 

The Nuclio documentation is available at [this link](https://nuclio.io/docs/latest/).

Start [Nuclio](https://github.com/nuclio/nuclio) using a docker container.

```sh
$ docker run -p 8070:8070 -v /var/run/docker.sock:/var/run/docker.sock -v /tmp:/tmp nuclio/dashboard:stable-amd64
```

Browse to http://localhost:8070, create a project, and add a function. When run outside of an orchestration platform (for example, Kubernetes or Swarm), the dashboard will simply deploy to the local Docker daemon.

<br>

----------------------------------------------------------------------------------------------------------------------------

### RabbitMQ 

Start [RabbitMQ](https://www.rabbitmq.com) instance with MQTT enabled using docker.

```sh
$ docker run -p 9000:15672  -p 1883:1883 -p 5672:5672  cyrilix/rabbitmq-mqtt 
```

Browse to http://localhost:9000, and login using username: guest and password: guest, to access to the RabbitMQ managment, where is possible to visualize the message queues and the broker status.

<br>

------------------------------------------------------------------------------------------------------------------------------

### Library for MQTT clients

There are different libraries for many languages for interacting with protocol MQTT you can use what you want. For JavaScript MQTT you can use this [library](https://github.com/mqttjs/MQTT.js#readme).

<br>

### Library for <i>.env</i> file

[Dotenv](https://github.com/motdotla/dotenv#readme) is a zero-dependency module that loads environment variables from a .env file into process.env. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology. 

<br>
  
### Library to make HTTP request used in the project to trigger mail event on IFTT
[Request](https://github.com/request/request#readme) is designed to be the simplest way possible to make http calls. It supports HTTPS and follows redirects by default.

<br>

#### MQTT Android Clients

General purpose [MQTT client](https://play.google.com/store/apps/details?id=com.sanyamarya.mqtizermqtt_client) for Android.

-----------------------------------------------------------------------------------------------------------------------------
