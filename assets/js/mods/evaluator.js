const functions = {
    sqrt: Math.sqrt,

    abs: Math.abs,

    max: Math.max,

    min: Math.min,

    pow: Math.pow,

    sin: x => Math.sin(x),

    cos: x => Math.cos(x),

    tan: x => Math.tan(x),

    log: Math.log10,

    ln: Math.log
};

export default class Evaluator {
    constructor(variables = {}) {
        this.variables = {
            pi: Math.PI,
            e: Math.E,
            ...variables
        };
    }

    evaluate(node) {
        switch (node.type) {

            case "NumberLiteral":
                return node.value;

            case "Identifier":
                return this.evaluateIdentifier(node);

            case "UnaryExpression":
                return this.evaluateUnary(node);

            case "BinaryExpression":
                return this.evaluateBinary(node);

            case "CallExpression":
                return this.evaluateCall(node);

            default:
                throw new Error(
                    `Unknown AST node type: ${node.type}`
                );
        }
    }

    evaluateIdentifier(node) {
        if (!(node.name in this.variables)) {
            throw new Error(
                `Unknown variable '${node.name}'`
            );
        }

        return this.variables[node.name];
    }

    evaluateUnary(node) {
        const value = this.evaluate(node.argument);

        switch (node.operator) {
            case "+":
                return value;

            case "-":
                return -value;

            default:
                throw new Error(
                    `Unknown unary operator '${node.operator}'`
                );
        }
    }

    evaluateBinary(node) {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);

        switch (node.operator) {
            case "+":
                return left + right;

            case "-":
                return left - right;

            case "*":
                return left * right;

            case "/":
                return left / right;

            case "^":
                return Math.pow(left, right);

            default:
                throw new Error(
                    `Unknown operator '${node.operator}'`
                );
        }
    }

    evaluateCall(node) {
        const functionName = node.name;

        if (!(functionName in functions)) {
            throw new Error(
                `Unknown function '${functionName}'`
            );
        }

        // Evaluate every argument
        const args = node.arguments.map(
            argument => this.evaluate(argument)
        );

        // Call the JavaScript function with all arguments
        return functions[functionName](...args);
    }
}
