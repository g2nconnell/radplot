export function getPlotLayout(layoutConfig = {title: "Polar Plot", displayMode: "radians", pieSliceCount: 24, radialaxisRange: [0, 10]}) {
    const tickLabelData = getAxisTickLabels(layoutConfig.pieSliceCount);
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
                range: layoutConfig.radialaxisRange
            }
        }
    };
}

export function getAxisTickLabels(sliceCount = 24) {
    const tickValues24 = [
        0, 15, 30, 45, 60, 75, 
        90, 105, 120, 135, 150, 165, 
        180, 195, 210, 225, 240, 255, 
        270, 285, 300, 315, 330, 345
    ];

    const tickValues12 = [
        0, 30, 60,  
        90, 120, 150, 
        180, 210, 240,
        270, 300, 330
    ];

    const tickValues8 = [
        0, 45, 
        90, 135,
        180, 225, 
        270, 315,
    ];

    const tickValues4 = [
        0, 
        90,
        180, 
        270
    ];

    const radianTickLabels24 = [
        '0', 'π/12', 'π/6','π/4', 'π/3', '5π/12', 
        'π/2', '7π/12', '2π/3','3π/4', '5π/6', '11π/12', 
        'π', '13π/12', '7π/6', '5π/4', '4π/3', '17π/12', 
        '3π/2', '19π/12', '5π/3', '7π/4', '11π/6', '23π/12'
    ];

    const radianTickLabels12 = [
        '0', 'π/6', 'π/3', 
        'π/2', '2π/3', '5π/6', 
        'π', '7π/6', '4π/3', 
        '3π/2', '5π/3', '11π/6'
    ];

    const radianTickLabels8 = [
        '0', 'π/4', 
        'π/2', '3π/4', 
        'π', '5π/4', 
        '3π/2', '7π/4'
    ];

    const radianTickLabels4 = [
        '0', 
        'π/2', 
        'π',
        '3π/2'
    ];

    const degreeTickLabels24 = [
        '0°', '15°', '30°', '45°', '60°', '75°', 
        '90°', '105°', '120°','135°', '150°', '165°', 
        '180°', '195°', '210°', '225°', '240°', '255°', 
        '270°', '285°', '300°', '315°', '330°', '345°'
    ];

    const degreeTickLabels12 = [
        '0°', '30°', '60°', 
        '90°', '120°', '150°', 
        '180°', '210°', '240°', 
        '270°', '300°', '330°'
    ];

    const degreeTickLabels8 = [
        '0°', '45°', 
        '90°', '135°',
        '180°', '225°', 
        '270°', '315°'
    ];

    const degreeTickLabels4 = [
        '0°' ,
        '90°',
        '180°' ,
        '270°'
    ];

    const axisTickData = {
        24: {
            tickValues: tickValues24,
            radianTickLabels: radianTickLabels24,
            degreeTickLabels: degreeTickLabels24
        },
        12: {
            tickValues: tickValues12,
            radianTickLabels: radianTickLabels12,
            degreeTickLabels: degreeTickLabels12
        },
        8: {
            tickValues: tickValues8,
            radianTickLabels: radianTickLabels8,
            degreeTickLabels: degreeTickLabels8
        },
        4: {
            tickValues: tickValues4,
            radianTickLabels: radianTickLabels4,
            degreeTickLabels: degreeTickLabels4
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
        pieSliceCount: plotData.pieSliceCount,
        radialaxisRange: plotData.radialaxisRange // Set range based on max r value
    };
    const layout = getPlotLayout(layoutConfig);

    Plotly.newPlot("polarPlot", data, layout);
}

export function getPlotData(config) {
    const rValues = [];
    const minusRValues = [];
    const DefaultDegreeValuesToTest = [
        0, 1, 2,3, 4, 5, 6, 7, 8, 9, 
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,  
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29,  
        30, 31, 32, 33, 34, 35, 36, 37, 38, 39,  
        40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 
        50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 
        60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 
        70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 
        80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 
        90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 
        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 
        110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 
        120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 
        130, 131, 132, 133, 134, 135, 136, 137, 138, 139,
        140, 141, 142, 143, 144, 145, 146, 147, 148, 149,
        150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 
        160, 161, 162, 163, 164, 165, 166, 167, 168, 169,
        170, 171, 172, 173, 174, 175, 176, 177, 178, 179,
        180, 181, 182, 183, 184, 185, 186, 187, 188, 189,
        190, 191, 192, 193, 194, 195, 196, 197, 198, 199,
        200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
        210, 211, 212, 213, 214, 215, 216, 217, 218, 219,
        220, 221, 222, 223, 224, 225, 226, 227, 228, 229,
        230, 231, 232, 233, 234, 235, 236, 237, 238, 239,
        240, 241, 242, 243, 244, 245, 246, 247, 248, 249,
        250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
        260, 261, 262, 263, 264, 265, 266, 267, 268, 269,
        270, 271, 272, 273, 274, 275, 276, 277, 278, 279,
        280, 281, 282, 283, 284, 285, 286, 287, 288, 289,
        290, 291, 292, 293, 294, 295, 296, 297, 298, 299,
        300, 301, 302, 303, 304, 305, 306, 307, 308, 309,
        310, 311, 312, 313, 314, 315, 316, 317, 318, 319,
        320, 321, 322, 323, 324, 325, 326, 327, 328, 329,
        330, 331, 332, 333, 334, 335, 336, 337, 338, 339,
        340, 341, 342, 343, 344, 345, 346, 347, 348, 349,
        350, 351, 352, 353, 354, 355, 356, 357, 358, 359
    ];
    const radianValuesToTest = (config.thetasToUse || DefaultDegreeValuesToTest).map(deg => deg * (Math.PI / 180)); // Convert degrees to radians
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
        rValues: rValues,
        minusRValues: minusRValues.length > 0 ? minusRValues : null,
        degreeValues: degreeValues,
        thetaValues: thetaValues,
        layoutTitle: config.layoutTitle.replace(/\ r \b/g, ` r = ${config.currentExpression} `),
        plotName: config.plotName.trim() ? config.plotName : `r = ${config.currentExpression}`,
        pieSliceCount: config.pieSliceCount,
        displayMode: config.displayMode,
        radialaxisRange: config.radialaxisRange
    };
}
