//Bluetooth BIOZ Arduino
//Version 5

// while (!Serial) needs to be uncommented to debug using serial
// Remove while (!Serial) to use with external battery

#define print_spi_address_and_data 0  //Enable printing the SPI address and values transmitted
#define MAX3009_enabled 1             //Enable / disable the MAX3009 chip SPI
#define eeprom_enabled 0              //Enable / disable access to the EEPROM
#define SPI_strict_write 0            //Strict write => Verify each write

//TO_VERIFY: TAG TO VERIFY


#include <SPI.h>
#include <ArduinoBLE.h>

/* SPI connections:
CS: 10
MOSI -> SDI chip: 11
MISO -> SDO chip: 12
SCLK: 13
*/
const int SELECT_PIN = 10;
const int CS_PIN_EEPROM = 9;
const int PIN_VOLTAGE_REDUCER = 2;

bool MAX3009_SUCCESS = 0;
bool EEPROM_SUCCESS = 0;

//Transmission Variables
const int valueBLEBuffer = 3;    //Number of bytes sent (max 512 bytes)
const int numberReadFifo = 400;  //Number of values to read bioZ and send via bluetooth

const int checkSumEachNbValues = 100;  //Compare errors each xx values sent

//Config variables sweep read
const int minimumNumberLoop = 100;
const int nbValuesToDiscard = 100;      //Discards the first xx values before sending them to allow the device to stabilize
const int averageSize = 32;

// Bluetooth® Low Energy Services
BLEService commandService("0000FFF0-0000-1000-8000-00805F9B34FB");
BLEService deviceInformationService("180A");

// Bluetooth® Low Energy Characteristics
// BLEBroadcast, BLERead, BLEWriteWithoutResponse, BLEWrite, BLENotify, BLEIndicate
BLECharacteristic commandCharacteristic("0000FFF2-0000-1000-8000-00805F9B34FB", BLERead | BLENotify, valueBLEBuffer, false);  //PC will only be able to read
BLECharacteristic connect_PC_Characteristic("0000FFF1-0000-1000-8000-00805F9B34FB", BLEWrite, valueBLEBuffer, false);         //PC will be able to write
BLECharacteristic frame7byte_Characteristic("0000FFF3-0000-1000-8000-00805F9B34FB", BLERead | BLENotify, 7, false);           //PC will be able to write

BLECharacteristic manufacturerCharacteristic("2A29", BLERead, 10, false);     //10 bytes
BLECharacteristic modelNumberCharacteristic("2A24", BLERead, 9, false);       // 9 bytes
BLECharacteristic firmwareRevisionCharacteristic("2A26", BLERead, 7, false);  // 7 bytes

struct frequency_struct {
  uint16_t MDIV;
  bool NDIV;
  uint8_t KDIV;
  uint8_t DAC_OSR;
  uint8_t ADC_OSR;
};

//Variables for init communication
bool connectionEstablished = 0;  //Used to send data to the computer when connection is established

//Variables used for the transmission loop
//In order to have CPU time for the bluetooth receiver, we must
//not use while loops and make it go through the void loop() every time
bool enableSingleTransmission = 0;
bool firstTimeTransmission = 0;
bool waitingPCResponse = 0;
bool gotPCResponse = 0;

//Variables for sending transmission
bool transmissionEnabled = 0;  //When FIFO reaches a certain number, read all the values until it is empty
bool transmittingValues = 1;   //Disabled in case of error to exit loop
int valuesSent = 0, valuesDiscarded = 0;
unsigned long totalSum = 0;
bool transmissionAveraged = 0;

//Variables for sending sweep transmission averaged
int nbValuesQ = 0, nbValuesI = 0;
long Q_avg_val = 0, I_avg_val = 0;

//Variables for calibration / sweep
bool calPins = 1;
bool debugMode = 0, save_eeprom = 1, doublecheck_spi = 0;
uint32_t calibResistor = 0;
bool enableCalib = 0;
bool enableSweep = 0, enableAverageTransmission = 0;
uint8_t nbFrequenciesExpected = 0, nbFreqRecieved = 0;

//Other variables used in multiple parts
uint32_t I_global = 0, Q_global = 0;
unsigned long timeBefore;
unsigned long valueReadPC = 0;


void setup() {
  pinMode(SELECT_PIN, OUTPUT);
  pinMode(CS_PIN_EEPROM, OUTPUT);
  pinMode(PIN_VOLTAGE_REDUCER, OUTPUT);
  Serial.begin(115200);  // initialize serial output


  while (!Serial) {
    ;
  }
  digitalWrite(SELECT_PIN, HIGH);
  digitalWrite(CS_PIN_EEPROM, HIGH);
  SPI.begin();  // initialize the SPI library
  Serial.println("Initializing");

  SPI.beginTransaction(SPISettings(450000, MSBFIRST, SPI_MODE0));  //450000
                                                                   //SPI.beginTransaction(SPISettings(48000000, MSBFIRST, SPI_MODE0));
                                                                   //It seems the frequency won't be higher than 11.76 MHz in osciloscope...

  //initSequence();

  //SPI.end();

  uint8_t partId = 0x00;
  uint8_t count = 0;
  if (eeprom_enabled) {
    digitalWrite(PIN_VOLTAGE_REDUCER, LOW);
    delay(100);
    partId = 0x00;
    count = 0;
    delay(300);
    while (partId != 0x42 && count < 10) {
      eeprom_read_byte(0x0000, &partId);  //Read check byte
      Serial.print("Read EEPROM ID: ");
      Serial.println(partId, HEX);
      delay(500);
      count++;
    }
    if (partId != 0x42) {
      Serial.println("Error: Couldn't read the proper device ID for EEPROM (42).\nDo you want to write the check bit? (1-0)");
      EEPROM_SUCCESS = 0;
      timeBefore = millis();
      unsigned long timeDiff = millis() - timeBefore;
      int val = Serial.read();
      while (timeDiff < 15000) {
        if (val == '1') {
          Serial.println("Writing check bit");
          eeprom_write_byte(0x00, 0x42);
          timeDiff = 15000;
        } else if (val == '0') {
          timeDiff = 15000;
        } else {
          timeDiff = millis() - timeBefore;
          val = Serial.read();
        }
      }
      //return;
    } else EEPROM_SUCCESS = 1;
  }
  if (MAX3009_enabled) {
    digitalWrite(PIN_VOLTAGE_REDUCER, HIGH);
    partId = 0x00;
    count = 0;
    delay(200);
    while (partId != 0x42 && count < 10) {
      partId = readPartId();
      delay(500);
      count++;
    }
    if (partId != 0x42) {
      Serial.println("Error: Couldn't read the proper device ID for MAX3009 (42).");
      MAX3009_SUCCESS = 0;
      //return;
    } else {
      MAX3009_SUCCESS = 1;
      shut_down();
    }
  }


  Serial.println("Check device OK. Enabling Bluetooth");
  // begin initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1)
      ;
  }
  BLE.setLocalName("Arduino BioZ");

  BLE.setAdvertisedService(commandService);  // add the service UUID
  commandService.addCharacteristic(commandCharacteristic);
  commandService.addCharacteristic(connect_PC_Characteristic);
  commandService.addCharacteristic(frame7byte_Characteristic);
  BLE.addService(commandService);

  //Setting up the values of deviceInformationService

  //Manufacturer name: Mahel Inc.
  uint8_t manufBuf[10] = { 0x4D, 0x61, 0x68, 0x65, 0x6C, 0x20, 0x49, 0x6E, 0x63, 0x2E };

  //Model number: BioZ V1.0
  uint8_t modelBuf[9] = { 0x42, 0X69, 0X6F, 0X5A, 0X20, 0X56, 0X31, 0X2E, 0X30 };

  //Firmware version: FW 1.5
  uint8_t firmwareBuf[7] = { 0x46, 0X57, 0X20, 0X56, 0X31, 0X2E, 0X35 };

  //Configure the deviceInformationService adding the characteristics
  //with their respective values
  deviceInformationService.addCharacteristic(manufacturerCharacteristic);
  manufacturerCharacteristic.writeValue(manufBuf, sizeof(manufBuf));
  deviceInformationService.addCharacteristic(modelNumberCharacteristic);
  modelNumberCharacteristic.writeValue(modelBuf, sizeof(modelBuf));
  deviceInformationService.addCharacteristic(firmwareRevisionCharacteristic);
  firmwareRevisionCharacteristic.writeValue(firmwareBuf, sizeof(firmwareBuf));
  BLE.addService(deviceInformationService);

  // assign event handlers for connected, disconnected to peripheral
  BLE.setEventHandler(BLEConnected, blePeripheralConnectHandler);
  BLE.setEventHandler(BLEDisconnected, blePeripheralDisconnectHandler);

  // assign event handlers for characteristic (pc writes to arduino)
  connect_PC_Characteristic.setEventHandler(BLEWritten, read_from_PC);
  // set an initial value for the characteristic
  connect_PC_Characteristic.setValue(0);

  /* Start advertising Bluetooth® Low Energy.  It will start continuously transmitting Bluetooth® Low Energy
     advertising packets and will be visible to remote Bluetooth® Low Energy central devices
     until it receives a new connection */

  // start advertising
  BLE.advertise();

  Serial.println("Bluetooth® device active, waiting for connections...");
}

void loop() {
  serial_functions();
  // wait for a Bluetooth® Low Energy central
  BLEDevice central = BLE.central();
  // if a central is connected to the peripheral:
  if (central) {
    Serial.print("Connected to central: ");
    // print the central's BT address:
    Serial.println(central.address());
    while (central.connected()) {
      serial_functions();
      if (connectionEstablished == 1) {
        //Send the connection sequence to computer
        //A second check is performed to ensure all the 
        //devices are correctly connected
        connectionEstablished = 0;
        uint8_t partId = 0x00;
        uint8_t count = 0;
        if (!EEPROM_SUCCESS && eeprom_enabled) {
          partId = 0x00;
          count = 0;
          digitalWrite(PIN_VOLTAGE_REDUCER, LOW);
          delay(100);
          partId = 0x00;
          count = 0;
          delay(300);
          while (partId != 0x42 && count < 10) {
            eeprom_read_byte(0x0000, &partId);  //Read check byte
            Serial.print("Read EEPROM ID: ");
            Serial.println(partId, HEX);
            delay(500);
            count++;
          }
          if (partId != 0x42) {
            Serial.println("Error: Couldn't read the proper device ID for EEPROM (42).");
            EEPROM_SUCCESS = 0;
            //return;
          } else EEPROM_SUCCESS = 1;
          digitalWrite(PIN_VOLTAGE_REDUCER, HIGH);
          delay(10);
        }
        if (!MAX3009_SUCCESS) {
          partId = 0x00;
          count = 0;
          Serial.println("Re-checking MAX3009 chip");
          while (partId != 0x42 && count < 10) {
            partId = readPartId();
            delay(500);
            count++;
          }
          if (partId != 0x42) {
            Serial.println("Error: Couldn't read the proper device ID for MAX3009 (42).");
            MAX3009_SUCCESS = 0;
            //return;
          } else {
            MAX3009_SUCCESS = 1;
            shut_down();
          }
        }

        if (eeprom_enabled && EEPROM_SUCCESS) {
          //Read eeprom and determine if calibration values were stored
          uint8_t eeprom_success_byte, eeprom_nb_freq, eeprom_rcal_2, eeprom_rcal_1, eeprom_rcal_0;
          eeprom_read_byte(0x0001, &eeprom_success_byte);

          if (eeprom_success_byte == 0x01) {
            //Last session stored successfully content into the eeprom
            //Get the rcal value from eeprom
            eeprom_read_byte(0x0002, &eeprom_nb_freq);
            Serial.print("Found ");
            Serial.print(eeprom_nb_freq);
            Serial.println(" calibration values.");

            if (eeprom_nb_freq == 255) {
              //An error happened.
              Serial.print("EEPROM success failed. 255 values were indicated: ");
              Serial.println(eeprom_success_byte);
              unsigned long eepromPC = 0x520001;  //0x500001
              commandCharacteristic.writeValue(eepromPC);
            } else if (eeprom_nb_freq > 0) {
              //Got frequencies in EEPROM
              //Send the step 2
              unsigned long eepromPC = (0x510 << 12) | (EEPROM_SUCCESS << 9) | (MAX3009_SUCCESS << 8) | (eeprom_nb_freq & 0xFF);
              commandCharacteristic.writeValue(eepromPC);

              //Send the step 3 - Resistor Value
              uint8_t bufferSend[7];
              eeprom_read_byte(0x0003, &eeprom_rcal_2);
              eeprom_read_byte(0x0004, &eeprom_rcal_1);
              eeprom_read_byte(0x0005, &eeprom_rcal_0);

              Serial.print("Getting resistor value: ");
              Serial.print(eeprom_rcal_2, HEX);
              Serial.print(eeprom_rcal_1, HEX);
              Serial.println(eeprom_rcal_0, HEX);

              bufferSend[0] = eeprom_rcal_0;
              bufferSend[1] = eeprom_rcal_1;
              bufferSend[2] = eeprom_rcal_2;
              bufferSend[3] = 0x00;
              bufferSend[4] = 0x00;
              bufferSend[5] = 0x01;  //Type 01 -> Transmit calib resistance
              bufferSend[6] = 0x00;  //Freq number to 0 (don't care as reading resistor value)
              frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));

              //Step 4 - Send the calibration data
              for (int i = 0; i < eeprom_nb_freq; i++) {
                uint8_t bufferSend[7];
                uint8_t readBuffer[1 + 31];
                eeprom_read_page((i + 1) << 5, readBuffer);

                Serial.print("Read ");
                Serial.print(readBuffer[0]);
                Serial.print(" bytes from EEPROM at frequency no ");
                Serial.print(i);
                Serial.println(": ");

                /*for (int j = 1; j <= readBuffer[0]; j++) {
                Serial.print("Byte ");
                Serial.print(j+1);
                Serial.print(": 0x");
                Serial.println(readBuffer[j], HEX);
              }*/

                uint8_t eeprom_freqNum = readBuffer[1],
                        eeprom_adc = (readBuffer[2] >> 5) & 0x07,
                        eeprom_dac = readBuffer[2] & 0x03,
                        eeprom_kdiv = (readBuffer[3] >> 3) & 0x0F,
                        eeprom_ndiv = (readBuffer[3] >> 2) & 0x01;
                uint16_t eeprom_mdiv = (readBuffer[3] & 0x03) << 8 | readBuffer[4];

                Serial.print("Freq number: ");
                Serial.print(eeprom_freqNum);
                Serial.print(", MDIV: ");
                Serial.print(eeprom_mdiv);
                Serial.print(", NDIV: ");
                Serial.print(eeprom_ndiv);
                Serial.print(", KDIV: ");
                Serial.print(eeprom_kdiv);
                Serial.print(", DAC: ");
                Serial.print(eeprom_dac);
                Serial.print(", ADC: ");
                Serial.println(eeprom_adc);

                /*
              ((value.getUint8(1) & 0x03) << 8) | value.getUint8(0);
              (value.getUint8(1) & 0x04)
              ((value.getUint8(1) & 0x78) >> 3)
              ((value.getUint8(2) & 0x01) << 1) | ((value.getUint8(1) & 0x80) >> 7))
              ((value.getUint8(2) & 0x0E) >> 1)
              */

                bufferSend[0] = eeprom_mdiv & 0xFF;
                bufferSend[1] = ((eeprom_dac & 0x01) << 7) | ((eeprom_kdiv & 0x0F) << 3) | (eeprom_ndiv << 2) | ((eeprom_mdiv & 0x300) >> 8);
                bufferSend[2] = (eeprom_adc << 1) | ((eeprom_dac >> 1) & 0x01);
                bufferSend[3] = 0x00;
                bufferSend[4] = 0x00;
                bufferSend[5] = 0x02;            //Type 01 -> Transmit calib resistance
                bufferSend[6] = eeprom_freqNum;  //Freq number
                frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));

                //            ((type) << 4) | ((element.adc_osr & 0x7) << 1) | ((element.dac_osr >> 1) & 0x01),
                //  ((element.dac_osr & 0x01) << 7) | ((element.kdiv & 0xF) << 3) | ((element.ndiv & 0x01) << 2) | ((element.mdiv & 0x300) >> 8),
                // element.mdiv & 0xFF

                uint8_t eeprom_i_offset = ((readBuffer[5] & 0x0F) << 16) | (readBuffer[6] << 8) | readBuffer[7],
                        eeprom_q_offset = ((readBuffer[8] & 0x0F) << 16) | (readBuffer[9] << 8) | readBuffer[10],
                        eeprom_i_rcal_in = ((readBuffer[11] & 0x0F) << 16) | (readBuffer[12] << 8) | readBuffer[13],
                        eeprom_q_rcal_in = ((readBuffer[14] & 0x0F) << 16) | (readBuffer[15] << 8) | readBuffer[16],
                        eeprom_i_rcal_quad = ((readBuffer[17] & 0x0F) << 16) | (readBuffer[18] << 8) | readBuffer[19],
                        eeprom_q_rcal_quad = ((readBuffer[20] & 0x0F) << 16) | (readBuffer[21] << 8) | readBuffer[22];

                //Write Q offset and I offset
                bufferSend[0] = eeprom_i_offset & 0xFF;
                bufferSend[1] = (eeprom_i_offset >> 8) & 0xFF;
                bufferSend[2] = ((eeprom_i_offset >> 16) & 0x0F) | ((eeprom_q_offset & 0x0F) << 4);
                bufferSend[3] = (eeprom_q_offset >> 4) & 0xFF;
                bufferSend[4] = (eeprom_q_offset >> 12) & 0xFF;
                bufferSend[5] = 0x03;            //Type I/Q offset, no error
                bufferSend[6] = eeprom_freqNum;  //Freq number
                frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));

                //Write Q and I rcal in
                bufferSend[0] = eeprom_i_rcal_in & 0xFF;
                bufferSend[1] = (eeprom_i_rcal_in >> 8) & 0xFF;
                bufferSend[2] = ((eeprom_i_rcal_in >> 16) & 0x0F) | ((eeprom_q_rcal_in & 0x0F) << 4);
                bufferSend[3] = (eeprom_q_rcal_in >> 4) & 0xFF;
                bufferSend[4] = (eeprom_q_rcal_in >> 12) & 0xFF;
                bufferSend[5] = 0x04;            //Type I/Q Rcal in, no error
                bufferSend[6] = eeprom_freqNum;  //Freq number
                frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));

                //Write Q and I rcal quad
                bufferSend[0] = eeprom_i_rcal_quad & 0xFF;
                bufferSend[1] = (eeprom_i_rcal_quad >> 8) & 0xFF;
                bufferSend[2] = ((eeprom_i_rcal_quad >> 16) & 0x0F) | ((eeprom_q_rcal_quad & 0x0F) << 4);
                bufferSend[3] = (eeprom_q_rcal_quad >> 4) & 0xFF;
                bufferSend[4] = (eeprom_q_rcal_quad >> 12) & 0xFF;
                bufferSend[5] = 0x05;            //Type I/Q Rcal quad, no error
                bufferSend[6] = eeprom_freqNum;  //Freq number
                frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));
              }
              Serial.println("Calib init sequence finished.");
              eepromPC = 0x5C0001;  //0x500001
              commandCharacteristic.writeValue(eepromPC);
            } else {
              Serial.print("EEPROM success failed. 0 values were indicated: ");
              Serial.println(eeprom_success_byte);
              unsigned long eepromPC = (0x520 << 12) | (eeprom_enabled << 9) | (MAX3009_SUCCESS << 8) | 0xFF;
              commandCharacteristic.writeValue(eepromPC);
            }
          } else {
            Serial.print("EEPROM success failed. Value: ");
            Serial.println(eeprom_success_byte);
            unsigned long eepromPC = (0x520 << 12) | (eeprom_enabled << 9) | (MAX3009_SUCCESS << 8) | 0xFF;
            commandCharacteristic.writeValue(eepromPC);
          }

        } else {
          unsigned long eepromPC = (0x500 << 12) | (eeprom_enabled << 9) | (MAX3009_SUCCESS << 8) | 0xFF;
          commandCharacteristic.writeValue(eepromPC);
          Serial.println("No eeprom or EEPROM failed check bit. Sending calib value");
        }
      }
      if (enableSingleTransmission) {
        if (firstTimeTransmission) {
          Serial.println("First time transmission");
          totalSum = 0;
          transmissionEnabled = 0;  //When FIFO reaches a certain number, read all the values until it is empty
          valuesSent = 0;
          valuesDiscarded = 0;
          waitingPCResponse = 0;
          gotPCResponse = 0;
        }
        sendTransmission();
      }
      if (enableAverageTransmission) {
        if (firstTimeTransmission) {
          Serial.println("First time transmission averaged");
          totalSum = 0;
          transmissionEnabled = 0;  //When FIFO reaches a certain number, read all the values until it is empty
          valuesSent = 0;
          valuesDiscarded = 0;
          waitingPCResponse = 0;
          gotPCResponse = 0;
        }
        sendTransmissionAverage();
      }
    }
    Serial.print("Disconnected from central: ");
    Serial.println(central.address());
  }
}

void serial_functions() {
  int val = Serial.read();
  if (val == '0') {
    shut_down();
  }
  if (val == '1') {
    power_on();
  }
  if (val == '2') {
    Serial.println("Init sequence");
    initSequence();
  }
  if (val == '3') {
    struct frequency_struct freqSweep = { 781, 1, 0x1, 0x3, 0x7 };
    if (!setFrequencyReg(freqSweep.MDIV, freqSweep.NDIV, freqSweep.KDIV, freqSweep.DAC_OSR, freqSweep.ADC_OSR)) {
      Serial.println("ERROR");
      return;
    }
  }
  if (val == '4') {
    if (eeprom_enabled) {
      eeprom_write_byte(0x00, 0x42);
    } else {
      Serial.println("EEPROM disabled");
    }
    /*Serial.println("4");
    SPI_write(0x41, 0x06);

    uint8_t regRead;
    SPI_read(0x41, &regRead);
    Serial.println(regRead, HEX);*/
  }
  if (val == '5') {
    if (eeprom_enabled) {
      digitalWrite(PIN_VOLTAGE_REDUCER, LOW);
      delay(200);
      Serial.println("EEPROM RESET.");
      uint8_t nb_freq;
      eeprom_read_byte(0x0002, &nb_freq);
      Serial.print("Deleting ");
      Serial.print(nb_freq);
      Serial.println(" frequencies");

      delay(10);
      eeprom_page_reset(0);
      delay(10);
      eeprom_write_byte(0x00, 0x42);
      for (int i = 1; i <= nb_freq; i++) {
        delay(50);
        eeprom_page_reset(32 * i);
      }
      delay(200);
      digitalWrite(PIN_VOLTAGE_REDUCER, HIGH);
    }
  }
  if (val == '9') {
    if (eeprom_enabled) eeprom_write_byte(0x0001, 0x01);
    else Serial.println("EEPROM is disabled.");
  }
  if (val == 'a') {
    if (eeprom_enabled) {
      Serial.println("Read check byte");
      uint8_t byte;
      eeprom_read_byte(0x0000, &byte);
      Serial.print("Byte read: ");
      Serial.println(byte, HEX);
    } else Serial.println("EEPROM is disabled.");
  }
  if (val == 'c') {
    //Serial.println("Calibration");
    //calibration();
  }
  if (val == 'd') {
    if (eeprom_enabled) {
      Serial.println("Disable write");
      eeprom_disable_write();
    } else Serial.println("EEPROM is disabled.");
  }
  if (val == 'e') {
    if (eeprom_enabled) {
      Serial.println("Enable write latch");
      eeprom_enable_write();
    } else Serial.println("EEPROM is disabled.");
  }
  if (val == 'f') {
    uint8_t bioz_status;
    SPI_read(0x20, &bioz_status);
    Serial.print("BIOZ Status 0x20: ");
    Serial.println(bioz_status, HEX);

    uint8_t fifo_read_ptr;
    SPI_read(0x09, &fifo_read_ptr);
    Serial.print("FIFO Read Pointer: ");
    Serial.println(fifo_read_ptr, HEX);

    uint8_t msb, lsb, data[3];
    SPI_read(0x0A, &msb);
    SPI_read(0x0B, &lsb);
    uint16_t sampleCount = ((uint16_t)msb << 8) | lsb;

    Serial.print("Samples in FIFO: ");
    Serial.println(sampleCount);

    uint32_t dataFIFO;
    SPI_read_FIFO(&dataFIFO);                        //Gets the data (tag and data) from FIFO
    uint8_t checkData = check_FIFO_data(&dataFIFO);  //0: Invalid, 1: In Phase, 2: Quadrature, 3: Marker
    uint32_t dataF = dataFIFO & 0x0FFFFF;
    Serial.print("Check data: ");
    Serial.print(checkData);
    Serial.print(" Data: ");
    Serial.println(dataF, HEX);
  }
  if (val == 'h') {
    digitalWrite(PIN_VOLTAGE_REDUCER, HIGH);
  }
  if (val == 'i') {
    readPartId();
  }
  if (val == 'l') {
    digitalWrite(PIN_VOLTAGE_REDUCER, LOW);
  }
  if (val == 'o') {
    if (eeprom_enabled) {
      uint8_t eeprom_8bit;
      uint32_t rcal;
      eeprom_read_byte(0x0000, &eeprom_8bit);
      Serial.print("Check byte: ");
      Serial.println(eeprom_8bit, HEX);
      eeprom_read_byte(0x0001, &eeprom_8bit);
      Serial.print("Success byte: ");
      Serial.println(eeprom_8bit, HEX);
      eeprom_read_byte(0x0002, &eeprom_8bit);
      Serial.print("Number of frequencies: ");
      Serial.println(eeprom_8bit, HEX);
      eeprom_read_byte(0x0003, &eeprom_8bit);
      rcal = eeprom_8bit << 16;
      eeprom_read_byte(0x0004, &eeprom_8bit);
      rcal = rcal | eeprom_8bit << 8;
      eeprom_read_byte(0x0005, &eeprom_8bit);
      rcal = rcal | eeprom_8bit;
      Serial.print("RCAL: ");
      Serial.print(rcal);
      Serial.print(", RCAL HEX: ");
      Serial.println(rcal, HEX);
    } else Serial.println("EEPROM is disabled.");
  }
  if (val == 'p') {
    if (eeprom_enabled) {
      uint8_t readBuffer[1 + 31];
      eeprom_read_page(0x0020, readBuffer);

      Serial.print("Read ");
      Serial.print(readBuffer[0]);
      Serial.println(" bytes from EEPROM:");
      for (int i = 1; i <= readBuffer[0]; i++) {
        Serial.print("Byte ");
        Serial.print(i + 1);
        Serial.print(": 0x");
        Serial.println(readBuffer[i], HEX);
      }
    } else Serial.println("EEPROM is disabled.");
  }
  if (val == 'r') {
    read_all_registers();
  }
  if (val == 's') {
    soft_reset();
  }
  if (val == 't') {
    if (eeprom_enabled) {
      uint8_t byte;
      eeprom_read_status_reg(&byte);
      Serial.print("Result: ");
      Serial.println(byte, HEX);
      Serial.print("WPEN: ");
      Serial.println((byte & (1 << 7)) >> 7);
      Serial.print("BP1: ");
      Serial.println((byte & (1 << 3)) >> 3);
      Serial.print("BP0: ");
      Serial.println((byte & (1 << 2)) >> 2);
      Serial.print("WEL: ");
      Serial.println((byte & (1 << 1)) >> 1);
      Serial.print("BIP: ");
      Serial.println(byte & 1);
    } else Serial.println("EEPROM is disabled.");
  }
}

void SPI_write(uint8_t address, uint8_t data) {
  digitalWrite(SELECT_PIN, LOW);
  uint8_t bufferWrite[3];
  bufferWrite[0] = address;
  bufferWrite[1] = 0x00;
  bufferWrite[2] = data;

  if (print_spi_address_and_data) {
    Serial.print("Address: 0x");
    Serial.print(bufferWrite[0], HEX);
    Serial.print(" Data: 0x");
    Serial.println(bufferWrite[2], HEX);
  }

  SPI.transfer(bufferWrite, sizeof(bufferWrite));
  digitalWrite(SELECT_PIN, HIGH);

  if (doublecheck_spi || SPI_strict_write) {
    // Check the register has the correct value
    uint8_t byte;
    uint8_t count = 0;
    SPI_read(address, &byte);
    while (checkIfValueCorrect(address, data, byte) && count < 10) {
      Serial.print("Trying to write ");
      Serial.print(data, HEX);
      Serial.print(" to address ");
      Serial.print(address, HEX);
      Serial.print(". Obtaining value ");
      Serial.print(byte, HEX);
      Serial.print(". Retrying ");
      Serial.print(count);
      Serial.println("/10");
      digitalWrite(SELECT_PIN, LOW);
      SPI.transfer(bufferWrite, sizeof(bufferWrite));
      digitalWrite(SELECT_PIN, HIGH);
      delay(10);
      SPI_read(address, &byte);
      count++;
    }
    if (byte != data && count >= 10) {
      Serial.println("ERROR. The MAX3009 chip did not write correctly the result...");
      unsigned long sendErrorVal = 0xD20001;
      commandCharacteristic.writeValue(sendErrorVal);
      //return;
    } /*else {
      Serial.print("Trying to write ");
      Serial.print(data, HEX);
      Serial.print(" to address ");
      Serial.print(address, HEX);
      Serial.print(". Obtaining value ");
      Serial.println(byte, HEX);
    }*/
  }
  //delay(1);
}

bool checkIfValueCorrect(uint8_t addr, uint8_t data, uint8_t readByte) {
  bool whilestatment = (data != readByte);
  if (whilestatment) {
    switch (addr) {
      case 0x17:
        //0x17 has MDIV which resets to 0x1 => 0x40
        if (readByte == 0x40) whilestatment = 0;
        break;
      case 0x11:
        // System config.
        whilestatment = 0;
        break;
      default:
        // statements
        whilestatment = 1;
        break;
    }
  }
  return whilestatment;
}

void SPI_read(uint8_t addr, uint8_t *bufferRead) {
  digitalWrite(SELECT_PIN, LOW);
  SPI.transfer(addr);                //Send desired address
  SPI.transfer(0x80);                //Read mode
  *bufferRead = SPI.transfer(0x00);  //Get read values
  digitalWrite(SELECT_PIN, HIGH);
  //byte x = SPI.transfer (0); // get response
  //delay(1);
}

void SPI_read_FIFO(uint32_t *data) {
  uint8_t byte1, byte2, byte3;
  digitalWrite(SELECT_PIN, LOW);
  SPI.transfer(0x0C);  //Send desired address
  SPI.transfer(0x80);  //Read mode
  byte1 = SPI.transfer(0x00);
  byte2 = SPI.transfer(0x00);
  byte3 = SPI.transfer(0x00);
  digitalWrite(SELECT_PIN, HIGH);

  *data = byte1 << 16 | byte2 << 8 | byte3;

  //*tag = (byte1 >> 4);
  //*data = ((byte1 & 0x0F)<<16) | (byte2 <<8) | byte3;
}

void initSequence() {
  //Init sequence as stated in https://github.com/analogdevicesinc/MAX32655_MAX30009/blob/main/MAX30009.c
  uint8_t byte;
  SPI_write(0x20, 1 << 2);  //BIOZ_BG_EN
  delay(200);
  SPI_write(0x11, 0x00);  // clear SHDN
  SPI_write(0x17, 0x00);  // clear PLL_EN
  SPI_write(0x1a, 0x00);  // clear REF_CLK_SEL
  SPI_write(0x11, 0x01);  // RESET

  SPI_read(0x00, &byte);

  //SPI_read(0x00, NUM_STATUS_REGS);	// read and clear all status registers
  //SPI_write(0x0d, AFE_FIFO_SIZE-NUM_SAMPLES_PER_INT);	// FIFO_A_FULL; assert A_FULL on NUM_SAMPLES_PER_INT samples


  SPI_write(0x10, 0x00);
  SPI_write(0x12, 0x04);
  SPI_write(0x13, 0x00);
  SPI_write(0x14, 0x00);
  //SPI_write(0x20, 0x74); //TO_VERIFY
  SPI_write(0x21, 0x20);
  SPI_write(0x23, 0x00);
  SPI_write(0x24, 0xF3);  //No analog high pass filter | gain 10v
  SPI_write(0x25, 0x4A);
  SPI_write(0x26, 0x00);
  SPI_write(0x27, 0xFF);
  SPI_write(0x28, 0x02);
  SPI_write(0x42, 0x01);
  SPI_write(0x43, 0xA0);
  SPI_write(0x50, 0x00);
  SPI_write(0x51, 0x00);
  SPI_write(0x58, 0x07);
  SPI_write(0x81, 0x00);

  SPI_write(0x80, 0x80);                                // A_FULL_EN; enable interrupt pin on A_FULL assertion
  SPI_write(0x18, 0xBB);                                // MDIV
  SPI_write(0x19, 0x01);                                // PLL_LOCK_WNDW
  SPI_write(0x1A, (0 << 6) | (1 << 5));                 // REF_CLK_SEL | CLK_FREQ_SEL
  SPI_write(0x17, (1 << 6) | (0 << 5) | (2 << 1) | 0);  // MDIV | NDIV | KDIV | PLL_EN
  SPI_write(0x22, (2 << 4) | (2 << 2));                 //0x28         // BIOZ_VDRV_MAG=177 mVrm | BIOZ_IDRV_RGE: 5.525 kohm -> current = 32 uArms
  //SPI_write(0x25, (3 << 2) | 3);                        // BIOZ_AMP_RGE | BIOZ_AMP_BW
  SPI_write(0x41, (1 << 1));  // MUX_EN, Elx pins are connected (not CALx pins)
  //SPI_write(0x41, (0 << 2) | (1 << 1) | 1); // ! CONNECT_CAL_ONLY | MUX_EN | CAL_EN -> connect CALx pins
  // ensure to enable the MCU's interrupt pin before enabling BIOZ
  SPI_write(0x20, (3 << 6) | (4 << 3) | (1 << 2) | (0 << 1) | 0);  // BIOZ_DAC_OSR | BIOZ_ADC_OSR | BIOZ_BG_EN |! BIOZ_Q_EN | ! BIOZ_I_EN
  delay(200);

  //setMode(0);
}


void setMdiv(int val) {
  /*
    This function is specifically to change the M divider value
    as it spans over two seperate registers
    */
  uint32_t V = val;

  uint8_t a = V >> 8;

  uint8_t b = V & 0xFF;


  changeReg(0x17, a, 7, 2);  //step 3:
  changeReg(0x18, b, 7, 8);  //MDIV
}
void changeReg(uint8_t regAddr, uint8_t val, uint8_t bit1, uint8_t numBits) {
  /*
  This is a function to change specific bits of the byte
  */
  int i = 0;
  uint8_t x1 = 0;
  for (i = 7; i > bit1; i--) {
    x1 = x1 + pow(2, i);
  }
  uint8_t x2 = 0;
  for (i = 0; i < (bit1 - numBits + 1); i++) {
    x2 = x2 + (pow(2, i));
  }
  uint8_t newBits = x1 + x2;
  uint8_t reg1;
  SPI_read(regAddr, &reg1);
  newBits = reg1 & newBits;
  val = val << (bit1 - numBits + 1);
  newBits = newBits + val;
  SPI_write(regAddr, newBits);
}

/*void setMode(int mode) {

  
  //There are many modes available in the MAX30009 data sheet. This function allows you to set the 
  //registers according to each of those modes simply by entering the number of the mode.
  //**** not all modes available so far ****
    
  //using EX4

  if (mode == 0) {               // from BU advice
    changeReg(0x20, 0x3, 7, 2);  // step 1: set BIOZ_DAC_OSR = 256
    changeReg(0x17, 0x9, 4, 4);  // step 2: set KDIV to get PLL_CLK in range --512
    setMdiv(532);
    changeReg(0x17, 1, 5, 1);     //step4: NDIV to 1, meaning 1024
    changeReg(0x20, 0x07, 5, 3);  //step 5: BIOZ_ADC_OSR to 7, meaning 1024


    changeReg(0x25, 1, 6, 1);  //dc restore
    changeReg(0x25, 0, 7, 1);  //bypass Cext
  }

  if (mode == 1) {
    changeReg(0x20, 0x3, 7, 2);   // step 1: set BIOZ_DAC_OSR = 256
    changeReg(0x17, 0xD, 3, 4);   // step 2: set KDIV to get PLL_CLK in range --8192
    changeReg(0x17, 0x04, 7, 2);  //step 3:
    changeReg(0x18, 0x12, 7, 8);  //MDIV to 511
    changeReg(0x17, 1, 5, 1);     //step4: NDIV to 1, meaning 1024
    changeReg(0x20, 0x07, 5, 3);  //step 5: BIOZ_ADC_OSR to 7, meaning 1024
  }

  if (mode == 2) {
    changeReg(0x20, 0x3, 7, 2);   // step 1: set BIOZ_DAC_OSR = 256
    changeReg(0x17, 0xA, 3, 4);   // step 2: set KDIV to get PLL_CLK in range --1024
    setMdiv(799);                 //step 3: MDIV to 799
    changeReg(0x17, 1, 5, 1);     //step4: NDIV to 1, meaning 1024
    changeReg(0x20, 0x04, 5, 3);  //step 5: BIOZ_ADC_OSR to 4, meaning 128
  }

  if (mode == 3) {
    changeReg(0x20, 0x3, 7, 2);  // step 1: set BIOZ_DAC_OSR = 256
    changeReg(0x17, 0x6, 3, 4);  // step 2: set KDIV to get PLL_CLK in range -64
    setMdiv(499);
    changeReg(0x17, 0x0, 5, 1);   //step4: NDIV to 1, meaning 512
    changeReg(0x20, 0x04, 5, 3);  //step 5: BIOZ_ADC_OSR to 4, meaning 128
  }

  if (mode == 4) {
    changeReg(0x20, 0x3, 7, 2);  // step 1: set BIOZ_DAC_OSR = 256
    changeReg(0x17, 0x3, 3, 4);  // step 2: set KDIV to get PLL_CLK in range --8
    setMdiv(624);
    changeReg(0x17, 1, 5, 1);     //step4: NDIV to 1, meaning 1024
    changeReg(0x20, 0x04, 5, 3);  //step 5: BIOZ_ADC_OSR to 4, meaning 128
  }

  if (mode == 5) {
    changeReg(0x20, 0x3, 7, 2);   // step 1: set BIOZ_DAC_OSR = 256
    changeReg(0x17, 0x1, 3, 4);   // step 2: set KDIV to get PLL_CLK in range --8
    changeReg(0x17, 0x02, 7, 2);  //step 3:
    changeReg(0x18, 0x70, 7, 8);  //MDIV to 624
    changeReg(0x17, 1, 5, 1);     //step4: NDIV to 1, meaning 1024
    changeReg(0x20, 0x04, 5, 3);  //step 5: BIOZ_ADC_OSR to 4, meaning 128
  }
  if (mode == 6) {
    changeReg(0x20, 0x3, 7, 2);   // step 1: set BIOZ_DAC_OSR = 256
    changeReg(0x17, 0x0, 3, 4);   // step 2: set KDIV to get PLL_CLK in range --1
    setMdiv(427);                 //step 3: MDIV to 799
    changeReg(0x17, 0, 5, 1);     //step4: NDIV to 0, meaning 512
    changeReg(0x20, 0x04, 5, 3);  //step 5: BIOZ_ADC_OSR to 4, meaning 128
  }
}
*/

/*void initSequence(){
   for (int i = 0; i < sizeof(spi_data_init) / sizeof(spi_data_init[0]); i++) {
    //uint32_t spi_value = (spi_data[i].address << 16) | (0 << 15) | spi_data[i].data; //0 to write, 1 to read
    SPI_write(spi_data_init[i]);
  }
}*/

void shut_down() {
  //Page 24, Verified
  //Disable BioZ
  uint8_t data_addr;
  SPI_read(0x20, &data_addr);         //Get the current parameters, we don t want to override them
  SPI_write(0x20, data_addr & 0xFC);  //Send the bits to disable BIOZ_Q_EN and BIOZ_I_EN

  //Disable PLL
  SPI_read(0x17, &data_addr);         //Get the current parameters
  SPI_write(0x17, data_addr & 0xFE);  //Send the bits to disable PLL_EN

  //Set SHDN to 1 to enter shutdown mode
  SPI_read(0x11, &data_addr);         //Get the current parameters
  SPI_write(0x11, data_addr | 0x02);  //Send the bits to disable SHDN
}

bool power_on() {
  //Page 24, Verified
  uint8_t data_addr;
  //Set SHDN to 0 to enter normal mode
  SPI_read(0x11, &data_addr);         //Get the current parameters
  SPI_write(0x11, data_addr & 0xFD);  //Send the bits to disable SHDN

  //Disable BioZ, if enabled
  SPI_read(0x20, &data_addr);         //Get the current parameters, we don t want to override them
  SPI_write(0x20, data_addr & 0xFC);  //Send the bits to disable BIOZ_Q_EN and BIOZ_I_EN

  //Enable PLL by setting PLL_EN to 1
  SPI_read(0x17, &data_addr);         //Get the current parameters
  SPI_write(0x17, data_addr | 0x01);  //Send the bits to enable PLL_EN

  uint8_t readValue = 0;
  unsigned long timeNow = millis();
  while (readValue == 0 && millis() - timeNow < 100) {
    SPI_read(0x00, &readValue);
    readValue = readValue & 0x0A;
    //Serial.println(readValue);
    delay(10);
  }

  if (readValue == 0) {
    Serial.println("Timeout. Could't read value of FREQ_LOCK");
    return (0);
  } else {
    //Serial.print("Frequency locked: ");
    //Serial.println(readValue);
  }

  //Enable BioZ I and Q
  SPI_read(0x20, &data_addr);         //Get the current parameters, we don t want to override them
  SPI_write(0x20, data_addr | 0x03);  //Send the bits to enable BIOZ_Q_EN and BIOZ_I_EN
  delay(2);

  delay(10);
  //Flush FIFO
  uint8_t dataFlush;
  SPI_read(0x0E, &dataFlush);         //Get the current parameters
  SPI_write(0x0E, dataFlush | 0x10);  //Send the bits
  return (1);
}

void soft_reset() {
  Serial.println("Reset");
  uint8_t data_addr;
  //BIOZ_BG_EN = 1
  SPI_read(0x20, &data_addr);             //Get the current parameters
  SPI_write(0x20, data_addr | (1 << 2));  //Send the bits

  //Set SHDN to 0 to enter normal mode
  SPI_read(0x11, &data_addr);         //Get the current parameters
  SPI_write(0x11, data_addr & 0xFD);  //Send the bits

  //Set REF_CLK_SEL = 0
  SPI_read(0x1A, &data_addr);         //Get the current parameters
  SPI_write(0x1A, data_addr & 0xBF);  //Send the bits

  //Set PLL_EN = 0
  SPI_read(0x17, &data_addr);         //Get the current parameters
  SPI_write(0x17, data_addr & 0xFE);  //Send the bits

  //Delay 1 ms
  /*unsigned long previousMicros = micros();
  while (micros() - previousMicros <= 2000)
    ;  //Wait 1000 us = 1 ms
  */
  delay(5);
  //Set RESET = 0
  SPI_read(0x11, &data_addr);         //Get the current parameters
  SPI_write(0x11, data_addr | 0x01);  //Send the bits

  //Set PLL_EN = 1
  /*SPI_read(0x17, &data_addr);         //Get the current parameters
  SPI_write(0x17, data_addr | 0x01);  //Send the bits*/
}

void read_all_registers() {
  uint8_t byte1;
  uint8_t addr_to_read[36] = { 0x00, 0x01, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x10, 0x11, 0x12, 0x13, 0x14, 0x17, 0x18, 0x19, 0x1A, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x41, 0x42, 0x43, 0x44, 0x50, 0x51, 0x52, 0x58, 0xFF };
  Serial.println("Reading all registers\nAddress,Value");
  for (uint8_t i = 0; i < sizeof(addr_to_read); i++) {
    SPI_read(addr_to_read[i], &byte1);
    char strBuf[50];
    sprintf(strBuf, "%02X,%02X", addr_to_read[i], byte1);
    Serial.println(strBuf);
    if (debugMode) {
      uint8_t bufferSend[3];
      bufferSend[0] = byte1;
      bufferSend[1] = addr_to_read[i];
      bufferSend[2] = 0xA0;
      commandCharacteristic.writeValue(bufferSend, sizeof(bufferSend));
    }
  }
}

/*void calibration() {
  //struct frequency_struct {
  //uint16_t MDIV;
  //  bool NDIV;
  //  uint8_t KDIV;
  //  uint8_t DAC_OSR;
  //  uint8_t ADC_OSR;
  //};

  frequency_struct calibFreq[] = {
    { 625, 1, 0x4, 0x3, 0x5 },  //Set drive frequency to 5 kHz
    { 625, 1, 0x2, 0x3, 0x5 },  //Set drive frequency to 20 kHz
    { 781, 1, 0x1, 0x3, 0x5 },  //Set drive frequency to 50 kHz
    { 781, 1, 0x0, 0x3, 0x5 },  //Set drive frequency to 99.968 kHz
    { 586, 1, 0x0, 0x2, 0x5 },  //Set drive frequency to 150,016 kHz
    { 781, 1, 0x0, 0x2, 0x5 },  //Set drive frequency to 199,936 kHz
    { 488, 0, 0x0, 0x1, 0x6 },  //Set drive frequency to 249.856 kHz
    { 586, 1, 0x0, 0x1, 0x5 },  //Set drive frequency to 300,032 kHz
  };
  initSequence();
  uint8_t nbCalib = sizeof(calibFreq) / sizeof(calibFreq[0]);

  Serial.println(nbCalib);
  for (uint8_t i = 0; i < nbCalib; i++) {
    uint32_t I_offset = 0, Q_offset = 0, I_rcal_in = 0, Q_rcal_in = 0, I_rcal_quad = 0, Q_rcal_quad = 0;
    uint8_t calibReturn = calibrationAtFrequency(calibFreq[i], &I_offset, &Q_offset, &I_rcal_in, &Q_rcal_in, &I_rcal_quad, &Q_rcal_quad);
    sendBackCalib(i, calibReturn, I_offset, Q_offset, I_rcal_in, Q_rcal_in, I_rcal_quad, Q_rcal_quad, calibFreq[i]);
    //i = nbCalib;  //For dev purposes
  }
  //calibrationAtFrequency(uint16_t MDIV, bool NDIV, uint8_t KDIV, uint8_t DAC_OSR, uint8_t ADC_OSR)
}*/

void sendBackCalib(uint8_t freqNum, uint8_t calibReturn, uint32_t I_offset, uint32_t Q_offset, uint32_t I_rcal_in, uint32_t Q_rcal_in, uint32_t I_rcal_quad, uint32_t Q_rcal_quad, frequency_struct calibReg) {
  if (calibReturn == 1) {
    uint8_t bufferSend[7];
    bufferSend[0] = I_offset & 0xFF;
    bufferSend[1] = (I_offset >> 8) & 0xFF;
    bufferSend[2] = ((I_offset >> 16) & 0x0F) | ((Q_offset & 0x0F) << 4);
    bufferSend[3] = (Q_offset >> 4) & 0xFF;
    bufferSend[4] = (Q_offset >> 12) & 0xFF;
    bufferSend[5] = 0x00;     //Type I/Q offset, no error
    bufferSend[6] = freqNum;  //Freq number
    frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));

    bufferSend[0] = I_rcal_in & 0xFF;
    bufferSend[1] = (I_rcal_in >> 8) & 0xFF;
    bufferSend[2] = ((I_rcal_in >> 16) & 0x0F) | ((Q_rcal_in & 0x0F) << 4);
    bufferSend[3] = (Q_rcal_in >> 4) & 0xFF;
    bufferSend[4] = (Q_rcal_in >> 12) & 0xFF;
    bufferSend[5] = 0x01;     //Type I/Q Rcal in, no error
    bufferSend[6] = freqNum;  //Freq number
    frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));

    bufferSend[0] = I_rcal_quad & 0xFF;
    bufferSend[1] = (I_rcal_quad >> 8) & 0xFF;
    bufferSend[2] = ((I_rcal_quad >> 16) & 0x0F) | ((Q_rcal_quad & 0x0F) << 4);
    bufferSend[3] = (Q_rcal_quad >> 4) & 0xFF;
    bufferSend[4] = (Q_rcal_quad >> 12) & 0xFF;
    bufferSend[5] = 0x02;     //Type I/Q Rcal quad, no error
    bufferSend[6] = freqNum;  //Freq number
    frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));

    if (eeprom_enabled && save_eeprom) {
      Serial.println("Saving to eeprom");
      uint8_t pageWrite[24] = {
        0x42,     //Integrity bit
        0x16,     //22 bytes to follow
        freqNum,  //Frequency number (0 - 126)
        (calibReg.ADC_OSR << 5) | (calibReg.DAC_OSR),
        (calibReg.KDIV << 3) | (calibReg.NDIV << 2) | ((calibReg.MDIV & 0x300) >> 8),
        calibReg.MDIV & 0x0FFFF,
        (I_offset >> 16) & 0x0F,
        (I_offset >> 8) & 0xFF,
        I_offset & 0xFF,
        (Q_offset >> 16) & 0x0F,
        (Q_offset >> 8) & 0xFF,
        Q_offset & 0xFF,
        (I_rcal_in >> 16) & 0x0F,
        (I_rcal_in >> 8) & 0xFF,
        I_rcal_in & 0xFF,
        (Q_rcal_in >> 16) & 0x0F,
        (Q_rcal_in >> 8) & 0xFF,
        Q_rcal_in & 0xFF,
        (I_rcal_quad >> 16) & 0x0F,
        (I_rcal_quad >> 8) & 0xFF,
        I_rcal_quad & 0xFF,
        (Q_rcal_quad >> 16) & 0x0F,
        (Q_rcal_quad >> 8) & 0xFF,
        Q_rcal_quad & 0xFF,
      };
      // Write at address multiple of 32
      //starting by 32 for freqNum=0
      eeprom_write_page((freqNum + 1) << 5, pageWrite, 24);
    } else Serial.println("EEPROM is disabled. Calibration values were not stored.");

  } else {
    debugMode = 0;
    doublecheck_spi = 0;
    Serial.print("ABORT. Seems like there was an error... error_code = ");
    Serial.println(calibReturn);
    if (eeprom_enabled) eeprom_write_byte(0x0001, calibReturn);
    uint8_t bufferSend[7];
    bufferSend[0] = 0x00;
    bufferSend[1] = 0x00;
    bufferSend[2] = 0x00;
    bufferSend[3] = 0x00;
    bufferSend[4] = 0x00;
    bufferSend[5] = (calibReturn & 0x0F) << 4;  //Return error type
    bufferSend[6] = freqNum;                    //Freq number
    frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));
  }
}

uint8_t calibrationAtFrequency(frequency_struct calibReg, uint32_t *I_offset_pt, uint32_t *Q_offset_pt, uint32_t *I_rcal_in_pt, uint32_t *Q_rcal_in_pt, uint32_t *I_rcal_quad_pt, uint32_t *Q_rcal_quad_pt) {
  //Get the calibration values for a certain frequency
  //Error table: 0: Undefined error, 1: no error, 2: Power on error,
  //3: settling error offset, 4: settling error rcal_in, 5: settling error rcal_quad
  //Page 46
  uint8_t data_addr;

  if (!setFrequencyReg(calibReg.MDIV, calibReg.NDIV, calibReg.KDIV, calibReg.DAC_OSR, calibReg.ADC_OSR)) return (0);

  //BioZ MUX configuration to connect CALx pins
  //SPI_read(0x41, &data_addr);         //Get the current parameters
  //SPI_write(0x41, data_addr | 0x07);  //CONNECT_CAL_ONLY=1, MUX_EN=1, CAL_EN=1;

  //BioZ MUX configuration to calibrate using the ELX pins
  Serial.print("Calibration pin used : ");
  Serial.println(calPins);

  SPI_read(0x41, &data_addr);
  SPI_write(0x41, (data_addr & 0xF8) | (calPins << 2) | (1 << 1) | calPins);  //CalPins = 1 => Use cal pin
                                                                              //CalPin = 0 => Use ELX pin

  SPI_write(0x42, 0x1);


  //Measure I and Q offset

  //NOPE: Set the stimulus current magnitude to the minimum 16nARMS by setting BIOZ_VDRV_MAG[5:4](0x22) and BIOZ_IDRV_RGE[3:2](0x22) to 0x0.
  //Set stimulus to
  SPI_read(0x22, &data_addr);         //Get the current parameters
  SPI_write(0x22, data_addr & 0xC3);  //Send the bits
  //SPI_write(0x22, (2 << 4) | (2 << 2));  //0x28, (from initialization, we want current = 32 uarms)

  //Enable BIOZ_DRV_RESET[5](0x25) to apply a short circuit across the load
  SPI_read(0x25, &data_addr);             //Get the current parameters
  SPI_write(0x25, data_addr | (1 << 5));  //Send the bits
  delay(10);

  if (!power_on()) return (2);
  Serial.println("Calibration initialization sequence OK. Getting I and Q offset");



  //Wait for settling time and return I offset and Q offset
  if (!settleAndReturn(I_offset_pt, Q_offset_pt)) {
    Serial.println("Error during settle and return offset");
    //Disable measurement
    SPI_read(0x20, &data_addr);
    SPI_write(0x20, data_addr & 0xFC);
    //Disable BIOZ_DRV_RESET[5] (0x25)
    SPI_read(0x25, &data_addr);
    SPI_write(0x25, data_addr & 0xDF);
    //Connect resistors to ELx pins
    SPI_read(0x41, &data_addr);
    SPI_write(0x41, (data_addr & 0xF8) | (1 << 1));
    shut_down();
    return (3);
  }

  //Disable measurement
  SPI_read(0x20, &data_addr);
  SPI_write(0x20, data_addr & 0xFC);

  //Measure the calibration resistor with both channels set to in phase

  //Set the stimulus current to the desired value by adjusting BIOZ_VDRV_MAG[5:4] and BIOZ_IDRV_RGE[3:2] (0x22)
  SPI_write(0x22, (2 << 4) | (2 << 2));  //0x28, (from initialization, we want current = 32 uarms)

  //Disable BIOZ_DRV_RESET[5] (0x25)
  SPI_read(0x25, &data_addr);
  SPI_write(0x25, data_addr & 0xDF);

  //Set BIOZ_Q_CLK_PHASE[3](0x28) to 1, which shifts the Q-channel's demodulation clock to in-phase
  SPI_read(0x28, &data_addr);
  SPI_write(0x28, (data_addr & 0xF3) | (1 << 3));

  //Set BIOZ_I_EN[0] (0x20) and BIOZ_Q_EN[1] (0x20) to 1 to enable measurement
  SPI_read(0x20, &data_addr);
  SPI_write(0x20, data_addr | 0x03);


  Serial.println("I and Q offset value successful. Getting rcal in");
  //Record data until impedance signal is settled, and then record the average impedance I_rcal_in and Q_rcal_in
  if (!settleAndReturn(I_rcal_in_pt, Q_rcal_in_pt)) {
    Serial.println("Error during settle and return rcal in");
    //Disable measurement
    SPI_read(0x20, &data_addr);
    SPI_write(0x20, data_addr & 0xFC);
    //Connect resistors to ELx pins
    SPI_read(0x41, &data_addr);
    SPI_write(0x41, (data_addr & 0xF8) | (1 << 1));
    shut_down();
    return (4);
  }

  //Disable measurement
  SPI_read(0x20, &data_addr);
  SPI_write(0x20, data_addr & 0xFC);

  //Set BIOZ_Q_CLK_PHASE[3](0x28) to 0. Set BIOZ_I_CLK_PHASE[2](0x28) to 1, which shifts the I-channel's demodulation clock to quadrature phase.
  SPI_read(0x28, &data_addr);
  SPI_write(0x28, (data_addr & 0xF3) | (1 << 2));

  //Set BIOZ_I_EN[0] (0x20) and BIOZ_Q_EN[1] (0x20) to 1 to enable measurement
  SPI_read(0x20, &data_addr);
  SPI_write(0x20, data_addr | 0x03);

  Serial.println("I and Q rcal in value successful. Getting rcal quad");

  if (!settleAndReturn(I_rcal_quad_pt, Q_rcal_quad_pt)) {
    Serial.println("Error during settle and return rcal quad");
    SPI_read(0x20, &data_addr);
    SPI_write(0x20, data_addr & 0xFC);
    //Connect resistors to ELx pins
    SPI_read(0x41, &data_addr);
    SPI_write(0x41, (data_addr & 0xF8) | (1 << 1));
    shut_down();
    return (5);
  }

  SPI_read(0x20, &data_addr);
  SPI_write(0x20, data_addr & 0xFC);

  Serial.println("Calibration END ");
  shut_down();
  //Serial.print(loopNum);
  //Serial.print("/");
  //Serial.print(maxLoop);

  SPI_read(0x41, &data_addr);
  SPI_write(0x41, (data_addr & 0xF8) | (1 << 1));  //CONNECT resistor to ELx pin (not CAL)

  return (1);
}

bool setFrequencyReg(uint16_t MDIV, bool NDIV, uint8_t KDIV, uint8_t DAC_OSR, uint8_t ADC_OSR) {
  /*
  Sets the frequency of the PLL
  */
  //Check if the parameters given from the user are valid
  float PLL_CLK = MDIV * 32.768e3;
  float bioz_adc_clk = PLL_CLK / (NDIV ? 1024 : 512);
  float bioz_synth_clk = PLL_CLK / (1 << KDIV);
  if (PLL_CLK < 14e6 || PLL_CLK > 28e6) {
    Serial.print("ABORT. The user frequency is ");
    Serial.print(PLL_CLK / 1e6);
    Serial.println(" MHz. The frequency PLL_CLK must be between 14MHz and 28 MHz.");
    return (0);
  }
  if (bioz_adc_clk < 16.0e3 || bioz_adc_clk > 36.375e3) {
    Serial.print("ABORT. The user frequency is ");
    Serial.print(bioz_adc_clk / 1e3);
    Serial.println(" kHz. The frequency BIOZ_ADC_CLK must be between 16kHz and 36.375 kHz.");
    return (0);
  }
  if (bioz_synth_clk < 4096 || bioz_synth_clk > 28e6) {
    Serial.print("ABORT. The user frequency is ");
    Serial.print(bioz_synth_clk / 1e6);
    Serial.println(" MHz. The frequency BIOZ_SYNTH_CLK must be between 4096 Hz and 28 MHz.");
    return (0);
  }

  Serial.print("User configures a frequency of: ");
  Serial.print((bioz_synth_clk / (1 << (5 + DAC_OSR))) / 1e3);
  Serial.println(" kHz");
  Serial.print("Frequencies: PLL = ");
  Serial.print(PLL_CLK / 1e6);
  Serial.print(" MHz, BIOZ_ADC_CLK = ");
  Serial.print(bioz_adc_clk / 1e3);
  Serial.print(" KHz, BIOZ_SYNTH_CLK = ");
  Serial.print(bioz_synth_clk / 1e6);
  Serial.println(" MHz.");
  //return (0);  // For dev purposes

  uint8_t byte;
  SPI_read(0x1A, &byte);
  SPI_write(0x1A, (byte & 0xBF) | 0x20);  //Internal oscilator of 32.768

  //Setting the PLL frequency and KDIV
  MDIV--;  //Because datasheet says it multiplies by MDIV + 1
  SPI_read(0x17, &byte);
  SPI_write(0x17, (byte & 0x01) | ((MDIV & 0x0300) >> 2) | NDIV << 5 | ((KDIV & 0x0F) << 1));  //Sets the 2 MSB of MDIV and the NDIV and KDIV wanted
  SPI_write(0x18, MDIV & 0x00FF);                                                              //Sets the rest of MDIV

  //Setting the BioZ DAC OSR and BIOZ ADC OSR
  SPI_read(0x20, &byte);
  SPI_write(0x20, (byte & 0x07) | ((DAC_OSR & 0x03) << 6) | (ADC_OSR & 0x07) << 3);  //Set the ADC_OSR and DAC_OSR

  return (1);


  //KDIV; DAC OSR; N DIV; ADC OSR; MDIV
}

bool settleAndReturn(uint32_t *I_average, uint32_t *Q_average) {

  unsigned long sumQ = 0, sumI = 0;
  uint16_t countQ = 0, countI = 0, loopNum = 0;
  bool I_settled = 0, Q_settled = 0;
  uint32_t data_I[averageSize], data_Q[averageSize];
  const uint16_t maxLoop = 1000;
  while ((countQ < averageSize || countI < averageSize)) {
    uint32_t dataFIFO;
    uint16_t sampleCount = 0;
    uint8_t msb, lsb;
    SPI_read(0x0A, &msb);
    SPI_read(0x0B, &lsb);
    sampleCount = ((uint16_t)msb << 8) | lsb;
    if (sampleCount > 0) {
      //Samples are available in the FIFO to read
      //We only have to read when they are available

      //Serial.print("SampleCount: ");
      //Serial.print(sampleCount);
      //Serial.print(", ");
      SPI_read_FIFO(&dataFIFO);                        //Gets the data (tag and data) from FIFO
      uint8_t checkData = check_FIFO_data(&dataFIFO);  //0: Invalid, 1: In Phase, 2: Quadrature, 3: Marker
      uint32_t data = dataFIFO & 0x0FFFFF;
      //Serial.print(loopNum);
      //Serial.print(", ");
      //Serial.print(countQ);
      //Serial.print(", ");
      //Serial.println(countI);
      if (loopNum >= minimumNumberLoop+nbValuesToDiscard) {
        if (checkData == 1 && countQ < averageSize) {
          if (data > 0) {
            if (debugMode) {
              Serial.print("Q value: ");
              Serial.println(data);
              unsigned long connect_PCValue = (unsigned long)dataFIFO;
              commandCharacteristic.writeValue(connect_PCValue);
            }
            data_Q[countQ] = data;
            countQ++;
          }
        } else if (checkData == 2 && countI < averageSize) {
          if (data > 0) {
            if (debugMode) {
              Serial.print("I value: ");
              Serial.println(data);
              unsigned long connect_PCValue = (unsigned long)dataFIFO;
              commandCharacteristic.writeValue(connect_PCValue);
            }
            data_I[countI] = data;
            countI++;
          }
        }
      }
      else{
        //Discard Values
        //Serial.print("Discard, ");
        //Serial.println(data);
      }
      loopNum++;
    }
  }
  if (countI == averageSize && countQ == averageSize) {
    Serial.print("Measure finished. Compiling results. loopNum = ");
    Serial.print(loopNum);
    Serial.print("/");
    Serial.println(maxLoop);
    //Measure finished. Computing result
    uint8_t data_addr;
    SPI_read(0x20, &data_addr);
    SPI_write(0x20, data_addr & 0xFC);

    for (int i = 0; i < averageSize; i++) {
      sumQ += data_Q[i];
      sumI += data_I[i];
    }
    *I_average = (uint32_t)(sumI / averageSize);
    *Q_average = (uint32_t)(sumQ / averageSize);
    return (1);
  } else {
    Serial.print("UNDEFINED ERROR");
    Serial.print(loopNum);
    Serial.print("/");
    Serial.println(maxLoop);
    return (0);
  }
}

uint8_t check_FIFO_data(uint32_t *data) {
  /*Checks the FIFO data type
    * 0: Invalid
    * 1: In Phase
    * 2: Quadrature
    * 3: Marker
  */
  uint8_t tag = *data >> 20;
  if (tag == 0b0001) return 1;
  if (tag == 0b0010) return 2;
  if (tag == 0b1111) {
    if (*data == 0xFFFFFE) return 3;
    if (*data == 0xFFFFFF) return 0;
  }
  return 0;
}

uint8_t readPartId() {
  uint8_t byte1;
  SPI_read(0xFF, &byte1);
  Serial.print("Read part ID: ");
  Serial.println(byte1, HEX);
  return byte1;
}

/*uint8_t readFIFOByte(){
  uint8_t byte1;
  SPI_read(0x0C, &byte1);
  Serial.print("FIFO: ");
  Serial.println(byte1, HEX);
  return byte1;
}*/

void blePeripheralConnectHandler(BLEDevice central) {
  // central connected event handler
  Serial.print("Connected event, central: ");
  Serial.println(central.address());
}

void blePeripheralDisconnectHandler(BLEDevice central) {
  // central disconnected event handler
  Serial.print("Disconnected event, central: ");
  Serial.println(central.address());
}

void read_from_PC(BLEDevice central, BLECharacteristic characteristic) {
  // central wrote new value to characteristic, update LED
  Serial.print("Characteristic event, written: ");
  /*int bufferRead[valueBLEBuffer];
  for(int i=0; i<valueBLEBuffer; i++){
    bufferRead[i] = 0;
  }*/
  uint8_t rawData[3];
  uint32_t reordered = 0;

  characteristic.readValue(rawData, 3);

  // Debug: print raw bytes
  Serial.print("Raw bytes: ");
  Serial.print(rawData[0], HEX);
  Serial.print(" ");
  Serial.print(rawData[1], HEX);
  Serial.print(" ");
  Serial.println(rawData[2], HEX);

  // Reorder: Assuming first byte is most significant (big endian)
  reordered = (rawData[0] << 16) | (rawData[1] << 8) | rawData[2];

  Serial.print("Value reorder: ");
  Serial.println(reordered, HEX);
  //;
  if (waitingPCResponse) {
    valueReadPC = reordered;
    gotPCResponse = 1;  //We got a response from the PC
    //We can't update waitingPCResponse or the next loop will re-initialize the chip
  } else {
    if ((reordered & 0xF00000) >> 20 == 0x0 && (reordered & 0x0000F0) >> 4 == 0x1) {
      if (enableCalib) {
        Serial.println("Error. Calibration still happening...");
      } else {
        //Upon recieving this code, enable the transmission
        if (commandCharacteristic.subscribed()) {
          Serial.println("Enabling transmission");
          initSequence();

          calPins = reordered & 0x000001;
          if (calPins) Serial.println("Use CALx pins (single trans)");
          else Serial.println("Use ELx pins (single trans)");

          struct frequency_struct freqSweep = { 781, 1, 0x1, 0x3, 0x7 };
          if (!setFrequencyReg(freqSweep.MDIV, freqSweep.NDIV, freqSweep.KDIV, freqSweep.DAC_OSR, freqSweep.ADC_OSR)) {
            //Sending error 4 back
            unsigned long connect_PCValue;
            connect_PCValue = 0xD10001;  //Tag D = Error, Value 1 = error on transmission
            commandCharacteristic.writeValue(connect_PCValue);
            return;
          }
          uint8_t data_addr;

          SPI_read(0x41, &data_addr);
          SPI_write(0x41, (data_addr & 0xF8) | (calPins << 2) | (1 << 1) | calPins);  //CalPins = 1 => Use cal pin
                                                                                      //CalPin = 0 => Use ELX pin
          enableSingleTransmission = 1;
          firstTimeTransmission = 1;
        } else {
          //The bluetooth device has not been subscribed to
          Serial.println("The bluetooth device has not been subscribed to");
        }
      }
    } else if ((reordered & 0x0F0000) >> 16 == 0xD) {
      //Sweep read command
      nbFrequenciesExpected = (reordered & 0x0000FF);
      Serial.print("Sweep command recieved with ");
      Serial.print(nbFrequenciesExpected);
      Serial.println(" frequencies");

      if (nbFrequenciesExpected > 0) {
        if ((reordered >> 8) & 0x1 == 0x1) {
          Serial.println("Transmission averaged: yes");
          transmissionAveraged = 1;
        } else {
          Serial.println("Transmission averaged: no");
          transmissionAveraged = 0;
        }

        calPins = (reordered >> 9) & 0x1;
        if (calPins) Serial.println("Use CALx pins");
        else Serial.println("Use ELx pins");

        if (frame7byte_Characteristic.subscribed()) {
          enableSweep = 1;
          nbFreqRecieved = 0;
          nbValuesQ = 0;
          nbValuesI = 0;
          Q_avg_val = 0;
          I_avg_val = 0;
          initSequence();

          uint8_t data_addr;
          SPI_read(0x41, &data_addr);
          SPI_write(0x41, (data_addr & 0xF8) | (calPins << 2) | (1 << 1) | calPins);  //CalPins = 1 => Use cal pin

        } else {
          //The bluetooth device has not been subscribed to
          Serial.println("The bluetooth device has not subscribed to the frame7byte characteristic.");
        }
      } else {
        Serial.println("Error: No frequencies were given");
      }
    } else if (reordered == 0x000002) {
      Serial.println("Init command recieved");
      initSequence();
    } else if ((reordered & 0xF00000) >> 20 == 0x5) {
      connectionEstablished = 1;
    } else if ((reordered & 0xF00000) >> 20 == 0xC) {
      //Calibration command initialization
      const uint8_t type = (reordered & 0x0F0000) >> 16;
      if (type == 0x00) {
        calPins = (reordered >> 2) & 0x000001;
        debugMode = (reordered >> 3) & 0x000001;
        save_eeprom = (reordered >> 4) & 0x000001;
        doublecheck_spi = (reordered >> 5) & 0x000001;
        if (calPins) Serial.println("Use CALx pins");
        else Serial.println("Use ELx pins");
        if (save_eeprom) Serial.println("Save to eeprom");
        else Serial.println("Don't save to eeprom");
      } else if (type == 0x1) {
        //Recieving nb frequencies and rcal_2
        calibResistor = 0;
        nbFrequenciesExpected = ((reordered & 0x00FF00) >> 8) & 0xFF;
        Serial.print("Calibration command recieved with ");
        Serial.print(nbFrequenciesExpected);
        Serial.println(" frequencies");
        if (eeprom_enabled && save_eeprom) {
          digitalWrite(PIN_VOLTAGE_REDUCER, LOW);
          delay(200);
          eeprom_write_byte(0x0001, 0x00);
          delay(10);
          eeprom_write_byte(0x0002, nbFrequenciesExpected);

          uint8_t eeprom_nbfreq;
          eeprom_read_byte(0x0002, &eeprom_nbfreq);
          Serial.print("Number of frequencies EEPROM: ");
          Serial.println(eeprom_nbfreq);

          uint8_t countErrValue = 0;
          while (countErrValue < 15 && nbFrequenciesExpected != eeprom_nbfreq) {
            eeprom_write_byte(0x0001, nbFrequenciesExpected);
            delay(10);
            eeprom_read_byte(0x0001, &eeprom_nbfreq);

            Serial.print("EEPROM nbfreq value: ");
            Serial.println(eeprom_nbfreq, HEX);
            countErrValue++;
          }
        } else if (eeprom_enabled) {
          Serial.println("User doesn't want to save to EEPROM. Discarding");
        }
        calibResistor = (reordered & 0x0000FF) << 16;
      } else if (type == 0x02) {
        //Getting rcal_1 and rcal_0
        calibResistor = calibResistor | ((reordered & 0x00FF00) << 8) | (reordered & 0x0000FF);
        Serial.print("Calibration resistor: ");
        Serial.println(calibResistor);
        if (eeprom_enabled) {
          uint8_t countErrValue = 0, eeprom_rcal = 0;
          while (countErrValue < 15 && eeprom_rcal != calibResistor) {
            eeprom_write_byte(0x0003, ((calibResistor >> 16) & 0xFF));
            delay(10);
            eeprom_write_byte(0x0004, ((calibResistor >> 8) & 0xFF));
            delay(10);
            eeprom_write_byte(0x0005, (calibResistor & 0xFF));

            uint8_t eeprom_rcal_2, eeprom_rcal_1, eeprom_rcal_0;
            eeprom_read_byte(0x0003, &eeprom_rcal_2);
            delay(10);
            eeprom_read_byte(0x0004, &eeprom_rcal_1);
            delay(10);
            eeprom_read_byte(0x0005, &eeprom_rcal_0);

            eeprom_rcal = (eeprom_rcal_2 << 16) | (eeprom_rcal_1 << 8) | eeprom_rcal_0;
            Serial.print("EEPROM RCAL value: ");
            Serial.println(eeprom_rcal, HEX);
            countErrValue++;
          }

          //Power the MAX3009 chip
          digitalWrite(PIN_VOLTAGE_REDUCER, HIGH);
          delay(100);
        }


        //Initialize calibration sequence
        Serial.println("Calibration Sequence Initiated");
        if (frame7byte_Characteristic.subscribed()) {
          enableCalib = 1;
          nbFreqRecieved = 0;
          initSequence();
        } else {
          //The bluetooth device has not been subscribed to
          Serial.println("The bluetooth device has not subscribed to the frame7byte characteristic.");
        }
      } else {
        //Unknown type
        Serial.print("Unknown type ");
        Serial.print(type);
        Serial.println(" . (tag 0xC for calibration)");
      }
    } else if ((reordered & 0xF00000) >> 20 == 0x3) {
      //Calibration register values recieved
      //Extracting the desired register value from the frames
      if (enableCalib) {
        if (nbFreqRecieved < nbFrequenciesExpected) {
          const uint8_t adc = (reordered & 0x0E0000) >> 17,
                        dac = (reordered & 0x018000) >> 15,
                        kdiv = (reordered & 0x007800) >> 11;
          const uint16_t mdiv = reordered & 0x0003FF;
          const bool ndiv = (reordered & 0x000400) >> 10;
          Serial.print("Freq number: ");
          Serial.print(nbFreqRecieved);
          Serial.print(", MDIV: ");
          Serial.print(mdiv);
          Serial.print(", NDIV: ");
          Serial.print(ndiv);
          Serial.print(", KDIV: ");
          Serial.print(kdiv);
          Serial.print(", DAC: ");
          Serial.print(dac);
          Serial.print(", ADC: ");
          Serial.println(adc);
          struct frequency_struct calibFreqC = { mdiv, ndiv, kdiv, dac, adc };

          uint32_t I_offset = 0, Q_offset = 0, I_rcal_in = 0, Q_rcal_in = 0, I_rcal_quad = 0, Q_rcal_quad = 0;
          uint8_t calibReturn = calibrationAtFrequency(calibFreqC, &I_offset, &Q_offset, &I_rcal_in, &Q_rcal_in, &I_rcal_quad, &Q_rcal_quad);
          sendBackCalib(nbFreqRecieved, calibReturn, I_offset, Q_offset, I_rcal_in, Q_rcal_in, I_rcal_quad, Q_rcal_quad, calibFreqC);
          nbFreqRecieved++;

          if (nbFreqRecieved == nbFrequenciesExpected) {
            debugMode = 0;
            doublecheck_spi = 0;
            //Calibration finished successfully
            Serial.println("Calibration finished. Writing success byte to EEPROM");
            if (eeprom_enabled && save_eeprom) {
              digitalWrite(PIN_VOLTAGE_REDUCER, LOW);
              delay(100);
              eeprom_write_byte(0x0001, 0x01);
              uint8_t successbyte;
              eeprom_read_byte(0x0001, &successbyte);
              Serial.print("Success byte: ");
              Serial.println(successbyte);
            } else Serial.println("Success byte: EEPROM is disabled.");
            uint8_t bufferSend[7];
            bufferSend[0] = 0x00;
            bufferSend[1] = 0x00;
            bufferSend[2] = 0x00;
            bufferSend[3] = 0x00;
            bufferSend[4] = 0x00;
            bufferSend[5] = 0x0E;  //no error, end of calibration
            bufferSend[6] = 0xFF;  //Freq number
            frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));
            digitalWrite(PIN_VOLTAGE_REDUCER, HIGH);
            enableCalib = 0;
          }
        } else {
          Serial.println("Error: More frequencies than expected...");
          unsigned long sendErrorVal = 0xDC0002;
          commandCharacteristic.writeValue(sendErrorVal);
        }
      } else {
        unsigned long connect_PCValue;
        connect_PCValue = 0xDC0001;
        commandCharacteristic.writeValue(connect_PCValue);
        Serial.println("Recieved a frequency calibration before proper calibration sequence initialization");
      }
    } else if ((reordered & 0xF00000) >> 20 == 0x4) {
      //Sweep value
      if (enableSweep) {
        if (nbFreqRecieved < nbFrequenciesExpected) {
          const uint8_t adc = (reordered & 0x0E0000) >> 17,
                        dac = (reordered & 0x018000) >> 15,
                        kdiv = (reordered & 0x007800) >> 11;
          const uint16_t mdiv = reordered & 0x0003FF;
          const bool ndiv = (reordered & 0x000400) >> 10;
          Serial.print("Freq number: ");
          Serial.print(nbFreqRecieved);
          Serial.print(", MDIV: ");
          Serial.print(mdiv);
          Serial.print(", NDIV: ");
          Serial.print(ndiv);
          Serial.print(", KDIV: ");
          Serial.print(kdiv);
          Serial.print(", DAC: ");
          Serial.print(dac);
          Serial.print(", ADC: ");
          Serial.println(adc);

          struct frequency_struct freqSweep = { mdiv, ndiv, kdiv, dac, adc };
          //uint32_t I_sweep = 0, Q_sweep = 0;
          if (!setFrequencyReg(freqSweep.MDIV, freqSweep.NDIV, freqSweep.KDIV, freqSweep.DAC_OSR, freqSweep.ADC_OSR)) {
            //Sending error 4 back
            frame7byte_write(0xFF, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00);
            enableSweep = 0;
            return;
          }
          if (!power_on()) {
            //Sending error 2 back (error on power up)
            frame7byte_write(0xFF, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00);
            enableSweep = 0;
            return;
          }

          Serial.println("Enabling transmission");
          if (transmissionAveraged) {
            enableAverageTransmission = 1;
          } else {
            enableSingleTransmission = 1;
          }
          firstTimeTransmission = 1;

        } else {
          Serial.println("Error: More frequencies than expected...");
        }
      } else {
        Serial.println("Recieved a frequency calibration before proper calibration sequence initialization");
      }
    } else {
      Serial.print("Unknown command recieved: ");
      Serial.println(reordered, HEX);
    }
  }
}

void sendTransmission() {
  /* 
  This function values from the FIFO and sends them to the PC.
  After a certain number of samples, it checks with the PC if their checksum correspond. 
  In order to implement this, we can't use any loop or while, or the value read from the PC will
  not be executed in the handler. 
  To avoid this, the function is always called from the main loop(), giving CPU time to the bluetooth
  communication and avoiding breaking the link with the PC

  */
  if (firstTimeTransmission) {
    uint8_t data_addr;
    //Connect resistor to ELx pins
    //SPI_read(0x41, &data_addr);
    //SPI_write(0x41, (data_addr & 0xF8) | (1 << 1));

    //Connect the resistor pins to CALx pin (verify correct calibration)
    //#Debugging
    //SPI_read(0x41, &data_addr);
    //SPI_write(0x41, data_addr | 0x07);

    if (!power_on()) {  //!power_on()
      //Power on failed. Sending error to PC
      unsigned long connect_PCValue;
      connect_PCValue = 0xD10001;  //Tag D = Error, Value 1 = error on transmission
      commandCharacteristic.writeValue(connect_PCValue);
      enableSingleTransmission = 0;
      return;
    } else firstTimeTransmission = 0;
  }
  if (valuesSent < numberReadFifo && enableSingleTransmission || waitingPCResponse) {
    uint16_t sampleCount = 0;
    if (!waitingPCResponse) {
      uint8_t msb, lsb, data[3];
      SPI_read(0x0A, &msb);
      SPI_read(0x0B, &lsb);
      sampleCount = ((uint16_t)msb << 8) | lsb;

      if (sampleCount > checkSumEachNbValues + 5) {
        //Print in case of FIFO greater than checkSumEachNbValues + 5
        Serial.print("Samples in FIFO: ");
        Serial.println(sampleCount);
        if (sampleCount == 0xFFFF) {
          //Problem with FIFO, flush it
          uint8_t dataFlush;
          SPI_read(0x0E, &dataFlush);         //Get the current parameters
          SPI_write(0x0E, dataFlush | 0x10);  //Send the bits
        }
      }
    }
    if (waitingPCResponse || ((sampleCount > checkSumEachNbValues || transmissionEnabled))) {
      //(When waiting for PC response) or
      //Number of samples in FIFO is > to number of samples for each checksum send, or transmission enabled
      //TransmissionEnabled makes it so we can send the checkSumEachNbValues number of values up to having the FIFO empty
      unsigned long connect_PCValue;
      if (!waitingPCResponse) {
        transmissionEnabled = sampleCount > 0;
        uint32_t dataFIFO;
        SPI_read_FIFO(&dataFIFO);
        //Serial.print("Sending: ");
        //Serial.println(connect_PCValue, HEX);
        if (valuesDiscarded < nbValuesToDiscard) {
          Serial.println("Discarded");
          valuesDiscarded++;
        } else {
          valuesSent++;
          Serial.print(dataFIFO, HEX);
          Serial.print(", TAG: ");
          Serial.print(dataFIFO >> 20, HEX);
          Serial.print(", DATA: ");
          Serial.print(dataFIFO & 0x0FFFFF, HEX);
          if ((dataFIFO & 0xFFFFFF) != 0xFFFFFF) {
            //Verify that the value obtained is not all ones
            //If it's the case, it's the FIFO saying an error happened or no value was found
            totalSum += dataFIFO & 0x0FFFFF;
            Serial.print(", CHECKSUM: ");
            Serial.print(totalSum, HEX);
            Serial.print(", Timestamp: ");
            Serial.print(millis());
            Serial.print(", Samples in FIFO: ");
            Serial.println(sampleCount);
            connect_PCValue = (unsigned long)dataFIFO;
            //Send the information read from the FIFO to the computer
            //It should only have a tag 1 or 2
            commandCharacteristic.writeValue(connect_PCValue);
          } else {
            //Tag was all ones, discard it
            Serial.println(", ERR TAG");
          }
        }
      }
      if ((valuesSent % checkSumEachNbValues == 0 && valuesDiscarded > nbValuesToDiscard && 0) || valuesSent == numberReadFifo || waitingPCResponse) {
        //If we have reached the x number of values sent before checksum verification
        //Or we are at the end of the transmission
        if (!waitingPCResponse) {
          Serial.println("Checking with PC");
          //Check if the values recieved and send still correspond
          connect_PCValue = 0x0FFFFF;  //Just re-using the variable, tag C means checksum tag
          waitingPCResponse = 1;
          commandCharacteristic.writeValue(connect_PCValue);
          timeBefore = millis();
        }
        unsigned long timeDiff = millis() - timeBefore;
        if (waitingPCResponse && !gotPCResponse && timeDiff < 5000) {
          //Can't use the while or arduino doesn't read bluetooth
          //Serial.println("Waiting for PC...");
          return;
        }
        waitingPCResponse = 0;
        if (!gotPCResponse) {
          Serial.println("Timeout error: Waiting for PC");
          enableSingleTransmission = 0;
        } else {
          Serial.print("PC: ");
          Serial.print(valueReadPC, HEX);
          Serial.print(" | Arduino: ");
          Serial.println(totalSum & 0xFFFFFF, HEX);

          if (valueReadPC != (totalSum & 0xFFFFFF)) {
            Serial.println("Checksum mismatch");
            enableSingleTransmission = 0;
          } else {
            Serial.println("Checksum OK");
          }
          gotPCResponse = 0;
        }
      }
    }
    //delay(10);
  }
  if ((!waitingPCResponse && valuesSent == numberReadFifo) || !enableSingleTransmission) {
    Serial.println("Transmission end");
    shut_down();
    enableSingleTransmission = 0;
    Serial.print("Checksum: ");
    Serial.println(totalSum, HEX);

    if (enableSweep) {
      unsigned long valueEnd = 0xE00D00 | (nbFreqRecieved & 0xFF);
      Serial.print("End of transmission for this sweep frequency number ");
      Serial.print(nbFreqRecieved);
      Serial.print(". Sending EOT message ");
      Serial.println(valueEnd, HEX);
      commandCharacteristic.writeValue(valueEnd);
      nbFreqRecieved++;
      if (nbFreqRecieved == nbFrequenciesExpected) {
        enableSweep = 0;
      }
    } else {
      doublecheck_spi = 0;
      Serial.println("Sending normal transmission END message");
      unsigned long valueEnd = 0xE00001;
      commandCharacteristic.writeValue(valueEnd);
    }
  }
}

void sendTransmissionAverage() {
  /* 

  */
  if (firstTimeTransmission) {
    uint8_t data_addr;
    //Connect resistor to ELx pins
    //SPI_read(0x41, &data_addr);
    //SPI_write(0x41, (data_addr & 0xF8) | (1 << 1));

    //Connect the resistor pins to CALx pin (verify correct calibration)
    //#Debugging
    //SPI_read(0x41, &data_addr);
    //SPI_write(0x41, data_addr | 0x07);

    if (!power_on()) {  //!power_on()
      //Power on failed. Sending error to PC
      unsigned long connect_PCValue;
      connect_PCValue = 0xD10001;  //Tag D = Error, Value 1 = error on transmission
      commandCharacteristic.writeValue(connect_PCValue);
      enableAverageTransmission = 0;

      return;
    } else firstTimeTransmission = 0;
    nbValuesQ = 0;
    nbValuesI = 0;
    Q_avg_val = 0;
    I_avg_val = 0;
  }
  if (valuesSent < numberReadFifo && enableAverageTransmission) {
    uint16_t sampleCount = 0;
    uint8_t msb, lsb, data[3];
    SPI_read(0x0A, &msb);
    SPI_read(0x0B, &lsb);
    sampleCount = ((uint16_t)msb << 8) | lsb;

    if (sampleCount > checkSumEachNbValues + 5) {
      //Print in case of FIFO greater than checkSumEachNbValues + 5
      Serial.print("Samples in FIFO: ");
      Serial.println(sampleCount);
      if (sampleCount == 0xFFFF) {
        //Problem with FIFO, flush it
        uint8_t dataFlush;
        SPI_read(0x0E, &dataFlush);         //Get the current parameters
        SPI_write(0x0E, dataFlush | 0x10);  //Send the bits
      }
    }
    if ((sampleCount > checkSumEachNbValues || transmissionEnabled)) {
      //(When waiting for PC response) or
      //Number of samples in FIFO is > to number of samples for each checksum send, or transmission enabled
      //TransmissionEnabled makes it so we can send the checkSumEachNbValues number of values up to having the FIFO empty
      unsigned long connect_PCValue;
      transmissionEnabled = sampleCount > 0;
      uint32_t dataFIFO;
      SPI_read_FIFO(&dataFIFO);
      //Serial.print("Sending: ");
      //Serial.println(connect_PCValue, HEX);
      if (valuesDiscarded < nbValuesToDiscard) {
        valuesDiscarded++;
      } else {
        if (dataFIFO >> 20 == 0x1) {
          //Phase
          if (nbValuesI < numberReadFifo) {
            nbValuesI++;
            if (nbValuesI == 1) {
              I_avg_val = dataFIFO & 0x0FFFFF;
            } else {
              I_avg_val = (I_avg_val * (nbValuesI - 1) / nbValuesI) + (dataFIFO & 0x0FFFFF) / nbValuesI;
            }
          }
        }
        if (dataFIFO >> 20 == 0x2) {
          //Quadrature
          if (nbValuesQ < numberReadFifo) {
            nbValuesQ++;
            if (nbValuesQ == 1) {
              Q_avg_val = dataFIFO & 0x0FFFFF;
            } else {
              Q_avg_val = (Q_avg_val * (nbValuesQ - 1) / nbValuesQ) + (dataFIFO & 0x0FFFFF) / nbValuesQ;
            }
          }
        }

        if (nbValuesQ == numberReadFifo && nbValuesI == numberReadFifo) {
          valuesSent = numberReadFifo;
          uint32_t I_avg_val_32 = (uint32_t)I_avg_val & (0xFFFFFF);
          uint32_t Q_avg_val_32 = (uint32_t)Q_avg_val & (0xFFFFFF);

          Serial.print("Average I: ");
          Serial.print(I_avg_val);
          Serial.print(", Average I (uint20): ");
          Serial.println(I_avg_val_32);
          Serial.print("Average Q: ");
          Serial.print(Q_avg_val);
          Serial.print(", Average Q (uint20): ");
          Serial.println(Q_avg_val_32);
          //Send the 7 bytes
          uint8_t bufferSend[7];
          bufferSend[0] = I_avg_val_32 & 0xFF;
          bufferSend[1] = (I_avg_val_32 >> 8) & 0xFF;
          bufferSend[2] = ((I_avg_val_32 >> 16) & 0x0F) | ((Q_avg_val_32 & 0x0F) << 4);
          bufferSend[3] = (Q_avg_val_32 >> 4) & 0xFF;
          bufferSend[4] = (Q_avg_val_32 >> 12) & 0xFF;
          bufferSend[5] = 0x03;            //Average sweep valye type
          bufferSend[6] = nbFreqRecieved;  //Freq number
          frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));
        }
      }
    }
    //delay(10);
  }
  if ((valuesSent == numberReadFifo) || !enableAverageTransmission) {
    Serial.println("Transmission end");
    shut_down();
    enableAverageTransmission = 0;

    nbFreqRecieved++;
    if (nbFreqRecieved == nbFrequenciesExpected) {
      //Calibration finished successfully
      Serial.println("Calibration finished successfully");
      uint8_t bufferSend[7];
      bufferSend[0] = 0x00;
      bufferSend[1] = 0x00;
      bufferSend[2] = 0x00;
      bufferSend[3] = 0x00;
      bufferSend[4] = 0x00;
      bufferSend[5] = 0x0F;  //no error, end of sweep transmission
      bufferSend[6] = 0xFF;  //Freq number
      frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));
      enableSweep = 0;
    }
  }
}
void frame7byte_write(uint8_t byte6, uint8_t byte5, uint8_t byte4, uint8_t byte3, uint8_t byte2, uint8_t byte1, uint8_t byte0) {
  uint8_t bufferSend[7];
  bufferSend[0] = byte0;
  bufferSend[1] = byte1;
  bufferSend[2] = byte2;
  bufferSend[3] = byte3;
  bufferSend[4] = byte4;
  bufferSend[5] = byte5;
  bufferSend[6] = byte6;
  frame7byte_Characteristic.writeValue(bufferSend, sizeof(bufferSend));
}


void eeprom_read_byte(uint16_t address, uint8_t *bufferRead) {
  digitalWrite(CS_PIN_EEPROM, LOW);
  SPI.transfer(0x03);  //Read status register instruction
  SPI.transfer((address & 0xFF00) >> 8);
  SPI.transfer(address & 0xFF);
  *bufferRead = SPI.transfer(0x00);  //Get read values
  digitalWrite(CS_PIN_EEPROM, HIGH);
}

void eeprom_page_reset(uint16_t address) {
  if (address & 0x1F) {  // Check alignment to 32 bytes
    Serial.println("EEPROM page reset: Address is not multiple of 32");
    return;
  }
  uint8_t zeroBuffer[32] = { 0 };  // Fill with zeros
  eeprom_write_page(address, zeroBuffer, 32);
}

void eeprom_read_page(uint16_t address, uint8_t *bufferRead) {
  if (address & 0x1F) {  // Not aligned to 32-byte boundary
    Serial.println("EEPROM read page: Address is not multiple of 32");
    return;
  }

  digitalWrite(CS_PIN_EEPROM, LOW);

  SPI.transfer(0x03);                   // Read command
  SPI.transfer((address >> 8) & 0xFF);  // Address high byte
  SPI.transfer(address & 0xFF);         // Address low byte

  uint8_t integrity = SPI.transfer(0x00);  // First byte: check integrity

  if (integrity != 0x42) {
    Serial.println("Check integrity failed (reading page eeprom)");
  }
  uint8_t length = SPI.transfer(0x00);  // Second byte: number of valid bytes
  if (length == 0 || length > 31) {
    Serial.print("EEPROM read page: Invalid window length: ");
    Serial.println(length);
    digitalWrite(CS_PIN_EEPROM, HIGH);
    return;
  }

  bufferRead[0] = length;  // Store the length
  for (uint8_t i = 0; i < length; i++) {
    bufferRead[1 + i] = SPI.transfer(0x00);  // Read the data bytes
  }

  digitalWrite(CS_PIN_EEPROM, HIGH);
}

void eeprom_read_status_reg(uint8_t *bufferRead) {
  digitalWrite(CS_PIN_EEPROM, LOW);
  SPI.transfer(0x05);                //Read status register instruction
  *bufferRead = SPI.transfer(0x00);  //Get read values
  digitalWrite(CS_PIN_EEPROM, HIGH);
}

void eeprom_enable_write() {
  //Disables the write protection to be able to write to eeprom
  digitalWrite(CS_PIN_EEPROM, LOW);
  SPI.transfer(0x06);                 //Send the WREN sequence
  digitalWrite(CS_PIN_EEPROM, HIGH);  //Enable CS to write enable latch
}

void eeprom_disable_write() {
  //Disables the write protection to be able to write to eeprom
  digitalWrite(CS_PIN_EEPROM, LOW);
  SPI.transfer(0x04);                 //Send the WREN sequence
  digitalWrite(CS_PIN_EEPROM, HIGH);  //Enable CS to write enable latch
}

void eeprom_write_byte(uint16_t address, uint8_t data) {
  eeprom_enable_write();
  digitalWrite(CS_PIN_EEPROM, LOW);
  uint8_t bufferWrite[4];
  bufferWrite[0] = 0x02;
  bufferWrite[1] = (address & 0xFF00) >> 8;
  bufferWrite[2] = address & 0xFF;
  bufferWrite[3] = data;

  SPI.transfer(bufferWrite, sizeof(bufferWrite));
  digitalWrite(CS_PIN_EEPROM, HIGH);
}

void eeprom_write_page(uint16_t address, const uint8_t *pageWrite, size_t length) {
  if (length == 0 || length > 32) {
    Serial.println("EEPROM write page: Invalid length");
    return;  // Guard against invalid lengths
  }
  if (address & 0x1F) {  // Same as address % 32 != 0
    Serial.println("EEPROM write page: Address is not multiple of 32");
  }

  eeprom_enable_write();
  digitalWrite(CS_PIN_EEPROM, LOW);

  // Allocate buffer: 1 (command) + 2 (address) + length (data)
  uint8_t bufferWrite[3 + length];
  bufferWrite[0] = 0x02;  // Write command
  bufferWrite[1] = (address & 0xFF00) >> 8;
  bufferWrite[2] = address & 0xFF;

  // Copy data into buffer
  for (size_t i = 0; i < length; i++) {
    bufferWrite[3 + i] = pageWrite[i];
  }

  SPI.transfer(bufferWrite, sizeof(bufferWrite));
  digitalWrite(CS_PIN_EEPROM, HIGH);
}
