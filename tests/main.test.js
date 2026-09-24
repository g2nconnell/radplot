import { beforeEach, describe, expect, it, vi } from "vitest";
import * as PolarPlotter from "../assets/js/mods/polarplotter.js";

const plotlyMock = { newPlot: vi.fn() };
vi.stubGlobal("Plotly", plotlyMock);
vi.mock("https://cdn.plot.ly/plotly-4.1.0.min.js", () => ({
    default: plotlyMock,
}), { virtual: true });

const { generatePlot, initializeUI, resetPlotAndInputs } = await import("../assets/js/main.js");

function buildDom(overrides = {}) {
    const formValues = {
        ignoreRvalueBeyond: "0",
        functionText: "theta",
        thetasToUse: "0,90,180",
        radialaxisRangeStart: "-10",
        radialaxisRangeEnd: "10",
        displayMode: "radians",
        traceMode: "lines",
        pieSliceCount: "24",
        plotName: "Polar Plot",
        layoutTitle: "Polar Plot",
        ...overrides
    };

    document.body.innerHTML = `
        <div id="polarPlot"></div>
        <div id="expressionErrorContainer" hidden>
            <textarea id="functionText" class=""></textarea>
            <input id="errorTextInput" type="text" value="" />
        </div>

        <form id="plotConfigForm">
            <input name="ignoreRvalueBeyond" value="${formValues.ignoreRvalueBeyond}" />
            <input name="functionText" value="${formValues.functionText}" />
            <input name="thetasToUse" value="${formValues.thetasToUse}" />
            <input name="radialaxisRangeStart" value="${formValues.radialaxisRangeStart}" />
            <input name="radialaxisRangeEnd" value="${formValues.radialaxisRangeEnd}" />
            <input name="displayMode" value="${formValues.displayMode}" />
            <input name="traceMode" value="${formValues.traceMode}" />
            <input name="pieSliceCount" value="${formValues.pieSliceCount}" />
            <input name="plotName" value="${formValues.plotName}" />
            <input name="layoutTitle" value="${formValues.layoutTitle}" />
            <button type="submit" data-action="createplot">Create plot</button>
            <button type="button" data-action="resetplot">Reset plot</button>
        </form>

        <table id="rValueTable">
            <tbody></tbody>
        </table>
    `;

    const textarea = document.querySelector("textarea#functionText");
    textarea.value = formValues.functionText;

    return document.querySelector("form#plotConfigForm");
}

describe("main UI handlers", () => {
    beforeEach(() => {
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
        vi.spyOn(PolarPlotter, "getPlotData").mockReturnValue({
            rValues: [2, 3],
            degreeValues: [0, 45],
            thetaValues: [0, 0.785],
            displayMode: "radians",
            plotName: "Polar Plot",
            layoutTitle: "Polar Plot",
            pieSliceCount: 24,
            radialaxisRange: [-2, 2]
        });

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(plotlyMock.newPlot).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll("#rValueTable tbody tr").length).toBe(2);
        expect(document.querySelector("#expressionErrorContainer").hasAttribute("hidden")).toBe(true);
        expect(document.querySelector("#errorTextInput").value).toBe("");
    });

    it("displays a syntax error when the expression cannot be parsed", () => {
        const form = buildDom({ functionText: "theta @ 2" });

        generatePlot({ preventDefault: vi.fn(), target: form });

        expect(document.querySelector("#expressionErrorContainer").hasAttribute("hidden")).toBe(false);
        expect(document.querySelector("textarea#functionText").classList.contains("inputError")).toBe(true);
        expect(document.querySelector("#errorTextInput").value).toContain("Unexpected character");
    });

    it("alerts and logs non-syntax exceptions", () => {
        const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
        vi.spyOn(PolarPlotter, "getPlotData").mockImplementation(() => {
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
    });

    it("registers submit and click handlers for plot creation and reset actions", () => {
        buildDom({ functionText: "theta" });
        vi.spyOn(PolarPlotter, "getPlotData").mockReturnValue({
            rValues: [1],
            degreeValues: [0],
            thetaValues: [0],
            displayMode: "radians",
            plotName: "Polar Plot",
            layoutTitle: "Polar Plot",
            pieSliceCount: 24,
            radialaxisRange: [-1, 1]
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
