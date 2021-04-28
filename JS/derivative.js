
const texOptions = {
	implicit: "hide"
};
var lang = "nl";
const synonyms = ['arctan', 'atan', 'arcsin', 'asin', 'arccos', 'acos', 'ln(', 'log('];
const commonFns = synonyms.concat('exp', 'sin', 'cos', 'tan', 'sqrt');

window.addEventListener('DOMContentLoaded', (event) => {
	if (location.href.split("/en/").length > 1) {
		lang = "en"
	}
	id("sourceFunction").addEventListener("input", inputEvent);
	id("derive-wr-to").addEventListener("input", inputEvent);
	id("evaluationPoint").addEventListener("input", inputEvent);
});

function inputEvent(event) {
	ga.getAll()[0].send("event", lang + "-DerivativeInputs", "type", event.target.id)

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
	let targetFunction = id("sourceFunction").value;
	if (targetFunction.split("(").length != targetFunction.split(")").length || targetFunction[targetFunction.length - 1] == '^' || targetFunction[targetFunction.length - 1] == '*') {
		clearOutputs();
		return;
	}
	if (targetFunction.split("=").length > 2) {
		id("sourceFunction").classList.add("errorInput");
		return;
	}
	targetFunction = targetFunction.split("=")[targetFunction.split("=").length - 1];
	id("sourceFunction").classList.remove("errorInput");
	let emptyFunction = targetFunction;
	targetFunction = parseSynonyms(targetFunction);
	for (let i = 0; i < commonFns.length; i++) {
		emptyFunction = replaceAll(emptyFunction, commonFns[i], "");
	}
	emptyFunction = replaceAll(emptyFunction, "(", "");
	emptyFunction = replaceAll(emptyFunction, ")", "");

	let evScan = determineEvPoint();
	let evPoint = evScan.evPoint;
	let willEvaluate = evScan.willEvaluate;

	var derivationSucceeded = false;

	try {
		let derivVarResult = determineDerivVar(emptyFunction, willEvaluate);
		let derivVar = derivVarResult.result;
		willEvaluate = derivVarResult.willEvaluate;

		if (lang === "en") {
			id("evaluationPoint").placeholder = 'Evaluate in ' + derivVar + '=...';
			id("evaluationPointLabel").innerHTML = 'Evaluate in ' + derivVar + '=...';
		} else {
			id("evaluationPoint").placeholder = 'Evalueren in ' + derivVar + '=...';
			id("evaluationPointLabel").innerHTML = 'Evalueren in ' + derivVar + '=...';
		}

		if (!targetFunction || !targetFunction.length) {
			throw 'targetFunction not defined';
		}

		parsedFn = math.parse(targetFunction);
		simplifiedFn = math.simplify(math.parse(targetFunction));
		if(event.target.id !== "evaluationPoint") {
			if (parsedFn.toTex() != simplifiedFn.toTex()) {
				id("parsedFunction").innerHTML = "\\(\\begin{align*}f(" + derivVar + ")&=" + parsedFn.toTex({ implicit: 'hide' }) + "\\\\&=" + simplifiedFn.toTex({ implicit: 'hide' }) + "\\end{align*}\\)";
			} else {
				id("parsedFunction").innerHTML = "\\(f(" + derivVar + ")=" + parsedFn.toTex() + "\\)";
			}
		}

		deriv = calcDeriv(simplifiedFn, false, derivVar);
		simplifiedDeriv = calcDeriv(simplifiedFn, true, derivVar);
		if(event.target.id !== "evaluationPoint") {
			if (deriv.toTex({ implicit: "hide" }) != simplifiedDeriv.toTex({ implicit: "hide" })) {
				id("derivedFunction").innerHTML = "\\(\\begin{align*}f'(" + derivVar + ")&=" + deriv.toTex(texOptions) + "\\\\ &=" + simplifiedDeriv.toTex(texOptions) + "\\end{align*}\\)";
			} else {
				id("derivedFunction").innerHTML = "\\(f'(" + derivVar + ")=" + deriv.toTex(texOptions) + "\\)";
			}
		}

		derivationSucceeded = true;

		if (willEvaluate) {
			id("evaluationWarning").classList.remove("shown");
			id("evaluationPoint").classList.remove("errorInput");
			id("evaluationResultContainer").classList.add("shown");
			id("evalPlek").innerHTML = '\\(' + derivVar + '=' + displayNum(evPoint) + '\\)';

			var evalSucceeded = true;
			let derivValue = evaluate(simplifiedDeriv, derivVar, evPoint);
			let realDerivValue = evaluate(simplifiedDeriv, derivVar, evPoint, true);
			let complexDerivFracFix = noComplexFrac(derivValue, realDerivValue);
			let derivIsApproximated = numberIsTruncated(derivValue) || complexDerivFracFix.fixed;
			let funcValIsApproximated = false;
			let targetFunctionValue;
			let realTargetFunctionValue;

			try {
				targetFunctionValue = evaluate(simplifiedFn, derivVar, evPoint);
				realTargetFunctionValue = evaluate(simplifiedFn, derivVar, evPoint, true);
				let complexFracFix = noComplexFrac(targetFunctionValue, realTargetFunctionValue);
				fixedFracs = complexFracFix.fixed;
				targetFunctionValue = complexFracFix.value;
				funcValIsApproximated = fixedFracs || numberIsTruncated(targetFunctionValue);
			} catch (err) {
				evalSucceeded = false;
			}

			if (evalSucceeded) {
				id("evaluationResult").innerHTML = `\\(f(${displayNum(evPoint)})${funcValIsApproximated ? "\\approx" : "="}${displayNum(targetFunctionValue, true)}\\)<br><br>\\(f\'(${displayNum(evPoint)})${derivIsApproximated ? "\\approx" : "="}${displayNum(derivValue, true)}\\)`;
			} else {
				id("evaluationResult").innerHTML = `\\(f\'(${displayNum(evPoint)})${derivIsApproximated ? "\\aprox" : "="}${displayNum(derivValue, true)}\\)`;
			}
		} else {
			id("evaluationResultContainer").classList.remove("shown");
		}
	} catch (err) {
		if (derivationSucceeded) {
			id("evaluationResultContainer").classList.remove("shown");
		} else {
			clearOutputs();
		}
	}

	let elements = id(["evaluationResult", "evalPlek"]);
	if(event.target.id !== "evaluationPoint") {
		elements = elements.concat(id(["parsedFunction", "derivedFunction"]));
	}
	MathJax.typeset(elements);
}

function determineDerivVar(emptyFunction, willEvaluate) {
	let result = id("derive-wr-to").value;
	if (result.replace(/[0-9]/g, '') != result || result.length > 1) {
		result = 'x';
		id("derive-wr-to").classList.add("errorInput")
	} else {
		id("derive-wr-to").classList.remove("errorInput")
	}
	let letters = uniques(emptyFunction.replace(/[^a-z]/ig, ''));
	if (letters.length > 1) {
		if (willEvaluate) {
			willEvaluate = false;
			id("evaluationWarning").classList.add("shown");
			id("evaluationPoint").classList.add("errorInput");
		}
		if (!result) result = 'x';
	} else if (letters.length == 1) {
		if (!result) result = letters;
	} else {
		if (!result) result = 'x';
	}

	if (!result) result = 'x';

	return {
		result: result,
		willEvaluate: willEvaluate
	};
}

function clearOutputs() {
	id("parsedFunction").innerHTML = ''
	id("derivedFunction").innerHTML = ''
	id("evaluationResult").innerHTML = '';
	id("evaluationResultContainer").classList.remove("shown");
	id("evaluationPoint").classList.remove("errorInput")
	id("evaluationWarning").classList.remove("shown");
}

function determineEvPoint() {
	let result = {};
	result.evPoint = parseEvaluationPoint(replaceAll(id("evaluationPoint").value, ',', '.'));
	result.willEvaluate = false;
	if (("" + result.evPoint).length) {
		if (!isNaN(replaceAll(result.evPoint, ['Math.exp(1)', 'Math.PI', '*', '/', '+', '-'], ''))) {
			result.evPoint = eval(result.evPoint);
			result.willEvaluate = true;
			id("evaluationPoint").classList.remove("errorInput")
			id("evaluationWarning").classList.remove("shown");
		} else {
			id("evaluationPoint").classList.add("errorInput")
		}
	} else {
		id("evaluationPoint").classList.remove("errorInput")
		id("evaluationWarning").classList.remove("shown");
	}
	return result;
}

function strip(number) {
	return parseFloat(number).toPrecision(12);
}

function last(item) {
	return item[item.length - 1];
}

function evaluate(targetFunction, derivVar, ev, preventTex) {
	let options = {};
	options[derivVar] = ev;
	let result = strip(targetFunction.evaluate(options));
	if (preventTex) {
		return result;
	} else {
		return math.simplify(result).toTex();
	}
}

function calcDeriv(simplifiedFn, simplify, derivVar) {
	if (simplify) {
		return math.simplify(
			math.derivative(simplifiedFn, derivVar, { simplify: false })
		);
	} else {
		return math.simplify(
			math.derivative(simplifiedFn, derivVar, { simplify: false }),
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
	let ar = str.split("");
	let res = [];
	for (let i = 0; i < ar.length; i++) {
		const a = ar[i];
		if (res.indexOf(a) === -1) {
			res.push(a);
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



function displayNum(n, noTex) {
	if (!noTex) n = math.parse(n).toTex();
	let suffix = "";
	let scientificDelim = "\\cdot10^";
	let splitScientific = String(n).split(scientificDelim)
	if (splitScientific.length > 1) {
		if (+n.split("\\cdot10^{")[1].split("}")[0] < -7) {
			return 0;
		}
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
	return splitString.length > 1 && splitString[1].length > 5 && !(String(n).split("\\cdot10^{").length > 1 && +n.split("\\cdot10^{")[1].split("}")[0] < 7);
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
	if (abs(realV) <= 1e-8) return {
		value: 0,
		fixed: false
	}
	if (n.split("\\frac").length > 1) {
		return {
			value: displayNum(realV, true),
			fixed: true
		}
	}
	return {
		value: displayNum(n, true),
		fixed: false
	};
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

function abs(n){
	return (n < 0 ? -n : n);
}