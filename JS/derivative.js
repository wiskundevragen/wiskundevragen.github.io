
const texOptions = {
	implicit: "hide"
};
var lang = "nl";
const synonyms = ['arctan', 'atan', 'arcsin', 'asin', 'arccos', 'acos', 'ln(', 'log('];
const commonFns = synonyms.concat('exp', 'sin', 'cos', 'tan')

function clearOutputs() {
	id("parsedFunction").innerHTML = ''
	id("derivedFunction").innerHTML = ''
	id("evaluationResult").innerHTML = '';
	id("evaluationResultContainer").classList.remove("shown");
}

window.addEventListener('DOMContentLoaded', (event) => {
	if (location.href.split("/en/").length > 1) {
		lang = "en"
	}
	function inputEvent(event) {
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

		let ev = parseEvaluationPoint(replaceAll(id("evaluationPoint").value, ',', '.'));
		let willEvaluate = false;
		if (ev) {
			if (!isNaN(replaceAll(ev, ['Math.exp(1)', 'Math.PI', '*', '/', '+', '-'], ''))) {
				ev = eval(ev);
				willEvaluate = true;
				id("evaluationPoint").classList.remove("errorInput")
				id("evaluationWarning").classList.remove("shown");
				id("evaluationPoint").classList.remove("errorInput");
			} else {
				id("evaluationPoint").classList.add("errorInput")
			}
		} else {
			id("evaluationPoint").classList.remove("errorInput")
			id("evaluationWarning").classList.remove("shown");
			id("evaluationPoint").classList.remove("errorInput");
		}

		var derivationSucceeded = false;

		try {
			let afvar = id("derive-wr-to").value;
			if (afvar.replace(/[0-9]/g, '') != afvar || afvar.length > 1) {
				afvar = 'x';
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
				if (!afvar) afvar = 'x';
			} else if (letters.length == 1) {
				if (!afvar) afvar = letters;
			} else {
				if (!afvar) afvar = 'x';
			}

			if (!afvar) afvar = 'x';

			if (lang === "en") {
				id("evaluationPoint").placeholder = 'Evaluate in ' + afvar + '=...';
				id("evaluationPointLabel").innerHTML = 'Evaluate in ' + afvar + '=...';
			} else {
				id("evaluationPoint").placeholder = 'Evalueren in ' + afvar + '=...';
				id("evaluationPointLabel").innerHTML = 'Evalueren in ' + afvar + '=...';
			}

			if (!targetFunction || !targetFunction.length) {
				throw 'targetFunction not defined';
			}

			parsedFn = math.parse(targetFunction);
			simplifiedFn = math.simplify(math.parse(targetFunction));
			if (parsedFn.toTex() != simplifiedFn.toTex()) {
				id("parsedFunction").innerHTML = "\\(\\begin{align*}f(" + afvar + ")&=" + parsedFn.toTex({ implicit: 'hide' }) + "\\\\&=" + simplifiedFn.toTex({ implicit: 'hide' }) + "\\end{align*}\\)";
			} else {
				id("parsedFunction").innerHTML = "\\(f(" + afvar + ")=" + parsedFn.toTex() + "\\)";
			}

			deriv = calcDeriv(simplifiedFn, false, afvar);
			simplifiedDeriv = calcDeriv(simplifiedFn, true, afvar);
			if (deriv.toTex({ implicit: "hide" }) != simplifiedDeriv.toTex({ implicit: "hide" })) {
				id("derivedFunction").innerHTML = "\\(\\begin{align*}f'(" + afvar + ")&=" + deriv.toTex(texOptions) + "\\\\ &=" + simplifiedDeriv.toTex(texOptions) + "\\end{align*}\\)";
			} else {
				id("derivedFunction").innerHTML = "\\(f'(" + afvar + ")=" + deriv.toTex(texOptions) + "\\)";
			}

			derivationSucceeded = true;

			if (willEvaluate) {
				id("evaluationWarning").classList.remove("shown");
				id("evaluationPoint").classList.remove("errorInput");
				id("evaluationResultContainer").classList.add("shown");
				id("evalPlek").innerHTML = '\\(' + afvar + '=' + ev + '\\)';

				var evalSucceeded = true;
				let derivValue = evaluate(simplifiedDeriv, afvar, ev);
				let targetFunctionValue;
				try {
					targetFunctionValue = evaluate(simplifiedFn, afvar, ev);
				}catch(err){
					evalSucceeded = false;
				}

				if(evalSucceeded){
					id("evaluationResult").innerHTML = '\\(f(' + ev + ')=' + targetFunctionValue + '\\)<br><br>\\(f\'(' + ev + ')=' + derivValue + '\\)';
				}else {
					id("evaluationResult").innerHTML = '\\(f\'(' + ev + ')=' + derivValue + '\\)';
				}
			} else {
				id("evaluationResultContainer").classList.remove("shown");
			}
		} catch (err) {
			console.log(err);
			if (derivationSucceeded) {
				id("evaluationResultContainer").classList.remove("shown");
			} else {
				clearOutputs();
			}
		}
		MathJax.typeset();
	};
	id("sourceFunction").addEventListener("input", inputEvent);
	id("derive-wr-to").addEventListener("input", inputEvent);
	id("evaluationPoint").addEventListener("input", inputEvent);
});

function strip(number) {
	return parseFloat(number).toPrecision(12);
}

function evaluate(targetFunction, afvar, ev) {
	let options = {};
	options[afvar] = ev;
	return math.simplify(strip(Math.round(targetFunction.evaluate(options) * 1e6) / 1e6)).toTex();
}

function calcDeriv(targetFunction, simplify, afvar) {
	if (simplify) {
		return math.simplify(
			math.derivative(simplifiedFn, afvar, { simplify: false })
		);
	} else {
		return math.simplify(
			math.derivative(simplifiedFn, afvar, { simplify: false }),
			["1*n1 -> n1", "-1*n1->-n1", "2-1->1", "3-1->2", "4-1->3", "5-1->4", "6-1->5", "7-1->6", "8-1->7", "9-1->8", "10-1->9", "n1^1->n1"]
		);
	}
}

function parseEvaluationPoint(ev) {
	return addMultiplications(addMultiplications(ev, 'pi', 'Math.PI'), 'e', 'Math.exp(1)');
}

function addMultiplications(expr, delim, rep) {
	let res = '';
	let p = expr.split(delim);
	for (let i = 0; i < p.length; i++) {
		if (!i) {
			res += p[i];
			continue;
		}
		if (res[res.length - 1] != '*' && res.length) res += '*'
		res += rep || delim;
		if (p[i][0] != '*') res += '*';
		res += p[i];
	}
	if (res[res.length - 1] == '*') res = res.substr(0, res.length - 1);
	return res;
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



function displayNum(n) {
	spl = String(n).split(".");
	if (spl.length > 1 && spl[1].length > 5) {
		return spl[0] + "." + spl[1].substr(0, 5) + "\\dots";
	} else {
		return n;
	}
}

function noComplexFrac(n, realV) {
	if (n.split("\frac").length > 1) {
		return displayNum(realV);
	}
	return n;
}