import Lexer from "./lexer.js";
import Parser from "./parser.js";
import Evaluator from "./evaluator.js";
export default class Configuration {

    constructor(formData) {
        this.currentExpression = "";
        this.thetafn = null;
        this.chartType = formData.get("chartType");
        this.xValsAreAngles = formData.get("xValsAreAngles") === "on";
        this.ignoreRvalueBeyond = parseInt(formData.get("ignoreRvalueBeyond"));
        this.thetasToUse = this.getThetasToUse(formData);
        this.layoutTitle = formData.get("layoutTitle");
        this.plotName = formData.get("plotName") + "       ";
        this.xaxisTickCount = formData.get("xaxisTickCount");
        this.displayMode = formData.get("thetaDisplayMode");
        this.traceMode = formData.get("traceMode");
        this.includeExpressionInTitle = true;
        this.xaxisRange = formData.get("xaxisRange") ? formData.get("xaxisRange").split(',').map(Number) : null;
        this.yaxisRange = formData.get("yaxisRange") ? formData.get("yaxisRange").split(',').map(Number) : null;
        this.sampleCount = formData.get("sampleCount") ? parseInt(formData.get("sampleCount")) : 100;
        this.optionalDesiredXValues = formData.get("desiredXValues") ? formData.get("desiredXValues").split(',').map(Number) : null;
        this.ast = null;
        const expressionText = formData.get("functionText") ?? "";
        const expressionTexts = expressionText
            .split(/\r?\n\s*\r?\n/)
            .map(expression => expression.trim())
            .filter(Boolean);
        if (expressionTexts.length === 0) {
            throw new SyntaxError("Enter at least one expression.");
        }

        this.expressions = expressionTexts.map((expression, index) => {
            try {
                const lexer = new Lexer(expression);
                const tokens = lexer.tokenize();
                const parser = new Parser(tokens);
                return { expression, ast: parser.parse() };
            } catch (error) {
                const message = expressionTexts.length > 1
                    ? `Expression ${index + 1}: ${error.message}`
                    : error.message;
                throw new SyntaxError(message);
            }
        });
        this.currentExpression = this.expressions[0].expression;
        this.ast = this.expressions[0].ast;
        this.thetafn = x => this.calculate({ theta: x, x });
    }

    getExpressionConfig(expression) {
        const plotName = this.plotName.trim();
        return {
            ...this,
            currentExpression: expression.expression,
            ast: expression.ast,
            plotName: plotName && this.expressions.length > 1
                ? `${plotName} (${expression.expression})`
                : this.plotName,
            calculate: variables => this.calculate(variables, expression.ast),
            thetafn: x => this.calculate({ theta: x, x }, expression.ast),
            getRvalueFn: () => this.getRvalueFn(expression.ast)
        };
    }

    calculate(variables = {}, ast = this.ast) {
        let retVal;
        if (ast) {
            const evaluator = new Evaluator(variables);
            retVal = evaluator.evaluate(ast);
        }
        return retVal;
    }

    getThetasToUse(formData) {
        let thetas = null;
        const thetasString = formData.get("thetasToUse");
        if (thetasString) {
            thetas = [];
            const degreeValues = thetasString.split(',');
            for (const degree of degreeValues) {
                let num;
                try {
                    num = parseInt(degree);
                    thetas.push(num);
                } catch(error) {
                    console.log(error);
                }
            }
        }
        return thetas;
    }

    getRvalueFn(ast = this.ast) {
        const rValueFunction = (theta, config = {} ) => {
            const retValueArray = [];
            const isPolar = config.chartType === 'polar';
            const rValue = this.calculate({ theta, x: theta }, ast);
            if (Number.isFinite(rValue) && (!isPolar || rValue >= 0 && (this.ignoreRvalueBeyond === 0 || (this.ignoreRvalueBeyond > 0 && rValue <= this.ignoreRvalueBeyond)))) {
                // if equation uses a square root, return both the positive and negative values of r. Otherwise, return only the positive value of r.
                retValueArray.push(rValue.toFixed(1));
                retValueArray.push((-1 * rValue).toFixed(1));
            } else {
                retValueArray.push(NaN);
            }
            return retValueArray;
        }
        return rValueFunction;
    }

}
