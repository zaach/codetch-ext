//onerror = alert;
var codetch = opener.codetch || top.codetch;
var gRule_1 = null;
kFixedFontFaceMenuItems = 0;

var gDoClear = false;
function clearHistory(){
	gDoClear = true;
}


function changeSize(el, a){
	var n = parseInt(el.value);
	el.value = n+a+'pt';
	setCodeFormat();
}

function setCodeFormat(){
		gStylesheet = document.styleSheets[1];
		if(gRule_1){
			gStylesheet.deleteRule(gRule_1+2);
			gStylesheet.deleteRule(gRule_1+1);
			gStylesheet.deleteRule(gRule_1);
		}
		gRule_1 = gStylesheet.insertRule('.editor-code textarea{'
		+'color: '+document.getElementById('codecolor').value
		+' !important;font-family: '+document.getElementById('codefont').value
		+' !important;font-size: '+document.getElementById('codefontsize').value
		+' !important;background-color: '+document.getElementById('codebg').value
		+' !important;'+document.getElementById('codecss').value+'}', gStylesheet.cssRules.length);
		gStylesheet.insertRule('.editor-code, .editor-code textbox {'
		+'background-color: '+document.getElementById('codebg').value+'!important;'
		+'}', gStylesheet.cssRules.length);
		// line numbers
		gStylesheet.insertRule('.editor-code .lines *, .editor-code .lines{'
		+'color: '+document.getElementById('codelinenumcolor').value+' !important;'
		+'background-color: '+document.getElementById('codelinenumbg').value+'!important;'
		+'}', gStylesheet.cssRules.length);
		
}

function initPrefWin(){
	var buttonApply = document.documentElement.getButton("help");
	buttonApply.accessKey = localize('Apply').charAt(0);
	buttonApply.label=localize('Apply');

	var all = document.getElementsByAttribute('preftype','*');

	for(var i=0, type,id;i<all.length;i++){
		type = all[i].getAttribute('preftype');
		id = all[i].getAttribute('id');
		switch(type){
			case 'bool': all[i].checked = GetBoolPref(id);
			break;
			case 'string':all[i].value=GetStringPref(id)
			break;
			case 'int':all[i].value=GetIntPref(id);
			break;
			case 'file':all[i].value=GetFilePref(id).path;all[i].file= GetFilePref(id);
			break;
		}
	}
	
	document.getElementById("samplelines").value='1\n2\n3\n4';
	document.getElementById("samplecode").value='function sampleFunction(val){\n	alert(val)\n	return true\n}';
	setCodeFormat();
}

function setFilePref(el, file){
	var savefile = el.file,nfile;
	if(el.file.path != el.value)nfile = DirIO.open(el.value);
	if(nfile && (file || nfile.isDirectory())) savefile = nfile;
	GetPrefs().setComplexValue(el.getAttribute('id'), Components.interfaces.nsILocalFile, savefile);
}

function setPrefs(){

	var all = document.getElementsByAttribute('preftype','*');

	for(var i=0, type,id;i<all.length;i++){
		type = all[i].getAttribute('preftype');
		id = all[i].getAttribute('id');
		switch(type){
			case 'bool': GetPrefs().setBoolPref(id, (all[i].checked));
			break;
			case 'string':GetPrefs().setCharPref(id, all[i].value)
			break;
			case 'int':GetPrefs().setIntPref(id, parseInt(all[i].value));
			break;
			case 'file':setFilePref(all[i]);
			break;
		}
	}

	if(gDoClear) GetPrefs().setCharPref('recentfiles','');
	
	return true;
}

function browseConfig(){
	var dirLocal = DirIO.open(getConfigPath());
	try{
		dirLocal.launch();
	}catch(e){
		alert(dirLocal.path);
	}
}
