
# **Serverless Computing for IoT**

## Serverless

Serverless is a cloud execution model that enables a simpler, more cost-effective way to build and operate cloud-native applications. The serverless model requires no management and operation of infrastructure, giving developers more time to optimize code and develop innovative new features and functionality.

Serverless computing runs code on-demand only, typically in a stateless container, on a pre-request basis, and scales transparently with the number of requests being served. Serverless computing enables end users to pay only for resources being used, never paying for idle capacity.

## IoT

The Internet of Things is the concept of connecting any device (so long as it has an on/off switch) to the Internet and to other connected devices. The IoT is a giant network of connected things and people – all of which collect and share data about the way they are used and about the environment around them.

## Serverless Computing for IoT
Since, serverless technology uses parallel processing and serverless databases ensures that the functions closest to the end device are executed on priority. This makes serverless functions a natural fit for edge computing applications.

Serverless supports the protocols which IoT devices require in actual deployment conditions. For instance, many IoT devices with limited power, such as edge sensors, uses MQTT, a lightweight messaging protocol. All the functions including Lambda and Azure Function have been designed to publish to an MQTT topic.

In the IoT era, you cannot afford downtime, as there are many essential services that depend on the Web, and it will have real world consequences, which means they can come to a grinding halt. Therefore, IoT and serverless computing are a perfect combination.

<br>

# **Hot&Cool installation**

### **Structure**

* **[Hot&Cool](#hot-&-cool)**
* **[Architecture](#architecture)**
* **[Prerequisites](#prerequisites)**
* **[Installation](#installation)**
* **[Run Project](#run-project)**

<br>
<br>


## **Hot & Cool**

Hot&Cool is a project with the purpose to demonstrate the potential of the suggested architecture to collect data from IoT sensors and logging this data on an external data manager.<br><br>
In detail it provides the simulation of a temperature sensors that sends the temperature on a topic. When arrives a new temperature is triggered a nuclio function that write on a determinated topic. 
- if the temperature is less than 22° writes on the thermostat topic to start all radiators with some power (the power depends on the temperature). 
  - ( for example, if temperature is less than 5° power is 3, if temperature is less than 1° power is 4 ... )
- if the temperature is more than 26° writes on the conditioner topic to start the conditioner with some power (the power depends on the temperature)
  - ( for example, if temperature is more than 40° power is 3, if temperature is more than 43° power is 4 ... )
- if the temperature is between 22° and 26° turns off the conditioner and all radiators     
- if power is 4 is sent an email to adice the user

In any case is sent a log on the tablet topic to show to the user what is happening.   

<br>

The application is composed by six functions:

* **[Temperature Handler](#temperature-handler-function)**, is triggered by a new MQTT message on the topic "iot/sensors/temperature".
* **[Temperature Sensor](#send-random-temperature-function)**, sends a new temperature value on the MQTT topic "iot/sensors/temperature" once a minute.
* **[Tablet](#tablet)**, logs the behavior of the Temperature Handler function, this functions is subscribed to "iot/devices/tablet". Is a JavaScript function for Node.js and is executed on an external machine. 
* **[IoT-Client](#iot-client)**, a general purpose Android MQTT Client subcribed to "iot/devices/tablet" to show to the user what is happening.
* **[Conidtioner](#conditioner)**, simulates the behavior of the air conditioner. This functions is subscribed to "iot/devices/conditioner". According to the power and temperature recieved it takes an action. Is a JavaScript function for Node.js and is executed on an external machine. 
* **[Thermostat](#thermostat)**, simulates the behavior of the thermostat. This functions is subscribed to "iot/devices/thermostat". According to the power and temperature recieved it takes an action. Is a JavaScript function for Node.js and is executed on an external machine.
*  
The first step to do is access to the Nuclio dashboard and create a new project. (you can set your preferd name)

<br>

## **Architecture**

<p align="center"><img src="./assets/architecture.png" width="90%"/></p>

- The **temperature sensor** sends temperature to nuclio function (sensor writes new temperature on **iot/sensors/temperature** queue) 
- When arrives messages on "iot/sensors/temperature" the **nuclio function** is triggered and takes an action (eg. if the temperature is to low writes on iot/devices/conditoner topic, if is too high writes on iot/devices/thermostat topic)
- The **conditioner** (or the **thermostat**) recieves the temperature and the power from messages to start itself
  - if the temperature is too low (or too high) is **triggered an iftt event** to send an email to the user
- The conditioner (or the thermostat) writes on **iot/sensors/temperature** topic to simulate the **dropping** (or **rising**) of temperature
- The **nuclio funtion also writes on iot/devices/tablet to log** what is happening
  - the **tablet** function and the **Android MQTT Client** recieves messages on "iot/devices/tablet"
  
<br>

## **Prerequisites**
- OS: 
    - Ubuntu 21.04 LTS
- Software:
    - Docker and Docker Compose (Application containers engine)
    - Nuclio (Serverless computing provider)
    - RabbitMQ (AMQP and MQTT message broker)
    - Node.js
- Service:
  - IFTT account 

<br>

## **Installation**

This project is made on top of one local machine an Linux Ubuntu 21.04 LTS machine. 

<br>

### Docker

Docker is a tool designed to make it easier to create, deploy, and run applications by using containers.
 

### Install Docker using the Docker CE installation [guide](https://docs.docker.com/engine/install/ubuntu/).

<br>

#### Set up the repository:

- Update the apt package index and install packages to allow apt to use a repository over HTTPS:

    ```sh
    sudo apt-get update

    sudo apt-get install \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    ```

- Add Docker’s official GPG key:

    ```sh
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

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
    sudo apt-get update
    sudo apt-get install docker-ce docker-ce-cli containerd.io
    ```
    
    <br>

---------------------------------------------------------------------------------------------------------------------------- 
### Docker Compose

Compose is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file to configure your application’s services.

Install Docker Compose using the Docker Compose installation [guide](https://docs.docker.com/compose/install/#install-compose).

```sh
sudo curl -L "https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```
<br>

------------------------------------------------------------------------------------------------------------------------------
### Nuclio 

The Nuclio documentation is available at [this link](https://nuclio.io/docs/latest/).

Start [Nuclio](https://github.com/nuclio/nuclio) using a docker container.

```sh
sudo docker run -p 8070:8070 -v /var/run/docker.sock:/var/run/docker.sock -v /tmp:/tmp nuclio/dashboard:stable-amd64
```

Browse to http://localhost:8070, create a project, and add a function. When run outside of an orchestration platform (for example, Kubernetes or Swarm), the dashboard will simply deploy to the local Docker daemon.

<br>

----------------------------------------------------------------------------------------------------------------------------

### RabbitMQ 

Start [RabbitMQ](https://www.rabbitmq.com) instance with MQTT enabled using docker.

```sh
sudo docker run -p 9000:15672  -p 1883:1883 -p 5672:5672  cyrilix/rabbitmq-mqtt 
```

Browse to http://localhost:9000, and login using username: guest and password: guest, to access to the RabbitMQ managment, where is possible to visualize the message queues and the broker status.

<br>

----------------------------------------------------------------------------------------------------------------------------

### IFTT MAIL TRIGGER 

Create an [IFTT](https://ifttt.com) account.

Then you need to create a new Applet:

- Set this name to Event Name: _"triggerIotMail"_
- Use WebHooks in _"if"_ section:
<p align=center><img src="./assets/webhooks.png" width="250"/> </p>

- Use Gmail in _"then"_ section:
<p align=center>  <img src="./assets/gmail.png" width="250"/></p>

- Set the mail:
<p align=center> <img src="./assets/mail.png" width="250"/></p>

- Save your key to call the http request from node functions


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

### MQTT Android Clients

General purpose [MQTT client](https://play.google.com/store/apps/details?id=com.gbn.mqttclient) for Android.

<br>

-----------------------------------------------------------------------------------------------------------------------------

<br>

## **Run Project**

<br>

### Temperature Handler Function

The Temperature Handler Function is written in pure JavaScript and exploits the _mqtt_ JavaScript library to communicate on the "iot/devices/conditioner", "iot/devices/thermostat" and "iot/devices/tablet" topics the invocation of the function. 
The JavaScript code is [here](src/nuclio_functions/temperatureHandlerMqtt-nuclio.js)

The function is deployed using the Docker compose specifics for Nuclio. This is achieved by define a new yaml file that declares all functions specifications and source code. The source code of the function (the JavaScript code) is encoded in base64 and copied in the attribute "functionSourceCode",  moreover, is defined a new trigger on the mqtt protocol that allows to automatically call the function when a new message is coming on the topic "iot/sensors/temperature". Since the functions exploits the mqtt in the "commands" attribute is added the command to install on Node.js the mqtt (npm install mqtt).

```yaml
metadata:
  name: temperaturehandlermqtt
  labels: {}
  annotations: {}
spec:
  description: ""
  disable: false
  triggers:
    temperatureTrigger:
      kind: mqtt
      attributes:
        subscriptions:
          - topic: iot/sensors/temperature
            qos: 2
      workerAllocatorName: ""
      url: "guest:guest@YOUR_IP:1883"
      username: ""
      password: ""
  env: []
  handler: "main:handler"
  runtime: nodejs
  build:
    image: ""
    noCache: false
    offline: false
    dependencies: []
    runtimeAttributes:
      repositories: []
    functionSourceCode: dmFyIG1xdHQgPSByZXF1aXJlKCdtcXR0Jyk7DQoNCmNvbnN0IEZVTkNUSU9OX05BTUUgPSAidGVtcGVyYXR1cmVIYW5kbGVyTXF0dCI7DQpjb25zdCBJUCA9ICIxOTIuMTY4LjEuNyINCmNvbnN0IENPTkRJVElPTkVSX1RPUElDID0gImlvdC9kZXZpY2VzL2NvbmRpdGlvbmVyIg0KY29uc3QgVEhFUk1PU1RBVF9UT1BJQyA9ICJpb3QvZGV2aWNlcy90aGVybW9zdGF0Ig0KY29uc3QgVEFCTEVUX1RPUElDID0gImlvdC9kZXZpY2VzL3RhYmxldCINCg0KLy8gUkFOR0UgT0YgR09PRCBURU1QRVJBVFVSRQ0KY29uc3QgTUFYX1RFTVBFUkFUVVJFID0gMjYNCmNvbnN0IE1JTl9URU1QRVJBVFVSRSA9IDIyDQoNCi8vIExFVkVMIDAgSVMgV0hFTiBURU1QRVJBVFVSRSBJUyA8IDEgDQpjb25zdCBURU1QRVJBVFVSRV9MMCA9IDENCi8vIExFVkVMIDEgSVMgV0hFTiBURU1QRVJBVFVSRSBJUyBCRVRXRUVOIDIgQU5EIDUgDQpjb25zdCBURU1QRVJBVFVSRV9MMSA9IDUNCi8vIExFVkVMIDIgSVMgV0hFTiBURU1QRVJBVFVSRSBJUyBCRVRXRUVOIDYgQU5EIDExIA0KY29uc3QgVEVNUEVSQVRVUkVfTDIgPSAxMQ0KLy8gTEVWRUwgMyBJUyBXSEVOIFRFTVBFUkFUVVJFIElTIEJFVFdFRU4gMjcgQU5EIDM0DQpjb25zdCBURU1QRVJBVFVSRV9MMyA9IDM0DQovLyBMRVZFTCA0IElTIFdIRU4gVEVNUEVSQVRVUkUgSVMgQkVUV0VFTiAzNSBBTkQgNDAgDQpjb25zdCBURU1QRVJBVFVSRV9MNCA9IDQwDQovLyBMRVZFTCA1IElTIFdIRU4gVEVNUEVSQVRVUkUgPiA0NCANCmNvbnN0IFRFTVBFUkFUVVJFX0w1ID0gNDQNCg0KdmFyIG9wdGlvbnMgPSB7DQogICAgaG9zdDogJ21xdHQ6Ly8nICsgSVAsDQogICAgY2xpZW50SWQ6ICdtcXR0anNfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnN1YnN0cigyLCA4KSwNCiAgICB1c2VybmFtZTogJ2d1ZXN0JywNCiAgICBwYXNzd29yZDogJ2d1ZXN0JywNCn07DQoNCnZhciBwb3dlciA9ICIwIg0KdmFyIGRlc2NyaXB0aW9uID0gIm5vIg0KdmFyIHRlbXBlcmF0dXJlID0gMjUNCg0KYXN5bmMgZnVuY3Rpb24gc2VuZF90b19vbmVfdG9waWNfbXF0dCh0b3BpYywgZGF0YSkgew0KICAgIHZhciBjbGllbnQgPSBtcXR0LmNvbm5lY3QoIm1xdHQ6Ly8iICsgSVAsIG9wdGlvbnMpOw0KICAgIGNsaWVudC5vbignY29ubmVjdCcsIGZ1bmN0aW9uICgpIHsNCiAgICAgICAgY2xpZW50LnB1Ymxpc2godG9waWMsIGRhdGEsIGZ1bmN0aW9uICgpIHsNCiAgICAgICAgICAgIGNsaWVudC5lbmQoKTsNCiAgICAgICAgfSk7DQogICAgfSk7DQp9DQphc3luYyBmdW5jdGlvbiBzZW5kX3RvX3R3b190b3BpY19tcXR0KHRvcGljMSwgdG9waWMyLCBkYXRhMSwgZGF0YTIpIHsNCiAgICB2YXIgY2xpZW50ID0gbXF0dC5jb25uZWN0KCJtcXR0Oi8vIiArIElQLCBvcHRpb25zKTsNCiAgICBjbGllbnQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbiAoKSB7DQogICAgICAgIGNsaWVudC5wdWJsaXNoKHRvcGljMSwgZGF0YTEsIGZ1bmN0aW9uICgpIHsNCiAgICAgICAgICAgIGNsaWVudC5wdWJsaXNoKHRvcGljMiwgZGF0YTIsIGZ1bmN0aW9uICgpIHsNCiAgICAgICAgICAgICAgICBjbGllbnQuZW5kKCk7DQogICAgICAgICAgICB9KTsNCiAgICAgICAgfSk7DQogICAgfSk7DQp9DQphc3luYyBmdW5jdGlvbiBzZW5kX3RvX3RocmVlX3RvcGljX21xdHQodG9waWMxLCB0b3BpYzIsIHRvcGljMywgZGF0YTEsIGRhdGEyLCBkYXRhMykgew0KICAgIHZhciBjbGllbnQgPSBtcXR0LmNvbm5lY3QoIm1xdHQ6Ly8iICsgSVAsIG9wdGlvbnMpOw0KICAgIGNsaWVudC5vbignY29ubmVjdCcsIGZ1bmN0aW9uICgpIHsNCiAgICAgICAgY2xpZW50LnB1Ymxpc2godG9waWMxLCBkYXRhMSwgZnVuY3Rpb24gKCkgew0KICAgICAgICAgICAgY2xpZW50LnB1Ymxpc2godG9waWMyLCBkYXRhMiwgZnVuY3Rpb24gKCkgew0KICAgICAgICAgICAgICAgIGNsaWVudC5wdWJsaXNoKHRvcGljMywgZGF0YTMsIGZ1bmN0aW9uICgpIHsNCiAgICAgICAgICAgICAgICAgICAgY2xpZW50LmVuZCgpOw0KICAgICAgICAgICAgICAgIH0pOw0KICAgICAgICAgICAgfSk7DQogICAgICAgIH0pOw0KICAgIH0pOw0KfQ0KDQpmdW5jdGlvbiBiaW4yc3RyaW5nKGFycmF5KSB7DQogICAgdmFyIHJlc3VsdCA9ICIiOw0KICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyArK2kpIHsNCiAgICAgICAgcmVzdWx0ICs9IChTdHJpbmcuZnJvbUNoYXJDb2RlKGFycmF5W2ldKSk7DQogICAgfQ0KICAgIHJldHVybiByZXN1bHQ7DQp9DQoNCmV4cG9ydHMuaGFuZGxlciA9IGZ1bmN0aW9uIChjb250ZXh0LCBldmVudCkgew0KICAgIHZhciBfZXZlbnQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGV2ZW50KSk7DQogICAgdmFyIF9kYXRhID0gYmluMnN0cmluZyhfZXZlbnQuYm9keS5kYXRhKTsNCg0KICAgIHZhciB0ZW1wZXJhdHVyZSA9IE51bWJlcihfZGF0YSkNCiAgICBpZiAoX2RhdGEudHJpbSgpID09ICIiKSB0ZW1wZXJhdHVyZSA9IE1BWF9URU1QRVJBVFVSRQ0KDQogICAgdmFyIHBvd2VyID0gIjAiDQogICAgdmFyIGRlc2NyaXB0aW9uID0gIm5vIg0KDQogICAgaWYgKHRlbXBlcmF0dXJlIDw9IE1BWF9URU1QRVJBVFVSRSAmJiB0ZW1wZXJhdHVyZSA+PSBNSU5fVEVNUEVSQVRVUkUpIHsNCiAgICAgICAgLy8gbm9uIGRldm8gZmFyZSBudWxsYSwgYWwgbWFzc2ltbyBzdG9wcG8gdHV0dG8NCiAgICAgICAgcG93ZXIgPSAiMCINCiAgICAgICAgZGVzY3JpcHRpb24gPSAic3RvcCINCg0KICAgICAgICBkYXRhVG9waWMxID0gIlxuLT4gVGhlIHRlbXBlcmF0dXJlIGlzIGdvb2QhIFsiICsgdGVtcGVyYXR1cmUgKyAiwrBdXG4gICBTdG9wcGluZyBjb25kaXRpb25lciBhbmQgcmFkaWF0b3JzIC4uLiINCiAgICAgICAgZGF0YVRvcGljMiA9IHRlbXBlcmF0dXJlICsgIi0iICsgcG93ZXIgKyAiLSIgKyBkZXNjcmlwdGlvbg0KICAgICAgICBkYXRhVG9waWMzID0gdGVtcGVyYXR1cmUgKyAiLSIgKyBwb3dlciArICItIiArIGRlc2NyaXB0aW9uDQoNCiAgICAgICAgc2VuZF90b190aHJlZV90b3BpY19tcXR0KFRBQkxFVF9UT1BJQywgQ09ORElUSU9ORVJfVE9QSUMsIFRIRVJNT1NUQVRfVE9QSUMsIGRhdGFUb3BpYzEsIGRhdGFUb3BpYzIsIGRhdGFUb3BpYzMpOw0KICAgICAgICBjb250ZXh0LmNhbGxiYWNrKCJmZWVkYmFjayB7dGVtcGVyYXR1cmU6ICIgKyB0ZW1wZXJhdHVyZSArICIsIHBvd2VyOiAiICsgcG93ZXIgKyAiLCBkZXNjcmlwdGlvbjogIiArIGRlc2NyaXB0aW9uICsgIn0iKQ0KICAgIH0NCiAgICBlbHNlIHsNCg0KICAgICAgICAvLyBkZXZvIGFiYmFzc2FyZSBsYSB0ZW1wZXJhdHVyYSAgICANCiAgICAgICAgaWYgKHRlbXBlcmF0dXJlID4gTUFYX1RFTVBFUkFUVVJFKSB7DQoNCiAgICAgICAgICAgIGlmICh0ZW1wZXJhdHVyZSA8IFRFTVBFUkFUVVJFX0wzKQ0KICAgICAgICAgICAgICAgIHBvd2VyID0gIjEiOw0KICAgICAgICAgICAgZWxzZSBpZiAodGVtcGVyYXR1cmUgPCBURU1QRVJBVFVSRV9MNCkNCiAgICAgICAgICAgICAgICBwb3dlciA9ICIyIjsNCiAgICAgICAgICAgIGVsc2UgaWYgKHRlbXBlcmF0dXJlIDwgVEVNUEVSQVRVUkVfTDUpDQogICAgICAgICAgICAgICAgcG93ZXIgPSAiMyI7DQogICAgICAgICAgICBlbHNlDQogICAgICAgICAgICAgICAgcG93ZXIgPSAiNCI7DQoNCiAgICAgICAgICAgIGRhdGFUb3BpYzIgPSAiXG4tPiBUaGUgdGVtcGVyYXR1cmUgaXMgdG9vIGhpZ2ghIFsiICsgdGVtcGVyYXR1cmUgKyAiwrBdXG4gICBTZXR0aW5nIGNvbmRpdGlvbmVyIHRvIHBvd2VyICIgKyBwb3dlciArICIgLi4uIg0KICAgICAgICAgICAgdG9waWMgPSBDT05ESVRJT05FUl9UT1BJQw0KICAgICAgICAgICAgZGVzY3JpcHRpb24gPSAiZG93biINCiAgICAgICAgfQ0KDQogICAgICAgIC8vIGRldm8gYWx6YXJlIGxhIHRlbXBlcmF0dXJhDQogICAgICAgIGVsc2UgaWYgKHRlbXBlcmF0dXJlIDwgTUlOX1RFTVBFUkFUVVJFKSB7DQoNCiAgICAgICAgICAgIGlmICh0ZW1wZXJhdHVyZSA+IFRFTVBFUkFUVVJFX0wyKQ0KICAgICAgICAgICAgICAgIHBvd2VyID0gIjEiOw0KICAgICAgICAgICAgZWxzZSBpZiAodGVtcGVyYXR1cmUgPiBURU1QRVJBVFVSRV9MMSkNCiAgICAgICAgICAgICAgICBwb3dlciA9ICIyIjsNCiAgICAgICAgICAgIGVsc2UgaWYgKHRlbXBlcmF0dXJlID4gVEVNUEVSQVRVUkVfTDApDQogICAgICAgICAgICAgICAgcG93ZXIgPSAiMyI7DQogICAgICAgICAgICBlbHNlDQogICAgICAgICAgICAgICAgcG93ZXIgPSAiNCI7DQoNCiAgICAgICAgICAgIGRhdGFUb3BpYzIgPSAiXG4tPiBUaGUgdGVtcGVyYXR1cmUgaXMgdG9vIGxvdyEgWyIgKyB0ZW1wZXJhdHVyZSArICLCsF1cbiAgIFNldHRpbmcgcmFkaWF0b3JzIHRvIHBvd2VyICIgKyBwb3dlciArICIgLi4uIg0KICAgICAgICAgICAgdG9waWMgPSBUSEVSTU9TVEFUX1RPUElDDQogICAgICAgICAgICBkZXNjcmlwdGlvbiA9ICJ1cCINCiAgICAgICAgfQ0KDQogICAgICAgIGRhdGFUb3BpYzEgPSB0ZW1wZXJhdHVyZSArICItIiArIHBvd2VyICsgIi0iICsgZGVzY3JpcHRpb24NCiAgICAgICAgc2VuZF90b190d29fdG9waWNfbXF0dCh0b3BpYywgVEFCTEVUX1RPUElDLCBkYXRhVG9waWMxLCBkYXRhVG9waWMyKTsNCiAgICAgICAgY29udGV4dC5jYWxsYmFjaygiZmVlZGJhY2sge3RlbXBlcmF0dXJlOiAiICsgdGVtcGVyYXR1cmUgKyAiLCBwb3dlcjogIiArIHBvd2VyICsgIiwgZGVzY3JpcHRpb246ICIgKyBkZXNjcmlwdGlvbiArICJ9IikNCg0KICAgIH0NCn0NCg==
    codeEntryType: sourceCode
    commands:
      - 'npm install mqtt'
  targetCPU: 75
  minReplicas: 1
  maxReplicas: 1
  readinessTimeoutSeconds: 60

```

To deploy the function: 
1. Set your IP in the url of _yaml_ file
2. Create a new project on Nuclio
3. Access, from the Nuclio dashboard, to the project _YOUR-PROJECT-NAME_ and create new function. 
4. When the system ask to create new function you have to select the import form yaml
5. Load the file "src/sensors/temperaturehandlermqtt.yaml".
At this point the dashboard show you the function IDE where it is needed to deploy on the system the function pressing the button _"Deploy"_.

The same procedure could be achieved but create new function and copy the JavaScript code in the edidor part, and create the new trigger for the MQTT messages.

<br>

### Send Random Temperature Function
The Send Random Temperature Function is written in pure JavaScript and exploits the _MQTT.js_ JavaScript library to communicate on the topic "iot/sensors/temperature".

The JavaScript code is [here](src/sensors/temperature_sensor.js)

**First of all you need to create a file _".env"_ in _"src/sensors"_ directory and add:**

```
    IP = YOUR_IP
```
_(You need to set your ip before saving the file.)_

The next step is to execute the temperature sensor simulation:

```sh
  cd src/sensors/
  npm install
  node temperature_sensor.js
  cd ../..
```
<br>

### Tablet

The tablet function is written in pure JavaScript and exploits the _mqtt_ JavaScript library to receive messages on the queue "iot/devices/tablet". 
The code is [here](src/devices/tablet.js)

**First of all you need to create a file _".env"_ in _"src/devices"_ directory and add:**

```
    IFTT_KEY = YOUR_IFTT_KEY
    IP = YOUR_IP
```
_(You need to set your key and your ip before saving the file.)_

The next step is to execute the temperature tablet simulation:

```sh
  cd src/devices/
  npm install
  node tablet.js
```

<br>

### Conditioner

The conditioner function is written in pure JavaScript and exploits the _mqtt_ JavaScript library to receive messages on the queue "iot/devices/conditioner". 
The code is [here](src/devices/conditioner.js)

The following commands execute the conditioner simulation:

```sh
  cd src/devices/
  npm install
  node conditioner.js
```

<br>

### Thermostat

The thermostat function is written in pure JavaScript and exploits the _mqtt_ JavaScript library to receive messages on the queue "iot/devices/thermostat". 
The code is [here](src/devices/thermostat.js)

The following commands execute the thermostat simulation:

```sh
  cd src/devices/
  npm install
  node thermostat.js
  cd ../..
```

<br>

### IoT Client

The IoT Client could be written in any language for any platform that support the MQTT protocol. For this example we have used a general purpose  [MQTT Android Client](https://play.google.com/store/apps/details?id=com.gbn.mqttclient). In this app you can subscribe to a topic. (In our case you have to subscribe to "iot/devices/tablet"). After created the connection you can easily recieve values on this (or other) topic.

<p align="center"><img src="./assets/mqtt_client.jpg" height="500"/></p>

<br>
