import Configuration from "./modules/configuration.js";
import * as PolarPlotter from "./modules/polarplotter.js";
import * as CartesianPlotter from "./modules/cartesianplotter.js";
import { PLOT_DATA_STORAGE_KEY } from "./modules/plotDataStorage.js";

export function generatePlot(event) {
    event.preventDefault();
    const formData = new FormData(event.target)
    try {
        const config = new Configuration(formData);
        const isPolar = config.chartType === 'polar';
        const expressionPlotData = config.expressions.map(expression => {
            const expressionConfig = config.getExpressionConfig(expression);
            return isPolar
                ? PolarPlotter.getPolarPlotData(expressionConfig)
                : CartesianPlotter.getCartesianPlotData(expressionConfig);
        });
        const plotData = expressionPlotData.length > 1
            ? { ...expressionPlotData[0], traces: expressionPlotData }
            : expressionPlotData[0];
        displaySyntaxError({}, true);

        sessionStorage.setItem(PLOT_DATA_STORAGE_KEY, JSON.stringify({
            chartType: config.chartType,
            plotData
        }));
        const plotWindow = window.open("./plot.html", "_blank");
        if (!plotWindow) {
            sessionStorage.removeItem(PLOT_DATA_STORAGE_KEY);
            throw new Error("The plot tab was blocked. Allow popups for this site and try again.");
        }
    } catch (error) {
        if (error instanceof SyntaxError) {
            displaySyntaxError(error);
        } else {
            alert(`An error occurred: ${error.message}`);
            console.log(error.stack);
        }
    }
}

function displaySyntaxError(error, reset=false) {
    const errCont = document.querySelector('div#expressionErrorContainer');
    const textarea = document.querySelector('textarea#functionText');
    const errorInput = document.querySelector('input#errorTextInput');
    if (!reset) {
        errCont.removeAttribute('hidden');
        if (textarea) {
            textarea.classList.add("inputError");
        }
        if (errorInput) {
            errorInput.value = error.message;
        }
    } else {
        errorInput.value = "";
        textarea.classList.remove("inputError")
        errCont.setAttribute('hidden', 'true');
    }
}

export function resetPlotAndInputs() {
    const isPolar = document.querySelector('input[name="chartType"]:checked').value === 'polar';
    const checkbox = document.querySelector('input[type="checkbox"]#xValsAreAngles');
    if (checkbox) {    
        checkbox.setAttribute('checked', true);
    }
    const checkboxContainer = document.querySelector('div#xValsAreAnglesContainer');
    if (checkboxContainer) {
        checkboxContainer.style.display = 'none';
    }
    const thetaDisplayModeContainer = document.querySelector('div#thetaDisplayModeContainer');
    if (thetaDisplayModeContainer) {
        thetaDisplayModeContainer.style.display = 'block';
    }
    const displayModeSelect = document.querySelector('select#displayMode');
    if (displayModeSelect) {
        displayModeSelect.value = 'radians';
    }
    const cartesianDetails = isPolar ? document.querySelector('details[itemid="polarPlotInputs"]') : document.querySelector('details[itemid="cartesianPlotInputs"]');
    if (cartesianDetails) {
        cartesianDetails.removeAttribute('open');
        cartesianDetails.style.display = 'none';
    }
    const polarDetails = isPolar ? document.querySelector('details[itemid="cartesianPlotInputs"]') : document.querySelector('details[itemid="polarPlotInputs"]'); 
    if (polarDetails) {
        polarDetails.removeAttribute('open');
        polarDetails.style.display = 'block';
    }
    displaySyntaxError({}, true);
}

export function onXaxisValuesAreAnglesCheckboxChange(event) {
    const isPolar = document.querySelector('input[name="chartType"]:checked').value === 'polar';
    const checkbox = document.querySelector('input[type="checkbox"]#xValsAreAngles');
    if (checkbox && checkbox.checked && !isPolar) {
        const thetaDisplayModeContainer = document.querySelector('div#thetaDisplayModeContainer'); 
        thetaDisplayModeContainer.style.display = 'block';
    } else {
        const thetaDisplayModeContainer = document.querySelector('div#thetaDisplayModeContainer'); 
        thetaDisplayModeContainer.style.display = 'none';
    }
    const xaxisRangeInput = document.querySelector('input#xaxisRange');
    if (xaxisRangeInput) {
        if (checkbox && checkbox.checked) {
            xaxisRangeInput.value = "-360,360";
        } else {
            xaxisRangeInput.value = "-10, 10";
        }
    }
}

export function onChartTypeChange(event) {
    const isPolar = document.querySelector('input[name="chartType"]:checked').value === 'polar';
    const detailsToShow = isPolar ? document.querySelector('details[itemid="polarPlotInputs"]') : document.querySelector('details[itemid="cartesianPlotInputs"]');
    const detailsToHide = isPolar ? document.querySelector('details[itemid="cartesianPlotInputs"]') : document.querySelector('details[itemid="polarPlotInputs"]');  
    detailsToShow.style.display = 'block';
    detailsToHide.style.display = 'none';
    const checkboxContainer = document.querySelector('div#xValsAreAnglesContainer');
    if (checkboxContainer) {
        const checkbox = document.querySelector('input#xValsAreAngles');
        checkbox.checked = isPolar; // default to unchecked for cartesianchecked for polar
        checkboxContainer.style.display = isPolar ? 'none' : 'block';
    }
    const thetaDisplayModeContainer = document.querySelector('div#thetaDisplayModeContainer');
    if (thetaDisplayModeContainer) {
        thetaDisplayModeContainer.style.display = isPolar ? 'block' : 'none';
    }
    const textarea = document.querySelector('textarea#functionText');
    if (textarea) {
        textarea.value = "";
    }
}

export function initializeUI() {
    const form = document.querySelector('form#plotConfigForm');
    form.addEventListener('submit', generatePlot, false);
    const createplotActionElements = document.querySelectorAll("[data-action='createplot']");
    for (const btn of createplotActionElements) {
        btn.addEventListener('click', generatePlot, false);
    }
    const resetplotActionElements = document.querySelectorAll("[data-action='resetplot']");
    for (const btn of resetplotActionElements) {
        btn.addEventListener('click', resetPlotAndInputs, false);
    }
    const chartTypeElements = document.querySelectorAll('input[name="chartType"]');
    for (const radio of chartTypeElements) {
        radio.addEventListener('change', onChartTypeChange, false);
    }
    const xValsAreAnglesCheckbox = document.querySelector('input[type="checkbox"]#xValsAreAngles');
    if (xValsAreAnglesCheckbox) {
        xValsAreAnglesCheckbox.addEventListener('change', onXaxisValuesAreAnglesCheckboxChange, false);
    }
}

document.addEventListener("DOMContentLoaded", initializeUI, false);

