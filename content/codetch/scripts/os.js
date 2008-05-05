var gOS = "";
const gWin = "Win";
const gUNIX = "UNIX";
const gMac = "Mac";

var platform = navigator.platform.toLowerCase();

if (platform.indexOf("win") != -1)
	gOS = gWin;
else if (platform.indexOf("mac") != -1)
	gOS = gMac;
else if (platform.indexOf("unix") != -1 || platform.indexOf("linux") != -1 || platform.indexOf("sun") != -1)
	gOS = gUNIX;
else
	gOS = gUNIX;
// Add other tests?