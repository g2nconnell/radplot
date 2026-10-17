import { beforeEach, describe, expect, it, vi } from "vitest";
import * as PolarPlotter from "../assets/js/mods/polarplotter.js";
import * as CartesianPlotter from "../assets/js/mods/cartesianplotter.js";

const plotlyMock = { newPlot: vi.fn() };
vi.stubGlobal("Plotly", plotlyMock);
vi.mock("https://cdn.plot.ly/plotly-4.1.0.min.js", () => ({
    default: plotlyMock,
}), { virtual: true });

const {
    generatePlot,
    initializeUI,
    onChartTypeChange,
    onXaxisValuesAreAnglesCheckboxChange,
    resetPlotAndInputs
} = await import("../assets/js/main.js");

function buildDom(overrides = {}) {
    const formValues = {
        ignoreRvalueBeyond: "0",
        chartType: "polar",
        functionText: "theta",
        thetasToUse: "0,90,180",
        xaxisRange: "-10,10",
        thetaDisplayMode: "radians",
        traceMode: "lines",
        xaxisTickCount: "24",
        plotName: "Polar Plot",
        layoutTitle: "Polar Plot",
        ...overrides
    };

    document.body.innerHTML = `
        <div class="plotContainer">
            <div id="polarPlot"></div>
            <div id="cartesianPlot"></div>
        </div>
        <div id="expressionErrorContainer" hidden>
            <textarea id="functionText" class=""></textarea>
            <input id="errorTextInput" type="text" value="" />
        </div>
        <div class="valuesTableContainer"></div>
        <div id="xValsAreAnglesContainer"><input type="checkbox" id="xValsAreAngles" /></div>
        <div id="thetaDisplayModeContainer"></div>
        <select id="displayMode"><option value="radians">Radians</option></select>
        <details itemid="polarPlotInputs"></details>
        <details itemid="cartesianPlotInputs"></details>

        <form id="plotConfigForm">
            <input type="radio" name="chartType" value="polar" ${formValues.chartType === "polar" ? "checked" : ""} />
            <input type="radio" name="chartType" value="cartesian" ${formValues.chartType === "cartesian" ? "checked" : ""} />
            <input name="ignoreRvalueBeyond" value="${formValues.ignoreRvalueBeyond}" />
            <input name="functionText" value="${formValues.functionText}" />
            <input name="thetasToUse" value="${formValues.thetasToUse}" />
            <input id="xaxisRange" name="xaxisRange" value="${formValues.xaxisRange}" />
            <input name="thetaDisplayMode" value="${formValues.thetaDisplayMode}" />
            <input name="traceMode" value="${formValues.traceMode}" />
            <input name="xaxisTickCount" value="${formValues.xaxisTickCount}" />
            <input name="plotName" value="${formValues.plotName}" />
            <input name="layoutTitle" value="${formValues.layoutTitle}" />
            <button type="submit" data-action="createplot">Create plot</button>
            <button type="button" data-action="resetplot">Reset plot</button>
        </form>

    `;

    const textarea = document.querySelector("textarea#functionText");
    textarea.value = formValues.functionText;

    return document.querySelector("form#plotConfigForm");
}

describe("main UI handlers", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        window.alert = vi.fn();
        vi.spyOn(console, "log").mockImplementation(() => {});
        const originalFormData = globalThis.FormData;
        globalThis.FormData = class extends originalFormData {
            constructor(target) {
                super(target instanceof HTMLFormElement ? target : document.querySelector("#plotConfigForm"));
            }
        };
        document.body.innerHTML = "";
    });

    it("generates a plot and fills the R-value table when the expression is valid", () => {
        const form = buildDom({ functionText: "theta" });
        vi.spyOn(PolarPlotter, "getPolarPlotData").mockReturnValue({
            rValues: [2, 3],
            degreeValues: [0, 45],
            thetaValues: [0, 0.785],
            displayMode: "radians",
            plotName: "Polar Plot",
            layoutTitle: "Polar Plot",
            xaxisTickCount: 24,
            xaxisRange: [-2, 2]
        });

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(plotlyMock.newPlot).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll("#rValueTable tbody tr").length).toBe(2);
        expect(document.querySelector("#expressionErrorContainer").hasAttribute("hidden")).toBe(true);
        expect(document.querySelector("#errorTextInput").value).toBe("");
    });

    it("generates a Cartesian plot and filters the results table to requested x values", () => {
        const form = buildDom({ chartType: "cartesian" });
        const plotData = {
            xValues: [0, 90, 180],
            yValues: [1, 2, 3],
            xValsAreAngles: true,
            displayMode: "radians",
            plotName: "Cartesian Plot",
            optionalDesiredXValues: [90, 0]
        };
        vi.spyOn(CartesianPlotter, "getCartesianPlotData").mockReturnValue(plotData);
        const renderSpy = vi.spyOn(CartesianPlotter, "renderCartesianPlot").mockImplementation(() => {});

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(renderSpy).toHaveBeenCalledWith(plotData);
        expect(plotData.xValues).toEqual([90, 0]);
        expect(plotData.yValues).toEqual([2, 1]);
        expect(document.querySelectorAll("#xyValueTable tbody tr")).toHaveLength(2);
        expect(document.querySelector("#xyValueTable tbody tr:first-child").textContent).toBe("1.57082.000");
        expect(document.querySelector("#xyValueTable tbody tr:last-child").textContent).toBe("0.00001.000");
    });

    it("keeps all Cartesian results when requested x values are not found", () => {
        const form = buildDom({ chartType: "cartesian" });
        const plotData = {
            xValues: [1, 2],
            yValues: [3, 4],
            optionalDesiredXValues: [8]
        };
        vi.spyOn(CartesianPlotter, "getCartesianPlotData").mockReturnValue(plotData);

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(window.alert).toHaveBeenCalledWith(
            "None of the desired x-values were found in the calculated x-values. Showing all values."
        );
        expect(plotData.xValues).toEqual([1, 2]);
        expect(document.querySelectorAll("#xyValueTable tbody tr")).toHaveLength(2);
    });

    it("lists non-angular Cartesian values in their configured display mode", () => {
        const form = buildDom({ chartType: "cartesian" });
        vi.spyOn(CartesianPlotter, "getCartesianPlotData").mockReturnValue({
            xValues: [1.5],
            yValues: [2.25],
            xValsAreAngles: false,
            displayMode: "degrees",
            plotName: "Line"
        });

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(document.querySelector("#xyValueTable tbody tr").textContent).toBe("1.52.250");
    });

    it("displays a syntax error when the expression cannot be parsed", () => {
        const form = buildDom({ functionText: "theta @ 2" });

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(document.querySelector("#expressionErrorContainer").hasAttribute("hidden")).toBe(false);
        expect(document.querySelector("textarea#functionText").classList.contains("inputError")).toBe(true);
        expect(document.querySelector("#errorTextInput").value).toContain("Unexpected character");
    });

    it("displays syntax errors when optional error inputs are absent", () => {
        const form = buildDom({ functionText: "theta @ 2" });
        document.querySelector("textarea#functionText").remove();
        document.querySelector("input#errorTextInput").remove();

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(document.querySelector("#expressionErrorContainer").hasAttribute("hidden")).toBe(false);
    });

    it("alerts and logs non-syntax exceptions", () => {
        const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
        vi.spyOn(PolarPlotter, "getPolarPlotData").mockImplementation(() => {
            throw new TypeError("boom");
        });

        const form = buildDom({ functionText: "theta" });
        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledTimes(1);
    });

    it("clears the plot area and resets the syntax error state", () => {
        buildDom();
        const errorContainer = document.querySelector("#expressionErrorContainer");
        const textarea = document.querySelector("textarea#functionText");
        const errorInput = document.querySelector("#errorTextInput");

        errorContainer.removeAttribute("hidden");
        textarea.classList.add("inputError");
        errorInput.value = "Expected error";
        document.querySelector("#polarPlot").innerHTML = "<div>old plot</div>";

        resetPlotAndInputs();

        expect(document.querySelector("#polarPlot").innerHTML).toBe("");
        expect(errorContainer.hasAttribute("hidden")).toBe(true);
        expect(errorInput.value).toBe("");
        expect(textarea.classList.contains("inputError")).toBe(false);
        expect(document.querySelector("#cartesianPlot").innerHTML).toBe("");
        expect(document.querySelector(".valuesTableContainer").innerHTML).toBe("");
        expect(document.querySelector("#xValsAreAngles").hasAttribute("checked")).toBe(true);
        expect(document.querySelector("#xValsAreAnglesContainer").style.display).toBe("none");
        expect(document.querySelector("#thetaDisplayModeContainer").style.display).toBe("block");
        expect(document.querySelector("#displayMode").value).toBe("radians");
        expect(document.querySelector('details[itemid="polarPlotInputs"]').style.display).toBe("none");
        expect(document.querySelector('details[itemid="cartesianPlotInputs"]').style.display).toBe("block");
    });

    it("resets Cartesian controls and tolerates optional reset elements being absent", () => {
        buildDom({ chartType: "cartesian" });
        document.querySelector('input[name="chartType"][value="polar"]').checked = false;
        document.querySelector('input[name="chartType"][value="cartesian"]').checked = true;
        document.querySelector("#xValsAreAngles").remove();
        document.querySelector("#xValsAreAnglesContainer").remove();
        document.querySelector("#thetaDisplayModeContainer").remove();
        document.querySelector("#displayMode").remove();
        document.querySelector(".valuesTableContainer").remove();

        resetPlotAndInputs();

        expect(document.querySelector('details[itemid="cartesianPlotInputs"]').style.display).toBe("none");
        expect(document.querySelector('details[itemid="polarPlotInputs"]').style.display).toBe("block");
        expect(document.querySelector("#polarPlot").innerHTML).toBe("");
        expect(document.querySelector("#cartesianPlot").innerHTML).toBe("");
    });

    it("updates the angular checkbox controls and range for Cartesian plots", () => {
        buildDom({ chartType: "cartesian" });
        const checkbox = document.querySelector("#xValsAreAngles");
        const thetaMode = document.querySelector("#thetaDisplayModeContainer");
        const range = document.querySelector("#xaxisRange");

        checkbox.checked = false;
        onXaxisValuesAreAnglesCheckboxChange({});
        expect(thetaMode.style.display).toBe("none");
        expect(range.value).toBe("-10, 10");

        checkbox.checked = true;
        onXaxisValuesAreAnglesCheckboxChange({});
        expect(thetaMode.style.display).toBe("block");
        expect(range.value).toBe("-360,360");

        document.querySelector('input[name="chartType"][value="polar"]').checked = true;
        onXaxisValuesAreAnglesCheckboxChange({});
        expect(thetaMode.style.display).toBe("none");

        document.querySelector("#xaxisRange").remove();
        onXaxisValuesAreAnglesCheckboxChange({});
    });

    it("updates chart-specific controls and clears previous output on chart changes", () => {
        buildDom({ chartType: "cartesian" });
        document.querySelector("#polarPlot").textContent = "old polar";
        document.querySelector("#cartesianPlot").textContent = "old cartesian";
        document.querySelector(".valuesTableContainer").textContent = "old table";
        document.querySelector("textarea#functionText").value = "old expression";

        onChartTypeChange({});

        expect(document.querySelector('details[itemid="cartesianPlotInputs"]').style.display).toBe("block");
        expect(document.querySelector('details[itemid="polarPlotInputs"]').style.display).toBe("none");
        expect(document.querySelector("#xValsAreAnglesContainer").style.display).toBe("block");
        expect(document.querySelector("#xValsAreAngles").checked).toBe(false);
        expect(document.querySelector("#thetaDisplayModeContainer").style.display).toBe("none");
        expect(document.querySelector("#polarPlot").textContent).toBe("");
        expect(document.querySelector("#cartesianPlot").textContent).toBe("");
        expect(document.querySelector(".valuesTableContainer").textContent).toBe("");
        expect(document.querySelector("textarea#functionText").value).toBe("");

        document.querySelector('input[name="chartType"][value="polar"]').checked = true;
        onChartTypeChange({});
        expect(document.querySelector('details[itemid="polarPlotInputs"]').style.display).toBe("block");
        expect(document.querySelector("#xValsAreAngles").checked).toBe(true);
        expect(document.querySelector("#thetaDisplayModeContainer").style.display).toBe("block");
    });

    it("initializes a form when no optional action controls exist", () => {
        document.body.innerHTML = "<form id='plotConfigForm'></form>";

        expect(() => initializeUI()).not.toThrow();
    });

    it("registers submit and click handlers for plot creation and reset actions", () => {
        buildDom({ functionText: "theta" });
        vi.spyOn(PolarPlotter, "getPolarPlotData").mockReturnValue({
            rValues: [1],
            degreeValues: [0],
            thetaValues: [0],
            displayMode: "radians",
            plotName: "Polar Plot",
            layoutTitle: "Polar Plot",
            xaxisTickCount: 24,
            xaxisRange: [-1, 1]
        });

        initializeUI();

        const form = document.querySelector("#plotConfigForm");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        expect(plotlyMock.newPlot).toHaveBeenCalledTimes(1);

        const createButton = document.querySelector("[data-action='createplot']");
        createButton.click();
        expect(plotlyMock.newPlot).toHaveBeenCalledTimes(2);

        const resetButton = document.querySelector("[data-action='resetplot']");
        resetButton.click();
        expect(document.querySelector("#polarPlot").innerHTML).toBe("");
    });
});
