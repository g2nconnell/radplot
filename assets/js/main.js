import "https://cdn.plot.ly/plotly-4.1.0.min.js";
import Configuration from "./mods/configuration.js";
import * as PolarPlotter from "./mods/polarplotter.js";

export function generatePlot(event) {
    event.preventDefault();
    const formData = new FormData(event.target)
    try {
        const config = new Configuration(formData);
        const plotData = PolarPlotter.getPlotData(config);
        PolarPlotter.renderPolarPlot(plotData);
        displaySyntaxError({}, true);
        updateRvalueTable(plotData);
    } catch (error) {
        if (error instanceof SyntaxError) {
            displaySyntaxError(error);
        } else {
            alert(`An error occurred: ${error.message}`);
            console.log(error.stack);
        }
    }
}

function updateRvalueTable(plotData) {
    const table = document.querySelector('table#rValueTable');
    deleteTableRows(table);
    appendTableRows(table, plotData);
}

function deleteTableRows(table) {
    if (table) {
        // first, cleanup old rows
        let rowCount = table.tBodies[0].rows.length;
        while (rowCount) {
            table.tBodies[0].deleteRow(0);
            rowCount = table.tBodies[0].rows.length;
        }
    }
}

function appendTableRows(table, plotData) {
    if (table && plotData && plotData.rValues && plotData.degreeValues && plotData.thetaValues) {
        const len = plotData.rValues.length;
        for (let index = 0; index < len; index++) {
            const row = document.createElement('tr');
            const degreeTd = document.createElement('td');
            const radianTd = document.createElement('td');
            const rValueTd = document.createElement('td');
            degreeTd.textContent = plotData.degreeValues[index].toFixed(0);
            radianTd.textContent = plotData.thetaValues[index].toFixed(3);
            rValueTd.textContent = plotData.rValues[index];
            row.appendChild(degreeTd);
            row.appendChild(radianTd);
            row.appendChild(rValueTd);
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
    const plotContainer = document.querySelector('div#polarPlot');
    if (plotContainer) {
        plotContainer.innerHTML = "";
    }
    displaySyntaxError({}, true);
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
}

document.addEventListener("DOMContentLoaded", initializeUI, false);

