import { describe, expect, it, vi } from "vitest";
import {
    getAxisTickLabels,
    getPolarPlotData,
    getPolarPlotLayout,
    getTraceData,
    renderPolarPlot
} from "../assets/js/mods/polarplotter.js";

describe("polarplotter", () => {
    describe("getAxisTickLabels", () => {
        it.each([
            [24, "π/12", "15°"],
            [12, "π/6", "30°"],
            [8, "π/4", "45°"],
            [4, "π/2", "90°"]
        ])("returns labels for %s slices", (sliceCount, radianLabel, degreeLabel) => {
            const labels = getAxisTickLabels(sliceCount);
            const zeroIndex = sliceCount;

            expect(labels.tickValues).toHaveLength(sliceCount * 2 + 1);
            expect(labels.radianTickLabels).toHaveLength(sliceCount * 2 + 1);
            expect(labels.degreeTickLabels).toHaveLength(sliceCount * 2 + 1);
            expect(labels.tickValues[zeroIndex + 1]).toBe(360 / sliceCount);
            expect(labels.radianTickLabels[zeroIndex + 1]).toBe(radianLabel);
            expect(labels.degreeTickLabels[zeroIndex + 1]).toBe(degreeLabel);
        });
    });

    describe("getPolarPlotLayout", () => {
        it("uses radians by default and includes the radial range", () => {
            const layout = getPolarPlotLayout({
                title: "Polar Plot",
                displayMode: "radians",
                xaxisTickCount: 4,
                xaxisRange: [0, 5]
            });

            expect(layout.title).toEqual({ text: "Polar Plot" });
            expect(layout.polar.angularaxis.tickvals).toEqual([
                -360, -270, -180, -90, 0, 90, 180, 270, 360
            ]);
            expect(layout.polar.angularaxis.ticktext).toEqual([
                "-2π",
                "-3π/2",
                "-π",
                "-π/2",
                "0",
                "π/2",
                "π",
                "3π/2",
                "2π"
            ]);
            expect(layout.polar.radialaxis.range).toEqual([0, 5]);
        });

        it("uses degree labels for degree display mode", () => {
            const layout = getPolarPlotLayout({
                title: "Degrees",
                displayMode: "degrees",
                xaxisTickCount: 4,
                xaxisRange: [-2, 2]
            });

            expect(layout.polar.angularaxis.ticktext).toEqual([
                "-360°",
                "-270°",
                "-180°",
                "-90°",
                "0°",
                "90°",
                "180°",
                "270°",
                "360°"
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
                xaxisTickCount: 4,
                xaxisRange: [0, 2]
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
                xaxisTickCount: 4,
                xaxisRange: [0, 2]
            };

            renderPolarPlot(plotData);

            const traces = newPlot.mock.calls[0][1];
            expect(traces).toHaveLength(2);
            expect(traces[1].name).toBe("Radius (Negative r)             ");
            expect(traces[1].line.color).toBe("lightcoral");
        });
    });

    describe("getPolarPlotData", () => {
        it("converts selected degree values and builds plot data", () => {
            const config = {
                thetasToUse: [0, 90],
                getRvalueFn: () => () => ["1.0", "-1.0"],
                layoutTitle: "Plot r vs theta",
                currentExpression: "theta",
                plotName: "Radius",
                xaxisTickCount: 4,
                displayMode: "radians",
                xaxisRange: [0, 2]
            };

            expect(getPolarPlotData(config)).toEqual({
                rValues: ["1.0", "1.0"],
                minusRValues: ["-1.0", "-1.0"],
                degreeValues: [0, 90],
                thetaValues: [0, Math.PI / 2],
                layoutTitle: "Plot r = theta vs theta",
                plotName: "Radius",
                xaxisTickCount: 4,
                displayMode: "radians",
                xaxisRange: [0, 2]
            });
        });

        it("uses the expression as the plot name when the configured name is blank", () => {
            const config = {
                thetasToUse: [0],
                getRvalueFn: () => () => [NaN],
                layoutTitle: "Polar Plot",
                currentExpression: "sin(theta)",
                plotName: "       ",
                xaxisTickCount: 24,
                displayMode: "radians",
                xaxisRange: [0, 1]
            };

            expect(getPolarPlotData(config).plotName).toBe("r = sin(theta)");
            expect(getPolarPlotData(config).minusRValues).toBeNull();
        });
    });
});
