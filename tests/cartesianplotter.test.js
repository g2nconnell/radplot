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
