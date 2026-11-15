import { beforeEach, describe, expect, it, vi } from "vitest";
import * as PolarPlotter from "/assets/js/modules/polarplotter.js";
import * as CartesianPlotter from "/assets/js/modules/cartesianplotter.js";
import { PLOT_DATA_STORAGE_KEY } from "/assets/js/modules/plotDataStorage.js";

const {
    generatePlot,
    initializeUI,
    onChartTypeChange,
    onXaxisValuesAreAnglesCheckboxChange,
    resetPlotAndInputs
} = await import("../../assets/js/main.js");

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
        <div id="expressionErrorContainer" hidden>
            <textarea id="functionText" class=""></textarea>
            <input id="errorTextInput" type="text" value="" />
        </div>
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

    document.querySelector("textarea#functionText").value = formValues.functionText;
    return document.querySelector("form#plotConfigForm");
}

function useMultilineExpression(form, expressionText) {
    form.querySelector("[name='functionText']").outerHTML = '<textarea name="functionText"></textarea>';
    form.querySelector("textarea[name='functionText']").value = expressionText;
}

describe("main UI handlers", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        sessionStorage.clear();
        window.alert = vi.fn();
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(window, "open").mockReturnValue({});
        const originalFormData = globalThis.FormData;
        globalThis.FormData = class extends originalFormData {
            constructor(target) {
                super(target instanceof HTMLFormElement ? target : document.querySelector("#plotConfigForm"));
            }
        };
        document.body.innerHTML = "";
    });

    it("opens a plot tab with the generated polar data", () => {
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

        expect(window.open).toHaveBeenCalledWith("./plot.html", "_blank");
        expect(JSON.parse(sessionStorage.getItem(PLOT_DATA_STORAGE_KEY))).toEqual({
            chartType: "polar",
            plotData: expect.objectContaining({ rValues: [2, 3] })
        });
        expect(document.querySelector("#expressionErrorContainer").hasAttribute("hidden")).toBe(true);
    });

    it("stores multiple Cartesian expressions together for the viewer tab", () => {
        const form = buildDom({
            chartType: "cartesian",
            functionText: "x\n\n2 * x",
            xaxisRange: "0,2",
            plotName: ""
        });
        useMultilineExpression(form, "x\n\n2 * x");

        generatePlot({ preventDefault: vi.fn(), target: form });

        const result = JSON.parse(sessionStorage.getItem(PLOT_DATA_STORAGE_KEY));
        expect(result.chartType).toBe("cartesian");
        expect(result.plotData.traces.map(trace => trace.plotName)).toEqual([
            "y = x",
            "y = 2 * x"
        ]);
        expect(result.plotData.traces[0].xValues).toHaveLength(100);
        expect(window.open).toHaveBeenCalledTimes(1);
    });

    it("stores multiple polar expressions together for the viewer tab", () => {
        const form = buildDom({
            functionText: "theta\n\n2 * theta",
            thetasToUse: "0,90",
            plotName: ""
        });
        useMultilineExpression(form, "theta\n\n2 * theta");

        generatePlot({ preventDefault: vi.fn(), target: form });

        const result = JSON.parse(sessionStorage.getItem(PLOT_DATA_STORAGE_KEY));
        expect(result.chartType).toBe("polar");
        expect(result.plotData.traces.map(trace => trace.plotName)).toEqual([
            "r = theta",
            "r = 2 * theta"
        ]);
        expect(window.open).toHaveBeenCalledTimes(1);
    });

    it("does not open a plot tab for invalid expressions", () => {
        const form = buildDom({ functionText: "theta @ 2" });

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(window.open).not.toHaveBeenCalled();
        expect(document.querySelector("#expressionErrorContainer").hasAttribute("hidden")).toBe(false);
        expect(document.querySelector("#errorTextInput").value).toContain("Unexpected character");
    });

    it("reports when the browser blocks the plot tab", () => {
        vi.spyOn(window, "open").mockReturnValue(null);
        const form = buildDom();

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(window.alert).toHaveBeenCalledWith(
            "An error occurred: The plot tab was blocked. Allow popups for this site and try again."
        );
        expect(sessionStorage.getItem(PLOT_DATA_STORAGE_KEY)).toBeNull();
    });

    it("alerts and logs errors while generating plot data", () => {
        const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
        vi.spyOn(PolarPlotter, "getPolarPlotData").mockImplementation(() => {
            throw new TypeError("boom");
        });

        const form = buildDom();
        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(alertSpy).toHaveBeenCalledWith("An error occurred: boom");
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(window.open).not.toHaveBeenCalled();
    });

    it("resets form controls and syntax error state", () => {
        buildDom();
        const errorContainer = document.querySelector("#expressionErrorContainer");
        const textarea = document.querySelector("textarea#functionText");
        const errorInput = document.querySelector("#errorTextInput");

        errorContainer.removeAttribute("hidden");
        textarea.classList.add("inputError");
        errorInput.value = "Expected error";

        resetPlotAndInputs();

        expect(errorContainer.hasAttribute("hidden")).toBe(true);
        expect(errorInput.value).toBe("");
        expect(textarea.classList.contains("inputError")).toBe(false);
        expect(document.querySelector("#xValsAreAngles").hasAttribute("checked")).toBe(true);
        expect(document.querySelector("#xValsAreAnglesContainer").style.display).toBe("none");
        expect(document.querySelector("#thetaDisplayModeContainer").style.display).toBe("block");
        expect(document.querySelector("#displayMode").value).toBe("radians");
        expect(document.querySelector('details[itemid="polarPlotInputs"]').style.display).toBe("none");
        expect(document.querySelector('details[itemid="cartesianPlotInputs"]').style.display).toBe("block");
    });

    it("resets Cartesian controls when optional reset elements are absent", () => {
        buildDom({ chartType: "cartesian" });
        document.querySelector('input[name="chartType"][value="polar"]').checked = false;
        document.querySelector('input[name="chartType"][value="cartesian"]').checked = true;
        document.querySelector("#xValsAreAngles").remove();
        document.querySelector("#xValsAreAnglesContainer").remove();
        document.querySelector("#thetaDisplayModeContainer").remove();
        document.querySelector("#displayMode").remove();

        resetPlotAndInputs();

        expect(document.querySelector('details[itemid="cartesianPlotInputs"]').style.display).toBe("none");
        expect(document.querySelector('details[itemid="polarPlotInputs"]').style.display).toBe("block");
    });

    it("updates angular controls for Cartesian plots", () => {
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
    });

    it("updates chart-specific controls when the chart type changes", () => {
        buildDom({ chartType: "cartesian" });
        document.querySelector("textarea#functionText").value = "old expression";

        onChartTypeChange({});

        expect(document.querySelector('details[itemid="cartesianPlotInputs"]').style.display).toBe("block");
        expect(document.querySelector('details[itemid="polarPlotInputs"]').style.display).toBe("none");
        expect(document.querySelector("#xValsAreAnglesContainer").style.display).toBe("block");
        expect(document.querySelector("#xValsAreAngles").checked).toBe(false);
        expect(document.querySelector("#thetaDisplayModeContainer").style.display).toBe("none");
        expect(document.querySelector("textarea#functionText").value).toBe("");

        document.querySelector('input[name="chartType"][value="polar"]').checked = true;
        onChartTypeChange({});
        expect(document.querySelector('details[itemid="polarPlotInputs"]').style.display).toBe("block");
        expect(document.querySelector("#xValsAreAngles").checked).toBe(true);
    });

    it("initializes a form when no optional action controls exist", () => {
        document.body.innerHTML = "<form id='plotConfigForm'></form>";

        expect(() => initializeUI()).not.toThrow();
    });

    it("registers submit and click handlers for plot creation and reset", () => {
        buildDom();
        initializeUI();

        const form = document.querySelector("#plotConfigForm");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        document.querySelector("[data-action='createplot']").click();
        expect(window.open).toHaveBeenCalledTimes(2);

        document.querySelector("[data-action='resetplot']").click();
        expect(document.querySelector("#expressionErrorContainer").hasAttribute("hidden")).toBe(true);
    });
});
