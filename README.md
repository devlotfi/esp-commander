<img src="https://raw.githubusercontent.com/devlotfi/esp-commander/master/github-assets/github-banner.png">

# 📜 esp-commander

An app to controll IOT devices using MQTT

# 📌 Contents

- [Tech stack](#tech-stack)
  - [App](#app)
  - [IOT](#iot)
  - [Diagrams](#diagrams)
- [How does the system work ?](#how-does-the-system-work-)
- [Web App](#web-app)

# Tech stack

## App

<p float="left">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/html.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/css.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/ts.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/tailwind.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/react.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/lucide.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/formik.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/i18n.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/tanstack-router.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/tanstack-query.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/rxdb.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/drizzle.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/heroui.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/vite.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/hashicorp-terraform.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/openapi.svg">
</p>

## Services

<p float="left">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/gemini.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/netlify.svg">
</p>

## IOT

<p float="left">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/arduino.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/espressif.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/mqtt.svg">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/esp-now-mqtt-gateway.svg">
</p>

## Diagrams

<p float="left">
  <img height="50px" src="https://devlotfi.github.io/stack-icons/icons/drawio.svg">
</p>

# How does the system work ?

- We use a web PWA client to control IOT Devices using MQTT
- It is possible to query data and perform actions
- Its also possible to control devices using AI (Gemini), By using a classic chat interface or real-time voice conversation
- Devices are categorized into 2 types **Normal Devices** and **Sleepy Devices**
- Normal devices use a request/response comunication and can be connected directly qith MQTT or via a gateway
- Sleepy devices require the use of a gateway like [EspNowMqttGateway](https://github.com/devlotfi/esp-now-mqtt-gateway)
- Sleepy devices are the low power devices that wake up occasionally, they send the data as a retained message to an mqtt topic and commands are recived and stored in the gateway for when the sleepy devices requests it

## Direct Connection

<img src="https://raw.githubusercontent.com/devlotfi/esp-commander/master/github-assets/working-diagram.png">

## Gateway Connection

<img src="https://raw.githubusercontent.com/devlotfi/esp-commander/master/github-assets/working-diagram-gateway.png">

# Web App

<img src="https://raw.githubusercontent.com/devlotfi/esp-commander/master/github-assets/preview-1.png">
<img src="https://raw.githubusercontent.com/devlotfi/esp-commander/master/github-assets/preview-2.png">
<img src="https://raw.githubusercontent.com/devlotfi/esp-commander/master/github-assets/preview-3.png">
<img src="https://raw.githubusercontent.com/devlotfi/esp-commander/master/github-assets/preview-4.png">
<img src="https://raw.githubusercontent.com/devlotfi/esp-commander/master/github-assets/preview-5.png">
