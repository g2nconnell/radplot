import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLOT_DATA_STORAGE_KEY } from "/assets/js/modules/plotDataStorage.js";
import { initializePlotViewer, renderPlotResult } from "/assets/js/plot-viewer.js";

const plotlyMock = { newPlot: vi.fn() };

describe("plot viewer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("Plotly", plotlyMock);
        window.alert = vi.fn();
        vi.spyOn(console, "error").mockImplementation(() => {});
        sessionStorage.clear();
        document.body.innerHTML = `
            <p id="plotError" role="alert" hidden></p>
            <div class="plotContainer">
                <div id="polarPlot"></div>
                <div id="cartesianPlot"></div>
            </div>
            <div class="valuesTableContainer"></div>
        `;
    });

    it("renders a polar chart and filters its results table", () => {
        renderPlotResult({
            chartType: "polar",
            plotData: {
                rValues: ["1.0", "2.0", "3.0"],
                degreeValues: [0, 90, 180],
                thetaValues: [0, Math.PI / 2, Math.PI],
                optionalDesiredXValues: [180, 0],
                displayMode: "radians",
                plotName: "Polar Plot",
                traceMode: "lines",
                layoutTitle: "Polar Plot",
                xaxisTickCount: 4,
                xaxisRange: [0, 3]
            }
        });

        expect(plotlyMock.newPlot).toHaveBeenCalledWith(
            "polarPlot",
            expect.any(Array),
            expect.any(Object)
        );
        expect(document.querySelector("#polarPlot").hidden).toBe(false);
        expect(document.querySelector("#cartesianPlot").hidden).toBe(true);
        expect(document.querySelectorAll("#rValueTable tbody tr")).toHaveLength(2);
        expect(document.querySelector("#rValueTable tbody tr:first-child").textContent).toBe("3.1421803.0");
    });

    it("renders a Cartesian chart and filters its results table", () => {
        renderPlotResult({
            chartType: "cartesian",
            plotData: {
                xValues: [0, 90, 180],
                yValues: [1, 2, 3],
                xValsAreAngles: true,
                displayMode: "radians",
                plotName: "Cartesian Plot",
                optionalDesiredXValues: [90, 0],
                xaxisRange: [0, 180]
            }
        });

        expect(plotlyMock.newPlot).toHaveBeenCalledWith(
            "cartesianPlot",
            expect.any(Array),
            expect.any(Object)
        );
        expect(document.querySelector("#polarPlot").hidden).toBe(true);
        expect(document.querySelector("#cartesianPlot").hidden).toBe(false);
        expect(document.querySelectorAll("#xyValueTable tbody tr")).toHaveLength(2);
        expect(document.querySelector("#xyValueTable tbody tr:first-child").textContent).toBe("1.57082.000");
        expect(document.querySelector("#xyValueTable tbody tr:last-child").textContent).toBe("0.00001.000");
    });

    it("labels rows for each expression in a multi-trace result", () => {
        renderPlotResult({
            chartType: "cartesian",
            plotData: {
                plotName: "y = x",
                traces: [
                    {
                        xValues: [0, 1],
                        yValues: [0, 1],
                        plotName: "y = x"
                    },
                    {
                        xValues: [0, 1],
                        yValues: [0, 2],
                        plotName: "y = 2x"
                    }
                ]
            }
        });

        expect(document.querySelector("#xyValueTable thead").textContent).toContain("Expression");
        expect(document.querySelectorAll("#xyValueTable tbody tr")).toHaveLength(4);
        expect(document.querySelector("#xyValueTable tbody tr:first-child td").textContent).toBe("y = x");
        expect(document.querySelector("#xyValueTable tbody tr:nth-child(3) td").textContent).toBe("y = 2x");
    });

    it("shows all table rows and alerts when requested values do not match", () => {
        renderPlotResult({
            chartType: "cartesian",
            plotData: {
                xValues: [1, 2],
                yValues: [3, 4],
                optionalDesiredXValues: [8],
                plotName: "Cartesian Plot"
            }
        });

        expect(window.alert).toHaveBeenCalledWith(
            "None of the desired x-values were found in the calculated x-values. Showing all values."
        );
        expect(document.querySelectorAll("#xyValueTable tbody tr")).toHaveLength(2);
    });

    it("labels polar traces and alerts when none of their requested angles match", () => {
        renderPlotResult({
            chartType: "polar",
            plotData: {
                plotName: "Polar traces",
                traces: [
                    {
                        plotName: "r = 1",
                        rValues: ["1"],
                        degreeValues: [0],
                        thetaValues: [0]
                    },
                    {
                        plotName: "r = 2",
                        rValues: ["2", "3"],
                        degreeValues: [90, 180],
                        thetaValues: [Math.PI / 2, Math.PI],
                        optionalDesiredXValues: [45]
                    }
                ]
            }
        });

        expect(document.querySelector("#rValueTable thead").textContent).toContain("Expression");
        expect(document.querySelectorAll("#rValueTable tbody tr")).toHaveLength(3);
        expect(document.querySelector("#rValueTable tbody tr:last-child").textContent).toBe("r = 23.1421803");
        expect(window.alert).toHaveBeenCalledWith(
            "None of the desired x-values were found in the calculated x-values. Showing all values."
        );
    });

    it("renders undefined Cartesian values without angle conversion", () => {
        renderPlotResult({
            chartType: "cartesian",
            plotData: {
                xValues: [2],
                yValues: [null],
                plotName: "Discontinuous",
                displayMode: "degrees"
            }
        });

        expect(document.querySelector("#xyValueTable tbody tr").textContent).toBe("2undefined");
    });

    it("renders plots without a results table when its container is absent", () => {
        document.querySelector(".valuesTableContainer").remove();

        renderPlotResult({
            chartType: "cartesian",
            plotData: {
                xValues: [0],
                yValues: [1]
            }
        });

        expect(plotlyMock.newPlot).toHaveBeenCalledTimes(1);
        expect(document.querySelector("#xyValueTable")).toBeNull();
    });

    it("leaves the caption blank and skips incomplete polar traces", () => {
        renderPlotResult({
            chartType: "polar",
            plotData: {
                traces: [
                    { rValues: ["1"], degreeValues: [0] },
                    {}
                ]
            }
        });

        expect(document.querySelector("#rValueTable caption").textContent).toBe("");
        expect(document.querySelectorAll("#rValueTable tbody tr")).toHaveLength(0);
    });

    it("rejects missing plot data and unsupported chart types", () => {
        expect(() => renderPlotResult(null)).toThrow(TypeError);
        expect(() => renderPlotResult({ chartType: "unknown", plotData: {} }))
            .toThrow("Unsupported chart type 'unknown'.");
    });

    it("loads and removes the stored result before rendering it", () => {
        sessionStorage.setItem(PLOT_DATA_STORAGE_KEY, JSON.stringify({
            chartType: "cartesian",
            plotData: {
                xValues: [0, 1],
                yValues: [0, 1],
                plotName: "Line",
                xaxisRange: [0, 1]
            }
        }));

        initializePlotViewer();

        expect(sessionStorage.getItem(PLOT_DATA_STORAGE_KEY)).toBeNull();
        expect(plotlyMock.newPlot).toHaveBeenCalledTimes(1);
    });

    it("shows an explicit message when no plot data was provided", () => {
        initializePlotViewer();

        expect(document.querySelector("#plotError").hidden).toBe(false);
        expect(document.querySelector("#plotError").textContent).toContain("No plot data was found");
    });

    it("shows a message when stored plot data cannot be parsed", () => {
        sessionStorage.setItem(PLOT_DATA_STORAGE_KEY, "{");

        initializePlotViewer();

        expect(document.querySelector("#plotError").hidden).toBe(false);
        expect(document.querySelector("#plotError").textContent).toContain("JSON");
        expect(sessionStorage.getItem(PLOT_DATA_STORAGE_KEY)).toBeNull();
        expect(console.error).toHaveBeenCalledWith(expect.any(SyntaxError));
    });

    it("logs initialization errors when the error container is absent", () => {
        document.querySelector("#plotError").remove();

        initializePlotViewer();

        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });
});
