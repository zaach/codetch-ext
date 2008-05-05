
// gets string of clipboard contents
function getClipboard() {
  var pastetext='';

  try {
		var clip = Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard);
		var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);

		trans.addDataFlavor("text/unicode");
		clip.getData(trans,clip.kGlobalClipboard);

		var str=new Object();
		var strLength=new Object();

		trans.getTransferData("text/unicode",str,strLength);

		if (str) str=str.value.QueryInterface(Components.interfaces.nsISupportsString);
		if (str) pastetext=str.data.substring(0,strLength.value / 2);

  } catch (ex) {
    dump("Caught an exception in navigator.js, getClipboard(): " + ex + "\n");
    //return "";
  }
  return pastetext;
}

function copyToClipboard(string) {
    var str = Components.classes["@mozilla.org/supports-string;1"].
    createInstance(Components.interfaces.nsISupportsString);

    if (!str) return false;
    str.data=string;

    var trans = Components.classes["@mozilla.org/widget/transferable;1"].
    createInstance(Components.interfaces.nsITransferable);

    if (!trans) return false;

    trans.addDataFlavor("text/unicode");
    trans.setTransferData("text/unicode",str,string.length*2);

    var clipid=Components.interfaces.nsIClipboard;
    var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
    if (!clip) return false;

    clip.setData(trans,null,clipid.kGlobalClipboard);
	return true;
}