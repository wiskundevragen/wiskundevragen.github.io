window.onload = function () {
	document.getElementById("searchQuery").innerHTML = location.href.split("q=")[1].split("&")[0];
}