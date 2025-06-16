/*
Brave only: Activate web bluetooth API -> brave://flags/#brave-web-bluetooth-api
Brave & Chrome: Activate new permission backend -> about:flags/#enable-web-bluetooth-new-permissions-backend
*/

import { btnAlertError, btnAlertErrorWithTimeout, btnAlertSuccessWithTimeout, btnAuto, btnLoadingTimeout, btnCustom, alertError, alertInfo, REF_CLK, enableFormCalculateFreq, returnFreqParams, } from "./other.mjs";


const debugMode = new URL(location.href).searchParams.get('debug') == "true";
var firmwareVersion = "";
var bluetoothDevice, characteristicWrite = null;

var checkSum = 0;
var totalTag1 = 0, totalTag2 = 0;
window.calibratedValues = [];
var I_offset, Q_offset = 0, I_rcal_in = 0, Q_rcal_in = 0, I_rcal_quad = 0, Q_rcal_quad = 0;
var init_cal_transmission = 0, rcal_calib = 0;

var lengthCalibrationFrequencies = 0;
var calibTransmission = 0, calibFatalError = 0, sweepTransmission = 0, sweepIndex = 0;
//window.frequenciesArray = [{ "freq": 5000, "mdiv": 625, "ndiv": 1, "kdiv": 4, "dac_osr": 3, "adc_osr": 5, "generatedFreq": 5000, "recievedFreq": 3, "I_offset": -485, "Q_offset": -281, "I_rcal_in": 31019, "Q_rcal_in": -31825, "I_rcal_quad": -501, "Q_rcal_quad": -267, "I_cal_in": 31504, "Q_cal_in": -31544, "I_cal_quad": -16, "Q_cal_quad": 14, "I_coeff": 143.20001846807213, "Q_coeff": 143.38183230350612, "I_phase_coeff": -0.02909892056216701, "Q_phase_coeff": -0.025429268973958176, "avg_real": 568.6375519313021, "avg_imag": -1.572081973927845, "avg_mag": 568.6397250528291, "avg_angle": -0.15840218846603432 }, { "freq": 20000, "mdiv": 625, "ndiv": 1, "kdiv": 2, "dac_osr": 3, "adc_osr": 5, "generatedFreq": 20000, "recievedFreq": 3, "I_offset": -472, "Q_offset": -278, "I_rcal_in": 31064, "Q_rcal_in": -31840, "I_rcal_quad": -582, "Q_rcal_quad": -178, "I_cal_in": 31536, "Q_cal_in": -31562, "I_cal_quad": -110, "Q_cal_quad": 100, "I_coeff": 143.3463265620817, "Q_coeff": 143.46435644524368, "I_phase_coeff": -0.19985128698343502, "Q_phase_coeff": -0.18153345096021264, "avg_real": 567.9917661185026, "avg_imag": -1.9184653521179833, "avg_mag": 567.9950060411826, "avg_angle": -0.1935231395512525 }, { "freq": 50000, "mdiv": 781, "ndiv": 1, "kdiv": 1, "dac_osr": 3, "adc_osr": 5, "generatedFreq": 49984, "recievedFreq": 3, "I_offset": -495, "Q_offset": -351, "I_rcal_in": 31389, "Q_rcal_in": -32264, "I_rcal_quad": -667, "Q_rcal_quad": -180, "I_cal_in": 31884, "Q_cal_in": -31913, "I_cal_quad": -172, "Q_cal_quad": 171, "I_coeff": 144.92938149262457, "Q_coeff": 145.06117333133793, "I_phase_coeff": -0.30908225070919015, "Q_phase_coeff": -0.3070060643122677, "avg_real": 567.5581477650292, "avg_imag": -2.999680099681439, "avg_mag": 567.5660747218521, "avg_angle": -0.3028190327100995 }, { "freq": 100000, "mdiv": 781, "ndiv": 1, "kdiv": 0, "dac_osr": 3, "adc_osr": 5, "generatedFreq": 99968, "recievedFreq": 3, "I_offset": -523, "Q_offset": -318, "I_rcal_in": 32431, "Q_rcal_in": -33304, "I_rcal_quad": -649, "Q_rcal_quad": -195, "I_cal_in": 32954, "Q_cal_in": -32986, "I_cal_quad": -126, "Q_cal_quad": 123, "I_coeff": 149.79200400158186, "Q_coeff": 149.9374060171127, "I_phase_coeff": -0.21907000785591405, "Q_phase_coeff": -0.21364664455470359, "avg_real": 565.5223545282602, "avg_imag": -5.123538596608819, "avg_mag": 565.5455632563463, "avg_angle": -0.5190760436294682 }, { "freq": 150000, "mdiv": 586, "ndiv": 1, "kdiv": 0, "dac_osr": 2, "adc_osr": 5, "generatedFreq": 150016, "recievedFreq": 3, "I_offset": -590, "Q_offset": -167, "I_rcal_in": 34221, "Q_rcal_in": -35010, "I_rcal_quad": -403, "Q_rcal_quad": -367, "I_cal_in": 34811, "Q_cal_in": -34843, "I_cal_quad": 187, "Q_cal_quad": -200, "I_coeff": 158.23410120806437, "Q_coeff": 158.3798818120847, "I_phase_coeff": 0.30778224440563184, "Q_phase_coeff": 0.32887610289176095, "avg_real": 561.0138841946366, "avg_imag": -6.684649755807154, "avg_mag": 561.0537075909141, "avg_angle": -0.6826642002255154 }, { "freq": 200000, "mdiv": 781, "ndiv": 1, "kdiv": 0, "dac_osr": 2, "adc_osr": 5, "generatedFreq": 199936, "recievedFreq": 3, "I_offset": -626, "Q_offset": -213, "I_rcal_in": 36743, "Q_rcal_in": -37613, "I_rcal_quad": 486, "Q_rcal_quad": -1337, "I_cal_in": 37369, "Q_cal_in": -37400, "I_cal_quad": 1112, "Q_cal_quad": -1124, "I_coeff": 169.93427904403183, "Q_coeff": 170.0767556426138, "I_phase_coeff": 1.7044638861505226, "Q_phase_coeff": 1.7214191871031532, "avg_real": 556.3332314603582, "avg_imag": -7.527171990098498, "avg_mag": 556.3841503361621, "avg_angle": -0.7751628858029042 }, { "freq": 250000, "mdiv": 488, "ndiv": 0, "kdiv": 0, "dac_osr": 1, "adc_osr": 6, "generatedFreq": 249856, "recievedFreq": 3, "I_offset": -583, "Q_offset": -88, "I_rcal_in": 40095, "Q_rcal_in": -40793, "I_rcal_quad": 1956, "Q_rcal_quad": -2656, "I_cal_in": 40678, "Q_cal_in": -40705, "I_cal_quad": 2539, "Q_cal_quad": -2568, "I_coeff": 185.25982452394967, "Q_coeff": 185.39056655995606, "I_phase_coeff": 3.5715990924057754, "Q_phase_coeff": 3.6098961218309915, "avg_real": 551.227957339308, "avg_imag": -7.441135594640343, "avg_mag": 551.2781797345182, "avg_angle": -0.773400122560554 }, { "freq": 300000, "mdiv": 586, "ndiv": 1, "kdiv": 0, "dac_osr": 1, "adc_osr": 5, "generatedFreq": 300032, "recievedFreq": 3, "I_offset": -639, "Q_offset": -117, "I_rcal_in": 44260, "Q_rcal_in": -45038, "I_rcal_quad": 4888, "Q_rcal_quad": -5676, "I_cal_in": 44899, "Q_cal_in": -44921, "I_cal_quad": 5527, "Q_cal_quad": -5559, "I_coeff": 205.62683494119605, "Q_coeff": 205.74389932009655, "I_phase_coeff": 7.017720124514785, "Q_phase_coeff": 7.054520627785574, "avg_real": 543.523718311655, "avg_imag": -5.2272857048869525, "avg_mag": 543.5488541825545, "avg_angle": -0.5510195149778806 }];
//window.frequenciesArray = [{ "freq": 50000, "mdiv": 781, "ndiv": 1, "kdiv": 1, "dac_osr": 3, "adc_osr": 5, "generatedFreq": 49984, "recievedFreq": 3, "I_offset": -481, "Q_offset": -359, "I_rcal_in": 31391, "Q_rcal_in": -32268, "I_rcal_quad": -665, "Q_rcal_quad": -190, "I_cal_in": 31872, "Q_cal_in": -31909, "I_cal_quad": -184, "Q_cal_quad": 169, "I_coeff": 144.87514145487572, "Q_coeff": 145.04294334169842, "I_phase_coeff": -0.33077015284138, "Q_phase_coeff": -0.30345345201534607 }];
window.frequenciesArray = [];
var calibrationFrequencies = [5, 20, 50, 100, 150, 200, 250, 300];
//  var calibrationFrequencies = [25, 50, 100, 150];
var xlsx, csv;

window.doAverageSweep = 1;

(async function () {
  $("#btns-commands").css("display", "flex").hide();
  if (debugMode) {
    $("[alerttype='debugmode']").css("display", "block");
    $("#col-one-time").css("display", "flex");
    $("#btn-compute-frequency").removeClass("noDisplay");
  }
  //$("#btns-commands").css("display", "flex");

  /*$("#btn-charttest").fadeIn().click(function () {
    if (window.chartPhase || window.chartQuadrature) {
      deleteChartData();
    } else {
      createChartBioZ();
    }

    $("#div-chart").css("display", "grid");
    for (let i = 0; i < 1000; i++) {
      let numValue;
      if (i % 2 == 0) {
        numValue = numValue = Math.floor(Math.random() * (0xFFFFFF - 0xFF0000 + 1)) + 0xFF0000;
        totalTag1++;
        updateChartData(0, numValue);
      }
      else {
        numValue = Math.floor(Math.random() * 0x0000100);
        totalTag2++;
        updateChartData(1, numValue);
      }
      //console.log("Update: ", totalTag1, totalTag2, Math.max(totalTag1, totalTag2));
    }
    window.chartPhase.update();
    window.chartQuadrature.update();
  });*/

  if (!('bluetooth' in navigator)) {
    console.log("Navigator doesn't support bluetooth");
    $("#card-error-navigator").removeClass("noDisplay");
    btnAuto($("#btn-connect-arduino"), "danger", -1, "Error", { disabled: true });
  }
  else {
    document.querySelector("#formConnect").addEventListener("submit", async function (e) {
      e.stopPropagation();
      e.preventDefault();
      $("#alert-connect-form").fadeOut();
      $("#alert-connect-sequence").fadeOut();
      $("#alert-sweep").fadeOut();
      if (isWebBluetoothEnabled()) {
        btnLoadingTimeout($("#btn-connect-arduino"), 15000);
        if (navigator.bluetooth) {
          const target = $("#btn-connect-arduino").attr("purpose");
          if (target == "connect") {
            if (bluetoothDevice) {
              console.log("Bluetooth device already connected...");
              btnCustom($("#btn-connect-arduino"), "Desconectarse", "primary", true, true, true);
              $("#btn-connect-arduino").attr("purpose", "disconnect");
            }
            else {
              bluetoothDevice = null;
              try {
                setStepSpinner($("#div-connect-step-1"));
                setStepWait($("#div-connect-step-2"));
                setStepWait($("#div-connect-step-3"));
                setStepWait($("#div-connect-step-4"));
                $("#row-connect-sequence").css("display", "flex");
                //Every bluetooth device has a specified service and characteristic UID
                //These parameters are programmed into the arduino and are HEX numbers
                //The table for these parameters can be found here
                //https://www.bluetooth.com/specifications/assigned-numbers/
                const serviceUuid = '0000fff0-0000-1000-8000-00805f9b34fb';; //0x181B Body composition Service.
                //It's the main service advertised from the arduino

                bluetoothDevice = await navigator.bluetooth.requestDevice({
                  filters: [{ services: [serviceUuid] }], //UID of the main service advertized by the arduino
                  optionalServices: [serviceUuid, 0x180A],
                  //acceptAllDevices: true
                });
                setStepOK($("#div-connect-step-1"));
                setStepSpinner($("#div-connect-step-2"));

              } catch (error) {
                setStepError($("#div-connect-step-1"));
                var textError = "";
                switch (error.code) {
                  case 19:
                    textError = "Se ha producido un error al conectarse al dispositivo. Inténtalo de nuevo.";
                    break;

                  default:
                    textError = "Se ha producido un error";
                    break;
                }
                btnCustom($("#btn-connect-arduino"), "Conectarse", "primary", true, true, true);
                $("#row-connect-sequence").fadeOut();
                if (error.code == 8) {
                  btnAuto($("#btn-connect-arduino"), "danger", 4000, "Operación cancelada");
                }
                else {
                  btnAlertErrorWithTimeout($("#btn-connect-arduino"), $("#alert-connect-form"), textError, "mt-3 alert-fadeout noDisplay");
                }
                console.log('Argh! ' + error, error.code);
                $("#btn-connect-arduino").attr("purpose", "connect");
                $("#btns-commands").fadeOut();
              }
              if (bluetoothDevice != null) {
                bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

                console.log('Connecting to GATT Server...');
                const server = await bluetoothDevice.gatt.connect();

                console.log('Getting Services...');
                const services = await server.getPrimaryServices();
                //parseInt(characteristicUuid)

                console.log('Getting Characteristics...');
                for (const service of services) {
                  console.log('> Service: ' + service.uuid);
                  const characteristics = await service.getCharacteristics();

                  characteristics.forEach(async characteristic => {
                    /*console.log('>> Characteristic UUID:  ' + characteristic.uuid);
                    console.log('>> Broadcast:            ' + characteristic.properties.broadcast);
                    console.log('>> Read:                 ' + characteristic.properties.read);
                    console.log('>> Write w/o response:   ' +
                      characteristic.properties.writeWithoutResponse);
                    console.log('>> Write:                ' + characteristic.properties.write);
                    console.log('>> Notify:               ' + characteristic.properties.notify);
                    console.log('>> Indicate:             ' + characteristic.properties.indicate);
                    console.log('>> Signed Write:         ' +
                      characteristic.properties.authenticatedSignedWrites);
                    console.log('>> Queued Write:         ' + characteristic.properties.reliableWrite);
                    console.log('>> Writable Auxiliaries: ' +
                      characteristic.properties.writableAuxiliaries);*/

                    console.log('>> Characteristic: ' + characteristic.uuid + ' ' +
                      getSupportedProperties(characteristic));

                    if (characteristic.properties.notify && characteristic.uuid == "0000fff2-0000-1000-8000-00805f9b34fb") {
                      await characteristic.startNotifications();
                      console.log('> Notifications started (resistanceCharacteristic)');
                      characteristic.addEventListener('characteristicvaluechanged',
                        handleCommand);
                      if (characteristicWrite) {
                        //Send initialization to arduino
                        let valueInit = fromHexString('500001');
                        characteristicWrite.writeValue(valueInit);
                      }

                    }
                    if (characteristic.properties.notify && characteristic.uuid == "0000fff3-0000-1000-8000-00805f9b34fb") {
                      await characteristic.startNotifications();
                      console.log('> Notifications started (calibrationCharacteristic)');
                      characteristic.addEventListener('characteristicvaluechanged',
                        handle7byte);
                    }

                    if (characteristic.properties.write && characteristic.uuid == "0000fff1-0000-1000-8000-00805f9b34fb") {
                      characteristicWrite = characteristic;
                      //Request resistance read
                      $("#btn-send-recieve").unbind().click(async function () {
                        window.frequenciesArray = [];
                        window.calibratedValues = [];
                        totalTag1 = 0;
                        totalTag2 = 0;
                        btnLoadingTimeout($(this), 20000, true);
                        var oneTimePin = $("[name='oneTimePin']:checked").val(),
                          fullRegisters = $("[name='onetime_fullRegister']").prop("checked");
                        $("#alert-send-recieve").fadeOut();
                        if (!window.chartPhase && !window.chartQuadrature) {
                          createChartBioZ();
                          $("#div-chart").css("display", "grid");
                        }
                        else deleteChartData();
                        checkSum = 0;
                        console.log("> Sending message get data (000001). UUID=", characteristicWrite.uuid);
                        var valueInitCalib = new Uint8Array([
                          0x00,
                          0x00,
                          0x10 | (fullRegisters << 1) | oneTimePin,
                        ]);
                        console.log(valueInitCalib);
                        await characteristicWrite.writeValue(valueInitCalib);
                        //btnAlertErrorWithTimeout($(this), $("#alert-send-recieve"), "Debes calibrar el dispositivo antes de poder recibir datos.", "mt-3", 3000);
                      });
                      $("#btn-sweep").unbind().click(async function () {
                        if (debugMode && false) {
                          var txtTable = "";
                          window.frequenciesArray.forEach((element, index) => {
                            txtTable += returnHTMLRowCalib("sweep", index, Math.round(element.generatedFreq / 1e3), { calibrated: true });
                          });
                          $("#table-body-frequencies-sweep").html(txtTable);
                          $("[svgcheck-sweep]").css("display", "inline");
                          lengthCalibrationFrequencies = window.frequenciesArray.length;
                          setHandleBtnCalib("sweep");

                          $("#chbk-apply-calib").prop("checked", true).unbind().change(function () {
                            //User updated the apply calibration checkbox
                            //We want to disable the ability to add values which were not calibrated, but 
                            //allow the user to delete sweep values
                            const applyCalib = $(this).prop("checked");
                            if (applyCalib) {
                              //The user indicated they want to apply calibration
                              var arrValues = [];
                              for (let i = 0; i < window.frequenciesArray.length; i++) {
                                arrValues.push(Math.round(window.frequenciesArray[i].generatedFreq / 1e3));
                              }
                              console.log("Arr values: ", arrValues);
                              for (let i = 0; i < lengthCalibrationFrequencies; i++) {
                                const numInput = Number($(`[inputfrequency-sweep='${i}']`).val());
                                if (arrValues.includes(numInput)) {
                                  //Value was calibrated
                                  $(`[svgcheck-sweep='${i}']`).css("display", "inline");
                                  $(`[svgcrossmark-sweep='${i}']`).addClass("text-warning").css({ 'color': '', 'display': 'none' });

                                }
                                else {
                                  //Value was not calibrated
                                  $(`[svgcheck-sweep='${i}']`).css("display", "none");
                                  $(`[svgcrossmark-sweep='${i}']`).addClass("text-warning").css({ 'color': '', 'display': 'inline' });
                                }
                              }
                            }
                            else {
                              $("[svgcheck-sweep]").css("display", "none");
                              $("[svgcrossmark-sweep]").removeClass("text-warning").css({ 'color': 'darkgray', 'display': 'inline' });
                            }
                          });
                          $("#modal-sweep").modal("show");
                        }
                        else {
                          getSweepValues();
                        }
                      });

                      async function getSweepValues() {
                        if (window.frequenciesArray && window.frequenciesArray.length > 0 || debugMode) {
                          btnLoadingTimeout($("#btn-sweep"), 20000, false, `frecuencia 1/${window.frequenciesArray.length}`);
                          $("#alert-sweep").fadeOut();
                          if (!window.chartPhase && !window.chartQuadrature) {
                            createChartBioZ();
                            $("#div-chart").css("display", "grid");
                          }
                          else deleteChartData();
                          checkSum = 0;

                          var sweepPin = $("[name='sweepPin']:checked").val();
                          if (!debugMode) sweepPin = 0;

                          //Sending initialize sweep command
                          let valueInitCalib = new Uint8Array([
                            0x0D,
                            0x00 | (sweepPin << 1) | doAverageSweep,
                            (window.frequenciesArray.length) & 0xFF
                          ]);
                          sweepTransmission = 1;
                          sweepIndex = 0;
                          console.log(valueInitCalib);
                          await characteristicWrite.writeValue(valueInitCalib);

                          //Send the first frequency to sweep
                          await sendFrequencyToArduino(0x4, 0);

                        }
                        else {
                          btnAlertErrorWithTimeout($("#btn-sweep"), $("#alert-sweep"), "Debes calibrar el dispositivo antes de poder recibir datos.", "mt-3", 3000);
                        }
                      }


                      //Request init of the MAX3009
                      $("#btn-send-init").unbind().click(async function () {
                        console.log("> Sending message init (000002). UUID=", characteristicWrite.uuid);
                        let value = fromHexString('000002');
                        characteristicWrite.writeValue(value);
                        btnAuto($(this), "success");
                      });

                      //Request calibration
                      $("#btn-calibrate").unbind().click(async function () {
                        $("#alert-calibrate").fadeOut();
                        $("#alert-form-calibrate").fadeOut();
                        lengthCalibrationFrequencies = calibrationFrequencies.length;
                        var txtTable = "";
                        calibrationFrequencies.forEach((element, index) => {
                          txtTable += returnHTMLRowCalib("calib", index, element);
                        });
                        $("#table-body-frequencies-calib").html(txtTable);
                        if (debugMode) {
                          $("[displaywith='debugmode']").removeClass("noDisplay");
                        }
                        $("#modal-calibration").modal("show");

                        setHandleBtnCalib("calib");

                        $("#form-calibrate").unbind().submit(async function (e) {
                          //Calibration Sequence
                          e.stopPropagation();
                          e.preventDefault();
                          let btn = $("#form-calibrate [type='submit']"), alertForm = $("#alert-form-calibrate"),
                            calibInput = $("[name='selectMode']:checked").val(),
                            chbk_debug = $("[name='chbk_calib_debug']").prop("checked"),
                            chbk_eeprom = $("[name='chbk_calib_save_eeprom']").prop("checked"),
                            chbk_check_spi = $("[name='chbk_calib_check_spi']").prop("checked");

                          alertForm.fadeOut();
                          btnLoadingTimeout($("#btn-modal-calibrate"), 20000, false, `Calibrando 1/${lengthCalibrationFrequencies}`);
                          $("#card-success-calib").fadeOut();

                          //For each value specified in the form, calculate the corresponding parameters
                          window.frequenciesArray = [];
                          for (let i = 0; i < lengthCalibrationFrequencies; i++) {
                            const freqVal = Number($(`[inputfrequency-calib='${i}']`).val()) * 1e3; //Compute the desired frequency value

                            //Return the correct register values for this frequency and search for a sample rate between min and max
                            //returnFreqParams(freqVal, min, max)
                            const calcul = returnFreqParams(freqVal, 50, 100);

                            if (calcul.success) {
                              window.frequenciesArray.push({
                                freq: freqVal,
                                mdiv: calcul.mdiv,
                                ndiv: calcul.ndiv == 512 ? 0 : 1,
                                kdiv: (Math.log2(calcul.kdiv)), //.toString(16),
                                dac_osr: (Math.log2(calcul.dac_osr) - 5), //.toString(16),
                                adc_osr: (Math.log2(calcul.sampleRateSelect[calcul.default_adc_osr == -1 ? 0 : calcul.default_adc_osr].adc_osr) - 3), //.toString(16),
                                generatedFreq: calcul.generatedFreq
                              });
                            }
                            else {
                              console.log(calcul.errorMsg);
                              btnAlertErrorWithTimeout($("#btn-modal-calibrate"), alertForm, calcul.errorMsg, 3000);
                            }
                          }
                          console.log(window.frequenciesArray);

                          //Send the first frame that indicates the number of frequencies to calibrate
                          /*let valueInitCalib = new Uint8Array([
                            0x00,
                            0x0C,
                            (window.frequenciesArray.length) & 0xFF
                          ]);
                          */
                          const Rcal = Number($("#form-calibrate input[name='calibResistor']").val());


                          //This if was done to quickly be able to work with another version of the programm
                          //To remove before publication
                          //TOREMOVE
                          if (firmwareVersion == "FW V1.5") {
                            let valueInitCalib = new Uint8Array([
                              0xC0,
                              0x00,
                              (chbk_check_spi << 5) | (chbk_eeprom << 4) | (chbk_debug << 3) | (calibInput << 2) | 0x3,
                            ]);
                            console.log(valueInitCalib);
                            await characteristicWrite.writeValue(valueInitCalib);

                            valueInitCalib = new Uint8Array([
                              0xC1,
                              (window.frequenciesArray.length) & 0xFF,
                              (Rcal >> 16) & 0xFF,

                            ]);
                            console.log(valueInitCalib);
                            await characteristicWrite.writeValue(valueInitCalib);

                            valueInitCalib = new Uint8Array([
                              0xC2,
                              (Rcal >> 8) & 0xFF,
                              Rcal & 0xFF,
                            ]);
                            console.log(valueInitCalib);
                            await characteristicWrite.writeValue(valueInitCalib);
                          }
                          else {
                            console.log("Number of calibration frequencies: ", window.frequenciesArray.length);
                            let valueInitCalib = new Uint8Array([
                              0xC0,
                              (window.frequenciesArray.length) & 0xFF,
                              (Rcal >> 16) & 0xFF,
                            ]);
                            let hexValue = Array.from(valueInitCalib).map(byte => byte.toString(16).padStart(2, '0')).join(' ').toUpperCase();
                            console.log("Hex value: ", hexValue);
                            await characteristicWrite.writeValue(valueInitCalib);

                            valueInitCalib = new Uint8Array([
                              0xC1,
                              (Rcal >> 8) & 0xFF,
                              Rcal & 0xFF,
                            ]);
                            hexValue = Array.from(valueInitCalib).map(byte => byte.toString(16).padStart(2, '0')).join(' ').toUpperCase();
                            console.log("Hex value: ", hexValue);
                            await characteristicWrite.writeValue(valueInitCalib);

                            valueInitCalib = new Uint8Array([
                              0xC2,
                              0x00,
                              (chbk_check_spi << 5) | (chbk_eeprom << 4) | (chbk_debug << 3) | (calibInput << 2) | 0x3,
                            ]);
                            hexValue = Array.from(valueInitCalib).map(byte => byte.toString(16).padStart(2, '0')).join(' ').toUpperCase();
                            console.log("Hex value: ", hexValue);
                            await characteristicWrite.writeValue(valueInitCalib);
                          }


                          calibTransmission = 1;
                          //for (const element of window.frequenciesArray) {};

                          //Send the first frequency to calibrate
                          await sendFrequencyToArduino(0x3, 0);
                        });
                        //btnLoadingTimeout($(this), 60000, true);
                        //$("#alert-calibration").fadeOut();;
                        //console.log("> Sending message calibration. UUID=", characteristicWrite.uuid);
                        //let value = fromHexString('000C03');
                        //characteristicWrite.writeValue(value);
                      });
                      if (window.frequenciesArray && window.frequenciesArray.length > 0) {
                        //The frequenciesArray was already defined
                        $("#col-sweep").css("display", "block");
                        enableCalibDownload();
                      }
                      //$("#btns-commands").fadeIn();

                    }
                    if (characteristic.properties.read && characteristic.uuid.slice(4, 8) == "2a26") {
                      await characteristic.readValue().then(value => {
                        let decoder = new TextDecoder('ascii');
                        firmwareVersion = decoder.decode(value);
                        console.log('> Firmware description: ' + firmwareVersion);
                      });
                    }
                  });
                }
                btnCustom($("#btn-connect-arduino"), "Desconectarse", "primary", true, true, true);
                $("#btn-connect-arduino").attr("purpose", "disconnect");
                if (!characteristicWrite) {
                  setStepOK($("#div-connect-step-2"));
                  setStepError($("#div-connect-step-3"));
                  btnAlertErrorWithTimeout($("#btn-connect-arduino"), $("#alert-connect-form"), "El dispositivo conectado no permite el envío de datos.", "mt-3 alert-fadeout noDisplay");
                }
              }
            }
          }
          else {
            console.log("Disconnect");
            //await onStopButtonClick();

            try {
              if (bluetoothDevice.gatt.connected) {
                bluetoothDevice.gatt.disconnect();
              } else {
                console.log('> Bluetooth Device is already disconnected');
              }
              bluetoothDevice = null;
            } catch (error) {
              console.log("Error: ", error);
            }
            $("#row-connect-sequence").fadeOut();
            btnCustom($("#btn-connect-arduino"), "Conectarse", "primary", true, true, true);
            $("#btn-connect-arduino").attr("purpose", "connect");
            $("#btns-commands").fadeOut();
          }
        }
        else {
          btnAlertError($("#btn-connect-arduino"), "Error", $("#alert-connect-form"), "Tu navegador no soporta la API de Bluetooth. Utiliza Google Chrome (u otro navegador tipo chromium) o microsoft Edge. <br>Esta página sólo funciona en un ordenador.", true, true);
        }
      }

    });

    enableFormCalculateFreq();


    $("#form-modal-save").unbind().submit(async function (e) {
      e.stopPropagation();
      e.preventDefault();
      let btn = $("#form-modal-save button"), alertForm = $("#alert-modal-save"),
        dwval = $("#form-modal-save [name='saveformat']").val();
      alertForm.fadeOut();

      var arrayData;
      if (!window.frequenciesArray) {
        console.log("Using (non)calibrated values");
        arrayData = transformCalibDataToArray(window.calibratedValues);
      }
      else {
        console.log("Using frequencies array")
        arrayData = transformDataToArray(window.frequenciesArray);
      }

      if (dwval == "xlsx") {
        if (!xlsx) xlsx = await (await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')).default;
        const worksheet = xlsx.utils.aoa_to_sheet(arrayData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Data");

        const wbout = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
        saveAs(blob, "frequencyValues.xlsx");
      }
      else if (dwval == "csv") {
        const arrayDataCsv = arrayData.map(row => row.join(",")).join("\r\n");
        const blob = new Blob([arrayDataCsv], {
          type: "text/csv;charset=utf-8"
        });
        saveAs(blob, "frequencyValues.csv");
      }

    });
  }

})();

function transformDataToArray(data) {
  //Transforms data to the correct format
  //To be interpreted as csv or xslx

  const result = [];
  // Optional: Add headers
  result.push(["Frequency (kHz)", "Magnitude", "Angle", "Real", "Imaginary"]);

  for (const key in data) {
    const item = data[key];
    result.push([
      item.generatedFreq / 1000,  // Convert Hz to kHz
      item.avg_mag,
      item.avg_angle,
      item.avg_real,
      item.avg_imag
    ]);
  }

  return result;
}

function transformCalibDataToArray(data) {
  //Transforms data to the correct format
  //To be interpreted as csv or xslx
  const result = [];
  // Optional: Add headers
  result.push(["Frequency (kHz)", "Sample Number", "Value"]);
  var indexSample = 0;
  for (const key in data) {
    const item = data[key];
    result.push([
      50e3,
      indexSample,
      item.value,

    ]);
    indexSample++;
  }

  return result;
}

function setHandleBtnCalib(id) {
  $(`[removefeature-${id}]`).unbind().click(function () {
    var numElm = Number($(this).attr(`removefeature-${id}`));
    $(this).attr(`removefeature-${id}`, "-1");
    $(`[inputfrequency-${id}='${numElm}']`).attr(`inputfrequency-${id}`, "-1");

    for (let i = numElm + 1; i < lengthCalibrationFrequencies; i++) {
      $(`[removefeature-${id}='${i}']`).attr(`removefeature-${id}`, i - 1);
      $(`[inputfrequency-${id}='${i}']`).attr(`inputfrequency-${id}`, i - 1);
    }
    lengthCalibrationFrequencies--;
    $(this).parent().parent().remove();
  });
  $(`[inputfrequency-${id}]`).unbind().change(function () {

    var numElm = Number($(this).attr(`inputfrequency-${id}`)),
      value = Number($(this).val());
    var valueBefore = Number($(`[inputfrequency-${id}='${numElm - 1}']`).val());
    if (numElm - 1 >= 0 && value < valueBefore) {
      //If value is inferior to the frequency shown before
      for (let i = numElm - 1; i >= 0; i--) {
        if (value > Number($(`[inputfrequency-${id}='${i}']`).val())) {
          //First time value is superior to the frequency before
          console.log(numElm, " should be at position (<-) ", i + 1);
          for (let j = numElm; j > i + 1; j--) {
            $(`[inputfrequency-${id}='${j}']`).val($(`[inputfrequency-${id}='${j - 1}']`).val());
          }
          $(`[inputfrequency-${id}='${i + 1}']`).val(value);
          i = -1;
        }
        if (i == 0 && value < valueBefore) {
          console.log("Should be at the beggining", numElm);
          for (let j = numElm; j > 0; j--) {
            $(`[inputfrequency-${id}='${j}']`).val($(`[inputfrequency-${id}='${j - 1}']`).val());
          }
          $(`[inputfrequency-${id}='0']`).val(value);
        }
      }
    }
    if (numElm + 1 < lengthCalibrationFrequencies && value > Number($(`[inputfrequency-${id}='${numElm + 1}']`).val())) {
      //If value is superior to the value next in line
      for (let i = numElm + 1; i < lengthCalibrationFrequencies; i++) {
        if (value < Number($(`[inputfrequency-${id}='${i}']`).val())) {
          console.log("Should be at position (->)", i);
          for (let j = numElm + 1; j <= i; j++) {
            $(`[inputfrequency-${id}='${j - 1}']`).val($(`[inputfrequency-${id}='${j}']`).val());
          }
          $(`[inputfrequency-${id}='${i}']`).val(value);
          i = lengthCalibrationFrequencies + 1;
        }
        if (i == lengthCalibrationFrequencies - 1 && value > Number($(`[inputfrequency-${id}='${i}']`).val())) {
          console.log("Should be at the end of the list");
          for (let j = numElm + 1; j <= lengthCalibrationFrequencies; j++) {
            $(`[inputfrequency-${id}='${j - 1}']`).val($(`[inputfrequency-${id}='${j}']`).val());
          }
          $(`[inputfrequency-${id}='${lengthCalibrationFrequencies - 1}']`).val(value);
        }
      }
    }
  });

  $(`#btn-add-frequency-${id}`).unbind().click(function () {
    var options = {};
    if (id == "sweep") {
      //Check if the value to sweep has been calibrated or not
      //options["calibrateIcon"] = true;
      options["calibrated"] = false; //Value has not been calibrated
    }
    const newFreqVal = Number($(`[inputfrequency-${id}='${lengthCalibrationFrequencies - 1}']`).val());
    $(`#table-body-frequencies-${id}`).append(returnHTMLRowCalib(id, lengthCalibrationFrequencies, newFreqVal + 1, options));
    lengthCalibrationFrequencies++;
    setHandleBtnCalib(id);
  });
}

const fromHexString = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

function isWebBluetoothEnabled() {
  if (navigator.bluetooth) {
    return true;
  } else {
    ChromeSamples.setStatus('Web Bluetooth API is not available.\n' +
      'Please make sure the "Experimental Web Platform features" flag is enabled.');
    return false;
  }
}

function getSupportedProperties(characteristic) {
  let supportedProperties = [];
  for (const p in characteristic.properties) {
    if (characteristic.properties[p] === true) {
      supportedProperties.push(p.toUpperCase());
    }
  }
  return '[' + supportedProperties.join(', ') + ']';
}

async function handle7byte(event) {
  //Calibration frames are of 32 bits = 5 bytes
  let value = event.target.value;
  let numValue =
    (((value.getUint8(2) & 0x0F) << 16) | // MSB
      (value.getUint8(1) << 8) |  // Middle byte
      (value.getUint8(0)));           // LSB

  let hexValue =
    ('00' + value.getUint8(6).toString(16)).slice(-2) + ' ' +
    ('00' + value.getUint8(5).toString(16)).slice(-2) + ' ' +
    ('00' + value.getUint8(4).toString(16)).slice(-2) + ' ' +
    ('00' + value.getUint8(3).toString(16)).slice(-2) + ' ' +
    ('00' + value.getUint8(2).toString(16)).slice(-2) + ' ' +
    ('00' + value.getUint8(1).toString(16)).slice(-2) + ' ' +
    ('00' + value.getUint8(0).toString(16)).slice(-2);
  console.log("7-byte value, ", hexValue);

  if (calibTransmission) {
    let errorCode = (value.getUint8(5) & 0xF0) >> 4;
    let frameType = value.getUint8(5) & 0x0F;
    if (errorCode) {
      //An error happened
      console.log("Error: ", errorCode);
      btnAlertErrorWithTimeout($("#btn-modal-calibrate"), $("#alert-form-calibrate"), "Se ha producido un error. Código error: " + errorCode, "mt-3", 10000);
      if (errorCode >= 2 && errorCode <= 5) {
        console.log("Fatal error. Dismissing.");
        calibTransmission = 0;
        calibFatalError = 1;
      }
    }
    else if (frameType == 0x0E) {
      //End of transmission
      console.log("End of calibration transmission");
      calibTransmission = 0;
      btnAlertSuccessWithTimeout($("#btn-modal-calibrate"), $("#alert-form-calibrate"), "¡Calibración realizada con éxito! Ahora puedes empezar a recibir datos", "mt-3");
      $("#alert-connect-sequence").fadeOut();
      setStepOK($("#div-connect-step-4"));
      btnCustom($("#btn-calibrate"), `Calibrado <svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg>`, "success");
      $("#col-sweep").fadeIn();
      enableCalibDownload();

    }
    else if ((value.getUint8(5) & 0x0C) || ((value.getUint8(5) & 0x03) == 0x3)) {
      //Only types 0000, 0001 and 0010 are correct
      //11xx are not correct and 0011 (xx11) are not correct
      console.log("Error: type field is not correct");
      btnAlertErrorWithTimeout($("#btn-modal-calibrate"), $("#alert-form-calibrate"), "Se ha producido un error: el argumento 'type' recibido no es correcto", "mt-3");
    }
    else {
      //Generating the value
      let I_val =
        ((value.getUint8(2) & 0x0F) << 16) |
        (value.getUint8(1) << 8) |
        value.getUint8(0);
      let Q_val =
        ((value.getUint8(4)) << 12) |
        (value.getUint8(3) << 4) |
        ((value.getUint8(2) & 0xF0) >> 4);

      I_val = convertToSigned20Bit(I_val);
      Q_val = convertToSigned20Bit(Q_val);

      let numFreq = (value.getUint8(6)); //Number of the frequency

      if (numFreq < window.frequenciesArray.length) {
        if (window.frequenciesArray[numFreq]) {
          //Normally, window.frequenciesArray must be defined, as the user requested the calibration
          //and its parameters are stored in window.frequenciesArray

          if (!window.frequenciesArray[numFreq].recievedFreq) window.frequenciesArray[numFreq].recievedFreq = 0;
          if (frameType == 0x0) {
            //Type = 0x0 => I_offset and Q_offset
            window.frequenciesArray[numFreq].I_offset = I_val;
            window.frequenciesArray[numFreq].Q_offset = Q_val;
            window.frequenciesArray[numFreq].recievedFreq++;
          }
          else if (frameType == 0x1) {
            //Type = 0x01 => I_rcal_in and Q_rcal_in
            window.frequenciesArray[numFreq].I_rcal_in = I_val;
            window.frequenciesArray[numFreq].Q_rcal_in = Q_val;
            window.frequenciesArray[numFreq].recievedFreq++;
          }
          else if (frameType == 0x2) {
            //Type = 0x2 => I_rcal_quad and Q_rcal_quad
            window.frequenciesArray[numFreq].I_rcal_quad = I_val;
            window.frequenciesArray[numFreq].Q_rcal_quad = Q_val;
            window.frequenciesArray[numFreq].recievedFreq++;
          }

          //console.log(window.frequenciesArray[numFreq].recievedFreq, numFreq + 1, window.frequenciesArray.length, numFreq + 1 < window.frequenciesArray.length)

          if (window.frequenciesArray[numFreq].recievedFreq == 3) {
            //When the device has recieved its third calibration value (the last one),
            //Proceed to Calculate the calibration parameters
            const Rcal = Number($("#form-calibrate input[name='calibResistor']").val()); //Calibration resistance value

            //Calculate the calibration parameters with calibration resistance value
            //It will automatically update window.frequenciesArray
            calculateCalibValues(numFreq, Rcal);

            if (numFreq + 1 < window.frequenciesArray.length) {
              //If we still not have reached the last frequency
              //Send the next calib request with the next frequency
              console.log("Sending next frequency: ", numFreq + 1);
              btnLoadingTimeout($("#btn-modal-calibrate"), 20000, false, `Calibrando ${numFreq + 2}/${window.frequenciesArray.length}`);
              setTimeout(async () => {
                await sendFrequencyToArduino(0x3, numFreq + 1);
              }, 500);
            }
          }
        }
        else {
          console.log("Error: window.frequenciesArray was not defined for the frequency number", numFreq);
          btnAlertErrorWithTimeout($("#btn-modal-calibrate"), $("#alert-form-calibrate"), "Error: frequenciesArray was not defined for the frequency number " + numFreq, "mt-3");
        }
      }
      else {
        console.log("Recieved more frequencies than desired...");
        btnAlertErrorWithTimeout($("#btn-modal-calibrate"), $("#alert-form-calibrate"), "Se ha recibido más frecuencias que las que se han pedido.", "mt-3 alert-fadeout noDisplay");
      }
    }
  }
  else if (sweepTransmission) {
    let errorCode = (value.getUint8(5) & 0xF0) >> 4;
    let frameType = value.getUint8(5) & 0x0F;
    if (errorCode) {
      //An error happened
      console.log("Error: ", errorCode);
      btnAlertErrorWithTimeout($("#btn-sweep"), $("#alert-sweep"), "Se ha producido un error. Código error: " + errorCode, "mt-3");
      if (errorCode == 0x2) {
        console.log("Fatal error. Dismissing.");
        sweepTransmission = 0;
      }
    }
    else if (frameType == 0x0F) {
      //End of transmission
      console.log("End of sweep transmission");
      sweepTransmission = 0;
      //btnAlertSuccessWithTimeout($("#btn-modal-calibrate"), $("#alert-form-calibrate"), "¡Calibración realizada con éxito! Ahora puedes empezar a recibir datos", "mt-3");
      //btnCustom($("#btn-calibrate"), `Calibrado <svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg>`, "success");
    }
    else {
      //Compute the values
      let I_val =
        ((value.getUint8(2) & 0x0F) << 16) |
        (value.getUint8(1) << 8) |
        value.getUint8(0);
      let Q_val =
        ((value.getUint8(4)) << 12) |
        (value.getUint8(3) << 4) |
        ((value.getUint8(2) & 0xF0) >> 4);

      //Convert the CA2 value to its signed version
      I_val = convertToSigned20Bit(I_val);
      Q_val = convertToSigned20Bit(Q_val);

      let numFreq = (value.getUint8(6));

      if (numFreq < window.frequenciesArray.length) {
        if (window.frequenciesArray[numFreq]) {
          //If the frequenciesArray exists (it should because the user calibrated the device / recieved calibration)
          sweepIndex++;

          //Compute the value according to the calibration parameters
          let I_load_offset = I_val - window.frequenciesArray[numFreq].I_offset;
          let I_cal_real = (I_load_offset / window.frequenciesArray[numFreq].I_coeff) * Math.cos(window.frequenciesArray[numFreq].I_phase_coeff * (Math.PI / 180));
          let I_cal_imag = (I_load_offset / window.frequenciesArray[numFreq].I_coeff) * Math.sin(window.frequenciesArray[numFreq].I_phase_coeff * (Math.PI / 180));

          let Q_load_offset = Q_val - window.frequenciesArray[numFreq].Q_offset;
          let Q_cal_real = (Q_load_offset / window.frequenciesArray[numFreq].Q_coeff) * Math.sin(window.frequenciesArray[numFreq].Q_phase_coeff * (Math.PI / 180));
          let Q_cal_img = (Q_load_offset / window.frequenciesArray[numFreq].Q_coeff) * Math.cos(window.frequenciesArray[numFreq].Q_phase_coeff * (Math.PI / 180));

          const load_real = I_cal_real - Q_cal_real;
          const load_imag = I_cal_imag + Q_cal_img;
          const load_mag = Math.sqrt(load_real ** 2 + load_imag ** 2);
          const load_angle = Math.atan(load_imag / load_real) * 180 / Math.PI;

          window.frequenciesArray[numFreq].avg_real = load_real;
          window.frequenciesArray[numFreq].avg_imag = load_imag;
          window.frequenciesArray[numFreq].avg_mag = load_mag;
          window.frequenciesArray[numFreq].avg_angle = load_angle;

          if (sweepIndex == window.frequenciesArray.length) {
            sweepTransmission = 0;
            console.log("Sweep transmission ended: index=", sweepIndex, " / ", window.frequenciesArray.length);
            btnAlertSuccessWithTimeout($("#btn-sweep"), $("#alert-sweep"), "¡Datos recibitos correctamente! Consulta los resultados en el gráfico.", "mt-3");
            computeGraph();
          }
          else {
            btnLoadingTimeout($("#btn-sweep"), 20000, false, `frecuencia ${sweepIndex + 1}/${window.frequenciesArray.length}`);
            sendFrequencyToArduino(0x4, sweepIndex);
          }

        }
        else {
          console.log("Error: window.frequenciesArray was not defined for the frequency number", numFreq);
          btnAlertErrorWithTimeout($("#btn-sweep"), $("#alert-sweep"), "Error: frequenciesArray was not defined for the frequency number " + numFreq, "mt-3");
        }
      }
      else {
        console.log("Recieved more frequencies than desired...");
        btnAlertErrorWithTimeout($("#btn-sweep"), $("#alert-sweep"), "Se ha recibido más frecuencias que las que se han pedido.", "mt-3 alert-fadeout noDisplay");
      }
    }
  }
  else if (init_cal_transmission) {
    //When connected, the device sends the calibration parameters from the memory to the PC.
    //We have to get them, and calculate the coefficients.
    let freqNum = value.getUint8(6);
    let E_type = ((value.getUint8(5) & 0xF0) >> 4);
    let type = (value.getUint8(5) & 0x0F);

    if (type == 0x01) {
      //Calibration resistance, only once
      let calibResistance =
        ((value.getUint8(2)) << 16) |
        (value.getUint8(1) << 8) |
        (value.getUint8(0));
      console.log("Calib resistance: ", calibResistance);
      if (calibResistance <= 0) {
        console.log("Error: Calibration resistance cannot be <=0.");
        init_cal_transmission = 0;
        setStepError($("#div-connect-step-4"));
        alertError($("#alert-connect-sequence"), `El valor de la resistencia de calibración es erróneo (RCAL=${calibResistance})`);
        $("#btns-commands").fadeIn();
      }
      rcal_calib = calibResistance;
    }
    else if (type == 0x02) {
      //Frequency in terms of registers
      if (!window.frequenciesArray[freqNum]) window.frequenciesArray[freqNum] = {};
      window.frequenciesArray[freqNum].debugVal = value;

      window.frequenciesArray[freqNum].mdiv = ((value.getUint8(1) & 0x03) << 8) | value.getUint8(0);
      window.frequenciesArray[freqNum].ndiv = ((value.getUint8(1) & 0x04) >> 2);
      window.frequenciesArray[freqNum].kdiv = ((value.getUint8(1) & 0x78) >> 3);
      window.frequenciesArray[freqNum].dac_osr = ((value.getUint8(2) & 0x01) << 1) | ((value.getUint8(1) & 0x80) >> 7);
      window.frequenciesArray[freqNum].adc_osr = ((value.getUint8(2) & 0x0E) >> 1);

      window.frequenciesArray[freqNum].generatedFreq = (window.frequenciesArray[freqNum].mdiv * REF_CLK) / ((1 << window.frequenciesArray[freqNum].kdiv) * (1 << (5 + window.frequenciesArray[freqNum].dac_osr)));
      console.log("Got frequency in terms of registers: \nmdiv: ", window.frequenciesArray[freqNum].mdiv, "\nndiv: ", window.frequenciesArray[freqNum].ndiv, "\nkdiv: ", window.frequenciesArray[freqNum].kdiv, "\ndac: ", window.frequenciesArray[freqNum].dac_osr, "\nadc: ", window.frequenciesArray[freqNum].adc_osr, "\nGenerated frequency: ", window.frequenciesArray[freqNum].generatedFreq / 1e3, " kHz");
    }
    else if (type == 0x03 || type == 0x04 || type == 0x05) {
      let I_val =
        ((value.getUint8(2) & 0x0F) << 16) |
        (value.getUint8(1) << 8) |
        value.getUint8(0);
      let Q_val =
        ((value.getUint8(4)) << 12) |
        (value.getUint8(3) << 4) |
        ((value.getUint8(2) & 0xF0) >> 4);

      I_val = convertToSigned20Bit(I_val);
      Q_val = convertToSigned20Bit(Q_val);

      if (type == 0x03) {
        window.frequenciesArray[freqNum].I_offset = I_val;
        window.frequenciesArray[freqNum].Q_offset = Q_val;
      }
      else if (type == 0x04) {
        window.frequenciesArray[freqNum].I_rcal_in = I_val;
        window.frequenciesArray[freqNum].Q_rcal_in = Q_val;
      }
      else if (type == 0x05) {
        window.frequenciesArray[freqNum].I_rcal_quad = I_val;
        window.frequenciesArray[freqNum].Q_rcal_quad = Q_val;
        calculateCalibValues(freqNum, rcal_calib);
      }
      else {
        console.log("Unknown type on calib init: ", type);
      }
    }
  }
  else {
    console.log("Error: Recieved data from handle calibration witout asking for it...");
  }
}

async function sendFrequencyToArduino(type, index) {
  var element = window.frequenciesArray[index];
  if (element) {
    let valueSendFreqCalib = new Uint8Array([
      ((type) << 4) | ((element.adc_osr & 0x7) << 1) | ((element.dac_osr >> 1) & 0x01),
      ((element.dac_osr & 0x01) << 7) | ((element.kdiv & 0xF) << 3) | ((element.ndiv & 0x01) << 2) | ((element.mdiv & 0x300) >> 8),
      element.mdiv & 0xFF
    ]);
    console.log("Sending", element, valueSendFreqCalib);
    await characteristicWrite.writeValue(valueSendFreqCalib);
    return (1);
  }
  else {
    return (0);
  }

}

function handleCommand(event) {
  let value = event.target.value;
  console.log(value);

  // Read data as little-endian 3-byte values
  //for (let i = 0; i < value.byteLength; i += 3) {}
  let tag = (value.getUint8(2) & 0xF0) >> 4; // Store MSB in tag
  //console.log("Value: ", value.getUint8(i + 2).toString(16), " Tag: ", tag.toString(16));
  let numValue =
    (((value.getUint8(2) & 0x0F) << 16) | // MSB
      (value.getUint8(1) << 8) |  // Middle byte
      (value.getUint8(0)));           // LSB

  let hexValue =
    ('00' + value.getUint8(2).toString(16)).slice(-2) + ' ' +
    ('00' + value.getUint8(1).toString(16)).slice(-2) + ' ' +
    ('00' + value.getUint8(0).toString(16)).slice(-2);
  console.log("Hex value: ", hexValue);

  if (tag == 1 || tag == 2) {
    //Recieved a resistance value from the device
    checkSum += numValue;
    console.log('> BioZ tag ' + tag.toString(16) + '   0x ' + hexValue + ' | 0x' + checkSum.toString(16).toUpperCase());

    //numValue *= 0.00662128426020951; // Multiply by Ohm/count

    numValue = convertToSigned20Bit(numValue);

    if (tag == 1) {
      //Phase
      if (!window.calibratedValues[totalTag1]) window.calibratedValues[totalTag1] = {};
      window.calibratedValues[totalTag1].value = numValue;
      if (window.frequenciesArray.length > 0) {
        window.calibratedValues[totalTag1].I_load_offset = numValue - window.frequenciesArray[sweepIndex].I_offset;
        window.calibratedValues[totalTag1].I_cal_real = (window.calibratedValues[totalTag1].I_load_offset / window.frequenciesArray[sweepIndex].I_coeff) * Math.cos(window.frequenciesArray[sweepIndex].I_phase_coeff * (Math.PI / 180));
        window.calibratedValues[totalTag1].I_cal_imag = (window.calibratedValues[totalTag1].I_load_offset / window.frequenciesArray[sweepIndex].I_coeff) * Math.sin(window.frequenciesArray[sweepIndex].I_phase_coeff * (Math.PI / 180));
        window.calibratedValues[totalTag1].computedI = 1;
      }
      else window.calibratedValues[totalTag1].computedI = 0;


      //updateChartData(0, numValue);
      totalTag1++;

    }
    else if (tag == 2) {
      //Quadrature
      if (!window.calibratedValues[totalTag2]) window.calibratedValues[totalTag2] = {};
      window.calibratedValues[totalTag2].value = numValue;
      if (window.frequenciesArray.length > 0) {
        window.calibratedValues[totalTag2].Q_load_offset = numValue - window.frequenciesArray[sweepIndex].Q_offset;
        window.calibratedValues[totalTag2].Q_cal_real = (window.calibratedValues[totalTag2].Q_load_offset / window.frequenciesArray[sweepIndex].Q_coeff) * Math.sin(window.frequenciesArray[sweepIndex].Q_phase_coeff * (Math.PI / 180));
        window.calibratedValues[totalTag2].Q_cal_img = (window.calibratedValues[totalTag2].Q_load_offset / window.frequenciesArray[sweepIndex].Q_coeff) * Math.cos(window.frequenciesArray[sweepIndex].Q_phase_coeff * (Math.PI / 180));
        window.calibratedValues[totalTag2].computedQ = 1;
      }
      else window.calibratedValues[totalTag2].computedQ = 0;
      //updateChartData(1, numValue);

      totalTag2++;

    }
    //console.log("Update: ", totalTag1, totalTag2, Math.max(totalTag1, totalTag2));
  }
  else if (tag == 0) {
    if ((value.getUint8(2) & 0x0F) == 0x0F && (value.getUint8(1)) == 0xFF && (value.getUint8(0)) == 0xFF) {
      //Checking if the sum is equal in both parts
      console.log('> Chks tag ' + tag.toString(10) + '   0x ' + hexValue);
      console.log("Sending checkSum", checkSum.toString(16).toUpperCase());

      let checkSum_send = new Uint8Array([
        (checkSum >> 16) & 0xFF, // MSB (Most Significant Byte)
        (checkSum >> 8) & 0xFF,  // Middle Byte
        checkSum & 0xFF          // LSB (Least Significant Byte)
      ]);
      characteristicWrite.writeValue(checkSum_send);
    }
    else {
      console.log('> 0 tag ' + tag.toString(10) + '   0x ' + hexValue);
    }
  }
  else if (tag == 5) {
    let type = (value.getUint8(2) & 0x0C) >> 2,
      cal = (value.getUint8(2) & 0x03),
      nb_cal = value.getUint8(0),
      MAX3009_SUCCESS = (value.getUint8(1) & 0x01),
      EEPROM_SUCCESS = ((value.getUint8(1) & 0x02) >> 1);
    console.log('> INIT_CONNECTION tag ' + tag.toString(10) + ', 0x ' + hexValue, type, cal, nb_cal);
    if (type == 0) {
      setStepOK($("#div-connect-step-2"));
      if (!MAX3009_SUCCESS) {
        setStepError($("#div-connect-step-3"));
        alertError($("#alert-connect-sequence"), "No se ha podido comunicar con el chip MAX3009.");
        if (debugMode) {
          $("#btns-commands").fadeIn();
        }
      }
      else {
        if (!EEPROM_SUCCESS) {
          setStepError($("#div-connect-step-3"));
        }
        else {
          setStepOK($("#div-connect-step-3"));
        }
        switch (cal) {
          case 0:
            //No calibration values were found
            setStepErrorFile($("#div-connect-step-4"));

            if (!EEPROM_SUCCESS) {
              alertInfo($("#alert-connect-sequence"), "La memoria no está activada en el dispositivo. Calibralo antes de usarlo.");
            }
            else {
              alertInfo($("#alert-connect-sequence"), "No se han encontrado datos en la memoria. Calibra el dispositivo antes de realizar medidas.");
            }

            $("#card-success-calib").fadeOut();
            btnCustom($("#btn-calibrate"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm320 96c0-26.9-16.5-49.9-40-59.3V88c0-13.3-10.7-24-24-24s-24 10.7-24 24V292.7c-23.5 9.5-40 32.5-40 59.3c0 35.3 28.7 64 64 64s64-28.7 64-64zM144 176a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-16 80a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM400 144a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>`, "success shadow");

            if (debugMode) {
              $("#col-sweep").css("display", "block");
            }
            else {
              $("#col-sweep").fadeOut();
            }

            $("#btns-commands").fadeIn();
            break;
          case 1:
            //calibration values were found
            init_cal_transmission = 1;
            console.log("Found ", nb_cal, "calibration values");
            setStepSpinner($("#div-connect-step-4"));
            break;
          case 2:
            //Calibration success byte was low
            //Which means calibration data is corrupted
            //Or the last calibration sequence did not finish successfully
            setStepError($("#div-connect-step-4"));
            alertError($("#alert-connect-sequence"), "Los datos guardados en la memoria no son válidos. Calibra de nuevo el dispositivo.");
            $("#card-success-calib").fadeOut();
            btnCustom($("#btn-calibrate"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm320 96c0-26.9-16.5-49.9-40-59.3V88c0-13.3-10.7-24-24-24s-24 10.7-24 24V292.7c-23.5 9.5-40 32.5-40 59.3c0 35.3 28.7 64 64 64s64-28.7 64-64zM144 176a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-16 80a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM400 144a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>`, "success shadow");
            $("#btns-commands").fadeIn();

            if (debugMode) {
              $("#col-sweep").css("display", "block");
            }
            else {
              $("#col-sweep").fadeOut();
            }
            break;
          default:
            //An error happened, and the device needs to be recalibrated
            setStepError($("#div-connect-step-4"));
            alertError($("#alert-connect-sequence"), "Se ha producido un error. El dispositivo necesita calibrarse de nuevo.");
            $("#btns-commands").fadeIn();
            if (debugMode) {
              $("#col-sweep").css("display", "block");
            }
            else {
              $("#col-sweep").fadeOut();
            }
            break;
        }
      }
    }
    else if (type == 0x3) {
      //Send calib values on init END
      // END sequence
      if (init_cal_transmission) {
        console.log("Init cal transmission END");
        init_cal_transmission = 0;
        setStepOK($("#div-connect-step-4"));
        $("#col-sweep").css("display", "block");
        enableCalibDownload();
        $("#btns-commands").fadeIn();
        $("#alert-connect-sequence").fadeOut();
      }


    }

    /*if ((value.getUint8(2) & 0x0F) == 1 && (value.getUint8(0) & 0x0F) == 1) {
      //Error on power on. The arduino did not continue
      btnAlertErrorWithTimeout($("#btn-send-recieve"), $("#alert-send-recieve"), "No se ha podido encender la captura de datos (power on failed)", "mt-3 alert-fadeout noDisplay");
    }*/
  }
  else if (tag == 13) {
    console.log('> ERROR_ tag ' + tag.toString(10) + '   0x ' + hexValue, numValue);
    if ((value.getUint8(2) & 0x0F) == 1 && (value.getUint8(0) & 0x0F) == 1) {
      //Error on power on. The arduino did not continue
      btnAlertErrorWithTimeout($("#btn-send-recieve"), $("#alert-send-recieve"), "No se ha podido encender la captura de datos (power on failed)", "mt-3 alert-fadeout noDisplay");
    }
    else if ((value.getUint8(2) & 0x0F) == 0x2) {
      //SPI error
      if ((value.getUint8(0) & 0x0F) == 1) {
        alertError($("#alert-calibrate"), "Una transmisión SPI al chip MAX3009 no se ha realizado correctamente. ");
        alertError($("#alert-form-calibrate"), "Una transmisión SPI al chip MAX3009 no se ha realizado correctamente. ");
      }
    }
    else if ((value.getUint8(2) & 0x0F) == 0xC) {
      //Error on calibration. Checking individual values
      switch (value.getUint8(0)) {
        case 0x01:
          btnAlertErrorWithTimeout($("#btn-modal-calibrate"), $("#alert-form-calibrate"), "Calibration error. Code 1: Recieved a calibration value without asking for it. Check the system logs and/or contact support for more information.", 3000);
          break;
        case 0x02:
          btnAlertErrorWithTimeout($("#btn-modal-calibrate"), $("#alert-form-calibrate"), "Calibration error. Code 1: Recieved more frequencies than expected. Check the system logs and/or contact support for more information.", 3000);
          break;
        default:
          break;
      }
      /*if (value.getUint8(0) == 0x01) {

      }*/
    }
  }
  else if (tag == 14) {
    console.log('> END_ tag ' + tag.toString(10) + '   0x ' + hexValue);
    console.log("TRANSMISSION END");
    if (numValue == 1) {
      computeGraph("singleTransmission");
      btnAuto($("#btn-send-recieve"), "success");
    }
    if ((numValue & 0x00F00) >> 8 == 0xD) {
      //Recieved sweep transmission END
      let numberOfFreqRecieved = numValue & 0x000FF;
      console.log("Recieved frequency number", numberOfFreqRecieved);

      if (numberOfFreqRecieved != sweepIndex) {
        console.log("Error: The number of freq recieved does not correspond to the sweep index. ", numberOfFreqRecieved, sweepIndex);
      }
      else {
        sweepIndex++;
        var avg_real = 0, avg_imag = 0, avg_mag = 0, avg_angle = 0;
        let indexFor = 0;
        //Compute the calibration parameters
        for (const singleValueCalib of window.calibratedValues) {
          if (singleValueCalib && singleValueCalib.computedI && singleValueCalib.computedQ) {
            indexFor++;
            const load_real = singleValueCalib.I_cal_real - singleValueCalib.Q_cal_real;
            const load_imag = singleValueCalib.I_cal_imag + singleValueCalib.Q_cal_img;
            const load_mag = Math.sqrt(load_real ** 2 + load_imag ** 2);
            const load_angle = Math.atan(load_imag / load_real) * 180 / Math.PI;

            if (indexFor == 1) {
              avg_real = load_real;
              avg_imag = load_imag;
              avg_mag = load_mag;
              avg_angle = load_angle;
            }
            else {
              avg_real = (avg_real * (indexFor - 1) / indexFor) + (load_real / indexFor);
              avg_imag = (avg_imag * (indexFor - 1) / indexFor) + (load_imag / indexFor);
              avg_mag = (avg_mag * (indexFor - 1) / indexFor) + (load_mag / indexFor);
              avg_angle = (avg_angle * (indexFor - 1) / indexFor) + (load_angle / indexFor);
            }

          }
        }
        window.frequenciesArray[sweepIndex - 1].avg_real = avg_real;
        window.frequenciesArray[sweepIndex - 1].avg_imag = avg_imag;
        window.frequenciesArray[sweepIndex - 1].avg_mag = avg_mag;
        window.frequenciesArray[sweepIndex - 1].avg_angle = avg_angle;
        window.calibratedValues = [];
        totalTag1 = 0;
        totalTag2 = 0;
        if (sweepIndex == window.frequenciesArray.length) {
          sweepTransmission = 0;
          console.log("Sweep transmission ended: index=", sweepIndex, " / ", window.frequenciesArray.length);
          btnAlertSuccessWithTimeout($("#btn-sweep"), $("#alert-sweep"), "¡Datos recibidos correctamente! Consulta los resultados en el gráfico.", "mt-3");
          computeGraph();
        }
        else {
          totalTag1 = 0;
          totalTag2 = 0;
          btnLoadingTimeout($("#btn-sweep"), 20000, false, `frecuencia ${sweepIndex + 1}/${window.frequenciesArray.length}`);
          sendFrequencyToArduino(0x4, sweepIndex);
        }

      }
    }
  }
  else {
    console.log('> UNDF tag ' + tag.toString(10) + '   0x ' + hexValue);

  }
}

function computeGraph(option) {
  deleteChartData();
  window.chartPhase.options.scales.x.grid.display = true;
  window.chartPhase.options.scales.x.display = true;
  window.chartPhase.data.datasets[0].label = "Magnitude";

  window.chartQuadrature.options.scales.x.grid.display = true;
  window.chartQuadrature.options.scales.x.display = true;
  window.chartPhase.data.datasets[1].label = "Angle (º)";

  if (option == "singleTransmission") {
    var indexChart = 0;
    console.log("Calibrated values: ", window.calibratedValues);
    for (const singleValueSweep of window.calibratedValues) {
      if (indexChart < totalTag1 - 1) {
        if (window.chartPhase.data.datasets.length > 0) {
          //If the chart has at least one dataset
          window.chartPhase.data.labels.push(indexChart);
          window.chartPhase.data.datasets[0].data.push(singleValueSweep.value);
        }
        if (window.chartQuadrature.data.datasets.length > 0) {
          //If the chart has at least one dataset
          window.chartQuadrature.data.labels.push(indexChart);
          window.chartQuadrature.data.datasets[0].data.push(singleValueSweep.value);
        }
      }
      indexChart++;
    }
  }
  else {
    for (const singleValueSweep of window.frequenciesArray) {
      if (window.chartPhase.data.datasets.length > 0) {
        //If the chart has at least one dataset
        window.chartPhase.data.labels.push(singleValueSweep.generatedFreq / 1e3 + " kHz");
        window.chartPhase.data.datasets[0].data.push(singleValueSweep.avg_mag);
      }
      if (window.chartQuadrature.data.datasets.length > 0) {
        //If the chart has at least one dataset
        window.chartQuadrature.data.labels.push(singleValueSweep.generatedFreq / 1e3 + " kHz");
        window.chartQuadrature.data.datasets[0].data.push(singleValueSweep.avg_angle);
      }

    }
  }


  window.chartPhase.update();
  window.chartQuadrature.update();
}

function onDisconnected(event) {
  // Object event.target is Bluetooth Device getting disconnected.
  console.log('> Bluetooth Device disconnected');
  $("#row-connect-sequence").fadeOut();
  btnCustom($("#btn-connect-arduino"), "Conectarse", "primary", true, true, true);
  $("#btn-connect-arduino").attr("purpose", "connect");
  $("#btns-commands").fadeOut();
  bluetoothDevice = null;
}

function createChartBioZ() {

  var chartElevation = document.getElementById('chartPhaseCanvas').getContext('2d');

  window.chartPhase = new Chart(chartElevation, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          //Tag 0001
          label: 'In phase',
          data: [],
          borderColor: '#4e73df',
          backgroundColor: '#4e73df',
          yAxisId: 'phase'
        },
        {
          //Tag 0010
          label: 'In quadrature',
          data: [],
          borderColor: '#b30808',
          backgroundColor: '#b30808',
          yAxisId: 'quadrature'
        },
      ]
    },
    options: {
      fill: false,
      radius: 0,
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks:
          {
            beginAtZero: false,
            //color: 'red' 
          },
          grid: { display: false }
        },
        x: {
          display: false, //this will remove all the x-axis grid lines
          grid: {
            display: false
          }
          /*ticks: {
            display: false //this will remove only the label
          }*/
        }
      },
      plugins: {
        legend: {
          position: 'top',
          //display: false
        },
        title: {
          display: true,
          text: 'BioZ Measured'
        }
      }
    },
  });

  var chartElevationQuadrature = document.getElementById('chartQuadratureCanvas').getContext('2d');

  window.chartQuadrature = new Chart(chartElevationQuadrature, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          //Tag 0010
          label: 'In quadrature',
          data: [],
          borderColor: '#b30808',
          backgroundColor: '#b30808',
          yAxisId: 'quadrature'
        },
      ]
    },
    options: {
      fill: false,
      radius: 0,
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks:
          {
            beginAtZero: false,
            //color: 'red' 
          },
          grid: { display: false }
        },
        x: {
          display: false, //this will remove all the x-axis grid lines
          grid: {
            display: false
          }
          /*ticks: {
            display: false //this will remove only the label
          }*/
        }
      },
      plugins: {
        legend: {
          //position: 'top',
          display: false
        },
      }
    },
  });
}


function updateChartData(datasetNum, value) {
  let data;
  if (datasetNum) {
    data = window.chartQuadrature.data;
  }
  else {
    data = window.chartPhase.data;
  }

  if (data.datasets.length > 0) {
    //If the chart has at least one dataset
    data.labels.push(totalTag1);
    data.datasets[0].data.push(value);
  }
}

function deleteChartData() {
  console.log("Delete chart data");
  if (window.chartPhase) {
    const dataI = window.chartPhase.data;
    if (dataI.datasets.length > 0) {
      //If Fthe chart has at least one dataset
      dataI.labels = [];
      dataI.datasets.forEach(dataset => {
        dataset.data = [];
      });
      window.chartPhase.update();
    }
  }
  if (window.chartQuadrature) {
    const dataQ = window.chartQuadrature.data;
    if (dataQ.datasets.length > 0) {
      //If the chart has at least one dataset
      dataQ.labels = [];
      dataQ.datasets.forEach(dataset => {
        dataset.data = [];
      });
      window.chartQuadrature.update();
    }
  }
}

/*async function connect() {
  console.log('Connecting to Bluetooth Device...');
  await bluetoothDevice.gatt.connect();
  console.log('> Bluetooth Device connected');
}

/*function onReconnectButtonClick() {
  if (!bluetoothDevice) {
    return;
  }
  if (bluetoothDevice.gatt.connected) {
    console.log('> Bluetooth Device is already connected');
    return;
  }
  try {
    connect();
  } catch (error) {
    console.log('Argh! ' + error);
  }
}*/
function returnHTMLRowCalib(id, index, value, options) {
  const svgTrash = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"></path></svg>`;
  var txtHTML = `<tr><td><div class="input-group"><input class="form-control" inputfrequency-${id}="${index}" value="${value}" type="number" max="800" step="0.001" min="1" /><span class="input-group-text">kHz</span></div></td><td><button removefeature-${id}="${index}" class="btn btn-danger" type="button">${svgTrash}</button></td>`;
  if (id == "sweep") {
    if (!options) options = { calibrated: true };
    const svgcheck = `<svg class="text-success" style="${options.calibrated ? "" : "display:none;"}font-size: 30px;" svgcheck-${id}="${index}" xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path></svg>`;
    const svgcrossmark = `<svg class="text-warning" style="${options.calibrated ? "display:none;" : ""}font-size: 30px;" svgcrossmark-${id}="${index}" xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm79 143c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"></path></svg>`;
    txtHTML += `<td class="text-center">${svgcheck}${svgcrossmark}</td>`;
  }
  txtHTML += `</tr>`;
  return txtHTML;
}


function convertToSigned20Bit(val) {
  // If the sign bit (bit 19) is set
  if (val & 0x80000) {
    // Convert to negative value
    val = val - 0x100000;
  }
  return val;
}

function enableCalibDownload() {
  btnCustom($("#btn-calibrate"), `Calibrado <svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg>`, "success");
  $("#card-success-calib").fadeIn();
  $("#btn-save-calib").unbind().click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    var blob = new Blob([JSON.stringify(window.frequenciesArray)], { type: "application/json;charset=utf-8" });
    saveAs(blob, "calibration.json");
  });
}
function calculateCalibValues(numFreq, rcal_calculate) {
  window.frequenciesArray[numFreq].I_cal_in = window.frequenciesArray[numFreq].I_rcal_in - window.frequenciesArray[numFreq].I_offset;
  window.frequenciesArray[numFreq].Q_cal_in = window.frequenciesArray[numFreq].Q_rcal_in - window.frequenciesArray[numFreq].Q_offset;
  window.frequenciesArray[numFreq].I_cal_quad = window.frequenciesArray[numFreq].I_rcal_quad - window.frequenciesArray[numFreq].I_offset;
  window.frequenciesArray[numFreq].Q_cal_quad = window.frequenciesArray[numFreq].Q_rcal_quad - window.frequenciesArray[numFreq].Q_offset;

  window.frequenciesArray[numFreq].I_coeff = Math.sqrt((window.frequenciesArray[numFreq].I_cal_in ** 2) + (window.frequenciesArray[numFreq].I_cal_quad ** 2)) / rcal_calculate;
  window.frequenciesArray[numFreq].Q_coeff = Math.sqrt((window.frequenciesArray[numFreq].Q_cal_in ** 2) + (window.frequenciesArray[numFreq].Q_cal_quad ** 2)) / rcal_calculate;

  window.frequenciesArray[numFreq].I_phase_coeff = Math.atan(window.frequenciesArray[numFreq].I_cal_quad / window.frequenciesArray[numFreq].I_cal_in) * 180 / Math.PI;
  window.frequenciesArray[numFreq].Q_phase_coeff = Math.atan(-window.frequenciesArray[numFreq].Q_cal_quad / -window.frequenciesArray[numFreq].Q_cal_in) * 180 / Math.PI;
}

function setStepSpinner(div) {
  div.html("<span class='spinner-border' role='status'></span>");
  div.parent().css("background", "var(--bs-dark-text-emphasis)");
}
function setStepOK(div) {
  div.html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg>`);
  div.parent().css("background", "var(--bs-success)");
}
function setStepError(div) {
  div.html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>`);
  div.parent().css("background", "var(--bs-danger)");
}
function setStepErrorFile(div) {
  div.html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -32 576 576" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384v38.6C310.1 219.5 256 287.4 256 368c0 59.1 29.1 111.3 73.7 143.3c-3.2 .5-6.4 .7-9.7 .7H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128zm48 96a144 144 0 1 1 0 288 144 144 0 1 1 0-288zm0 240a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm0-192c-8.8 0-16 7.2-16 16v80c0 8.8 7.2 16 16 16s16-7.2 16-16V288c0-8.8-7.2-16-16-16z"></path></svg>`);
  div.parent().css("background", "var(--bs-orange)");
}
function setStepWait(div) {
  div.html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-64 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M0 32C0 14.3 14.3 0 32 0H64 320h32c17.7 0 32 14.3 32 32s-14.3 32-32 32V75c0 42.4-16.9 83.1-46.9 113.1L237.3 256l67.9 67.9c30 30 46.9 70.7 46.9 113.1v11c17.7 0 32 14.3 32 32s-14.3 32-32 32H320 64 32c-17.7 0-32-14.3-32-32s14.3-32 32-32V437c0-42.4 16.9-83.1 46.9-113.1L146.7 256 78.9 188.1C48.9 158.1 32 117.4 32 75V64C14.3 64 0 49.7 0 32zM96 64V75c0 25.5 10.1 49.9 28.1 67.9L192 210.7l67.9-67.9c18-18 28.1-42.4 28.1-67.9V64H96zm0 384H288V437c0-25.5-10.1-49.9-28.1-67.9L192 301.3l-67.9 67.9c-18 18-28.1 42.4-28.1 67.9v11z"></path></svg>`);
  div.parent().css("background", "var(--bs-dark-bg-subtle)");
}