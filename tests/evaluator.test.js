import { describe, expect, it } from "vitest";
import Evaluator from "../assets/js/mods/evaluator.js";

describe("Evaluator", () => {
    describe("constructor", () => {
        it("provides pi and e by default", () => {
            const evaluator = new Evaluator();

            expect(evaluator.variables).toEqual({
                pi: Math.PI,
                e: Math.E
            });
        });

        it("merges custom variables with the defaults", () => {
            const evaluator = new Evaluator({ x: 3, pi: 4 });

            expect(evaluator.variables).toEqual({
                pi: 4,
                e: Math.E,
                x: 3
            });
        });
    });

    describe("evaluate", () => {
        it("evaluates number literals", () => {
            expect(new Evaluator().evaluate({
                type: "NumberLiteral",
                value: 12
            })).toBe(12);
        });

        it("dispatches identifiers, unary expressions, binary expressions, and calls", () => {
            const evaluator = new Evaluator({ x: 5 });

            expect(evaluator.evaluate({ type: "Identifier", name: "x" })).toBe(5);
            expect(evaluator.evaluate({
                type: "UnaryExpression",
                operator: "-",
                argument: { type: "NumberLiteral", value: 3 }
            })).toBe(-3);
            expect(evaluator.evaluate({
                type: "BinaryExpression",
                operator: "+",
                left: { type: "NumberLiteral", value: 2 },
                right: { type: "NumberLiteral", value: 4 }
            })).toBe(6);
            expect(evaluator.evaluate({
                type: "CallExpression",
                name: "abs",
                arguments: [{ type: "NumberLiteral", value: -7 }]
            })).toBe(7);
        });

        it("throws for an unknown AST node type", () => {
            expect(() => new Evaluator().evaluate({ type: "Unknown" })).toThrow(
                "Unknown AST node type: Unknown"
            );
        });
    });

    describe("evaluateIdentifier", () => {
        it("returns the value of a known variable", () => {
            const evaluator = new Evaluator({ radius: 8 });

            expect(evaluator.evaluateIdentifier({
                type: "Identifier",
                name: "radius"
            })).toBe(8);
        });

        it("throws for an unknown variable", () => {
            expect(() => new Evaluator().evaluateIdentifier({
                type: "Identifier",
                name: "radius"
            })).toThrow("Unknown variable 'radius'");
        });
    });

    describe("evaluateUnary", () => {
        it.each([
            ["+", 6, 6],
            ["-", 6, -6]
        ])("evaluates the %s unary operator", (operator, value, expected) => {
            expect(new Evaluator().evaluateUnary({
                type: "UnaryExpression",
                operator,
                argument: { type: "NumberLiteral", value }
            })).toBe(expected);
        });

        it("throws for an unknown unary operator", () => {
            expect(() => new Evaluator().evaluateUnary({
                type: "UnaryExpression",
                operator: "!",
                argument: { type: "NumberLiteral", value: 1 }
            })).toThrow("Unknown unary operator '!'");
        });
    });

    describe("evaluateBinary", () => {
        it.each([
            ["+", 7],
            ["-", 1],
            ["*", 12],
            ["/", 4 / 3],
            ["^", 64]
        ])("evaluates the %s binary operator", (operator, expected) => {
            expect(new Evaluator().evaluateBinary({
                type: "BinaryExpression",
                operator,
                left: { type: "NumberLiteral", value: 4 },
                right: { type: "NumberLiteral", value: 3 }
            })).toBe(expected);
        });

        it("throws for an unknown binary operator", () => {
            expect(() => new Evaluator().evaluateBinary({
                type: "BinaryExpression",
                operator: "%",
                left: { type: "NumberLiteral", value: 4 },
                right: { type: "NumberLiteral", value: 3 }
            })).toThrow("Unknown operator '%'");
        });
    });

    describe("evaluateCall", () => {
        it.each([
            ["sqrt", [9], 3],
            ["abs", [-4], 4],
            ["max", [2, 8], 8],
            ["min", [2, 8], 2],
            ["pow", [2, 3], 8],
            ["sin", [Math.PI / 2], 1],
            ["cos", [0], 1],
            ["tan", [0], 0],
            ["log", [100], 2],
            ["ln", [Math.E], 1]
        ])("evaluates the %s function", (name, values, expected) => {
            const node = {
                type: "CallExpression",
                name,
                arguments: values.map(value => ({
                    type: "NumberLiteral",
                    value
                }))
            };

            expect(new Evaluator().evaluateCall(node)).toBeCloseTo(expected);
        });

        it("evaluates call arguments before invoking the function", () => {
            const evaluator = new Evaluator({ x: 6 });
            const node = {
                type: "CallExpression",
                name: "pow",
                arguments: [
                    { type: "Identifier", name: "x" },
                    { type: "NumberLiteral", value: 2 }
                ]
            };

            expect(evaluator.evaluateCall(node)).toBe(36);
        });

        it("throws for an unknown function", () => {
            expect(() => new Evaluator().evaluateCall({
                type: "CallExpression",
                name: "round",
                arguments: []
            })).toThrow("Unknown function 'round'");
        });
    });
});
