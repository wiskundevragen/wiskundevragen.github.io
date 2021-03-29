
const texOptions = {
	implicit: "hide"
};
var lang = "nl";
const synonyms = ['arctan', 'atan', 'arcsin', 'asin', 'arccos', 'acos', 'ln(', 'log('];
const commonFns = synonyms.concat('exp', 'sin', 'cos', 'tan')

function clearOutputs() {
	id("parsed-function").innerHTML = ''
	id("derived-function").innerHTML = ''
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

		let ev = parseEv(replaceAll(id("evalueren").value, ',', '.'));
		let gaanEval = false;
		if (ev) {
			if (!isNaN(replaceAll(ev, ['Math.exp(1)', 'Math.PI', '*', '/', '+', '-'], ''))) {
				ev = eval(ev);
				gaanEval = true;
				id("evalueren").classList.remove("errorInput")
				id("evalwarn").classList.remove("shown");
				id("evalueren").classList.remove("errorInput");
			} else {
				id("evalueren").classList.add("errorInput")
			}
		} else {
			id("evalueren").classList.remove("errorInput")
			id("evalwarn").classList.remove("shown");
			id("evalueren").classList.remove("errorInput");
		}

		var derivationSucceeded = false;

		try {
			let afvar = id("derive-wrt-to").value;
			if (afvar.replace(/[0-9]/g, '') != afvar || afvar.length > 1) {
				afvar = 'x';
				id("derive-wrt-to").classList.add("errorInput")
			} else {
				id("derive-wrt-to").classList.remove("errorInput")
			}
			let letters = uniques(emptyfunction.replace(/[^a-z]/ig, ''));
			if (letters.length > 1) {
				if (gaanEval) {
					gaanEval = false;
					id("evalwarn").classList.add("shown");
					id("evalueren").classList.add("errorInput");
				}
				if (!afvar) afvar = 'x';
			} else if (letters.length == 1) {
				if (!afvar) afvar = letters;
			} else {
				if (!afvar) afvar = 'x';
			}

			if (!afvar) afvar = 'x';

			if (lang === "en") {
				id("evalueren").placeholder = 'Evaluate in ' + afvar + '=...';
				id("evaluerenLabel").innerHTML = 'Evaluate in ' + afvar + '=...';
			} else {
				id("evalueren").placeholder = 'Evalueren in ' + afvar + '=...';
				id("evaluerenLabel").innerHTML = 'Evalueren in ' + afvar + '=...';
			}

			if (!fn || !fn.length) {
				throw 'fn not defined';
			}

			parsedFn = math.parse(fn);
			simplifiedFn = math.simplify(math.parse(fn));
			if (parsedFn.toTex() != simplifiedFn.toTex()) {
				id("parsed-function").innerHTML = "\\(\\begin{align*}f(" + afvar + ")&=" + parsedFn.toTex({ implicit: 'hide' }) + "\\\\&=" + simplifiedFn.toTex({ implicit: 'hide' }) + "\\end{align*}\\)";
			} else {
				id("parsed-function").innerHTML = "\\(f(" + afvar + ")=" + parsedFn.toTex() + "\\)";
			}

			deriv = calcDeriv(simplifiedFn, false, afvar);
			simplifiedDeriv = calcDeriv(simplifiedFn, true, afvar);
			if (deriv.toTex({ implicit: "hide" }) != simplifiedDeriv.toTex({ implicit: "hide" })) {
				id("derived-function").innerHTML = "\\(\\begin{align*}f'(" + afvar + ")&=" + deriv.toTex(texOptions) + "\\\\ &=" + simplifiedDeriv.toTex(texOptions) + "\\end{align*}\\)";
			} else {
				id("derived-function").innerHTML = "\\(f'(" + afvar + ")=" + deriv.toTex(texOptions) + "\\)";
			}

			derivationSucceeded = true;

			if (gaanEval) {
				id("evalwarn").classList.remove("shown");
				id("evalueren").classList.remove("errorInput");
				id("evaluerenRes").classList.add("shown");
				id("evalPlek").innerHTML = '\\(' + afvar + '=' + ev + '\\)';

				var evalSucceeded = true;
				let derivValue = evaluate(simplifiedDeriv, afvar, ev);
				let fnValue;
				try {
					fnValue = evaluate(simplifiedFn, afvar, ev);
				}catch(err){
					evalSucceeded = false;
				}

				if(evalSucceeded){
					id("echteEvalRes").innerHTML = '\\(f(' + ev + ')=' + fnValue + '\\)<br><br>\\(f\'(' + ev + ')=' + derivValue + '\\)';
				}else {
					id("echteEvalRes").innerHTML = '\\(f\'(' + ev + ')=' + derivValue + '\\)';
				}
			} else {
				id("evaluerenRes").classList.remove("shown");
			}
		} catch (err) {
			console.log(err);
			if (derivationSucceeded) {
				id("evaluerenRes").classList.remove("shown");
			} else {
				clearOutputs();
			}
		}
		MathJax.typeset();
	};
	id("src-functie").addEventListener("input", inputEvent);
	id("derive-wrt-to").addEventListener("input", inputEvent);
	id("evalueren").addEventListener("input", inputEvent);
});

function strip(number) {
	return parseFloat(number).toPrecision(12);
}

function evaluate(fn, afvar, ev) {
	let options = {};
	options[afvar] = ev;
	return math.simplify(strip(Math.round(fn.evaluate(options) * 1e6) / 1e6)).toTex();
}

function calcDeriv(fn, simplify, afvar) {
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