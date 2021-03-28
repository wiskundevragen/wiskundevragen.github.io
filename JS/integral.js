const texOptions = {
	implicit: "hide"
};
var lang = "nl";
const synonyms = ['arctan', 'atan', 'arcsin', 'asin', 'arccos', 'acos', 'ln(', 'log('];
const commonFns = synonyms.concat('exp', 'sin', 'cos', 'tan')

function clearOutputs() {
	id("parsed-function").innerHTML = '';
	id("integrated-function").innerHTML = '';
	id("echteEvalRes").innerHTML = '';
	id("evaluerenRes").classList.remove("shown");
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

		let fn = id("src-functie").value;
		if (fn.split("(").length != fn.split(")").length || fn[fn.length - 1] == '^' || fn[fn.length - 1] == '*') {
			clearOutputs();
			return;
		}
		if (fn.split("=").length > 2) {
			id("src-functie").classList.add("errorInput");
			return;
		}
		fn = fn.split("=")[fn.split("=").length - 1];
		id("src-functie").classList.remove("errorInput");
		let emptyfunction = fn;
		fn = parseSynonyms(fn);
		for (let i = 0; i < commonFns.length; i++) {
			emptyfunction = replaceAll(emptyfunction, commonFns[i], "");
		}
		emptyfunction = replaceAll(emptyfunction, "(", "");
		emptyfunction = replaceAll(emptyfunction, ")", "");

		let evO = parseEv(replaceAll(id("evalueren").value, ',', '.'));
		let evB = parseEv(replaceAll(id("evaluerenB").value, ',', '.'));
		let gaanEval = false;
		if (evB && evO) {
			gaanEval = true;
			if (isNaN(replaceAll(evO, ['Math.exp', 'Math.PI', '*', '/', '+', '-', '(', ')'], ''))) {
				gaanEval = false;
				id("evalueren").classList.add("errorInput")
			} else {
				evO = eval(evO);
				id("evalueren").classList.remove("errorInput")
			}
			if (isNaN(replaceAll(evB, ['Math.exp', 'Math.PI', '*', '/', '+', '-', '(', ')'], ''))) {
				gaanEval = false;
				id("evaluerenB").classList.add("errorInput")
			} else {
				evB = eval(evB);
				id("evaluerenB").classList.remove("errorInput")
			}
			if (gaanEval) {
				id("evalwarn").classList.remove("shown")
			}
		} else {
			id("evalueren").classList.remove("errorInput")
			id("evaluerenB").classList.remove("errorInput")
			id("evalwarn").classList.remove("shown");
		}

		var integrerenGelukt = false;


		try {
			let intvar = id("integreren-naar").value;
			if (intvar.replace(/[0-9]/g, '') != intvar || intvar.length > 1) {
				intvar = 'x';
				id("integreren-naar").classList.add("errorInput")
			} else {
				id("integreren-naar").classList.remove("errorInput")
			}
			let letters = uniques(emptyfunction.replace(/[^a-z]/ig, ''));
			if (letters.length > 1) {
				if (gaanEval) {
					gaanEval = false;
					id("evalwarn").classList.add("shown");
					id("evalueren").classList.add("errorInput");
					id("evaluerenB").classList.add("errorInput");
				}
				if (!intvar) intvar = 'x';
			} else if (letters.length == 1) {
				if (!intvar) intvar = letters;
			} else {
				if (!intvar) intvar = 'x';
			}
			if (!intvar) intvar = 'x';

			if (lang === "en") {
				id("evalueren").placeholder = 'Evaluate with lower bound ' + intvar + '=...';
				id("evaluerenLabel").innerHTML = 'Evaluate with lower bound ' + intvar + '=...';
				id("evaluerenB").placeholder = 'Evaluate with upper bound ' + intvar + '=...';
				id("evaluerenLabelB").innerHTML = 'Evaluate with upper bound ' + intvar + '=...';
			} else {
				id("evalueren").placeholder = 'Evalueren met ondergrens ' + intvar + '=...';
				id("evaluerenLabel").innerHTML = 'Evalueren met ondergrens ' + intvar + '=...';
				id("evaluerenB").placeholder = 'Evalueren met bovengrens ' + intvar + '=...';
				id("evaluerenLabelB").innerHTML = 'Evalueren met bovengrens ' + intvar + '=...';
			}


			if (!fn || !fn.length) {
				throw "fn is not defined"
			}
			parsedFn = math.parse(fn);
			simplifiedFn = math.simplify(math.parse(fn));
			if (parsedFn.toTex() != simplifiedFn.toTex()) {
				id("parsed-function").innerHTML = "\\(\\begin{align*}f(" + intvar + ")&=" + parsedFn.toTex({ implicit: 'hide' }) + "\\\\&=" + simplifiedFn.toTex({ implicit: 'hide' }) + "\\end{align*}\\)";
			} else {
				id("parsed-function").innerHTML = "\\(f(" + intvar + ")=" + parsedFn.toTex() + "\\)";
			}

			integr = calcIntegral(simplifiedFn, false, intvar);
			simplifiedInt = calcIntegral(simplifiedFn, true, intvar);
			if (integr.toTex({ implicit: "hide" }) != simplifiedInt.toTex({ implicit: "hide" })) {
				id("integrated-function").innerHTML = "\\(\\begin{align*}F(" + intvar + ")=\\int{f(" + intvar + ")}d" + intvar + "&=" + integr.toTex(texOptions) + "\\\\ &=" + simplifiedInt.toTex(texOptions) + "\\end{align*}\\)";
			} else {
				id("integrated-function").innerHTML = "\\(F(" + intvar + ")=\\int{f(" + intvar + ")d" + intvar + "}=" + integr.toTex(texOptions) + "\\)";
			}

			integrerenGelukt = true;

			if (gaanEval) {
				id("evalwarn").classList.remove("shown");
				id("evalueren").classList.remove("errorInput");
				id("evaluerenRes").classList.add("shown");
				id("evalPlekO").innerHTML = '\\(' + intvar + '=' + displayNum(evO) + '\\)';
				id("evalPlekB").innerHTML = '\\(' + intvar + '=' + displayNum(evB) + '\\)';

				let intValO = evaluate(simplifiedInt, intvar, evO);
				let intValB = evaluate(simplifiedInt, intvar, evB);
				let intValNumO = evaluate(simplifiedInt, intvar, evO, true);
				let intValNumB = evaluate(simplifiedInt, intvar, evB, true);

				intValO = noComplexFrac(intValO, intValNumO);
				intValB = noComplexFrac(intValB, intValNumB);

				id("echteEvalRes").innerHTML = '\\(\\begin{align*}\\int^{' + displayNum(evB) + '}_{' + displayNum(evO) + '} f(' + intvar + ')d' + intvar + ' &= F(' + displayNum(evB) + ') - F(' + displayNum(evO) + ') \\\\&= \\left[' + simplifiedInt.toTex(texOptions) + '\\right]^{' + displayNum(evB) + "}_{" + displayNum(evO) + "}\\\\&=" + intValB + " - " + intValO + "\\\\&=" + displayNum(intValNumB - intValNumO) + '\\end{align*}\\)';
			} else {
				id("evaluerenRes").classList.remove("shown");
			}
		} catch (err) {
			if (String(err).split("Unable to find").length > 1) {
				MathJax.typeset();
				if (lang === "en") {
					id("integrated-function").innerHTML = "<b>Unable to compute integral...</b>";
				} else {
					id("integrated-function").innerHTML = "<b>Geen primitieve gevonden...</b>";
				}
			} else {
				if (integrerenGelukt) {
					id("evaluerenRes").classList.remove("shown");
					id("evalueren").classList.add("errorInput");
					id("evaluerenB").classList.add("errorInput");
				} else {
					clearOutputs();
				}
			}
		}
		MathJax.typeset();
	};
	id("src-functie").addEventListener("input", inputEvent);
	id("integreren-naar").addEventListener("input", inputEvent);
	id("evalueren").addEventListener("input", inputEvent);
	id("evaluerenB").addEventListener("input", inputEvent);
});

function strip(number) {
	return parseFloat(number).toPrecision(12);
}

function evaluate(fn, intvar, ev, noSimplify) {
	let options = {};
	options[intvar] = ev;
	if (noSimplify) {
		return strip(Math.round(fn.evaluate(options) * 1e6) / 1e6);
	} else {
		return math.simplify(strip(Math.round(fn.evaluate(options) * 1e6) / 1e6)).toTex();
	}
}

function calcIntegral(fn, simplify, intvar) {
	if (simplify) {
		return math.simplify(
			math.integral(simplifiedFn, intvar, { simplify: false })
		);
	} else {
		return math.simplify(
			math.integral(simplifiedFn, intvar, { simplify: false }),
			["1*n1 -> n1", "-1*n1->-n1", "2-1->1", "3-1->2", "4-1->3", "5-1->4", "6-1->5", "7-1->6", "8-1->7", "9-1->8", "10-1->9", "n1^1->n1"]
		);
	}
}

function parseEv(ev) {
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

function parseSynonyms(fn) {
	for (let i = 0; i < synonyms.length; i += 2) {
		fn = replaceAll(fn, synonyms[i], synonyms[i + 1]);
	}
	return fn;
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