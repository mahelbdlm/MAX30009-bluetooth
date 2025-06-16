export function btnLoading(btn, btnBlock, btnSubmit, custom) {
  // Btn loading: (button, Is button block?, Is btn-submit?)
  btn.removeClass().addClass(`btn btn-dark${btnSubmit ? " btn-submit" : ""}${btnBlock ? " d-block w-100" : ""}${custom ? " " + custom : ""}`).attr('disabled', 'disabled').html(`Loading <span role="status" class="spinner-border spinner-border-sm"></span>`);
}
export function btnLoadingMini(btn, btnBlock, btnSubmit, custom) {
  // Btn loading: (button, Is button block?, Is btn-submit?)
  btn.removeClass().addClass(`btn btn-dark${btnSubmit ? " btn-submit" : ""}${btnBlock ? " d-block w-100" : ""}${custom ? " " + custom : ""}`).attr('disabled', 'disabled').html(`<span role="status" class="spinner-border spinner-border-sm"></span>`);
}
export function btnSuccess(btn, btnText, btnBlock, btnSubmit, custom) {
  btn.removeClass().addClass(`btn btn-success${btnSubmit ? " btn-submit" : ""}${btnBlock ? " d-block w-100" : ""}${custom ? " " + custom : ""}`).removeAttr("disabled").html(`<i class="fas fa-check"></i><strong> ${btnText}</strong>`);
}
export function btnWarning(btn, btnText, btnBlock, btnSubmit, custom) {
  btn.removeClass().addClass(`btn btn-warning text-white${btnSubmit ? " btn-submit" : ""}${btnBlock ? " d-block w-100" : ""}${custom ? " " + custom : ""}`).removeAttr("disabled").html(`<i class="fas fa-exclamation-circle"></i><strong> ${btnText}</strong>`);
}
export function btnDanger(btn, btnText, btnBlock, btnSubmit, custom) {
  btn.removeClass().addClass(`btn btn-danger${btnSubmit ? " btn-submit" : ""}${btnBlock ? " d-block w-100" : ""}${custom ? " " + custom : ""}`).removeAttr("disabled").html(`<i class="fas fa-exclamation-triangle"></i> ${btnText}`);
}
export function btnCustom(btn, btnText, btnStyle, btnBlock, btnSubmit, removeDisabled) {
  // Btn loading: (button, Is button block?, Is btn-submit?)
  btnClearTimeout(btn);
  btn.removeClass().addClass(`btn btn-${btnStyle}${btnSubmit ? " btn-submit" : ""}${btnBlock ? " d-block w-100" : ""}`).html(btnText);
  if (removeDisabled) { btn.removeAttr("disabled") }
}
export function alertSuccess(alert, alertText) {
  alert.removeClass().addClass("alert alert-success text-center noDisplay").html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg><strong> ${alertText}</strong>`).fadeIn(300);
}
export function alertWarning(alert, alertText) {
  alert.removeClass().addClass("alert alert-warning text-center").html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg><strong> ${alertText}</strong>`).fadeIn(300);
}
export function alertError(alert, alertText) {
  alert.removeClass().addClass("alert alert-danger text-center").html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg><strong> ${alertText}</strong>`).fadeIn(300);
}
export function alertInfo(alert, alertText) {
  alert.removeClass().addClass("alert alert-info text-center").html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"></path></svg><strong> ${alertText}</strong>`).fadeIn(300);
}
export function alertCustom(alert, alertText, alertStyle) {
  alert.removeClass().addClass(`alert alert-${alertStyle} text-center`).html(alertText).fadeIn(300);
}
export function btnAlertSuccess(btn, btnText, alert, alertText, btnBlock, btnSubmit, custom) {
  alertSuccess(alert, alertText)
  btnSuccess(btn, btnText, btnBlock, btnSubmit, custom);
}
export function btnAlertWarning(btn, btnText, alert, alertText, btnBlock, btnSubmit, custom) {
  alertWarning(alert, alertText);
  btnWarning(btn, btnText, btnBlock, btnSubmit, custom);
}
export function btnAlertError(btn, btnText, alert, alertText, btnBlock, btnSubmit, custom) {
  alertError(alert, alertText);
  btnDanger(btn, btnText, btnBlock, btnSubmit, custom);
}

export function btnClearTimeout(btn) {
  if (window.btnLoading && window.btnLoading[btn.attr("id")]) {
    clearTimeout(window.btnLoading[btn.attr("id")].timeout);
    delete window.btnLoading[btn.attr("id")];
  }

  if (window.timeout && window.timeout[btn.attr("id")]) {
    clearTimeout(window.timeout[btn.attr("id")].timeout);
    delete window.timeout[btn.attr("id")];
  }
}

export function btnLoadingTimeout(btn, timeout, mini, customText) {
  // Btn loading: (button, Is button block?, Is btn-submit?)
  const btnId = btn.attr("id");
  if (!timeout) timeout = 10000;
  if (!window.timeout) window.timeout = [];
  var optionsBtnLoading;
  var btnClass;

  if (window.timeout && window.timeout[btnId]) {
    //console.log(window.timeout[btnId]);
    optionsBtnLoading = window.timeout[btnId];
    clearTimeout(window.timeout[btnId].timeout);
    delete window.timeout[btnId].timeout;
    btnClass = optionsBtnLoading;
  }
  else {
    optionsBtnLoading = {
      class: btn.attr("class"),
      type: btn.attr("type"),
      content: btn.html()
    };
  }
  optionsBtnLoading.timeout = setTimeout(() => {
    btnAuto(btn, mini ? "timeoutmini" : "timeout", 10000);
  }, timeout);
  window.timeout[btn.attr("id")] = optionsBtnLoading;

  var remainingClass = "";
  let classList = btn.attr("class").split(" ");
  let alertIndex = classList.findIndex(cls => cls.startsWith("btn-") && cls !== "btn");

  if (alertIndex !== -1) {
    remainingClass = classList.slice(alertIndex + 1).join(" ");
  }

  btn.removeClass().addClass(`btn btn-dark${optionsBtnLoading.class.includes("btn-submit") ? " btn-submit" : ""}${optionsBtnLoading.class.includes("w-100") ? " d-block w-100" : ""}${remainingClass}`).attr('disabled', 'disabled').html(`${mini ? "" : customText ? customText : "Cargando"} <span role="status" class="spinner-border spinner-border-sm"></span>`);
}

export function btnAlertWarningWithTimeout(btn, alert, alertText, alertCustom, btnTimeout) {
  alert.removeClass().addClass(`alert alert-warning text-center ${alertCustom}`).html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg><strong> ${alertText}</strong>`).fadeIn(300);
  btnAuto(btn, "warning", btnTimeout);
}

export function btnAlertErrorWithTimeout(btn, alert, alertText, alertCustom, btnTimeout) {
  alert.removeClass().addClass(`alert alert-danger text-center ${alertCustom}`).html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg><strong> ${alertText}</strong>`).fadeIn(300);
  btnAuto(btn, "danger", btnTimeout);
}

export function btnAlertSuccessWithTimeout(btn, alert, alertText, alertCustom, btnTimeout) {
  alert.removeClass().addClass(`alert alert-success text-center ${alertCustom}`).html(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg><strong> ${alertText}</strong>`).fadeIn(300);
  btnAuto(btn, "success", btnTimeout);
}

export function btnAuto(btn, type, timeout, customText, custom) {
  const svgTimeout = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"></path></svg>`;
  var svgContent = "", btnNewClassType = "";
  switch (type) {
    case "success":
      btnNewClassType = "success"
      svgContent = `${customText ? customText : ""} <svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg>`;
      break;
    case "warning":
      btnNewClassType = "warning";
      svgContent = `${customText ? customText : ""} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="white"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>`;
      break;
    case "danger":
      btnNewClassType = "danger";
      svgContent = `${customText ? customText : ""} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>`;
      break;
    case "timeout":
      btnNewClassType = "danger";
      svgContent = `Request Timeout ${svgTimeout}`;
      break;
    case "timeoutmini":
      btnNewClassType = "danger";
      svgContent = svgTimeout;
      break;
    default:
      btnNewClassType = "danger";
      svgContent = type;
      break;
  }
  if (!window.timeout) window.timeout = [];
  const btnId = btn.attr("id");
  var btnClass, btnType, btnContent;

  if (window.timeout[btnId]) {
    btnClass = window.timeout[btnId].class;
    btnType = window.timeout[btnId].type;
    btnContent = window.timeout[btnId].content;
    clearTimeout(window.timeout[btnId].timeout);
    //delete window.btnLoading[btnId];  
  }
  else {
    btnClass = btn.attr("class");
    btnType = btn.attr("type");
    btnContent = btn.html();
  }

  var remainingClass = "";
  let classList = btnClass.split(" ");
  let alertIndex = classList.findIndex(cls => cls.startsWith("btn-") && cls !== "btn");

  if (alertIndex !== -1) {
    remainingClass = classList.slice(alertIndex + 1).join(" ");
  }

  btn.removeClass().addClass(`btn btn-${btnNewClassType} ${remainingClass ? remainingClass : ""}`).removeAttr("disabled").html(svgContent);

  if(custom && custom.disabled){
    btn.attr("disabled", "disabled");
  }

  var optionsBtnTimeout;
  if (!window.timeout[btn.attr("id")]) {
    optionsBtnTimeout = {
      class: btnClass,
      type: btnType,
      content: btnContent,
    }
  }
  else {
    optionsBtnTimeout = window.timeout[btnId];
  }

  if (timeout != -1) {
    optionsBtnTimeout.timeout = setTimeout(() => {
      btn.removeClass().addClass(btnClass);
      if (btnType) btn.attr("type", btnType);
      btn.html(btnContent);
      delete window.timeout[btn.attr("id")];
    }, timeout ? timeout : 2000);
    window.timeout[btn.attr("id")] = optionsBtnTimeout;
  }


}

export const REF_CLK = 32.768e3;

export function enableFormCalculateFreq() {
  $("#form-calculate-freq").unbind().submit(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let btn = $("#form-calculate-freq button"), alertForm = $("#alert-modal-freq"),
      value = Number($("#form-calculate-freq input[name='valueFreq']").val()) * 1e3,
      minsps = Number($("#form-calculate-freq input[name='minsps']").val()),
      maxsps = Number($("#form-calculate-freq input[name='maxsps']").val());
    alertForm.fadeOut();
    console.log("Value: ", value, ", minsps: ", minsps, ", maxsps: ", maxsps);

    var calcul = returnFreqParams(value, minsps, maxsps);
    if (calcul.success) {
      $("[tablefreq='mdiv']").html(calcul.mdiv);
      $("[tablefreq='ndiv']").html(calcul.ndiv);
      $("[tablefreq='kdiv']").html(calcul.kdiv);
      $("[tablefreq='dacosr']").html(calcul.dac_osr);
      $("[tablefreq='adcosr']").html(calcul.adc_osr);
      $("[tablefreq='freqtot']").html(calcul.generatedFreq / 1e3 + " KHz");
      $("[tablefreq='freqsample']").html('<select id="select-freqspr" class="form-select" style="width: 70%;"></select>');
    }
    else {
      btnAlertErrorWithTimeout(btn, alertForm, calcul.errorMsg, 3000);
    }



    var txtSelect = "";
    for (let i = 0; i < calcul.sampleRateSelectCount; i++) {
      txtSelect += `<option value="${i}">${calcul.sampleRateSelect[i].sampleRate}</option>`;
    }
    $("#select-freqspr").html(txtSelect);

    $("#select-freqspr").unbind().change(function () {
      var newValue = $(this).val();
      console.log("New value: ", newValue);
      $("[tablefreq='adcosr']").html(calcul.sampleRateSelect[newValue].adc_osr);
      $("#p-copy-arduino").html(`{ ${calcul.mdiv}, ${calcul.ndiv == 512 ? 0 : 1}, 0x${(Math.log2(calcul.kdiv)).toString(16)}, 0x${(Math.log2(calcul.dac_osr) - 5).toString(16)}, 0x${(Math.log2(calcul.sampleRateSelect[newValue].adc_osr) - 3).toString(16)} },  //Set drive frequency to ${calcul.generatedFreq / 1e3} kHz`);
    });

    $("#select-freqspr").val(calcul.default_adc_osr == -1 ? 0 : calcul.default_adc_osr);
    $("#select-freqspr").change();

  });
}

export function returnFreqParams(value, minsps, maxsps) {
  var maxSampleRate = 0;
  var returnParams = {};
  if (value < 1e3 || value > 800e3) {
    return { success: 0, errorMsg: "El valor de frecuencia introducido no es correcto. Debe ser superior a  1kHz e inferior a 800kHz" };
  }

  returnParams.mdiv = 0;
  returnParams.ndiv = 0;
  returnParams.kdiv = 0;
  returnParams.adc_osr = 0;
  returnParams.dac_osr = 0;
  returnParams.adc_clk = 0;
  returnParams.sampleRateSelect = [];

  let ch_fsel = 0, ina_chop_en = 0;
  let PLL_CLK = 0, sampleRate = 0;
  if (value < 54668) {
    //console.log("Value: ", value, " < 54 668");
    returnParams.dac_osr = 256;
    for (let i = 1; i <= 8192; i *= 2) {
      PLL_CLK = value * 256 * i;
      if (PLL_CLK > 14e6 && PLL_CLK < 28e6) {
        returnParams.kdiv = i;
        i = 8193;
      }
    }
    //console.log("PLL_CLK: ", PLL_CLK / 1e6, "MHz [14-28], KDIV: ", returnParams.kdiv);
    returnParams.mdiv = Math.round(PLL_CLK / REF_CLK);//MDIV is actually MDIV+1
    for (let i = 512; i <= 1024; i *= 2) {
      returnParams.adc_clk = PLL_CLK / i;
      //console.log("NDIV: ", i, ", ADC_CLK: ", returnParams.adc_clk);
      if (returnParams.adc_clk > 16e3 && returnParams.adc_clk < 36.375e3) {
        returnParams.ndiv = i;
        i = 1025;
      }
    }
    if (!returnParams.ndiv) console.log("Error: Could not find NDIV for adc_osr in range");

    returnParams.sampleRateSelectCount = 0, returnParams.default_adc_osr = -1;
    for (let i = 1024; i >= 8; i /= 2) {
      let C = (returnParams.ndiv * i) / (returnParams.kdiv * returnParams.dac_osr);
      sampleRate = PLL_CLK / (returnParams.ndiv * i);
      //console.log("C: ", C, Number.isInteger(C), sampleRate);
      if (Number.isInteger(C)) {
        returnParams.sampleRateSelect[returnParams.sampleRateSelectCount] = { adc_osr: i, sampleRate: PLL_CLK / (returnParams.ndiv * i) };
        if (sampleRate > minsps && sampleRate < maxsps) {
          if (sampleRate > maxSampleRate) {
            maxSampleRate = sampleRate;
            returnParams.default_adc_osr = returnParams.sampleRateSelectCount;
          }
          returnParams.adc_osr = i;
          //if (returnParams.default_adc_osr == -1) returnParams.default_adc_osr = returnParams.sampleRateSelectCount;
        }
        returnParams.sampleRateSelectCount++;
      }
    }


    if (!returnParams.adc_osr) console.log("Error. Couldn't assign value to adc_osr");
    ch_fsel = (value == returnParams.adc_clk / 8) ? 1 : 0;
    ina_chop_en = (value == returnParams.adc_clk / 2) ? 0 : 1;

    //console.log("Mdiv: ", returnParams.mdiv, "\nNdiv: ", returnParams.ndiv, "\nKdiv: ", returnParams.kdiv, "\nDAC_OSR: ", returnParams.dac_osr, "\nADC_OSR: ", returnParams.adc_osr, "\nSample rate: ", returnParams.sampleRate, " sps", "\nADC clk: ", returnParams.adc_clk, "\nch_fsel", ch_fsel, "\nina_chopen: ", ina_chop_en);
  }
  else {
    //console.log("Value: ", value, " > 54 668");
    returnParams.kdiv = 1;
    for (let i = 32; i <= 256; i *= 2) {
      PLL_CLK = value * returnParams.kdiv * i;
      //console.log("KDIV: ", i, ", PLL_CLK: ", PLL_CLK / 1e6, " MHz [14-28]");
      if (PLL_CLK > 14e6 && PLL_CLK < 28e6) {
        returnParams.dac_osr = i;
        i = 257;
      }
    }
    //console.log("PLL CLK: ", PLL_CLK);
    if (!returnParams.dac_osr) console.log("Error: Could not find dac_osr for pll_clk in range");
    returnParams.mdiv = Math.round(PLL_CLK / REF_CLK);//MDIV is actually MDIV+1

    for (let i = 512; i <= 1024; i *= 2) {
      returnParams.adc_clk = PLL_CLK / i;
      //console.log("NDIV: ", i, ", ADC_CLK: ", adc_clk);
      if (returnParams.adc_clk > 16e3 && returnParams.adc_clk < 36.375e3) {
        returnParams.ndiv = i;
        i = 1025;
      }
    }
    //console.log("ADC_CLK: ", returnParams.adc_clk);
    if (!returnParams.ndiv) console.log("Error: Could not find NDIV for adc_osr in range");
    returnParams.sampleRateSelectCount = 0, returnParams.default_adc_osr = -1;
    for (let i = 1024; i >= 8; i /= 2) {
      let C = (returnParams.ndiv * i) / (returnParams.kdiv * returnParams.dac_osr);
      sampleRate = PLL_CLK / (returnParams.ndiv * i);
      //console.log("C: ", C, Number.isInteger(C), sampleRate);
      if (Number.isInteger(C)) {
        returnParams.sampleRateSelect[returnParams.sampleRateSelectCount] = { adc_osr: i, sampleRate: PLL_CLK / (returnParams.ndiv * i) };
        if (sampleRate > minsps && sampleRate < maxsps) {
          if (sampleRate > maxSampleRate) {
            maxSampleRate = sampleRate;
            returnParams.default_adc_osr = returnParams.sampleRateSelectCount;
          }
          returnParams.adc_osr = i;
          //if (returnParams.default_adc_osr == -1) returnParams.default_adc_osr = returnParams.sampleRateSelectCount;
        }
        returnParams.sampleRateSelectCount++;
      }
    }
    if (!returnParams.adc_osr) {
      return { success: 0, errorMsg: "Error. Couldn't assign value to adc_osr or sample rate was not found in desired range" };
    }

  }
  returnParams.generatedFreq = (returnParams.mdiv * REF_CLK) / (returnParams.kdiv * returnParams.dac_osr);
  returnParams.success = 1;
  return returnParams;
}