import { describe, expect, it, vi } from "vitest";
import {
    getCartesianPlotData,
    getCartesianPlotLayout,
    getTraceData,
    renderCartesianPlot
} from "../assets/js/mods/cartesianplotter.js";

describe("cartesianplotter", () => {
    it("builds a cartesian layout with optional axis ranges", () => {
        expect(getCartesianPlotLayout({
            title: "y = x",
            xaxisRange: [-2, 2],
            yaxisRange: [-4, 4]
        })).toEqual(expect.objectContaining({
            title: { text: "y = x" },
            xaxis: expect.objectContaining({ title: { text: "x" }, range: [-2, 2] }),
            yaxis: expect.objectContaining({ title: { text: "y" }, range: [-4, 4] })
        }));
    });

    it("labels angular x values as theta", () => {
        expect(getCartesianPlotLayout({
            chartType: "cartesian",
            xValsAreAngles: true
        }).xaxis.title).toEqual({ text: "theta" });
    });

    it("formats angular axis ticks in the selected display mode", () => {
        const radiansLayout = getCartesianPlotLayout({
            chartType: "cartesian",
            xValsAreAngles: true,
            displayMode: "radians",
            xaxisTickCount: 4
        });
        const degreesLayout = getCartesianPlotLayout({
            chartType: "cartesian",
            xValsAreAngles: true,
            displayMode: "degrees",
            xaxisTickCount: 4
        });

        expect(radiansLayout.xaxis.tickvals).toEqual(degreesLayout.xaxis.tickvals);
        expect(radiansLayout.xaxis.ticktext).not.toEqual(degreesLayout.xaxis.ticktext);
    });

    it("builds a scatter trace", () => {
        expect(getTraceData([0, 1], [1, 2], {
            plotName: "Line",
            mode: "lines+markers",
            color: "peru"
        })).toEqual(expect.objectContaining({
            x: [0, 1],
            y: [1, 2],
            mode: "lines+markers",
            connectgaps: false,
            name: "Line",
            line: { color: "peru" },
            type: "scatter"
        }));
    });

    it("samples the expression over the configured x range", () => {
        const plotData = getCartesianPlotData({
            calculate: ({ x }) => x * x,
            currentExpression: "x^2",
            xaxisRange: [-1, 1],
            sampleCount: 3
        });

        expect(plotData.xValues).toEqual([-1, 0, 1]);
        expect(plotData.yValues).toEqual([1, 0, 1]);
        expect(plotData.plotName).toBe("y = x^2");
    });

    it("represents non-finite function values as gaps", () => {
        const plotData = getCartesianPlotData({
            calculate: ({ x }) => x === 0 ? Infinity : x,
            xaxisRange: [-1, 1],
            sampleCount: 3
        });

        expect(plotData.yValues).toEqual([-1, null, 1]);
    });

    it("converts angular sample inputs to radians and omits values outside the y range", () => {
        const plotData = getCartesianPlotData({
            calculate: ({ x, theta }) => {
                expect(x).toBe(theta);
                return Math.sin(theta);
            },
            xaxisRange: [0, 180],
            yaxisRange: [-0.5, 0.5],
            sampleCount: 3,
            xValsAreAngles: true
        });

        expect(plotData.xValues).toEqual([0, 90, 180]);
        expect(plotData.yValues[0]).toBe(0);
        expect(plotData.yValues[1]).toBeNull();
        expect(plotData.yValues[2]).toBeCloseTo(0);
    });

    it.each([
        [[], 3, "xaxisRange must contain an increasing pair of finite numbers"],
        [[2, 2], 3, "xaxisRange must contain an increasing pair of finite numbers"],
        [[0, 1], 1, "sampleCount must be an integer greater than 1"],
        [[0, 1], 2.5, "sampleCount must be an integer greater than 1"]
    ])("rejects invalid range %j and sample count %s", (xaxisRange, sampleCount, message) => {
        expect(() => getCartesianPlotData({
            calculate: ({ x }) => x,
            xaxisRange,
            sampleCount
        })).toThrow(new RangeError(message));
    });

    it("renders the trace and layout through Plotly", () => {
        const newPlot = vi.fn();
        globalThis.Plotly = { newPlot };

        renderCartesianPlot({
            xValues: [0, 1],
            yValues: [1, 2],
            layoutTitle: "Line",
            plotName: "Line",
            traceMode: "lines",
            xaxisRange: [0, 1]
        });

        expect(newPlot).toHaveBeenCalledWith(
            "cartesianPlot",
            [expect.objectContaining({ type: "scatter", x: [0, 1], y: [1, 2] })],
            expect.objectContaining({
                title: { text: "Line" },
                xaxis: expect.objectContaining({ range: [0, 1] })
            })
        );
    });
});
