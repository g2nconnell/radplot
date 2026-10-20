import { PlotterConstants } from "./plotterConstants.js";

export function getCartesianPlotLayout(layoutConfig = {}) {
    const layout = {
        title: {
            text: layoutConfig.title ?? "Cartesian Plot"
        },
        font: {
            family: "Arial, sans-serif;",
            size: 12,
            color: "#000"
        },
        showlegend: true,
        xaxis: {
            title: { text: layoutConfig.xValsAreAngles ? "theta" : "x" },
            zeroline: true
        },
        yaxis: {
            title: { text: "y" },
            zeroline: true
        }
    };

    if (layoutConfig.chartType === "cartesian" && layoutConfig.xValsAreAngles) {
        layout.xaxis.tickvals = PlotterConstants[`tickValues${layoutConfig.xaxisTickCount ?? 12}`];
        layout.xaxis.ticktext = layoutConfig.displayMode === "radians" ? PlotterConstants[`radianTickLabels${layoutConfig.xaxisTickCount ?? 12}`] : PlotterConstants[`degreeTickLabels${layoutConfig.xaxisTickCount ?? 12}`];
    }   

    const xaxisRange = layoutConfig.xaxisRange ?? [-10, 10];
    layout.xaxis.range = xaxisRange;
    if (layoutConfig.yaxisRange) {
        layout.yaxis.range = layoutConfig.yaxisRange;
    }

    return layout;
}

export function getTraceData(xValues, yValues, traceConfig = {}) {
    return {
        x: xValues,
        y: yValues,
        mode: traceConfig.mode ?? "lines",
        connectgaps: false,
        name: traceConfig.plotName ?? "Cartesian Plot",
        line: {
            color: traceConfig.color ?? "peru"
        },
        marker: {
            color: "#247f9b",
            symbol: "square",
            size: 10
        },
        type: "scatter"
    };
}

export function getCartesianPlotData(config = {}) {
    const xaxisRange = config.xaxisRange ?? [-10, 10];
    const sampleCount = config.sampleCount ?? xaxisRange[1] - xaxisRange[0] + 1; // Default to one sample per degree
    if (!Array.isArray(xaxisRange) || xaxisRange.length !== 2 ||
        !xaxisRange.every(Number.isFinite) || xaxisRange[0] >= xaxisRange[1]) {
        throw new RangeError("xaxisRange must contain an increasing pair of finite numbers");
    }
    if (!Number.isInteger(sampleCount) || sampleCount < 2) {
        throw new RangeError("sampleCount must be an integer greater than 1");
    }

    const xValues = [];
    const yValues = [];
    const plotName = config.plotName?.trim()
        ? config.plotName
        : `y = ${config.currentExpression ?? ""}`;

    const step = (xaxisRange[1] - xaxisRange[0]) / (sampleCount - 1);
    for (let i = 0; i < sampleCount; i++) {
        const x = xaxisRange[0] + i * step;
        const args = { x };
        if (config.xValsAreAngles) {
            const rad = x * Math.PI / 180;
            args.theta = rad;
            args.x = rad;
        }
        const y = config.calculate(args);
        if (!Number.isFinite(y) || y > 1e6 || y < -1e6) { // Filter out extreme values
            xValues.push(null);
            yValues.push(null);
            continue;
        }
        xValues.push(x);
        yValues.push(y);
    }

    return {
        chartType: config.chartType,
        xValsAreAngles: config.xValsAreAngles,
        xValues,
        yValues,
        xaxisRange,
        yaxisRange: config.yaxisRange ?? null,
        layoutTitle: config.layoutTitle ?? "Cartesian Plot",
        plotName,
        traceMode: config.traceMode ?? "lines",
        displayMode: config.displayMode ?? "default",
        xaxisTickCount: config.xaxisTickCount ?? 12,
        optionalDesiredXValues: config.optionalDesiredXValues ?? null
    };
}

export function renderCartesianPlot(plotData = {}) {
    const trace = getTraceData(plotData.xValues, plotData.yValues, {
        plotName: plotData.plotName,
        mode: plotData.traceMode,
        color: "peru"
    });
    const layout = getCartesianPlotLayout({
        title: plotData.layoutTitle,
        xaxisRange: plotData.xaxisRange,
        yaxisRange: plotData.yaxisRange,
        displayMode: plotData.displayMode,
        xaxisTickCount: plotData.xaxisTickCount,
        chartType: plotData.chartType,
        xValsAreAngles: plotData.xValsAreAngles
    });

    Plotly.newPlot("cartesianPlot", [trace], layout);
}
