const startT = +new Date();
const texOptions = {
	implicit: "hide"
};
var simplifiedInt;
var lang = "nl";
let clearEvalTimeout;
const synonyms = ['arctan', 'atan', 'arcsin', 'asin', 'arccos', 'acos', 'ln(', 'log('];
const commonFns = synonyms.concat('exp', 'sin', 'cos', 'tan')

function clearOutputs() {
	id("parsedFunction").innerHTML = '';
	id("integratedFunction").innerHTML = '';
	id("evaluationResult").innerHTML = '';
	id("evaluationResultContainer").classList.remove("shown");
}

window.addEventListener('DOMContentLoaded', function () {
	if (location.href.split("/en/").length > 1) {
		lang = "en"
	}

	id("sourceFunction", "integrate-wr-to", "evaluationPoint", "upperEvaluationPoint").forEach((el) => {
		el.addEventListener("input", function () {
			inputEvent(el.id)
		})
	});
});

function inputEvent(inputID) {
	let preventFnLatexUpdate = false;
	if (inputID === "evaluationPoint" || inputID === "upperEvaluationPoint") {
		preventFnLatexUpdate = true;
	}
	fixInputLabels();

	let targetFunction = id("sourceFunction").value;
	if (targetFunction.length === 0 || targetFunction.split("(").length != targetFunction.split(")").length || last(targetFunction) == '^' || last(targetFunction) == '*' || last(targetFunction) == "/") {
		clearOutputs();
		simplifiedInt = "";
		integrationResult = "";
		id("evaluationWarning").classList.remove("shown");
		id("evaluationPoint").classList.remove("errorInput");
		id("upperEvaluationPoint").classList.remove("errorInput");
		return;
	}

	if (targetFunction.split("=").length > 2) {
		id("sourceFunction").classList.add("errorInput");
		simplifiedInt = "";
		integrationResult = "";
		id("evaluationWarning").classList.remove("shown");
		id("evaluationPoint").classList.remove("errorInput");
		id("upperEvaluationPoint").classList.remove("errorInput");
		return;
	}

	targetFunction = last(targetFunction.split("="));
	id("sourceFunction").classList.remove("errorInput");
	let emptyFunction = targetFunction;
	targetFunction = parseSynonyms(targetFunction);
	for (let i = 0; i < commonFns.length; i++) {
		emptyFunction = replaceAll(emptyFunction, commonFns[i], "");
	}
	emptyFunction = replaceAll(emptyFunction, "(", "");
	emptyFunction = replaceAll(emptyFunction, ")", "");

	var integrerenGelukt = false;

	try {
		let variables = determineIntegrationVariable(emptyFunction);
		let intVariable = variables.result;
		let multiVariate = variables.multiVariate;
		setVariableStrings(intVariable);

		if(preventFnLatexUpdate){
			integrerenGelukt = true;
		}else {
			integrerenGelukt = doIntegration(targetFunction, intVariable);
		}

		evPoints = determineEvaluationPoints(multiVariate, targetFunction);

		if (evPoints.willEvaluate) {
			let lowerEvalPoint = evPoints.lower;
			let upperEvalPoint = evPoints.upper;
			id("evaluationWarning").classList.remove("shown");
			id("evaluationPoint").classList.remove("errorInput");
			id("upperEvaluationPoint").classList.remove("errorInput");
			id("evaluationResultContainer").classList.add("shown");
			id("evalPlekO").innerHTML = '\\(' + intVariable + '=' + displayNum(lowerEvalPoint) + '\\)';
			id("evalPlekB").innerHTML = '\\(' + intVariable + '=' + displayNum(upperEvalPoint) + '\\)';

			let intValO = evaluate(simplifiedInt, intVariable, lowerEvalPoint);
			let intValB = evaluate(simplifiedInt, intVariable, upperEvalPoint);
			let intValNumO = evaluate(simplifiedInt, intVariable, lowerEvalPoint, true);
			let intValNumB = evaluate(simplifiedInt, intVariable, upperEvalPoint, true);

			intValO = noComplexFrac(intValO, intValNumO);
			intValB = noComplexFrac(intValB, intValNumB);


			let finalAnswer = intValNumB - intValNumO;
			if (numberIsTruncated(finalAnswer)) {
				finalAnswer = '\\approx ' + firstDigitsOfNum(finalAnswer);
			} else {
				finalAnswer = '= ' + displayNum(finalAnswer);
			}

			id("evaluationResult").innerHTML =
				`\\(\\begin{align*}\\int^{${displayNum(upperEvalPoint)}}_{${displayNum(lowerEvalPoint)}}f(${intVariable})d${intVariable}&=
				F(${displayNum(upperEvalPoint)}) - F(${displayNum(lowerEvalPoint)})
				\\\\&=\\left[${simplifiedInt.toTex(texOptions)}\\right]^{${displayNum(upperEvalPoint)}}_{${displayNum(lowerEvalPoint)}}
				\\\\&=${displayNum(intValB)} - ${displayNum(intValO)}
				\\\\&${finalAnswer}\\end{align*}\\)`;


		} else {
			id("evaluationResultContainer").classList.remove("shown");
			// clearEvalTimeout = setTimeout(function(){
			// 	id("evaluationResultContainer")
			// })
		}
	} catch (err) {
		if (String(err).split("Unable to find").length > 1) {
			if (lang === "en") {
				id("integratedFunction").innerHTML = "<b>Unable to compute integral...</b>";
			} else {
				id("integratedFunction").innerHTML = "<b>Geen primitieve gevonden...</b>";
			}
			id("evaluationWarning").classList.remove("shown");
			id("evaluationPoint").classList.remove("errorInput");
			id("upperEvaluationPoint").classList.remove("errorInput");
		} else {
			if (integrerenGelukt) {
				console.log("quoi");
				id("evaluationResultContainer").classList.remove("shown");
				id("evaluationWarning").classList.add("shown");
				id("evaluationPoint").classList.add("errorInput");
				id("upperEvaluationPoint").classList.add("errorInput");
			} else {
				clearOutputs();
			}
		}
	}
	fixLatex(preventFnLatexUpdate);
}

function determineIntegrationVariable(emptyFunction) {
	result = id("integrate-wr-to").value;

	if (result.replace(/[0-9]/g, '') != result || result.length > 1) {
		result = 'x';
		id("integrate-wr-to").classList.add("errorInput")
	} else {
		id("integrate-wr-to").classList.remove("errorInput")
	}


	let letters = uniques(replaceAll(replaceAll(emptyFunction.replace(/[^a-z]/ig, ''), "e", ""), "pi", ""));
	if (letters.length > 1) {
		if (!result) result = 'x';
	} else if (letters.length == 1) {
		if (!result) result = letters;
	} else {
		if (!result) result = 'x';
	}

	if (!result) result = 'x';

	return {
		result: result,
		multiVariate: letters.length > 1
	}
}


function doIntegration(targetFunction, intVariable) {
	if (!targetFunction || !targetFunction.length) {
		simplifiedInt = "";
		integrationResult = "";
		throw "targetFunction is not defined"
	}

	parsedFn = math.parse(targetFunction);
	simplifiedFn = math.simplify(math.parse(targetFunction));
	if (parsedFn.toTex() != simplifiedFn.toTex()) {
		id("parsedFunction").innerHTML = "\\(\\begin{align*}f(" + intVariable + ")&=" + parsedFn.toTex({ implicit: 'hide' }) + "\\\\&=" + simplifiedFn.toTex({ implicit: 'hide' }) + "\\end{align*}\\)";
	} else {
		id("parsedFunction").innerHTML = "\\(f(" + intVariable + ")=" + parsedFn.toTex() + "\\)";
	}

	integrationResult = calcIntegral(simplifiedFn, false, intVariable);
	simplifiedInt = calcIntegral(simplifiedFn, true, intVariable);
	if (integrationResult.toTex({ implicit: "hide" }) != simplifiedInt.toTex({ implicit: "hide" })) {
		id("integratedFunction").innerHTML = "\\(\\begin{align*}F(" + intVariable + ")=\\int{f(" + intVariable + ")}d" + intVariable + "&=" + integrationResult.toTex(texOptions) + "\\\\ &=" + simplifiedInt.toTex(texOptions) + "\\end{align*}\\)";
	} else {
		id("integratedFunction").innerHTML = "\\(F(" + intVariable + ")=\\int{f(" + intVariable + ")d" + intVariable + "}=" + integrationResult.toTex(texOptions) + "\\)";
	}

	return true;
}

function determineEvaluationPoints(multiVariate, targetFunction) {
	let input1 = id("evaluationPoint");
	let input2 = id("upperEvaluationPoint");
	let result = {};
	result.willEvaluate = false;

	if(!simplifiedInt) return result;

	if (multiVariate && input1.value && input2.value) {
		id("evaluationWarning").classList.add("shown");
		id("evaluationPoint").classList.add("errorInput");
		id("upperEvaluationPoint").classList.add("errorInput");
		return result;
	}

	let permittedStrings = ['Math.exp', 'Math.PI', 'Math.log', '*', '/', '+', '-', '(', ')'];

	result.lower = parseEvaluationPoint(replaceAll(input1.value, ',', '.'));
	result.upper = parseEvaluationPoint(replaceAll(input2.value, ',', '.'));

	console.log(result.upper);
	if (result.upper && result.lower) {
		try {
			if (isNaN(replaceAll(result.lower, permittedStrings, '')) || isNaN(eval(result.lower))) {
				input1.classList.add("errorInput");
				console.log("wat");
				return result;
			} else {
				result.lower = eval(result.lower);
				input1.classList.remove("errorInput");
			}
		} catch (e) {
			input1.classList.add("errorInput");
			console.log("wat");
			return result;
		}

		try {
			if (isNaN(replaceAll(result.upper, permittedStrings, '')) || isNaN(eval(result.upper))) {
				console.log("wat");
				input2.classList.add("errorInput");
				return result;
			} else {
				result.upper = eval(result.upper);
				input2.classList.remove("errorInput");
			}
		} catch (e) {
			console.log("wat");
			input2.classList.add("errorInput");
			return result;
		}

		id("evaluationWarning").classList.remove("shown");
		result.willEvaluate = true;
	} else {
		input1.classList.remove("errorInput");
		input2.classList.remove("errorInput");
		id("evaluationWarning").classList.remove("shown");
	}

	console.log(result);
	return result;
}

function setVariableStrings(intVariable) {
	if (lang === "en") {
		id("evaluationPoint").placeholder = 'Evaluate with lower bound ' + intVariable + '=...';
		id("evaluationPointLabel").innerHTML = 'Evaluate with lower bound ' + intVariable + '=...';
		id("upperEvaluationPoint").placeholder = 'Evaluate with upper bound ' + intVariable + '=...';
		id("upperEvaluationPointLabel").innerHTML = 'Evaluate with upper bound ' + intVariable + '=...';
	} else {
		id("evaluationPoint").placeholder = 'Evalueren met ondergrens ' + intVariable + '=...';
		id("evaluationPointLabel").innerHTML = 'Evalueren met ondergrens ' + intVariable + '=...';
		id("upperEvaluationPoint").placeholder = 'Evalueren met bovengrens ' + intVariable + '=...';
		id("upperEvaluationPointLabel").innerHTML = 'Evalueren met bovengrens ' + intVariable + '=...';
	}
}


function strip(number) {
	return parseFloat(number).toPrecision(12);
}

function last(item) {
	return item[item.length - 1];
}

function evaluate(targetFunction, intVariable, ev, noSimplify) {
	let options = {};
	options[intVariable] = ev;
	if (noSimplify) {
		return strip(Math.round(targetFunction.evaluate(options) * 1e6) / 1e6);
	} else {
		return math.simplify(strip(Math.round(targetFunction.evaluate(options) * 1e6) / 1e6)).toTex();
	}
}

function calcIntegral(targetFunction, simplify, intVariable) {
	if (simplify) {
		return math.simplify(
			math.integral(simplifiedFn, intVariable, { simplify: false })
		);
	} else {
		return math.simplify(
			math.integral(simplifiedFn, intVariable, { simplify: false }),
			["1*n1 -> n1", "-1*n1->-n1", "2-1->1", "3-1->2", "4-1->3", "5-1->4", "6-1->5", "7-1->6", "8-1->7", "9-1->8", "10-1->9", "n1^1->n1"]
		);
	}
}

function parseEvaluationPoint(ev) {
	let result = ev;
	result = addMultiplicationsByDelim(result, "pi", "Math.PI");
	result = addMultiplicationsByDelim(result, "e", "Math.exp(1)");
	result = addMultiplicationsByDelim(result, "ln(", "Math.log(");

	for (let i = 0; i < result.length; i++) {
		if (i > 0) {
			if (!isNaN(result[i]) && result[i - 1] == ")") {
				result = result.substr(0, i) + "*" + result.substr(i);
			}
		}
		if (i < result.length - 1) {
			if (!isNaN(result[i]) && result[i + 1] == "(") {
				result = result.substr(0, i + 1) + "*" + result.substr(i + 1);
			}
		}
	}

	result = replaceAll(result, "^", "**")

	return result;
}

function addMultiplicationsByDelim(expr, delim, replaceBy) {
	let parts = expr.split(delim);
	let result = parts[0];
	let lastChar = last(result);

	for (let i = 1; i < parts.length; i++) {
		lastChar = last(result);

		if ((!isNaN(lastChar) || lastChar == ")") && result.length > 0) {
			result += '*'
		}

		result += replaceBy || delim;
		if ((!isNaN(parts[i][0]) || parts[i][0] == "(") && replaceBy.substr(-1) !== "(") {
			result += '*';
		}
		result += parts[i];
	}

	if (last(result) == '*') {
		result = result.substr(0, result.length - 1);
	}

	return result;
}

function uniques(str) {
	let array = str.split("");
	let res = [];
	for (let i = 0; i < array.length; i++) {
		const element = array[i];
		if (res.indexOf(element) === -1) {
			res.push(element);
		}
	}
	return res.join("");
}

function replaceAll(str, match, newV) {
	if (typeof match === 'object') {
		let res = str;
		for (let i = 0; i < match.length; i++) {
			res = replaceAll(res, match[i], newV);
		}
		return res;
	}
	oldVal = '';
	while (oldVal != str) {
		oldVal = str;
		str = str.replace(match, newV);
	}
	return str;
}

function parseSynonyms(targetFunction) {
	for (let i = 0; i < synonyms.length; i += 2) {
		targetFunction = replaceAll(targetFunction, synonyms[i], synonyms[i + 1]);
	}
	return targetFunction;
}

function displayNum(n) {
	let suffix = "";
	let scientificDelim = "\\cdot10^";
	let splitScientific = String(n).split(scientificDelim)
	if (splitScientific.length > 1) {
		suffix = scientificDelim + splitScientific[1];
		n = splitScientific[0];
	}
	if (numberIsTruncated(n)) {
		return firstDigitsOfNum(n) + "\\ldots" + suffix;
	} else {
		return fixFPError(n) + suffix;
	}
}

function firstDigitsOfNum(n) {
	return String(n).split(".")[0] + "." + String(n).split(".")[1].substr(0, 5);
}

function numberIsTruncated(n) {
	n = fixFPError(n);
	let splitString = String(n).split(".");
	return splitString.length > 1 && splitString[1].length > 5;
}

function fixFPError(n) {
	let splitString = String(n).split(".");
	if (splitString.length > 1 && splitString[1].length >= 5) {
		if (splitString[1].substr(0, 5).substr(-3) == "000") {
			let decimals = removeTrailingZeroes(splitString[1].substr(0, 5));
			if (decimals.length === 0) {
				return splitString[0];
			} else {
				return splitString[0] + "." + decimals;
			}
		} else {
			return n;
		}
	} else {
		return n;
	}
}

function removeTrailingZeroes(n) {
	let result = n;
	while (result[result.length - 1] === "0") {
		result = result.substr(0, result.length - 1);
	}
	return result;
}

function noComplexFrac(n, realV) {
	if (n.split("\\frac").length > 1) {
		return displayNum(realV);
	}
	return n;
}


function fixInputLabels() {
	let els = document.querySelectorAll(".form");
	for (let i = 0; i < els.length; i++) {
		const el = els[i];
		let label = document.querySelector("label[for=\"" + el.id + "\"]");
		if (el.value) {
			if (label) {
				label.classList.remove("hidden");
			}
		} else {
			if (label) {
				label.classList.add("hidden");
			}
		}
	}
}

function fixLatex(preventFunctionUpdate) {
	let elements = ["evaluationResult", "evalPlekO", "evalPlekB"];
	if(!preventFunctionUpdate){
		elements.push("parsedFunction", "integratedFunction")
	}
	MathJax.typeset(id(elements));
}