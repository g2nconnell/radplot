import { describe, expect, it } from "vitest";
import Lexer from "../mods/lexer.js";

describe("Lexer", () => {
    describe("constructor", () => {
        it("stores the input and starts at position zero", () => {
            const lexer = new Lexer("sin(x)");

            expect(lexer.input).toBe("sin(x)");
            expect(lexer.position).toBe(0);
        });
    });

    describe("tokenize", () => {
        it("tokenizes numbers, identifiers, operators, and punctuation", () => {
            const lexer = new Lexer("sqrt(6 * cos(-30), x^2) + pi / 2");

            expect(lexer.tokenize()).toEqual([
                { type: "IDENTIFIER", value: "sqrt" },
                { type: "LPAREN", value: "(" },
                { type: "NUMBER", value: 6 },
                { type: "MULTIPLY", value: "*" },
                { type: "IDENTIFIER", value: "cos" },
                { type: "LPAREN", value: "(" },
                { type: "MINUS", value: "-" },
                { type: "NUMBER", value: 30 },
                { type: "RPAREN", value: ")" },
                { type: "COMMA", value: "," },
                { type: "IDENTIFIER", value: "x" },
                { type: "POWER", value: "^" },
                { type: "NUMBER", value: 2 },
                { type: "RPAREN", value: ")" },
                { type: "PLUS", value: "+" },
                { type: "IDENTIFIER", value: "pi" },
                { type: "DIVIDE", value: "/" },
                { type: "NUMBER", value: 2 },
                { type: "EOF", value: null }
            ]);
        });

        it("ignores whitespace and tokenizes an empty input as EOF", () => {
            expect(new Lexer("  \t\n").tokenize()).toEqual([
                { type: "EOF", value: null }
            ]);
        });

        it("throws for unexpected characters", () => {
            expect(() => new Lexer("x @ 2").tokenize()).toThrow(
                "Unexpected character '@' at position 2"
            );
        });

        it("can be called again after reaching the end", () => {
            const lexer = new Lexer("1");

            expect(lexer.tokenize()).toEqual([
                { type: "NUMBER", value: 1 },
                { type: "EOF", value: null }
            ]);
            expect(lexer.tokenize()).toEqual([
                { type: "EOF", value: null }
            ]);
        });
    });

    describe("readNumber", () => {
        it("reads integers and decimal numbers", () => {
            const lexer = new Lexer("123.45x");

            expect(lexer.readNumber()).toEqual({ type: "NUMBER", value: 123.45 });
            expect(lexer.position).toBe(6);
        });

        it("stops before a second decimal point", () => {
            const lexer = new Lexer("1.2.3");

            expect(lexer.readNumber()).toEqual({ type: "NUMBER", value: 1.2 });
            expect(lexer.position).toBe(3);
        });

        it("rejects a standalone decimal point", () => {
            expect(() => new Lexer(".").readNumber()).toThrow("Invalid number");
        });
    });

    describe("readIdentifier", () => {
        it("reads letters, digits, and underscores after the first character", () => {
            const lexer = new Lexer("value_2+");

            expect(lexer.readIdentifier()).toEqual({
                type: "IDENTIFIER",
                value: "value_2"
            });
            expect(lexer.position).toBe(7);
        });

        it("stops at the first non-identifier character", () => {
            const lexer = new Lexer("sin(");

            expect(lexer.readIdentifier()).toEqual({
                type: "IDENTIFIER",
                value: "sin"
            });
            expect(lexer.position).toBe(3);
        });
    });
});
