import { describe, expect, it } from "vitest";
import Configuration from "../assets/js/mods/configuration.js";

function formData(values = {}) {
    return {
        get(name) {
            return values[name] ?? null;
        }
    };
}

describe("Configuration", () => {
    describe("constructor", () => {
        it("loads form values and builds the expression AST", () => {
            const config = new Configuration(formData({
                ignoreRvalueBeyond: 0,
                chartType: "polar",
                thetasToUse: "0,90,180",
                layoutTitle: "Polar plot",
                plotName: "Cardioid",
                xaxisTickCount: "24",
                thetaDisplayMode: "radians",
                xaxisRange: "-2,2",
                traceMode: "full",
                functionText: "2 * theta"
            }));

            expect(config.currentExpression).toBe("2 * theta");
            expect(config.thetafn).toEqual(expect.any(Function));
            expect(config.ignoreRvalueBeyond).toBe(0);
            expect(config.thetasToUse).toEqual([0, 90, 180]);
            expect(config.layoutTitle).toBe("Polar plot");
            expect(config.plotName).toBe("Cardioid       ");
            expect(config.xaxisTickCount).toBe("24");
            expect(config.displayMode).toBe("radians");
            expect(config.xaxisRange).toEqual([-2, 2]);
            expect(config.traceMode).toBe("full");
            expect(config.includeExpressionInTitle).toBe(true);
            expect(config.ast).toEqual({
                type: "BinaryExpression",
                operator: "*",
                left: { type: "NumberLiteral", value: 2 },
                right: { type: "Identifier", name: "theta" }
            });
        });

        it("wraps invalid expressions in a SyntaxError", () => {
            expect(() => new Configuration(formData({
                functionText: "theta @ 2"
            }))).toThrowError(new SyntaxError(
                "Unexpected character '@' at position 6"
            ));
        });
    });

    describe("calculate", () => {
        it("evaluates the configured expression with supplied variables", () => {
            const config = new Configuration(formData({
                functionText: "theta + offset"
            }));

            expect(config.calculate({ theta: 2, offset: 5 })).toBe(7);
        });

        it("returns undefined when no AST is configured", () => {
            const config = new Configuration(formData({ functionText: "1" }));
            config.ast = null;

            expect(config.calculate()).toBeUndefined();
        });
    });

    describe("getThetasToUse", () => {
        it("converts a comma-separated list to integers", () => {
            const config = new Configuration(formData({ functionText: "1" }));

            expect(config.getThetasToUse(formData({
                thetasToUse: "0, 45,180"
            }))).toEqual([0, 45, 180]);
        });

        it("returns null when no theta list is provided", () => {
            const config = new Configuration(formData({ functionText: "1" }));

            expect(config.getThetasToUse(formData())).toBeNull();
        });
    });

    describe("xaxisRange", () => {
        it("converts the configured range endpoints to numbers", () => {
            const config = new Configuration(formData({
                functionText: "1",
                xaxisRange: "-5,15"
            }));

            expect(config.xaxisRange).toEqual([-5, 15]);
        });

        it("returns null when no range is provided", () => {
            const config = new Configuration(formData({ functionText: "1" }));

            expect(config.xaxisRange).toBeNull();
        });
    });

    describe("getRvalueFn", () => {
        it("returns positive and negative radial values for a nonnegative result", () => {
            const config = new Configuration(formData({
                chartType: "polar",
                ignoreRvalueBeyond: 0,
                functionText: "theta"
            }));
            const rValueFn = config.getRvalueFn();

            expect(rValueFn(2, config)).toEqual(["2.0", "-2.0"]);
        });

        it("returns NaN for negative results", () => {
            const config = new Configuration(formData({
                chartType: "polar",
                ignoreRvalueBeyond: 0,
                functionText: "-theta"
            }));

            expect(config.getRvalueFn()(2, config)).toEqual([NaN]);
        });

        it("returns NaN when the configured upper limit is exceeded", () => {
            const config = new Configuration(formData({
                chartType: "polar",
                ignoreRvalueBeyond: 5,
                functionText: "theta"
            }));

            expect(config.getRvalueFn()(6, config)).toEqual([NaN]);
        });
    });
});
