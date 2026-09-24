import { describe, expect, it, vi } from "vitest";
import {
    getAxisTickLabels,
    getPlotData,
    getPlotLayout,
    getTraceData,
    renderPolarPlot
} from "../assets/js/mods/polarplotter.js";

describe("polarplotter", () => {
    describe("getAxisTickLabels", () => {
        it.each([
            [24, 24, "π/12", "15°"],
            [12, 12, "π/6", "30°"],
            [8, 8, "π/4", "45°"],
            [4, 4, "π/2", "90°"]
        ])("returns labels for %s slices", (sliceCount, length, radianLabel, degreeLabel) => {
            const labels = getAxisTickLabels(sliceCount);

            expect(labels.tickValues).toHaveLength(length);
            expect(labels.radianTickLabels).toHaveLength(length);
            expect(labels.degreeTickLabels).toHaveLength(length);
            expect(labels.radianTickLabels[1]).toBe(radianLabel);
            expect(labels.degreeTickLabels[1]).toBe(degreeLabel);
        });
    });

    describe("getPlotLayout", () => {
        it("uses radians by default and includes the radial range", () => {
            const layout = getPlotLayout({
                title: "Polar Plot",
                displayMode: "radians",
                pieSliceCount: 4,
                radialaxisRange: [0, 5]
            });

            expect(layout.title).toEqual({ text: "Polar Plot" });
            expect(layout.polar.angularaxis.tickvals).toEqual([0, 90, 180, 270]);
            expect(layout.polar.angularaxis.ticktext).toEqual([
                "0",
                "π/2",
                "π",
                "3π/2"
            ]);
            expect(layout.polar.radialaxis.range).toEqual([0, 5]);
        });

        it("uses degree labels for degree display mode", () => {
            const layout = getPlotLayout({
                title: "Degrees",
                displayMode: "degrees",
                pieSliceCount: 4,
                radialaxisRange: [-2, 2]
            });

            expect(layout.polar.angularaxis.ticktext).toEqual([
                "0°",
                "90°",
                "180°",
                "270°"
            ]);
            expect(layout.polar.angularaxis.period).toBe(360);
        });
    });

    describe("getTraceData", () => {
        it("uses radians when the display mode is radians", () => {
            expect(getTraceData([1, 2], [0, Math.PI], [0, 180], {
                displayMode: "radians",
                plotName: "Radius",
                mode: "lines",
                color: "peru"
            })).toEqual({
                r: [1, 2],
                theta: [0, Math.PI],
                thetaunit: "radians",
                mode: "lines",
                connectgaps: false,
                name: "Radius",
                line: { color: "peru" },
                marker: {
                    color: "#247f9b",
                    symbol: "square",
                    size: 10
                },
                type: "scatterpolar"
            });
        });

        it("uses degree values for degree display mode", () => {
            const trace = getTraceData([1], [Math.PI / 2], [90], {
                displayMode: "degrees",
                plotName: "Degrees",
                mode: "lines+markers",
                color: "lightcoral"
            });

            expect(trace.theta).toEqual([90]);
            expect(trace.thetaunit).toBe("degrees");
            expect(trace.mode).toBe("lines+markers");
            expect(trace.line.color).toBe("lightcoral");
        });
    });

    describe("renderPolarPlot", () => {
        it("renders one trace when negative values are absent", () => {
            const newPlot = vi.fn();
            globalThis.Plotly = { newPlot };
            const plotData = {
                rValues: [1],
                thetaValues: [0],
                degreeValues: [0],
                displayMode: "radians",
                plotName: "Radius",
                traceMode: "lines",
                layoutTitle: "Plot",
                pieSliceCount: 4,
                radialaxisRange: [0, 2]
            };

            renderPolarPlot(plotData);

            expect(newPlot).toHaveBeenCalledWith(
                "polarPlot",
                [expect.objectContaining({ name: "Radius" })],
                expect.objectContaining({
                    title: { text: "Plot" },
                    polar: expect.objectContaining({
                        radialaxis: { range: [0, 2] }
                    })
                })
            );
        });

        it("renders a second trace when negative values are present", () => {
            const newPlot = vi.fn();
            globalThis.Plotly = { newPlot };
            const plotData = {
                rValues: [1],
                minusRValues: ["-1.0"],
                thetaValues: [0],
                degreeValues: [0],
                displayMode: "degrees",
                plotName: "Radius",
                traceMode: "lines",
                layoutTitle: "Plot",
                pieSliceCount: 4,
                radialaxisRange: [0, 2]
            };

            renderPolarPlot(plotData);

            const traces = newPlot.mock.calls[0][1];
            expect(traces).toHaveLength(2);
            expect(traces[1].name).toBe("Radius (Negative r)             ");
            expect(traces[1].line.color).toBe("lightcoral");
        });
    });

    describe("getPlotData", () => {
        it("converts selected degree values and builds plot data", () => {
            const config = {
                thetasToUse: [0, 90],
                getRvalueFn: () => () => ["1.0", "-1.0"],
                layoutTitle: "Plot r vs theta",
                currentExpression: "theta",
                plotName: "Radius",
                pieSliceCount: 4,
                displayMode: "radians",
                radialaxisRange: [0, 2]
            };

            expect(getPlotData(config)).toEqual({
                rValues: ["1.0", "1.0"],
                minusRValues: ["-1.0", "-1.0"],
                degreeValues: [0, 90],
                thetaValues: [0, Math.PI / 2],
                layoutTitle: "Plot r = theta vs theta",
                plotName: "Radius",
                pieSliceCount: 4,
                displayMode: "radians",
                radialaxisRange: [0, 2]
            });
        });

        it("uses the expression as the plot name when the configured name is blank", () => {
            const config = {
                thetasToUse: [0],
                getRvalueFn: () => () => [NaN],
                layoutTitle: "Polar Plot",
                currentExpression: "sin(theta)",
                plotName: "       ",
                pieSliceCount: 24,
                displayMode: "radians",
                radialaxisRange: [0, 1]
            };

            expect(getPlotData(config).plotName).toBe("r = sin(theta)");
            expect(getPlotData(config).minusRValues).toBeNull();
        });
    });
});
