import { PlotterConstants } from "./plotterConstants.js";

export function getPolarPlotLayout(layoutConfig = {title: "Polar Plot", displayMode: "radians", xaxisTickCount: 24, xaxisRange: [0, 10]}) {
    const tickLabelData = getAxisTickLabels(layoutConfig.xaxisTickCount);
    const tickValues = tickLabelData.tickValues;
    return {
        title: {
            text: layoutConfig.title,
        },
        font: {
            family: 'Arial, sans-serif;',
            size: 12,
            color: '#000'
        },
        showlegend: true,
        orientation: -90,
        polar: {
            angularaxis: {
                tickmode: 'array',
                // Define where the labels should appear (in radians)
                tickvals: tickValues,
                // Define the corresponding Radian labels to display
                ticktext: layoutConfig.displayMode === 'radians' ? tickLabelData.radianTickLabels : tickLabelData.degreeTickLabels,
                direction: 'counterclockwise', // Optional: standard math direction
                period: 360
            },
            radialaxis: {
                range: layoutConfig.xaxisRange
            }
        }
    };
}

export function getAxisTickLabels(sliceCount = 24) {

    const axisTickData = {
        24: {
            tickValues: PlotterConstants.tickValues24,
            radianTickLabels: PlotterConstants.radianTickLabels24,
            degreeTickLabels: PlotterConstants.degreeTickLabels24
        },
        12: {
            tickValues: PlotterConstants.tickValues12,
            radianTickLabels: PlotterConstants.radianTickLabels12,
            degreeTickLabels: PlotterConstants.degreeTickLabels12
        },
        8: {
            tickValues: PlotterConstants.tickValues8,
            radianTickLabels: PlotterConstants.radianTickLabels8,
            degreeTickLabels: PlotterConstants.degreeTickLabels8
        },
        4: {
            tickValues: PlotterConstants.tickValues4,
            radianTickLabels: PlotterConstants.radianTickLabels4,
            degreeTickLabels: PlotterConstants.degreeTickLabels4
        }
    };

    return {
        tickValues: axisTickData[sliceCount].tickValues,
        radianTickLabels: axisTickData[sliceCount].radianTickLabels,
        degreeTickLabels: axisTickData[sliceCount].degreeTickLabels
    };
}

export function getTraceData(rValues, thetaValues, degreeValues, traceConfig = {displayMode: "radians", plotName: "Polar Plot", mode: "lines", color: "peru"}) {
    return {
        r: rValues,
        theta: traceConfig.displayMode === 'radians' ? thetaValues : degreeValues,
        thetaunit: traceConfig.displayMode, // comment out for degrees
        mode: traceConfig.mode, // 'lines+markers',
        connectgaps: false,
        name: traceConfig.plotName,
        line: {
            color: traceConfig.color
        },
        marker: {
            color: "#247f9b",
            symbol: "square",
            size: 10
        },
        type: 'scatterpolar'
    };
}

export function renderPolarPlot(plotData = {}) {
    const traceConfig1  = {
        displayMode: plotData.displayMode, 
        plotName: plotData.plotName, 
        mode: plotData.traceMode,
        color: "peru"
    };
    const trace1 = getTraceData(plotData.rValues, plotData.thetaValues, plotData.degreeValues, traceConfig1);
    const traceConfig2  = {
        displayMode: plotData.displayMode, 
        plotName: plotData.plotName + " (Negative r)             ", 
        mode: plotData.traceMode,
        color: "lightcoral"
    };
    const trace2 = plotData.minusRValues ? getTraceData(plotData.minusRValues, plotData.thetaValues, plotData.degreeValues, traceConfig2) : null;

    const data = [trace1, trace2].filter(trace => trace !== null); // Filter out null traces

    const layoutConfig = {
        title: plotData.layoutTitle,
        displayMode: plotData.displayMode,
        xaxisTickCount: plotData.xaxisTickCount,
        xaxisRange: plotData.xaxisRange, // Set range based on max r value
        chartType: plotData.chartType,
        xValsAreAngles: plotData.xValsAreAngles
    };
    const layout = getPolarPlotLayout(layoutConfig);

    Plotly.newPlot("polarPlot", data, layout);
}

export function getPolarPlotData(config) {
    const rValues = [];
    const minusRValues = [];
    const radianValuesToTest = (config.thetasToUse || PlotterConstants.DefaultDegreeValuesToTest).map(deg => deg * (Math.PI / 180)); // Convert degrees to radians
    const degreeValues = [];
    const thetaValues = [];
    const fn = config.getRvalueFn();
    for (const theta of radianValuesToTest) {
        const rValuesArray = fn(theta, config);
        const plusRValue = rValuesArray[0];
        const minusRValue = rValuesArray.length == 2 ? rValuesArray[1] : NaN;
        if (!isNaN(plusRValue)) {
            degreeValues.push(theta * (180 / Math.PI));
            thetaValues.push(theta);
            rValues.push(plusRValue);
        }
        if (!isNaN(minusRValue)) {
            minusRValues.push(minusRValue);
        }
    }

    return {
        chartType: config.chartType,
        xValsAreAngles: config.xValsAreAngles,
        rValues: rValues,
        minusRValues: minusRValues.length > 0 ? minusRValues : null,
        degreeValues: degreeValues,
        thetaValues: thetaValues,
        layoutTitle: config.layoutTitle.replace(/\ r \b/g, ` r = ${config.currentExpression} `),
        plotName: config.plotName.trim() ? config.plotName : `r = ${config.currentExpression}`,
        xaxisTickCount: config.xaxisTickCount,
        displayMode: config.displayMode,
        xaxisRange: config.xaxisRange,
        optionalDesiredXValues: config.optionalDesiredXValues
    };
}
