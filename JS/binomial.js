
faculteiten = [1];
function faculteit(n) {
	if (faculteiten[n]) return faculteiten[n];
	else {
		faculteiten[n] = n * faculteit(n - 1);
		return faculteiten[n];
	}
}

function erreur() {
	if(location.href.split("/en/").length > 1){
		id("result").innerHTML = 'Something went wrong! Please check your inputs';
	}else{
		id("result").innerHTML = 'Er ging iets fout! Controleer de juistheid van je invoer';
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
				id("result").innerHTML = Math.round(v * 1000) / 1000;
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