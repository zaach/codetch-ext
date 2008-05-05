// main preferences script

// default pref array
const DEF = [];

var gPrefsBranch = null;
var gPrefsService = null;
var gStylesheet = null;
var gRule_1 = 0;

function initPrefs() {
	try {
		var prefBranch = GetPrefs(), i;
		if (GetBoolPref("firstrun")){
			prefBranch.setBoolPref("firstrun", "false");
		}
		loadRecentFiles();
		loadExternalBrowsers();
		// set editor css style rules
		setCodePrefs();

		// set temporary file checkbox
		document.getElementById('use-temps-menuitem').setAttribute("checked", GetBoolPref("previewtmp"));
		document.getElementById('cmd_toggleLineNumbers').setAttribute("checked", GetBoolPref("linenumbers"));
		document.getElementById('cmd_toggleLivePreview').setAttribute("checked", GetBoolPref("autorefresh"));
		setLineNumbers();

		if(!GetFilePref("snippetdir")){
			var dirLocal = DirIO.open(getConfigPath());
			dirLocal.append("snippets");
			GetPrefs().setComplexValue("snippetdir", Components.interfaces.nsILocalFile, dirLocal);
		}
		if(!GetFilePref("templatedir")){
			var dirLocal = DirIO.open(getConfigPath());
			dirLocal.append("templates");
			GetPrefs().setComplexValue("templatedir", Components.interfaces.nsILocalFile, dirLocal);
		}
		/*
		if(!GetFilePref("projectdir")){
			var dirLocal = DirIO.open(getConfigPath());
			dirLocal.append("projects");
			GetPrefs().setComplexValue("projectdir", Components.interfaces.nsILocalFile, dirLocal);
		}
		*/
	
		// Why doesn't this work? Changing the wrap attribute has no effect on the textboxes? No text wrapping...
		/*
		if (GetBoolPref("codewrap")){
			for(i=0;i<codetch.docs.length;i++)
				codetch.docs[i].panel.panels['code'].element.removeAttribute('wrap');
		}else{
			for(i=0;i<codetch.docs.length;i++)
				codetch.docs[i].panel.panels['code'].element.setAttribute('wrap', 'off');
		}
		alert(codetch.docs[0].panel.panels['code'].element.getAttribute('wrap'));
		//*/

	} catch (ex) {alert(ex);}
}
function setCodePrefs(){
		gStylesheet = document.styleSheets[document.styleSheets.length-1];
		gRule_1 = gStylesheet.insertRule('.editor-code textarea{'
		+'color: '+GetStringPref('codecolor')
		+' !important;font-family: '+GetStringPref('codefont')
		+' !important;font-size: '+GetStringPref('codefontsize')
		+' !important;background-color: '+GetStringPref('codebg')
		+' !important;'+GetStringPref('codecss')+'}', gStylesheet.cssRules.length);
		gStylesheet.insertRule('.editor-code, .editor-code textbox {'
		+'background-color: '+GetStringPref('codebg')+'!important;'
		+'}', gStylesheet.cssRules.length);
		// line numbers
		gStylesheet.insertRule('.editor-code .lines *, .editor-code .lines{'
		+'color: '+GetStringPref('codelinenumcolor')+' !important;'
		+'background-color: '+GetStringPref('codelinenumbg')+'!important;'
		+'}', gStylesheet.cssRules.length);
}
function setLineNumbers(){ // toggle line #s
	var area = document.getElementById('workarea');
	if(GetBoolPref("linenumbers"))
		area.className=area.className.replace(/(\s*)lines-off/g,'');
	else
		area.className += ' lines-off';
}

function GetPrefsService()
{
  if (gPrefsService)
    return gPrefsService;

  try {
    gPrefsService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
  }
  catch(ex) {
    dump("failed to get prefs service!\n");
  }

  return gPrefsService;
}

function GetPrefs()
{
  if (gPrefsBranch)
    return gPrefsBranch;

  try {
    var prefService=GetPrefsService();
    if (prefService)
      gPrefsBranch = prefService.getBranch('codetch.');

    if (gPrefsBranch)
      return gPrefsBranch;
    else
      dump("failed to get codetch prefs!\n");
  }
  catch(ex) {
    dump("failed to get codetch prefs!\n");
  }
  return null;
}

function GetStringPref(name)
{
  try {
    var val = GetPrefs().getCharPref(name);
    return val;
  } catch (e) {}
  return DEF[name];
}

function GetBoolPref(name)
{
  try {
    var val = GetPrefs().getBoolPref(name);
    return val;
  } catch (e) {}
  return (DEF[name]);
}
function GetIntPref(name)
{
  try {
    var val = GetPrefs().getIntPref(name);
    return val;
  } catch (e) {}
  return DEF[name];
}
function GetFilePref(name)
{
  try {
    var val = GetPrefs().getComplexValue(name, Components.interfaces.nsILocalFile);
    return val;
  } catch (e) {}
  return DEF[name];
}
function SetUnicharPref(aPrefName, aPrefValue)
{
  var prefs = GetPrefs();
  if (prefs)
  {
    try {
      var str = Components.classes["@mozilla.org/supports-string;1"]
                          .createInstance(Components.interfaces.nsISupportsString);
      str.data = aPrefValue;
      prefs.setComplexValue(aPrefName, Components.interfaces.nsISupportsString, str);
    }
    catch(e) {}
  }
}

function GetUnicharPref(aPrefName, aDefVal)
{
  var prefs = GetPrefs();
  if (prefs)
  {
    try {
      var val = prefs.getComplexValue(aPrefName, Components.interfaces.nsISupportsString).data;
      return val;
    }
    catch(e) {}
  }
  return DEF[name];
}

// default prefs
DEF['version'] = '0.0.0';

DEF['launchtab'] = false;
DEF['editonlaunch'] = false;
DEF['firstrun'] = true;

DEF['username'] = '';
DEF['defaultdoctype'] = 'txt';
DEF['tabchar'] = '\t';
DEF['codewrap'] = false;
DEF['autorefresh'] = false;

DEF['filehistorylength'] = 20;
DEF['recentfiles'] = '';
DEF['tabhistory'] = '';
DEF['loadtabset'] = true;
DEF['projectlist'] = '';

DEF['codefont'] = "monospace";
DEF['codefontsize'] = "10pt";
DEF['codecolor'] = 'black';
DEF['codebg'] = 'white';
DEF['codecss'] = '';
DEF['codelinenumcolor'] = 'HighlightText';
DEF['codelinenumbg'] = 'Highlight';

DEF['previewtmp'] = true;
DEF['openinreference'] = true;
DEF['externalbrowsers'] = '';
DEF['defaultbrowser'] = '';
DEF['selectedtabgroup'] = 'Group 1';
DEF['linenumbers'] = true;

DEF['snippetdir'] = null;
DEF['templatedir'] = null;
DEF['projectdir'] = null;
DEF['welcomesceen'] = true;
