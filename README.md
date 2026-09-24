This is a simple polar plotter for simple math equations.  It supports plots in either degrees or radians.  It allows configuring the number of radial axis desired (24, 12, 8, 4).
It includes a parser that reads the supplied math equation text (e.g., "sqrt(10 / cos(2 * theta))") and uses a lexical analyzer to produce a list of tokens.  The tokens then become
input for a parser which produces an AST.  The AST is then used by an evaluator, along with provided variable values to run the equation over various angular values and plots the results, 
along with generating a table of r-values.
This app uses plotly.js as the plotting engine.  Refer to https://github.com/plotly/plotly.js/?tab=MIT-1-ov-file

I made this to simplify my math homework.

The parser currently supports sin, cos, tan, min, max, pow, sqrt and all the basic arithmetic operators and is a good example of such parsers in JavaScript.
