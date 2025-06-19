# MAX30009-bluetooth
Design and Implementation of a Bioimpedance Measurement System Based on the MAX30009 System-on-Chip is a bachelor thesis conducted in the Polytechnic University of Catalonia (UPC) in 2025. Its purpose is to create a system able to obtain bio impedance using the MAX30009 SOC and custom firmware / software. 

The system created uses an Arduino Nano to communicate with the PC and the MAX30009 chip. The Arduino is connected to two main components: the MAX30009 chip and the EEPROM memory through the SPI communication protocol.
<div align="center">
    <img height="50%" width="50%" alt="Image" src="https://github.com/user-attachments/assets/589594e0-6306-4362-82bc-920060a84f2f">
  <br/>
  <i>Figure 1: Diagram of the communication between the components</i>
</div>
<br />

The way the Bluetooth transmission works is simple. In general, the PC requests a command, and the Arduino responds to it. For example, the following transmission is used when initializing the device and requesting the calibrated values to the EEPROM: 
<div align="center">
    <img height="50%" width="50%" alt="Image" src="https://github.com/user-attachments/assets/fda5ac71-3382-4676-8849-333e90403807">
  <br/>
  <i>Figure 2: Communication between the PC and the Arduino asking for calibration values</i>
</div>
<br />


> [!NOTE]
> The documentation of this project is still being redacted. It will be available shortly.


# Licences
This code uses several dependencies: 
* Bootstrap, Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
* Google Fonts
* Fontawesome free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
* Chart.js, Released under the MIT License
* FileSaver.js, By Eli Grey, Licensed under MIT (https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md)

This project is part of a bachelor thesis, which per per university policy is licenced under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (https://creativecommons.org/licenses/by-nc-sa/4.0/). All dependencies used keep their original license, some of them were uploaded in case a CDN stopped working.
