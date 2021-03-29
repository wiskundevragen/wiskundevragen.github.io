function fixMath() {
	var mathEls = document.querySelectorAll("mathEl");
	for (let i = 0; i < mathEls.length; i++) {
		let el = mathEls[i];
		el.innerHTML = "\\(" + el.getAttribute("data") + "\\)";
	}
	MathJax.typeset();
}


function id() {
	let idList = arguments;
	if(typeOf(arguments[0]) === "Array"){
		idList = arguments[0];
	}
	if(idList.length === 1){
		return document.getElementById(String(idList[0]));
	}else{
		let result = [];
		for (let i = 0; i < idList.length; i++) {
			let el = document.getElementById(idList[i]);
			if(el) result.push(el);
		}
		return result;
	}
}


window.onload = function () {
	// if (search) {
	// 	document.getElementById("searchQuery").innerHTML = location.href.split("q=")[1].split("&")[0];
	// }
	// if ('serviceWorker' in navigator) {
	// 	navigator.serviceWorker.register('../service-worker.js', {
	// 		scope: '.' // <--- THIS BIT IS REQUIRED
	// 	}).then(function (registration) {
	// 		// Registration was successful
	// 		console.log('ServiceWorker registration successful with scope: ', registration.scope);
	// 	}, function (err) {
	// 		// registration failed :(
	// 		console.log('ServiceWorker registration failed: ', err);
	// 	});
	// }

	if (!home) fixMath();


	id('search').addEventListener('focus', function () {
		id("searchBox").style.background = 'rgba(255, 255, 255, 0.80)';
		id("searchIcon").style.color = 'black';
		id("search").style.color = 'black';
	});

	id("search").addEventListener("focusout", function () {
		if (id("search").value) return true;
		id("searchBox").style.background = 'rgba(255, 255, 255, 0.29)';
		id("searchIcon").style.color = 'white';
		id("search").style.color = 'white';
	});

	id("search").addEventListener("keyup", function (e) {
		if (e.keyCode == 13) {
			send();
			return false;
		}
	});

	id("balance").addEventListener("click", function () {
		id('search').focus();
	});

	id("searchIcon").addEventListener("click", send);
};

function send() {
	if (encodeURI) {
		location = 'https://www.google.com/search?q=site%3Awiskundevragen.github.io+' + encodeURI(id("search").value);
	} else {
		location = 'https://www.google.com/search?q=site%3Awiskundevragen.github.io+' + id("search").value;
	}
};
