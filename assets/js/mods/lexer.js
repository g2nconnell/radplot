/*
The lexer converts characters into tokens.

For example, 

sqrt(6 * cos(-30) - 4)

becomes (approximately) a list of Tokens:

IDENTIFIER("sqrt")
LPAREN
NUMBER(6)
MULTIPLY
IDENTIFIER("cos")
LPAREN
MINUS
NUMBER(30)
RPAREN
MINUS
NUMBER(4)
RPAREN
EOF

Supported Grammar

expression  → term (("+" | "-") term)*
term        → power (("*" | "/") power)*
power       → unary ("^" power)?
unary       → ("+" | "-") unary | primary
primary   → NUMBER
          | IDENTIFIER
          | IDENTIFIER "(" arguments ")"
          | "(" expression ")"

arguments → expression ("," expression)*

*/

export default class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
    }

    tokenize() {
        const tokens = [];

        while (this.position < this.input.length) {
            const char = this.input[this.position];

            // Ignore whitespace
            if (/\s/.test(char)) {
                this.position++;
                continue;
            }

            // Numbers
            if (/[0-9.]/.test(char)) {
                tokens.push(this.readNumber());
                continue;
            }

            // Identifiers: sqrt, sin, cos, x, pi, etc.
            if (/[a-zA-Z_]/.test(char)) {
                tokens.push(this.readIdentifier());
                continue;
            }

            // Operators and punctuation
            const operators = {
                "+": "PLUS",
                "-": "MINUS",
                "*": "MULTIPLY",
                "/": "DIVIDE",
                "^": "POWER",
                "(": "LPAREN",
                ")": "RPAREN",
                ",": "COMMA"
            };

            if (operators[char]) {
                tokens.push({
                    type: operators[char],
                    value: char
                });

                this.position++;
                continue;
            }

            throw new Error(
                `Unexpected character '${char}' at position ${this.position}`
            );
        }

        tokens.push({
            type: "EOF",
            value: null
        });

        return tokens;
    }

    readNumber() {
        const start = this.position;
        let decimalPointSeen = false;

        while (this.position < this.input.length) {
            const char = this.input[this.position];

            if (char === ".") {
                if (decimalPointSeen) {
                    break;
                }

                decimalPointSeen = true;
                this.position++;
                continue;
            }

            if (!/[0-9]/.test(char)) {
                break;
            }

            this.position++;
        }

        const text = this.input.slice(start, this.position);

        if (text === ".") {
            throw new Error("Invalid number");
        }

        return {
            type: "NUMBER",
            value: Number(text)
        };
    }

    readIdentifier() {
        const start = this.position;

        while (
            this.position < this.input.length &&
            /[a-zA-Z0-9_]/.test(this.input[this.position])
        ) {
            this.position++;
        }

        return {
            type: "IDENTIFIER",
            value: this.input.slice(start, this.position)
        };
    }
}
