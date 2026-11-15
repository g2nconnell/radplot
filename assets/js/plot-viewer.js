import { PLOT_DATA_STORAGE_KEY } from "./modules/plotDataStorage.js";
import * as PolarPlotter from "./modules/polarplotter.js";
import * as CartesianPlotter from "./modules/cartesianplotter.js";

export function renderPlotResult(result) {
    if (!result || !result.plotData) {
        throw new TypeError("The plot data is missing or invalid.");
    }

    const polarPlot = document.querySelector("#polarPlot");
    const cartesianPlot = document.querySelector("#cartesianPlot");
    polarPlot.hidden = result.chartType !== "polar";
    cartesianPlot.hidden = result.chartType !== "cartesian";

    if (result.chartType === "polar") {
        PolarPlotter.renderPolarPlot(result.plotData);
        updateRvalueTable(result.plotData);
    } else if (result.chartType === "cartesian") {
        CartesianPlotter.renderCartesianPlot(result.plotData);
        updateXYvalueTable(result.plotData);
    } else {
        throw new RangeError(`Unsupported chart type '${result.chartType}'.`);
    }
}

export function initializePlotViewer() {
    try {
        const serializedResult = sessionStorage.getItem(PLOT_DATA_STORAGE_KEY);
        if (!serializedResult) {
            throw new Error("No plot data was found. Return to the inputs page and generate a plot.");
        }
        sessionStorage.removeItem(PLOT_DATA_STORAGE_KEY);
        renderPlotResult(JSON.parse(serializedResult));
    } catch (error) {
        const errorContainer = document.querySelector("#plotError");
        if (errorContainer) {
            errorContainer.textContent = error.message;
            errorContainer.hidden = false;
        }
        console.error(error);
    }
}

function createResultsTable(id, plotData, headings) {
    const container = document.querySelector(".valuesTableContainer");
    if (!container) {
        return null;
    }

    const table = document.createElement("table");
    table.id = id;
    const caption = document.createElement("caption");
    caption.textContent = plotData.plotName ?? "";
    table.appendChild(caption);

    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for (const heading of headings) {
        const header = document.createElement("th");
        header.textContent = heading;
        headerRow.appendChild(header);
    }
    head.appendChild(headerRow);
    table.appendChild(head);
    table.appendChild(document.createElement("tbody"));
    container.replaceChildren(table);
    return table;
}

function updateRvalueTable(plotData) {
    const expressionData = plotData.traces ?? [plotData];
    const includeExpression = expressionData.length > 1;
    const headings = includeExpression
        ? ["Expression", "theta: radians", "theta: degrees", "r-value"]
        : ["theta: radians", "theta: degrees", "r-value"];
    const table = createResultsTable("rValueTable", plotData, headings);
    appendRTableRows(table, expressionData, includeExpression);
}

function updateXYvalueTable(plotData) {
    const expressionData = plotData.traces ?? [plotData];
    const includeExpression = expressionData.length > 1;
    const headings = includeExpression
        ? ["Expression", "X-Value", "Y-Value"]
        : ["X-Value", "Y-Value"];
    const table = createResultsTable("xyValueTable", plotData, headings);
    appendXYTableRows(table, expressionData, includeExpression);
}

function appendRTableRows(table, expressionData, includeExpression) {
    let hasDesiredValues = false;
    let missingDesiredValue = false;
    for (const plotData of expressionData) {
        if (table && plotData?.rValues && plotData.degreeValues && plotData.thetaValues) {
            hasDesiredValues = hasDesiredValues || Boolean(plotData.optionalDesiredXValues?.length);
            if (!filterDesiredDegreeValues(plotData) && plotData.optionalDesiredXValues?.length) {
                missingDesiredValue = true;
            }
            for (let index = 0; index < plotData.rValues.length; index++) {
                const row = document.createElement("tr");
                if (includeExpression) {
                    appendCell(row, plotData.plotName);
                }
                appendCell(row, plotData.thetaValues[index].toFixed(3));
                appendCell(row, plotData.degreeValues[index].toFixed(0));
                appendCell(row, plotData.rValues[index]);
                table.tBodies[0].appendChild(row);
            }
        }
    }
    if (hasDesiredValues && missingDesiredValue) {
        alert("None of the desired x-values were found in the calculated x-values. Showing all values.");
    }
}

function filterDesiredDegreeValues(plotData) {
    const desiredXValues = plotData.optionalDesiredXValues;
    if (!Array.isArray(desiredXValues) || desiredXValues.length === 0) {
        return true;
    }

    const filteredIndexes = desiredXValues
        .map(desiredDegree => plotData.degreeValues.indexOf(desiredDegree))
        .filter(index => index !== -1);
    if (filteredIndexes.length === 0) {
        return false;
    }

    plotData.degreeValues = filteredIndexes.map(index => plotData.degreeValues[index]);
    plotData.rValues = filteredIndexes.map(index => plotData.rValues[index]);
    plotData.thetaValues = filteredIndexes.map(index => plotData.thetaValues[index]);
    return true;
}

function filterDesiredXValues(plotData) {
    const desiredXValues = plotData.optionalDesiredXValues;
    if (!Array.isArray(desiredXValues) || desiredXValues.length === 0) {
        return true;
    }

    const filteredIndexes = desiredXValues
        .map(desiredX => plotData.xValues.indexOf(desiredX))
        .filter(index => index !== -1);
    if (filteredIndexes.length === 0) {
        return false;
    }

    plotData.xValues = filteredIndexes.map(index => plotData.xValues[index]);
    plotData.yValues = filteredIndexes.map(index => plotData.yValues[index]);
    return true;
}

function appendXYTableRows(table, expressionData, includeExpression) {
    let hasDesiredValues = false;
    let missingDesiredValue = false;
    for (const plotData of expressionData) {
        if (table && plotData?.xValues && plotData.yValues) {
            hasDesiredValues = hasDesiredValues || Boolean(plotData.optionalDesiredXValues?.length);
            if (!filterDesiredXValues(plotData) && plotData.optionalDesiredXValues?.length) {
                missingDesiredValue = true;
            }
            for (let index = 0; index < plotData.xValues.length; index++) {
                const row = document.createElement("tr");
                if (includeExpression) {
                    appendCell(row, plotData.plotName);
                }
                let xValue = plotData.xValues[index];
                if (plotData.xValsAreAngles && plotData.displayMode === "radians") {
                    xValue = (xValue * Math.PI / 180).toFixed(4);
                }
                appendCell(row, xValue);
                appendCell(row, plotData.yValues[index] !== null
                    ? plotData.yValues[index].toFixed(3)
                    : "undefined");
                table.tBodies[0].appendChild(row);
            }
        }
    }
    if (hasDesiredValues && missingDesiredValue) {
        alert("None of the desired x-values were found in the calculated x-values. Showing all values.");
    }
}

function appendCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}
