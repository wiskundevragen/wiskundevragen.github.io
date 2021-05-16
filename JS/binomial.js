
faculteiten = [1];
function faculteit(n) {
	if (faculteiten[n]) return faculteiten[n];
	else {
		faculteiten[n] = n * faculteit(n - 1);
		return faculteiten[n];
	}
}

function isEngels(){
	return location.href.split("/en/").length > 1;
}

function erreur() {
	if(isEngels()){
		id("result").innerHTML = '<b>Something went wrong! Please check your inputs</b>';
	}else{
		id("result").innerHTML = '<b>Er ging iets fout! Controleer de juistheid van je invoer</b>';
	}
}

function handleInput() {
	try {
		var nval = id("n").value;
		var kval = id("k").value;
		if (!nval || !kval) {
			id("result").innerHTML = "";
			return;
		}
		nval = +nval;
		kval = +kval;
		if (nval < 0 || isNaN(nval) || isNaN(kval)) {
			erreur();
		} else {
			if (kval < 0 || (kval > nval)) {
				id("result").innerHTML = 0;
			} else {
				var v = faculteit(nval) / (faculteit(kval) * (faculteit(nval - kval)));
				if(isFinite(v)) {
					id("result").innerHTML = Math.round(v);
				} else {
					if(isEngels()){
						id("result").innerHTML = "<b>Outcome too large</b>";
					}else {
						id("result").innerHTML = "<b>Uitkomst te groot</b>";
					}
				}
			}
		}
	} catch (e) {
		console.log(e);
		erreur();
	}
}

window.addEventListener("DOMContentLoaded", (event) => {
	id("n").addEventListener("input", handleInput);
	id("k").addEventListener("input", handleInput);
});