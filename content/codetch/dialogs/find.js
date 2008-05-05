
var codetch = opener.codetch || top.codetch;

function initDialog (){
//document.getElementById('query').focus();
document.getElementById('query').value = getClipboard();
document.getElementById('query').select();
if(window.arguments){
	document.getElementById('tabbox').selectedTab = document.getElementById(window.arguments[0]);
	document.getElementById('tabbox').className = window.arguments[0]+'pane';
}
}

function doFind (){
	var r = codetch.findNext(
		document.getElementById('query').value,
		document.getElementById('case').checked,
		document.getElementById('regex').checked,
		document.getElementById('wrap').checked,
		true);
	if(!r) {
		alert("No matches found");
		return false;
	}
	opener.focus();
	return true;
}

function doReplace (){
	var code = codetch.getPanel('code');
	var s = code.element.selectionStart,
	e = code.element.selectionEnd;
	code.element.setSelectionRange(s,s);
	if(doFind() && s==code.element.selectionStart && e==code.element.selectionEnd){
		code.replaceText(document.getElementById('replacetext').value);
		doFind ();
	}
}

function doFindAll (){
	var files = document.getElementById('allopendocs').selected;
	var func = files?codetch.findAllInOpen:codetch.findAll;
	var results = func.call(codetch,
		document.getElementById('query').value,
		document.getElementById('replacetext').value,
		document.getElementById('case').checked,
		document.getElementById('regex').checked,
		document.getElementById('wrap').checked,
		document.getElementById('selection').selected);
	if(!results) {
		alert("No matches found");
		return false;
	}
	opener.fillSearchResults(results);
	opener.focus();
	return true;
}

function doReplaceAll (){
	var files = document.getElementById('allopendocs').selected;
	var func = files?codetch.findAllInOpen:codetch.findAll;
	var results = func.call(codetch,
		document.getElementById('query').value,
		document.getElementById('replacetext').value,
		document.getElementById('case').checked,
		document.getElementById('regex').checked,
		document.getElementById('wrap').checked,
		document.getElementById('selection').selected,
		true);
	if(!results) {
		alert("No matches found");
		return false;
	}
	opener.fillSearchResults(results);
	opener.focus();
	return true;
}

function doCancel (){
	codetch.getCurrentEditor().element.focus();
}