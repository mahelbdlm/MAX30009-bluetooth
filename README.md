# MAX30009-bluetooth
Design and Implementation of a Bioimpedance Measurement System Based on the MAX30009 System-on-Chip is a bachelor thesis conducted in the Polytechnic University of Catalonia (UPC) in 2025. Its purpose is to create a system able to obtain bio impedance using the MAX30009 SOC and custom firmware / software. 

> [!NOTE]
> This project was developed as part of a Bachelor's thesis. The essential functionality and context are summarized below. For full technical details, design decisions, and results, please refer to the complete thesis document

The system created uses an Arduino Nano to communicate with the PC and the MAX30009 chip. The Arduino is connected to two main components: the MAX30009 chip and the EEPROM memory through the SPI communication protocol.
<div align="center">
    <img height="50%" width="50%" alt="Image" src="https://github.com/user-attachments/assets/2c1f3968-c883-4ab7-a9c3-75bc40b1880c">
  <br/>
  <i>Figure 1: Diagram of the communication between the components</i>
</div>
<br />

The way the Bluetooth transmission works is simple. In general, the PC requests a command, and the Arduino responds to it. For example, the following transmission is used when initializing the device and requesting the calibrated values to the EEPROM: 
<div align="center">
    <img height="50%" width="50%" alt="Image" src="https://github.com/user-attachments/assets/fa4192a9-b043-4832-81fe-eba3366e6162">
  <br/>
  <i>Figure 2: Diagram of the connections between the Arduino and the chip</i>
</div>
<br />

The schematic of the system is provided below: 
<div align="center">
    <img height="50%" width="50%" alt="Image" src="https://github.com/user-attachments/assets/c1b966ea-5f36-483c-b858-4d062a4a7e35">
  <br/>
  <i>Figure 3: Schematic of the system</i>
</div>
<br />

# Web Application
Since this project is being developed in Spain, the language chosen for the interface is Spanish. However, to make it more intuitive and reduce language barriers, the interface presents various pictograms and icons that help the user throughout the whole process. The JavaScript code was developed entirely from scratch, while CSS and HTML were created using bootstrap studio, a template generator. This tool significantly accelerates the design process, allowing to focus more on the functional part rather than its aesthetics.

The user interface guides the user throughout all the process. When the device is first powered on, a message will indicate that the calibration values were not found. 

<div align="center">
    <img height="50%" width="50%" alt="Image" src="https://github.com/user-attachments/assets/d3594256-abcb-4321-acab-d95579ff4d37">
  <br/>
  <i>Figure 4: User interface when establishing connection with a non calibrated device</i>
</div>
<br />
The user can then click on the calibrate button and input the desired parameters such as the calibration resistance used, the desired frequencies and the input mode. 
<div align="center">
    <img height="30%" width="30%" alt="Image" src="https://github.com/user-attachments/assets/7c6147e6-85b4-43d9-824b-76dfa431eaae">
  <br/>
  <i>Figure 5: Calibration menu</i>
</div>
<br />

More specifically, it can indicate the calibration resistance value and request up to 127 frequencies. These frequencies will be same one used to measure the impedance. 
Upon completion, a success message appears in the calibration menu. 
 <div align="center">
    <img height="30%" width="30%" alt="Image" src="https://github.com/user-attachments/assets/db8f04cf-fd5a-412f-a108-283b2a68c311">
  <br/>
  <i>Figure 6: Success message upon calibration completion</i>
</div>
<br />

This alert also allows to save the calibration values into a json file. In this way, the specific values of the calibration parameters can be obtained. 
Once the calibration has been successfully completed, the values can be obtained: 

<div align="center">
    <img height="100%" width="100%" alt="Image" src="https://github.com/user-attachments/assets/eea0c113-9a7f-4040-81e3-0f7cf0c41fdd">
  <br/>
  <i>Figure 7: Graph showing the impedance magnitude and phase obtained through the user interface, generated using chartjs</i>
</div>
<br />

The values are shown in a responsive graph, generated with the use of the library chartjs. It allows to simply observe the tendency, and read the value when hovering with the mouse. In this project, the graph is represented in linear scale, but could be changed to logarithmic in future versions.
Each frequency is computed using an average of 32 samples. This value can be changed in the Arduino code. The webpage receives the averaged value, processes the calibrated value and then represents in on a graph.
The values can also be saved in CSV or Excel files by clicking on the Download button and selecting the file format.

<div align="center">
    <img height="30%" width="30%" alt="Image" src="https://github.com/user-attachments/assets/0758accd-feeb-4bf5-80a0-fdc0899cbc12">
  <br/>
  <i>Figure 8: Downloading the values</i>
</div>
<br />

The file can then be inspected using third party tools (excel, matlab...)

<div align="center">
    <img height="40%" width="40%" alt="Image" src="https://github.com/user-attachments/assets/57379abe-2601-4c94-be43-199e652c0af5">
  <br/>
  <i>Figure 10: Opening the values downloaded through the user interface with Excel</i>
</div>
<br /> 

The user interface is also capable of detecting errors happening on the Arduino. For example, if the MAX30009 chip is not connected, the page displays the following error message: 

<div align="center">
    <img height="70%" width="70%" alt="Image" src="https://github.com/user-attachments/assets/dea2a04e-2156-4093-907b-34d410efcc3b">
  <br/>
  <i>Figure 11: Error message displayed on the user interface</i>
</div>
<br />
As the system’s capabilities continue to expand, managing all potential failures and displaying specific error messages in the user interface becomes increasingly challenging. To maintain a simple user interface, only common errors and failures are presented. For more complex errors, such as the chip failing to respond during power-up, or the transmission of an invalid sequence, generic error messages are displayed. Details of these errors can be obtained through the Arduino console. 
The user interface is designed to be simple and require few configuration. However, when unexpected errors happen, additional configuration options may be necessary. For this reason, a “debug mode” is available within the interface, allowing user to customize more parameters. 

# Licences
This code uses several dependencies: 
* Bootstrap, Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
* Google Fonts
* Fontawesome free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
* Chart.js, Released under the MIT License
* FileSaver.js, By Eli Grey, Licensed under MIT (https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md)

This project is part of a bachelor thesis, which per per university policy is licenced under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (https://creativecommons.org/licenses/by-nc-sa/4.0/). All dependencies used keep their original license, some of them were uploaded in case a CDN stopped working.
