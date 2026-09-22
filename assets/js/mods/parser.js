/*
    Parser constructs an abstract syntax tree AST from Tokens

    A parser would turn:
    sqrt(6 * cos(-30) - 4)
    into something like an abstract syntax tree:
    Function: sqrt
    └── Subtract
        ├── Multiply
        │   ├── 6
        │   └── Function: cos
        │       └── -30
        └── 4

    We'll use four basic node types:
        NumberLiteral
        UnaryExpression
        BinaryExpression
        CallExpression
        Identifier
*/

export default class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    current() {
        return this.tokens[this.position];
    }

    advance() {
        return this.tokens[this.position++];
    }

    match(type) {
        if (this.current().type === type) {
            this.position++;
            return true;
        }

        return false;
    }

    expect(type) {
        const token = this.current();

        if (token.type !== type) {
            throw new Error(
                `Expected ${type}, but found ${token.type}`
            );
        }

        this.position++;
        return token;
    }

    parse() {
        const expression = this.expression();

        this.expect("EOF");

        return expression;
    }

    // expression → term (("+" | "-") term)*
    expression() {
        let node = this.term();

        while (
            this.current().type === "PLUS" ||
            this.current().type === "MINUS"
        ) {
            const operator = this.advance();

            const right = this.term();

            node = {
                type: "BinaryExpression",
                operator: operator.value,
                left: node,
                right: right
            };
        }

        return node;
    }

    // term → power (("*" | "/") power)*
    term() {
        let node = this.power();

        while (
            this.current().type === "MULTIPLY" ||
            this.current().type === "DIVIDE"
        ) {
            const operator = this.advance();

            const right = this.power();

            node = {
                type: "BinaryExpression",
                operator: operator.value,
                left: node,
                right: right
            };
        }

        return node;
    }

    // power → unary ("^" power)?
    power() {
        let node = this.unary();

        if (this.match("POWER")) {
            const right = this.power();

            node = {
                type: "BinaryExpression",
                operator: "^",
                left: node,
                right: right
            };
        }

        return node;
    }

    // unary → ("+" | "-") unary | primary
    unary() {
        if (
            this.current().type === "PLUS" ||
            this.current().type === "MINUS"
        ) {
            const operator = this.advance();

            return {
                type: "UnaryExpression",
                operator: operator.value,
                argument: this.unary()
            };
        }

        return this.primary();
    }

    //     primary   → NUMBER
    //           | IDENTIFIER
    //           | IDENTIFIER "(" arguments ")"
    //           | "(" expression ")"
    // arguments → expression ("," expression)*
    primary() {
        const token = this.current();

        // Number
        if (token.type === "NUMBER") {
            this.advance();

            return {
                type: "NumberLiteral",
                value: token.value
            };
        }

        // Identifier or function call
        if (token.type === "IDENTIFIER") {
            this.advance();

            // Function call
            if (this.match("LPAREN")) {
                const args = [];

                // Handle empty argument list: foo()
                if (!this.match("RPAREN")) {
                    // First argument
                    args.push(this.expression());

                    // Additional arguments
                    while (this.match("COMMA")) {
                        args.push(this.expression());
                    }

                    // Closing parenthesis
                    this.expect("RPAREN");
                }

                return {
                    type: "CallExpression",
                    name: token.value,
                    arguments: args
                };
            }

            // Variable / constant
            return {
                type: "Identifier",
                name: token.value
            };
        }

        // Parenthesized expression
        if (this.match("LPAREN")) {
            const node = this.expression();

            this.expect("RPAREN");

            return node;
        }

        throw new Error(
            `Unexpected token ${token.type}`
        );
    }
}
