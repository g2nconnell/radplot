import "https://cdn.plot.ly/plotly-4.1.0.min.js";
import Configuration from "./mods/configuration.js";
import * as PolarPlotter from "./mods/polarplotter.js";
import * as CartesianPlotter from "./mods/cartesianplotter.js";

export function generatePlot(event) {
    event.preventDefault();
    const formData = new FormData(event.target)
    try {
        const config = new Configuration(formData);
        const isPolar = config.chartType === 'polar';
        const plotData = isPolar ? PolarPlotter.getPolarPlotData(config) : CartesianPlotter.getCartesianPlotData(config);
        if (isPolar) {
            PolarPlotter.renderPolarPlot(plotData);
        } else {
            CartesianPlotter.renderCartesianPlot(plotData);
        }
        displaySyntaxError({}, true);
        if (isPolar) {
            updateRvalueTable(plotData);
        } else {
            updateXYvalueTable(plotData);
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

function createRValueTable(plotData) {
    const tableContainer = document.querySelector('div.valuesTableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = `
            <table id="rValueTable"n>
                <caption>${plotData.plotName}</caption>
                <thead>
                    <tr>
                        <th>theta: radians</th>
                        <th>theta: degrees</th>
                        <th>r-value</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>`;
    }
}

function createXYValueTable(plotData) {
    const tableContainer = document.querySelector('div.valuesTableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = `
            <table id="xyValueTable"n>
                <caption>${plotData.plotName}</caption>
                <thead>
                    <tr>
                        <th>X-Value</th>
                        <th>Y-Value</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>`;
    }
}

function updateRvalueTable(plotData) {
    createRValueTable(plotData);
    const table = document.querySelector('table#rValueTable');
    appendRTableRows(table, plotData);
}

function updateXYvalueTable(plotData) {
    createXYValueTable(plotData);
    const table = document.querySelector('table#xyValueTable');
    appendXYTableRows(table, plotData);
}

function appendRTableRows(table, plotData) {
    if (table && plotData && plotData.rValues && plotData.degreeValues && plotData.thetaValues) {
        filterDesiredDegreeValues(plotData);
        const len = plotData.rValues.length;
        for (let index = 0; index < len; index++) {
            const row = document.createElement('tr');
            const degreeTd = document.createElement('td');
            const radianTd = document.createElement('td');
            const rValueTd = document.createElement('td');
            degreeTd.textContent = plotData.degreeValues[index].toFixed(0);
            radianTd.textContent = plotData.thetaValues[index].toFixed(3);
            rValueTd.textContent = plotData.rValues[index];
            row.appendChild(radianTd);
            row.appendChild(degreeTd);
            row.appendChild(rValueTd);
            table.tBodies[0].appendChild(row);
        }
    }
}

function filterDesiredDegreeValues(plotData) {
    const desiredXValues = plotData.optionalDesiredXValues;
    if (desiredXValues && Array.isArray(desiredXValues) && desiredXValues.length > 0) {
        const filteredDegreeValues = [];
        const filteredRValues = [];
        const filteredThetaValues = [];
        for (const desiredDegree of desiredXValues) {
            const index = plotData.degreeValues.indexOf(desiredDegree);
            if (index !== -1) {
                filteredDegreeValues.push(plotData.degreeValues[index]);
                filteredRValues.push(plotData.rValues[index]);
                filteredThetaValues.push(plotData.thetaValues[index]);
            }
        }
        if (filteredDegreeValues.length === 0) {
            alert("None of the desired x-values were found in the calculated x-values. Showing all values.");
        } else {
            plotData.degreeValues = filteredDegreeValues;
            plotData.rValues = filteredRValues;
            plotData.thetaValues = filteredThetaValues;
        }
    }
}

function filterDesiredXValues(plotData) {
    const desiredXValues = plotData.optionalDesiredXValues;
    if (desiredXValues && Array.isArray(desiredXValues) && desiredXValues.length > 0) {
        // Filter the xValues and yValues based on the desiredXValues 
        const filteredXValues = [];
        const filteredYValues = [];
        for (const desiredX of desiredXValues) {
            const index = plotData.xValues.indexOf(desiredX);
            if (index !== -1) {
                filteredXValues.push(plotData.xValues[index]);
                filteredYValues.push(plotData.yValues[index]);
            }
        }
        if (filteredXValues.length === 0) {
            alert("None of the desired x-values were found in the calculated x-values. Showing all values.");
        } else {
            plotData.xValues = filteredXValues;
            plotData.yValues = filteredYValues;
        }
    }
}

function appendXYTableRows(table, plotData) {
    if (table && plotData && plotData.xValues && plotData.yValues) {
        filterDesiredXValues(plotData);
        const len = plotData.xValues.length;
        for (let index = 0; index < len; index++) {
            const row = document.createElement('tr');
            const xValueTd = document.createElement('td');
            const yValueTd = document.createElement('td');
            let xValue = plotData.xValues[index];
            if (plotData.xValsAreAngles && plotData.displayMode === "radians") {
                xValue = (xValue * Math.PI / 180).toFixed(4); // Convert degrees to radians for display
            }
            xValueTd.textContent = xValue;
            yValueTd.textContent = plotData.yValues[index] !== null ? plotData.yValues[index].toFixed(3) : "undefined";
            row.appendChild(xValueTd);
            row.appendChild(yValueTd);
            table.tBodies[0].appendChild(row);
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
    for (const plotContainer of document.querySelectorAll('div.plotContainer > div')) {
        plotContainer.innerHTML = "";
    }
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
    const tableContainer = document.querySelector('div.valuesTableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = "";
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
    for (const plotContainer of document.querySelectorAll('div.plotContainer > div')) {
        plotContainer.innerHTML = "";
    }
    const tableContainer = document.querySelector('div.valuesTableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = "";
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

