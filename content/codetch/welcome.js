
const DEBUG_MODE = true;
const DEBUG_ALERT = false;
const DEBUG_CONSOLE = true;

var recent = '';

function loadRecentFiles()
{
	var files = GetStringPref('recentfiles');
	codetch.recentFiles = (files)?files.split(' '):[];
	codetch.recentFiles = codetch.recentFiles.slice(0,GetIntPref('filehistorylength'));
}
function fillRecentMenu(redo)
{
	if(redo && recent == parentCodetch.codetch.recentFiles[0])
		return;
	codetch.recentFiles = parentCodetch.codetch.recentFiles;
	recent = codetch.recentFiles[0];
	recenthead.className = 'loading';
	var menuPopup = document.getElementById('recent-file-list');
	var itemNode;
	while(menuPopup.childNodes.length)menuPopup.removeChild(menuPopup.lastChild);
	for(var i=0;i<codetch.recentFiles.length;i++){
        itemNode = menuPopup.appendItem(unescape(codetch.recentFiles[i]),codetch.recentFiles[i]);
        itemNode.setAttribute("crop", 'center');
	}
	recenthead.className = '';
}

function openSelctedFiles(){
	var list = document.getElementById('recent-file-list');
	var all = [];
	if(!list.selectedCount) return codetch.openFile();
	for(var i=0;i<list.selectedCount;i++){
		codetch.openPath(list.getSelectedItem(i).value);
	}
	return true;
}

var recenthead;
var INIT = false;

function init(){
	if(INIT) return;
	INIT = true;
	recenthead = document.getElementById('recent-file-list');
	document.getElementById('welcome-pref').checked = GetBoolPref('welcomescreen');

	if(!codetch.recentFiles)loadRecentFiles();
	recent = codetch.recentFiles[0];
	fillRecentMenu();
}

window.addEventListener('load', init, false);