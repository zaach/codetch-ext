// New file dialog
var gDocTree ;
var gTempTree ;
var gCurrentTree ;
var gInfo ;
var dsource;

//window.onerror = alert;
var codetch = opener.codetch || top.codetch;

function initDialog(){
	var buttonEdit = document.documentElement.getButton("help");
	buttonEdit.accessKey = localize('EditTemplate').charAt(0);
	buttonEdit.label=localize('EditTemplate');

	gDocTree = document.getElementById('main-tree');
    var dpath = DirIO.open(getDoctypesPath());
    dpath.append("doctypes.rdf");
	gDocTree.datasources=getBrowserPath(dpath.path);
	gTempTree = document.getElementById('template-tree');
	gInfo = document.getElementById('file-description');

	gTempTree.ref = getBrowserPath(GetFilePref("templatedir").path);
	//dsource = new RDFDataSource('../doctypes.rdf');
}

function treeEvent(tree, event)
{
	var b = tree.treeBoxObject;
	var n = tree.currentIndex;
	gCurrentTree = tree;
	if(n<=0) return false;
	if(event.type=="click"){
		gInfo.value = tree.id=='main-tree'?tree.view.getCellText(n, tree.columns?tree.columns['description']:'description'):'';
	}
	return true;
}

function openNew(open)
{
	var n = gDocTree.currentIndex;
	if(n<=0 || !gDocTree.view.getCellText(n, gDocTree.columns?gDocTree.columns['type']:'type')) return false;

	var importFile = FileIO.open(getConfigPath());
	importFile.append('doctypes');
	importFile.append(gDocTree.view.getCellText(n, gDocTree.columns?gDocTree.columns['default']:'default'));
	if(!importFile || !importFile.isFile()) return false;
	if(open)codetch.openPath(importFile.path);
	else codetch.newFile(gDocTree.view.getCellText(n, gDocTree.columns?gDocTree.columns['ext']:'ext'),
		gDocTree.view.getCellText(n, gDocTree.columns?gDocTree.columns['type']:'type'),
		importFile.path);
	return true;
}

function openTemplate(open)
{
	var n = gTempTree.currentIndex;
	var colm = gTempTree.columns?gTempTree.columns['Name']:'Name';

	if(n<0 || !gTempTree.view.getCellValue(n, colm)) return false;
	var file = gTempTree.view.getCellValue(n, colm);
	var importFile = FileIO.open(osPath(file));
	if(!importFile || !importFile.isFile()) return false;

	if(open)codetch.openPath(file);
	else codetch.newFile(getExt(file),null,file);
	return true;
}

function onAccept(){
	if(!gCurrentTree) return false;
	switch(gCurrentTree.getAttribute('id')){
		case 'template-tree':return openTemplate();
		break;
		case 'main-tree':return openNew();
		break;
	}
	return false;
}

function onEdit(){
	if(!gCurrentTree) return;
	var r = false;
	switch(gCurrentTree.getAttribute('id')){
		case 'template-tree':r= openTemplate(1);
		break;
		case 'main-tree':r= openNew(1);
		break;
	}
	if(r) close();
}

function onCancel(){
	return true;
}