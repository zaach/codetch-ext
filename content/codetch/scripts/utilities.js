
var XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
var DOCNS = 'http://doctypes.codetch.com/rdf#';

var gLocalFonts = null;
var gStringBundle = null;
var kFixedFontFaceMenuItems = 1;


function fileBrowse(mode, defaultDir)
{
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	if(mode=="open")
		fp.init(window, localize('Open'), nsIFilePicker.modeOpen);
	else if(mode=="save")
		fp.init(window, localize('SaveAs'), nsIFilePicker.modeSave);
	else if(mode=="folder")
		fp.init(window, localize('SelectFolder'), nsIFilePicker.modeGetFolder);
	fp.appendFilters( nsIFilePicker.filterText | nsIFilePicker.filterHTML | nsIFilePicker.filterXML | nsIFilePicker.filterAll);

	if(defaultDir && defaultDir.exists()) {
		fp.displayDirectory = defaultDir;
		if(defaultDir.isFile()) fp.defaultString = defaultDir.leafName;
	}else if(codetch && codetch.hasFiles()){
		var doc = codetch.targetID?codetch.docs[codetch.targetID]:codetch.getFile();
		if(doc.file)fp.displayDirectory = doc.file.parent;
		fp.defaultString = doc.leafName;
	}
	var res=fp.show();
	if (res==nsIFilePicker.returnOK || nsIFilePicker.returnReplace ){
		var thefile=fp.file;
		return thefile;
	}else{
		return false;
	}
}

function goToggleToolbar( id, elementID )
{
  var toolbar = document.getElementById(id);
  var element = document.getElementById(elementID);
  if (toolbar)
  {
    var isHidden = toolbar.hidden;
    toolbar.hidden = !isHidden;
    document.persist(id, 'hidden');
    if (element) {
      element.setAttribute("checked", isHidden ? "true" : "false");
      document.persist(elementID, 'checked');
    }
  }
}

function getFolderPath(path)
{
	var def = path?FileIO.open(path):null;
	var newfile = fileBrowse("folder", def);
	return FileIO.path(newfile);
}
function getFolder(path)
{
	var def = path?FileIO.open(path):null;
	var newfile = fileBrowse("folder", def);
	return newfile;
}
function getFilePath(path)
{
	var def = path?FileIO.open(path):null;
	var newfile = fileBrowse("open", def);
	return FileIO.path(newfile);
}

function AlertWithTitle(title, message, parentWindow)
{
  if (!parentWindow)
    parentWindow = window;

  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService();
  promptService = promptService.QueryInterface(Components.interfaces.nsIPromptService);

  if (promptService)
  {
    if (!title)
      title = GetString("Alert");

    // "window" is the calling dialog window
    promptService.alert(parentWindow, title, message);
  }
}

// Optional: Caller may supply text to substitue for "Ok" and/or "Cancel"
function ConfirmWithTitle(title, message, okButtonText, cancelButtonText)
{
  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService();
  promptService = promptService.QueryInterface(Components.interfaces.nsIPromptService);

  if (promptService)
  {
    var okFlag = okButtonText ? promptService.BUTTON_TITLE_IS_STRING : promptService.BUTTON_TITLE_OK;
    var cancelFlag = cancelButtonText ? promptService.BUTTON_TITLE_IS_STRING : promptService.BUTTON_TITLE_CANCEL;

    return promptService.confirmEx(window, title, message,
                            (okFlag * promptService.BUTTON_POS_0) +
                            (cancelFlag * promptService.BUTTON_POS_1),
                            okButtonText, cancelButtonText, null, null, {value:0}) == 0;
  }
  return false;
}

function ConfirmAdvanced(dialogTitle, dialogMsg, okButtonText, cancelButtonText, extraButtonText)
{
  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService();
  promptService = promptService.QueryInterface(Components.interfaces.nsIPromptService);
  var result = 1;
  if (promptService)
  {
    var okFlag = okButtonText ? promptService.BUTTON_TITLE_IS_STRING : promptService.BUTTON_TITLE_SAVE;
    var cancelFlag = cancelButtonText ? promptService.BUTTON_TITLE_IS_STRING : promptService.BUTTON_TITLE_CANCEL;
    var extraFlag = extraButtonText ? promptService.BUTTON_TITLE_IS_STRING : promptService.BUTTON_TITLE_DONT_SAVE;

    result = promptService.confirmEx(window, dialogTitle, dialogMsg,
                            (okFlag * promptService.BUTTON_POS_0) +
                            (cancelFlag * promptService.BUTTON_POS_1)+
                            (extraFlag * promptService.BUTTON_POS_2),
                            okButtonText, cancelButtonText, extraButtonText, null, {value:0});
  }
  return result;
}
function infoWin(img, title, message)
{
	///*
    var params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                             .createInstance(Components.interfaces.nsIDialogParamBlock);
    params.SetNumberStrings(3);
    params.SetString(0, img);
    params.SetString(1, title);
    params.SetString(2, message);
	//params = {title:title,img:img,message:message};
    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                         .getService(Components.interfaces.nsIWindowWatcher);
    return ww.openWindow(null, "chrome://codetch/content/dialogs/info.xul", "info", "chrome,all,centerscreen,alwaysRaised,dialog,modal=no,resizable=no", params);
	//*/

}

if(typeof openHelp=='undefined'){
	function openHelp() {
		return openBrowserURL('http://forum.codetch.com/');
	}
}

function localize(name)
{
  if (!gStringBundle)
  {
    try {
      var strBundleService =
          Components.classes["@mozilla.org/intl/stringbundle;1"].getService();
      strBundleService =
          strBundleService.QueryInterface(Components.interfaces.nsIStringBundleService);

      gStringBundle = strBundleService.createBundle("chrome://codetch/locale/codetch.properties");

    } catch (ex) {alert(ex)}
  }
  if (gStringBundle)
  {
    try {
      return gStringBundle.GetStringFromName(name);
    } catch (e) {alert(name+'\n'+e)}
  }
  return null;
}

function SupportsArray()
{
	return Components.classes['@mozilla.org/supports-array;1']
							.createInstance(Components.interfaces.nsISupportsArray);
}

function IsWhitespace(string)
{
  return /^\s/.test(string);
}

function GetSelectionAsText()
{
  try {
    return GetCurrentEditor().outputToString("text/plain", 1); // OutputSelectionOnly
  } catch (e) {}

  return "";
}

function stripChars(string) {
    string = string.replace(/\\/g,"\\\\");
    string = string.replace(/\(/g,"\\(");
    string = string.replace(/\)/g,"\\)");
    string = string.replace(/\$/g,"\\$");
    string = string.replace(/\^/g,"\\^");
    string = string.replace(/\[/g,"\\[");
    string = string.replace(/\]/g,"\\]");
    string = string.replace(/\{/g,"\\{");
    string = string.replace(/\}/g,"\\}");
    string = string.replace(/\+/g,"\\+");
    string = string.replace(/\?/g,"\\?");
    string = string.replace(/\./g,"\\.");
    string = string.replace(/\|/g,"\\|");
    string = string.replace(/\*/g,"\\*");

    return string;
}
function TextIsURI(selectedText)
{
  return selectedText && /^http:\/\/|^https:\/\/|^file:\/\/|\
    ^ftp:\/\/|^about:|^mailto:|^news:|^snews:|^telnet:|^ldap:|\
    ^ldaps:|^gopher:|^finger:|^javascript:/i.test(selectedText);
}

function openBrowserURL(url)
{
	var b = getContentBrowser();
	if(b){
		gotoLink(url);
	}else{
		try{
			open(url);
		}catch(ex){
			var winw = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                         .getService(Components.interfaces.nsIWindowWatcher);
			winw.openWindow(null, url, "_blank", "chrome,all,dialog=no,width=500,height=400,sizemode=maximized",
				Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                             .createInstance(Components.interfaces.nsIDialogParamBlock));
			return true;
		}
	}
	return true;
}
function launchPreview(targetpath, url)
{
	var targetFile = FileIO.open(targetpath);

	var process = Components.classes['@mozilla.org/process/util;1'].getService(Components.interfaces.nsIProcess);
	process.init(targetFile);
	var arguments= [] ;

	arguments.push(url);

	process.run(false, arguments, arguments.length,{});
}

function toggleElement( id, elementID )
{
  var toolbar = document.getElementById( id );
  var element = elementID?document.getElementById( elementID ):null;
  if ( toolbar ){
    if (toolbar.hidden){
      toolbar.hidden = false;
      if ( element )
        element.setAttribute("checked","true");
    }else{
      toolbar.hidden = true;
      if ( element )
        element.setAttribute("checked","false");
    }
    document.persist(id, 'hidden');
    //if(elementID)document.persist(elementID, 'checked');
  }
}

function colID(tree, id){

}

function initLocalFontFaceMenu(menuPopup, selected)
{
  if (!gLocalFonts)
  {
    // Build list of all local fonts once per editor
    try
    {
      var enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
                                 .getService(Components.interfaces.nsIFontEnumerator);
      var localFontCount = { value: 0 }
      gLocalFonts = enumerator.EnumerateAllFonts(localFontCount);
    }
    catch(e) { }
  }

  var useRadioMenuitems = (menuPopup.parentNode.localName == "menu"); // don't do this for menulists
  if (menuPopup.childNodes.length == kFixedFontFaceMenuItems)
  {
    if (gLocalFonts.length == 0) {
      menuPopup.childNodes[kFixedFontFaceMenuItems - 1].hidden = true;
    }
    for (var i = 0; i < gLocalFonts.length; ++i)
    {
      if (gLocalFonts[i] != "")
      {
        var itemNode = document.createElementNS(XULNS, "menuitem");
        itemNode.setAttribute("label", gLocalFonts[i]);
        itemNode.setAttribute("value", gLocalFonts[i]);
		if(selected == gLocalFonts[i])
			itemNode.setAttribute("selected", 'true');
        if (useRadioMenuitems) {
          //itemNode.setAttribute("type", "radio");
          itemNode.setAttribute("name", "2");
          itemNode.setAttribute("observes", "cmd_formatBlock");
        }
        menuPopup.appendChild(itemNode);
      }
    }
  }
}
function osPath(path)
{
	path = unescape(path);
	if(gOS==gWin)
		return path.replace('file:///', '').replace('|',':').replace(/\//g, '\\');
	else
		return path.replace('file://', '');
};

function getExt(path) {
	var rv='';
	try {
		var dotIndex  = path.lastIndexOf('.');
		rv=(dotIndex >= 0) ? path.substring(dotIndex+1) : "";
		return rv;
	}catch(e) {
		return '';
	}
}

function getBrowserPath(path) {
	try {
		if(path.match('://')) return path;
		return 'file:///' + path.replace(/\\/g, '\/')
			.replace(/^\s*\/?/, '').replace(/\ /g, '%20');
	}
	catch(e) {
		return false;
	}
}

function gotoLink(URL) {
	var brw = getContentBrowser();
	if (true) {
		var newtab = brw.addTab(URL);
		brw.selectedTab = newtab;
		return newtab;
	} else {
		return brw.loadURI(URL);
	}
}

function getContentBrowser() {
	var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
	var topWindowOfType = windowManager.getMostRecentWindow("navigator:browser");
	if (topWindowOfType) {
		return topWindowOfType.document.getElementById('content');
	}
	return null;
}

var gExtensionList;
function loadExtensionList()
{
 var RDFService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
              .getService(Components.interfaces.nsIRDFService);
 var Container = Components.classes["@mozilla.org/rdf/container;1"]
              .getService(Components.interfaces.nsIRDFContainer);

 var extensionDS= Components.classes["@mozilla.org/extensions/manager;1"]
   .getService(Components.interfaces.nsIExtensionManager).datasource;
 var root = RDFService
                .GetResource("urn:mozilla:item:root");
 var nameArc = RDFService
                .GetResource("http://www.mozilla.org/2004/em-rdf#name");
 var versionArc = RDFService
                .GetResource("http://www.mozilla.org/2004/em-rdf#version");
 var disabledArc = RDFService
                .GetResource("http://www.mozilla.org/2004/em-rdf#disabled");
 var homepageArc = RDFService
                .GetResource("http://www.mozilla.org/2004/em-rdf#homepageURL");

 var list=[];
 var disabledlist="";

 Container.Init(extensionDS, root);
 var elements=Container.GetElements();
var element;
 while(elements.hasMoreElements())
 {
   element=elements.getNext();
   var name= "",
   homepage ="";
   var version="";
   var disabled="";
   element.QueryInterface(Components.interfaces.nsIRDFResource);
   var target=extensionDS.GetTarget(element, nameArc ,true);
   if(target)
     name=target
       .QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
   target=extensionDS.GetTarget(element, homepageArc ,true);
   if(target)
     homepage=target
       .QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
   target=extensionDS.GetTarget(element, disabledArc ,true);
   if(target)
     disabled=target
       .QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
   if( disabled && disabled=="true")
     disabledlist[element.Value.replace('urn:mozilla:item:', '')] = {name:name, homepage:homepage};
   else if(name)
     list[element.Value.replace('urn:mozilla:item:', '')] = {name:name, homepage:homepage};
 }
 gExtensionList = list;
}


function getZipReader () {
  return Components.classes["@mozilla.org/libjar/zip-reader;1"]
    .createInstance(Components.interfaces.nsIZipReader);
}


function getZipWriter () {
  dump("*** getZipWriter: DISABLED\n");
  return null;
  // return Components.classes["@celtx.com/zipwriter;1"]
  //   .createInstance(Components.interfaces.nsIZipWriter);
}

// Provides a moz-icon url for a given file
function iconURLForFile (file) {
  if (! file)
    return "";
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
    .getService(Components.interfaces.nsIIOService);
  var fph = ios.getProtocolHandler("file")
    .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
  var urlspec = fph.getURLSpecFromFile(file);
  return "moz-icon://" + urlspec + "?size=16";
}

function getFileInputStream () {
  return Components.classes["@mozilla.org/network/file-input-stream;1"]
    .createInstance(Components.interfaces.nsIFileInputStream);
}


function getFileOutputStream () {
  return Components.classes["@mozilla.org/network/file-output-stream;1"]
    .createInstance(Components.interfaces.nsIFileOutputStream);
}


function getBufferedInputStream (is) {
  var bs = Components.classes["@mozilla.org/network/buffered-input-stream;1"]
    .createInstance(Components.interfaces.nsIBufferedInputStream);
  bs.init(is, 4096);
  return bs;
}


function getBufferedOutputStream (os) {
  var bs = Components.classes["@mozilla.org/network/buffered-output-stream;1"]
    .createInstance(Components.interfaces.nsIBufferedOutputStream);
  bs.init(os, 4096);
  return bs;
}


function getScriptableInputStream (is) {
  var ss = Components.classes["@mozilla.org/scriptableinputstream;1"]
    .createInstance(Components.interfaces.nsIScriptableInputStream);
  ss.init(is);
  return ss;
}


function getUnicharOutputStream (os) {
  var us = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
    .createInstance(Components.interfaces.nsIConverterOutputStream);
  us.init(os, null, 0, '?');
  return us.QueryInterface(Components.interfaces.nsIUnicharOutputStream);
}


function getDownloader () {
  return Components.classes["@mozilla.org/network/downloader;1"]
    .createInstance(Components.interfaces.nsIDownloader);
}
function getIOService () {
  return Components.classes["@mozilla.org/network/io-service;1"]
    .getService(Components.interfaces.nsIIOService);
}

function getTransferable () {
  return Components.classes["@mozilla.org/widget/transferable;1"]
    .createInstance(Components.interfaces.nsITransferable);
}

function getExternalProtocolService () {
  return Components.classes[
    "@mozilla.org/uriloader/external-protocol-service;1"]
    .getService(Components.interfaces.nsIExternalProtocolService);
};


function getPrintSettingsService () {
  return Components.classes["@mozilla.org/gfx/printsettings-service;1"]
    .getService(Components.interfaces.nsIPrintSettingsService);
}


function getAtomService () {
  return Components.classes["@mozilla.org/atom-service;1"]
    .getService(Components.interfaces.nsIAtomService);
}


function getAtom (str) {
  return getAtomService().getAtom(str);
}


function getMIMEService () {
  return Components.classes["@mozilla.org/mime;1"].getService()
    .QueryInterface(Components.interfaces.nsIMIMEService);
}
function getFindService () {
  return Components.classes["@mozilla.org/find/find_service;1"]
    .getService(Components.interfaces.nsIFindService);
}


function getRangeFind () {
  return Components.classes["@mozilla.org/embedcomp/rangefind;1"]
    .createInstance(Components.interfaces.nsIFind);
}


function getEditorSpellCheck () {
  return Components.classes["@mozilla.org/editor/editorspellchecker;1"]
    .createInstance(Components.interfaces.nsIEditorSpellCheck);
}


function getTextServicesFilter () {
  return Components.classes["@mozilla.org/editor/txtsrvfilter;1"]
    .createInstance(Components.interfaces.nsITextServicesFilter);
}

//-----------------------------------------------------------------------------------
function alertObject(obj, win)
{
  var names = "";
  for (var i in obj)
  {
	try{
    if (i == "value")
      names += i + ": " + obj.value + "\n";
    else if (i == "id")
      names += i + ": " + obj.id + "\n";
    else
      names += i +"\t=\t"+String(obj[i])+ "\n";
	}catch(e){
      names += i + ": " + String(e) + "\n";
	}
  }
  var out = "-----" + obj + "------\n"+names + "-----------\n";
  if(win){
	var tab = codetch.newBrowserPage('about:blank', obj.toString());
	  tab.panel.document.location = "data:text/plain," + encodeURIComponent(out);
  }else alert(out);
}

//-----------------------------------------------------------------------------------
function PrintObject(obj)
{
  dump("-----" + obj + "------\n");
  var names = "";
  for (var i in obj)
  {
    if (i == "value")
      names += i + ": " + obj.value + "\n";
    else if (i == "id")
      names += i + ": " + obj.id + "\n";
    else
      names += i + "\n";
  }

  dump(names + "-----------\n");
}

//-----------------------------------------------------------------------------------
function PrintNodeID(id)
{
  PrintObject(document.getElementById(id));
}

String.prototype.convertToUnix = function(){
	return this.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
};
String.prototype.trim = function(){
	return this.replace(/(^\s+)|(\s+$)/g, '');
};
String.prototype.trimTrail = function(){
	return this.replace(/(\s+$)/g, '');
};


String.prototype.replaceWhitespace = function(replaceVal)
{
	return this.replace(/(^\s+)|(\s+$)/g,'').replace(/\s+/g,replaceVal)
}

String.prototype.toCDATA = function()
{
  return this.replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_\.\-\:\u0080-\uFFFF]+/g,'');
}

/*
Array.prototype.removeAt=function(i){
	this.splice(i,1);
};
Array.prototype.sortn=function(i){
	this.sort(function(a,b){return a-b;});
};
*/

String.prototype.capitalize=function()
{
	return this.charAt(0).toUpperCase()+this.substr(1);
};
String.prototype.titleCase=function()
{
	var words = this.split(' ');
	for(var i=0;i<words.length;i++)words[i] = words[i].charAt(0).toUpperCase()+words[i].substr(1).toLowerCase();
	return words.join(' ');
};

function $(element) {
    if (typeof element == 'string')
      element = document.getElementById(element);

  return element;
}


function debugLog(val)
{
	if(!DEBUG_MODE || val==null) return;
	if(DEBUG_ALERT)alert(val);
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
	if(DEBUG_CONSOLE)consoleService.logStringMessage("Codetch: " + val);
	if(typeof(val) == 'string' && val.indexOf('\n')==-1)val+='\n';
	dump(val);
}
