var gExternalBrowsers=[],
revert,
revertDefault,
gBrowserMenuCount=0,
gListBox;

function initDialog(){
	loadExternalBrowsers();
	revert = gExternalBrowsers;
	revertDefault = GetStringPref('defaultbrowser');
	gListBox = document.getElementById('borwser-list');
	gBrowserMenuCount = gListBox.childNodes.length;
	fillBrowserList(gListBox);
}

function onAccept(){
	saveExternalBrowsers();
}

function onCancel(){
	gExternalBrowsers = revert;
	saveExternalBrowsers();
	GetPrefs().setCharPref('defaultbrowser', revertDefault);
	return true;
}
function setDefault()
{
	var n = gListBox.selectedIndex;
	if(gListBox.selectedIndex >=0){
		GetPrefs().setCharPref('defaultbrowser', gListBox.selectedItem.value);
		fillBrowserList(gListBox);
	}
	gListBox.selectedIndex = n;
}
function addBrowser()
{
	var path = document.getElementById('path').value;
	var name = document.getElementById('name').value;
	if(!path || !name) return alert(localize('NoNameOrPath'));
	addExternalBrowser(path, name);
	fillBrowserList(gListBox);
	return true;
}
function removeBrowser()
{
	if(gListBox.selectedIndex > 0){
	var path = gListBox.selectedItem.value;
	removeExternalBrowser(path);
	fillBrowserList(gListBox);
	}
}

function addExternalBrowser(path, name)
{
	gExternalBrowsers[path] = name;
	//saveExternalBrowsers();
}

function removeExternalBrowser(val)
{
	var prefs = [];
	for(var i in gExternalBrowsers){
		if(i != val)prefs[i] = gExternalBrowsers[i];
	}
	gExternalBrowsers = prefs;
	if(GetStringPref('defaultbrowser') == val)GetPrefs().setCharPref('defaultbrowser', '');
}

function loadExternalBrowsers()
{
	var files = GetStringPref('externalbrowsers');
	files = (files)?files.split(' '):[];
	for(var i=0;i<files.length;i+=2){
		gExternalBrowsers[unescape(files[i])] = unescape(files[i+1]);
	}
}

function saveExternalBrowsers()
{
	var pref = [];
	for(var i in gExternalBrowsers){
		pref[pref.length] = escape(i)+' '+escape(gExternalBrowsers[i]);
	}
	GetPrefs().setCharPref('externalbrowsers', pref.join(' '));
}


function fillBrowserList(listbox)
{
	while(listbox.childNodes.length>gBrowserMenuCount)listbox.removeChild(listbox.lastChild);
	for(var i in gExternalBrowsers){
		var itemNode = listbox.appendItem(gExternalBrowsers[i], i);
		if(GetStringPref('defaultbrowser') == i) itemNode.className = 'default';
		//itemNode.setAttribute("type", 'checkbox');
		itemNode.setAttribute("ondblclick", 'setDefault()');
		itemNode.setAttribute("onclick", 'setEdit(this.label, this.value)');
	}
	document.getElementById('extension-browser-menuitem').className = (GetStringPref('defaultbrowser')=='')?'default':'';
}

function setEdit(name, path)
{
	document.getElementById('path').value = path;
	document.getElementById('name').value = name;
}
function newEdit()
{
	document.getElementById('path').value = '';
	document.getElementById('name').value = '';
}
function getFilePath()
{
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, localize('LocateBrowser'), nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterApps);
	//fp.appendFilter(nsIFilePicker.filterAll);
	var res=fp.show();
	if (res==nsIFilePicker.returnOK){
		var thefile=fp.file;
		return thefile.path;
	}else{
		return '';
	}
}