import Lexer from "./lexer.js";
import Parser from "./parser.js";
import Evaluator from "./evaluator.js";
export default class Configuration {

    constructor(formData) {
        this.currentExpression = "";
        this.thetafn = null;
        this.ignoreRvalueBeyond = formData.get("ignoreRvalueBeyond");
        this.thetasToUse = this.getThetasToUse(formData);
        this.layoutTitle = formData.get("layoutTitle");
        this.plotName = formData.get("plotName") + "       ";
        this.pieSliceCount = formData.get("pieSliceCount");
        this.displayMode = formData.get("displayMode");
        this.radialaxisRange = this.getRadialAxisRange(formData);
        this.traceMode = formData.get("traceMode");
        this.includeExpressionInTitle = true;
        this.ast = null;
        try {
            const expression = formData.get("functionText");
            const lexer = new Lexer(expression);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            const ast = parser.parse();
            this.ast = ast;
            const thetaFn = function(theta) { return this.calculate({theta: theta}); }.bind(this);
            this.thetafn = thetaFn;
            this.currentExpression =  expression;
        } catch (error) {
            throw new SyntaxError(error.message);
        }
    }

    calculate(variables = {}) {
        let retVal;
        const ast = this.ast;
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

    getRadialAxisRange(formData) {
        let range = null;
        const rangeStartString = formData.get("radialaxisRangeStart");
        const rangeEndString = formData.get("radialaxisRangeEnd");
        if (rangeStartString && rangeEndString) {
            try {
                const rangeStart = parseInt(rangeStartString);
                const rangeEnd = parseInt(rangeEndString);
                range = [rangeStart, rangeEnd];
            } catch (error) {
                console.log(error);
            }
        }
        return range;
    }

    getRvalueFn() {
        const rValueFunction = (theta, config = {} ) => {
            const retValueArray = [];
            let rValue = this.thetafn(theta);
            if (rValue != NaN && rValue >= 0 && (this.ignoreRvalueBeyond === 0 || (this.ignoreRvalueBeyond > 0 && rValue <= this.ignoreRvalueBeyond))) {
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
