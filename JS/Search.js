var prev_handler = window.onload;
window.onload = function () {
	if (prev_handler) {
		prev_handler();
	}
	document.getElementById("searchQuery").innerHTML = location.href.split("q=")[1].split("&")[0];
}