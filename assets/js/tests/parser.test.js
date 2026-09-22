import { describe, expect, it } from "vitest";
import Lexer from "../mods/lexer.js";
import Parser from "../mods/parser.js";

function tokensFor(input) {
    return new Lexer(input).tokenize();
}

describe("Parser", () => {
    describe("constructor", () => {
        it("stores the tokens and starts at position zero", () => {
            const tokens = tokensFor("x + 1");
            const parser = new Parser(tokens);

            expect(parser.tokens).toBe(tokens);
            expect(parser.position).toBe(0);
        });
    });

    describe("current", () => {
        it("returns the token at the current position", () => {
            const parser = new Parser(tokensFor("x"));

            expect(parser.current()).toEqual({
                type: "IDENTIFIER",
                value: "x"
            });
        });
    });

    describe("advance", () => {
        it("returns the current token and advances the position", () => {
            const parser = new Parser(tokensFor("x + 1"));

            expect(parser.advance()).toEqual({
                type: "IDENTIFIER",
                value: "x"
            });
            expect(parser.position).toBe(1);
            expect(parser.current()).toEqual({ type: "PLUS", value: "+" });
        });
    });

    describe("match", () => {
        it("consumes and returns true when the type matches", () => {
            const parser = new Parser(tokensFor("x"));

            expect(parser.match("IDENTIFIER")).toBe(true);
            expect(parser.position).toBe(1);
        });

        it("returns false without consuming when the type does not match", () => {
            const parser = new Parser(tokensFor("x"));

            expect(parser.match("NUMBER")).toBe(false);
            expect(parser.position).toBe(0);
        });
    });

    describe("expect", () => {
        it("returns and consumes the expected token", () => {
            const parser = new Parser(tokensFor("x"));

            expect(parser.expect("IDENTIFIER")).toEqual({
                type: "IDENTIFIER",
                value: "x"
            });
            expect(parser.position).toBe(1);
        });

        it("throws when the current token has another type", () => {
            const parser = new Parser(tokensFor("x"));

            expect(() => parser.expect("NUMBER")).toThrow(
                "Expected NUMBER, but found IDENTIFIER"
            );
        });
    });

    describe("parse", () => {
        it("returns the expression and requires EOF", () => {
            expect(new Parser(tokensFor("2 + 3 * 4")).parse()).toEqual({
                type: "BinaryExpression",
                operator: "+",
                left: { type: "NumberLiteral", value: 2 },
                right: {
                    type: "BinaryExpression",
                    operator: "*",
                    left: { type: "NumberLiteral", value: 3 },
                    right: { type: "NumberLiteral", value: 4 }
                }
            });
        });

        it("throws when tokens remain after the expression", () => {
            expect(() => new Parser(tokensFor("1 2")).parse()).toThrow(
                "Expected EOF, but found NUMBER"
            );
        });
    });

    describe("expression", () => {
        it("creates left-associative addition and subtraction", () => {
            const parser = new Parser(tokensFor("8 - 3 + 2"));

            expect(parser.expression()).toEqual({
                type: "BinaryExpression",
                operator: "+",
                left: {
                    type: "BinaryExpression",
                    operator: "-",
                    left: { type: "NumberLiteral", value: 8 },
                    right: { type: "NumberLiteral", value: 3 }
                },
                right: { type: "NumberLiteral", value: 2 }
            });
        });
    });

    describe("term", () => {
        it("creates left-associative multiplication and division", () => {
            const parser = new Parser(tokensFor("12 / 3 * 2"));

            expect(parser.term()).toEqual({
                type: "BinaryExpression",
                operator: "*",
                left: {
                    type: "BinaryExpression",
                    operator: "/",
                    left: { type: "NumberLiteral", value: 12 },
                    right: { type: "NumberLiteral", value: 3 }
                },
                right: { type: "NumberLiteral", value: 2 }
            });
        });
    });

    describe("power", () => {
        it("creates right-associative power expressions", () => {
            const parser = new Parser(tokensFor("2 ^ 3 ^ 4"));

            expect(parser.power()).toEqual({
                type: "BinaryExpression",
                operator: "^",
                left: { type: "NumberLiteral", value: 2 },
                right: {
                    type: "BinaryExpression",
                    operator: "^",
                    left: { type: "NumberLiteral", value: 3 },
                    right: { type: "NumberLiteral", value: 4 }
                }
            });
        });
    });

    describe("unary", () => {
        it("creates nested unary expressions", () => {
            const parser = new Parser(tokensFor("+-5"));

            expect(parser.unary()).toEqual({
                type: "UnaryExpression",
                operator: "+",
                argument: {
                    type: "UnaryExpression",
                    operator: "-",
                    argument: { type: "NumberLiteral", value: 5 }
                }
            });
        });
    });

    describe("primary", () => {
        it("parses number literals", () => {
            expect(new Parser(tokensFor("42")).primary()).toEqual({
                type: "NumberLiteral",
                value: 42
            });
        });

        it("parses identifiers", () => {
            expect(new Parser(tokensFor("radius")).primary()).toEqual({
                type: "Identifier",
                name: "radius"
            });
        });

        it("parses function calls with multiple arguments", () => {
            expect(new Parser(tokensFor("point(1, x + 2)")).primary()).toEqual({
                type: "CallExpression",
                name: "point",
                arguments: [
                    { type: "NumberLiteral", value: 1 },
                    {
                        type: "BinaryExpression",
                        operator: "+",
                        left: { type: "Identifier", name: "x" },
                        right: { type: "NumberLiteral", value: 2 }
                    }
                ]
            });
        });

        it("parses function calls with no arguments", () => {
            expect(new Parser(tokensFor("random()")).primary()).toEqual({
                type: "CallExpression",
                name: "random",
                arguments: []
            });
        });

        it("parses parenthesized expressions", () => {
            expect(new Parser(tokensFor("(1 + 2)")).primary()).toEqual({
                type: "BinaryExpression",
                operator: "+",
                left: { type: "NumberLiteral", value: 1 },
                right: { type: "NumberLiteral", value: 2 }
            });
        });

        it("throws for an unexpected token", () => {
            expect(() => new Parser(tokensFor("+")).primary()).toThrow(
                "Unexpected token PLUS"
            );
        });
    });
});
