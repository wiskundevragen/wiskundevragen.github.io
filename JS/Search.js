window.onload = function () {
	console.log("?????????");
	document.getElementById("searchQuery").innerHTML = location.href.split("q=")[1].split("&")[0];
}