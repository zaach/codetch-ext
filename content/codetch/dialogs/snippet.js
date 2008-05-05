var mode;
var path;

const CDIALOG_ACCEPT = 0;
const CDIALOG_CANCEL = 1;

var codetch =  opener.codetch || top.codetch;

//window.onerror = alert;

function initDialog(){

if(window.arguments){
	mode = window.arguments[0];
	path = window.arguments[1];
	var snippetXml;
	
	//alert(path);
	if(mode == 'edit'){
		snippetXml = loadLocalSnippetXML(path);
		var root = snippetXml.getElementsByTagName('snippet')[0],
		text = snippetXml.getElementsByTagName('insertText'),
		after = '',
		before = '';
		
		//alert(snippetXml.xml);
		
		document.getElementById('snippetname').value = root.getAttribute('name');
		document.getElementById('snippetdescription').value = root.getAttribute('description');
		document.getElementById('snippettype').selectedIndex = root.getAttribute('type')=='wrap'?0:1;
		document.getElementById('previewtype').selectedIndex = root.getAttribute('preview')=='html'?0:1;
		document.getElementById('snippettags').value = root.hasAttribute('tags')?root.getAttribute('tags').replace(/\'/g,'"'):'';
		
		for(var i=0;i<text.length;i++)
			if(text[i].getAttribute('location')=='afterSelection')
				after += (text[i].firstChild.nextSibling && text[i].firstChild.nextSibling.nodeType==4)?
				text[i].firstChild.nextSibling.text:text[i].firstChild.text;
			else before += (text[i].firstChild.nextSibling && text[i].firstChild.nextSibling.nodeType==4)?
				text[i].firstChild.nextSibling.text:text[i].firstChild.text;
		
		switchInsert(root.getAttribute('type'));
		if(root.getAttribute('type')=='wrap'){
			document.getElementById('snippetinsertbefore').value=before;
			document.getElementById('snippetinsertafter').value=after;
		}else
			document.getElementById('snippetinsertcode').value=before+after;
	}
}

}

function switchInsert(type){
	var el = document.getElementById('snippet');
	
	el.className = 'insert-'+type;
	if(type == 'block'){
		document.getElementById('snippetinsertcode').value = document.getElementById('snippetinsertbefore').value + document.getElementById('snippetinsertafter').value;
	}else{
		document.getElementById('snippetinsertbefore').value = document.getElementById('snippetinsertcode').value;
		document.getElementById('snippetinsertafter').value = '';
	}
}

function onAccept(){
	
	try{
	if(mode == 'new'){
		var p = osPath(path),
		dir = FileIO.open(p);
		if(!dir.isDirectory()) dir = dir.parent;
		dir.append(document.getElementById('snippetname').value.replace('/','-')+'.csn');
		var savefile = dir;
	}else{
		var p = osPath(path),
		savefile = FileIO.open(p);
	}

	// create the nodes
	var snippetXml = document.implementation.createDocument("","",null),
	root = snippetXml.createElement('snippet'),
	before = snippetXml.createElement('insertText'),
	after = snippetXml.createElement('insertText');
	
	root.setAttribute('name', document.getElementById('snippetname').value);
	root.setAttribute('description', document.getElementById('snippetdescription').value);
	root.setAttribute('type', document.getElementById('snippettype').selectedItem.value);
	root.setAttribute('preview', document.getElementById('previewtype').selectedItem.value);
	root.setAttribute('tags', document.getElementById('snippettags').value.replace(/\"/g, "'"));
	
	before.setAttribute('location', 'beforeSelection');
	after.setAttribute('location', 'afterSelection');
	if(document.getElementById('snippettype').value == 'block'){
		before.appendChild(snippetXml.createCDATASection(document.getElementById('snippetinsertcode').value));
		after.appendChild(snippetXml.createCDATASection(''));
	}else{
		before.appendChild(snippetXml.createCDATASection(document.getElementById('snippetinsertbefore').value));
		after.appendChild(snippetXml.createCDATASection(document.getElementById('snippetinsertafter').value.replace(']]>',']]&gt;')));
	}

	// put the nodes together
	snippetXml.appendChild(root); 
	root.appendChild(before);
	root.appendChild(after);

	//alert(snippetXml.xml);
	FileIO.write(savefile, '<?xml version="1.0" encoding="utf-8"?>\n'+snippetXml.xml);
	
	codetch.dialogReturn = CDIALOG_ACCEPT;
	return true;
	
	}catch(e){
		alert(e);
		return false;
	}
}

function onCancel(){
	codetch.dialogReturn = CDIALOG_CANCEL;
	return true;
}


// load xml doc from local file
function loadLocalSnippetXML(path)
{
	try{
		var p = osPath(path);
		var newfile = FileIO.open(p);
		if(!newfile.isFile()) return null;
		var snippetXml = document.implementation.createDocument("","",null);
		var c = FileIO.read(newfile);var x = c.indexOf('?>');
		snippetXml.loadXML(c.slice(x+2));
		return snippetXml;
	}catch(e){
		//debugLog(e);
		return null;
	}
}