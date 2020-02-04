refreshMath = MathJax.typeset;
fixMath = function () {
	var mathEls = document.querySelectorAll("mathEl");
	for (let i = 0; i < mathEls.length; i++) {
		let el = mathEls[i];
		el.innerHTML = "\\(" + el.getAttribute("data") + "\\)";
	}
	refreshMath();
}

window.onload = function () {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('../service-worker.js');
		});
	}

	fixMath();
};
