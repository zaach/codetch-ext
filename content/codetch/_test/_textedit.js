const pageLoaderIface = Components.interfaces.nsIWebPageDescriptor;
var gPrefs = null;

var gEditor = null;
const cc = '\xad'; // control char

try {
  var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                              .getService(Components.interfaces.nsIPrefService);
  gPrefs = prefService.getBranch(null);
} catch (ex) {
}
//var dsource = new RDFDataSource();
var commandUpdateTrigger = function(event) {
  document.commandDispatcher.updateCommands(event.type);

};

var initCommandUpdateTrigger = function(context){
  context = context || document;
  var
    cmdSets = context.getElementsByTagName("commandset"),
    i, j,
    events
  ;
  for (i = cmdSets.length - 1; i >= 0; i--) {
    if(
      cmdSets[i].getAttribute("commandupdater") == "true"
      && cmdSets[i].getAttribute("oncommandupdate")
    ) {

      events = cmdSets[i].getAttribute("events")
        .split(/[^A-Za-z0-9_\-]+/)
                        ;
      for(j = events.length -1; j >= 0; j--) {
        if(events[j]) {
          // initial command update
          document.commandDispatcher.updateCommands(events[j]);
          // register command update trigger via event listener
          document.addEventListener(
            events[j], commandUpdateTrigger, true
          );
        };
      };
    };
  };

};

const designDocListener=
{
  NotifyDocumentCreated: function NotifyDocumentCreated() {alert('created');},
  NotifyDocumentWillBeDestroyed: function NotifyDocumentWillBeDestroyed() {alert('destroyd');},
  NotifyDocumentStateChanged: function NotifyDocumentStateChanged(isChanged)
  {
    alert(isChanged);
  }
};

function EditorWin(){
	var editorWindow = document.getElementById('content-source');
	return editorWindow;
}
function Editor(){
	var editorWindow = document.getElementById('content-source');
	var editor = editorWindow.getEditor(editorWindow.contentWindow);
    editor.QueryInterface(Components.interfaces.nsIPlaintextEditor);
	return editor;
}
function HTMLEditor(){
	var editorWindow = document.getElementById('content-source');
	var editor = editorWindow.getHTMLEditor(editorWindow.contentWindow);
	return editor;
}

function setup(){
	var editor = Editor();
	//editor.getEditor(editor.contentWindow);
	//editor.getEditor(editor.contentWindow).addEditorObserver(designObserver);
	//editor.getEditor(editor.contentWindow).addDocumentStateListener(designDocListener);
	//alert(editor.isDocumentEditable);
	editor.wrapWidth = 80;
	editor.insertLineBreak();
}

initCommandUpdateTrigger(); 

function startedit(url){
	var editorWindow = document.getElementById('content-source');


	var p = osPath(url);
	var newfile = FileIO.open(p);
	var s = FileIO.read(newfile);
	//alertObject(editorWindow, 1);
	
	
	editorWindow.makeEditable('text',false);
	var editor = Editor();
    editor.enableUndo(true);
    editor.rootElement.style.fontFamily = "-moz-fixed";
    editor.rootElement.style.whiteSpace = "pre";
    editor.rootElement.style.margin = 0;
    editor.rootElement.style.background = 'white';

	editorWindow.webBrowserFind.searchString = cc;
	editorWindow.webBrowserFind.wrapFind = true;
	editorWindow.webBrowserFind.findBackwards = true;
	
	HTMLEditor().insertHTML(parse(s));
	editorWindow.contentWindow.scrollTo(0,0);
}

function retext(s){
	var editor = Editor();
	var r = s || parse(quickSource(true));
	var sel = editor.selection,
	range = sel.getRangeAt(0);
	
	editor.selectAll();
	HTMLEditor().insertHTML(r);
	EditorWin().focus();
}

function parsed(){
	var editor = Editor();
  //alert(body.innerHTML);
	var r = parse(output(true));
  var w = window.open('about:blank','source','');
  w.document.location = "data:text/plain," + encodeURIComponent(r);
}
function source(){
	var editor = Editor();
	flags = 0;
  var w = window.open('about:blank','source','');
  //w.document.location = "data:text/html," + encodeURIComponent(editor.rootElement.innerHTML);
  w.document.location = "data:text/plain," + encodeURIComponent(HTMLEditor().outputToString("text/html", flags));
}
function selection(){
	var editor = Editor();
	alert(editor.selection.getRangeAt(0).toString());
	HTMLEditor().insertHTML(parse(editor.selection.getRangeAt(0).toString()));
  //var w = window.open('about:blank','source','');alert(editor.selection.toString());
  //w.document.location = "data:text/plain," + encodeURIComponent(editor.selection.toString());
}
function quickSource(r){
	var editor = Editor();
		code = editor.rootElement.innerHTML;
//		code = code.replace(/<pre>(<p>)*|(<\/p>)*<\/pre>/gi,'');
		code = code.replace(/<br>/gi,'\n');
		code = code.replace(/<\/p>/gi,'\r');
		code = code.replace(/<p>/gi,'\n');
		code = code.replace(/&nbsp;/gi,' ');
		code = code.replace(/&shy;/gi,'\xad');
		code = code.replace(/<.*?>/g,'');
		code = code.replace(/&lt;/g,'<');
		code = code.replace(/&gt;/g,'>');
		code = code.replace(/&amp;/gi,'&');
if(r) return code;
  var w = window.open('about:blank','source2','');
  w.document.location = "data:text/plain," + encodeURIComponent(code);
}

/*
TODO
before keypress, check for multiline match
if match found, and not found after edit, do extended highlight
else do a single line/countainer re-highlight
*/
function nodeData(){
	var editor = HTMLEditor();
	var win = EditorWin().contentWindow.frames,
	x = win.scrollX, y = win.scrollY;
	node = editor.getSelectionContainer();
	//alertObject(editor.selection, true);
	editor.selection.getRangeAt(0).insertNode(document.createTextNode(cc));
	if(node.tagName=='BODY'){
		var sel = editor.selection,
		node = sel.focusNode,
		range = sel.getRangeAt(0),
		n = node;
		//grab entire line to reformat
		
		//get first node of line
		while(!n.tagName || n.tagName !='BR'){
			if(n.tagName && n.getElementsByTagName('br').length)break
			else n = n.previousSibling;
		}
		var s = n.nextSibling;
		n = node;
		// get last node of line
		while(n && (!n.tagName || n.tagName !='BR')){
			if(n.tagName && n.getElementsByTagName('br').length)break
			else n = n.nextSibling;
		}
		if(s && n){
			range = sel.getRangeAt(0);//alertObject(range, true);
			range.selectNode(s);
			editor.selection.extend(n.nextSibling,0);
			editor.insertHTML(parse(range.toString()+'\n'));
		}
	}else{
		editor.selectElement(node);
		editor.insertHTML(parse(__getText(node)));
	}
	resetCaret();
	win.scrollTo(x, y);
}

function resetCaret(){
	var editor = HTMLEditor();
	EditorWin().webBrowserFind.findNext(cc);
	editor.selection.getRangeAt(0).deleteContents();
}

function output(r){
	htmleditor =  Editor();
	//this.element.makeEditable('html',false);
	var flags;
	/* flags = (editor.documentCharacterSet == "ISO-8859-1")
		? 32768  // OutputEncodeLatin1Entities
		: 16384; // OutputEncodeBasicEntities
	flags = 1024; */
	flags = 0;
	if(r) return htmleditor.outputToString("text/plain", flags);
  var w = window.open('about:blank','source','');
  w.document.location = "data:text/plain," + encodeURIComponent(htmleditor.outputToString("text/plain", flags));
}
function lineAndCol(){
	var editor =  Editor();
		var sel = editor.selection,
		node = sel.focusNode,
		n = node,m;
		
	if(sel.focusNode.tagName=="BODY") // empty lines with only a br
		n = n.childNodes[sel.focusOffset];

	while(n && n.tagName !='BR') n = n.nextSibling // traverse on text node level to find br
	
	if(!n && (m = sel.focusNode.parentNode) && m.tagName!="BODY"){ // no br on text level, traverse on element lvl
		n = m;
		//alertObject(n);
		if(n.getElementsByTagName('br').length) // check if contains br
			n = n.getElementsByTagName('br')[0];
		while(n && n.tagName !='BR') n = n.nextSibling
	}
	var lines = document.getElementById('content-source').
					contentDocument.getElementsByTagName('br');
	for(var i=0;i<lines.length;i++){
		if(lines[i] == n) break;
	}
	return ++i;
}

function retextMulti(results, offset){
	results = results.split(/\n/);
	for(var i=0;i<results.length;i++){
		selecteLine(i+offset);
		editor.insertHTML(results[i]);
	}

}

function selecteLine(n){
	var editor =  Editor();
	var line = grabLine(n);
	editor.selection.collapse(line[0],0);
	editor.selection.extend(line[1],0);
	return editor.selection.getRangeAt(0);
}

// find first and last elements of "line"
// TODO: grap gap
function grabLine(n){
	var end = document.getElementById('content-source').
					contentDocument.getElementsByTagName('br')[n-1];
	var n = end.previousSibling.nodeValue?end.parentNode:end.previousSibling;
	while(n.tagName !='BR'){
		if(n.tagName && n.getElementsByTagName('br').length)break;
		else n = n.previousSibling;
	}
	var start = n;
	return [start, end];
}

function selectStatus(){
	var editor =  Editor();
	if(!editor) return;
	var sbar = document.getElementById('edit-status');
	var sel = editor.selection;
	var node = sel.focusNode;
	var range = sel.getRangeAt(0);
	
	var lines = document.getElementById('content-source').contentDocument.
				getElementsByTagName('br').length+1;
	
	sbar.value = '"'+node.nodeValue+'" line:'+lineAndCol()+' of '+lines;
	
}

var parser = _parser;

//const DOCTYPE = /(<!DOCTYPE[^>]>)/;

//const MULTILINE_OPEN = /\/*/;
const MULTILINE = /(\/\*|\*\/|)/g;

function init(lang) {
	// default text colour
	//style.color = "black";

	// escape character
	parser.escapeChar = "\\";
	var syn = syntax[lang];
	var hlt = highlight[lang];
	for(var i in syn){
		if(i!='_meta')
			parser.add(syn[i][0], hlt[i], (syn[i][1])?syn[i][1]:null);
	}
}

function parse(text) {
		var parsed = parser.exec(text);
		//var parsed = pressParser(text);
		if (parsed) return parsed;
};
var syntax = {
	javascript: 
	{
		_meta:
		{
			escapeChar: "\\",
			multiLine: /(\/\*|\*\/|)/
		},
		line_comment: [LINE_COMMENT],
		block_comment: [BLOCK_COMMENT],
		string_1: [/'[^'\n\r]*'/],
		string_2: [/"[^"\n\r]*"/],
		numbers: [NUMBER],
		regex: [/([^\w\$\/'"*)])(\/[^\/\n\r\*][^\/\n\r]*\/g?i?)/, "$2<span>$3</span>"],
		ignore: [/\$\w+/],
		keywords:[ "arguments|break|continue|do|for|new|this|void|case|delete|default|else|function|return|typeof|while|if|label|switch|var|const|with|catch|boolean|int|instanceof|typeof|try|false|throws|null|undefined|true|goto"],
		special_chars: [/&&|\|\|/],
		global: ["alert|isNaN|constructor|parent|Array|parseFloat|parseInt|blur|clearTimeout|setInterval|clearInterval|prompt|prototype|close|confirm|length|Date|location|scroll|Math|document|element|name|self|elements|setTimeout|navigator|status|String|escape|Number|submit|eval|Object|event|submit|onblur|focus|onerror|onfocus|top|onload|toString|onunload|unescape|open|opener|valueOf|window|__defineGetter__|__defineSetter__"]
	},
	css:
	{
		_meta:
		{
			escapeChar: "\\",
			multiLine: /(\/\*|\*\/|['"])/
		},
		block_comment: [BLOCK_COMMENT],
		string_1: [STRING1],
		string_2: [STRING2],
		meta:[/@\w[\w\s]*/],
		selectors:[/([\w-:\[.#][^{};]*)\{/, "<span>$2{</span>"],
		//mozilla:[/(-[\w-]+)\s*:/, "<span>$2</span>:"],
		properties:[/([\w-]+)\s*:/, "<span>$2</span>:"],
		//colors:[/#[\da-fA-F]{3,}/],
		//measurement:[/\b[.\d]+(cm|em|ex|pt|px|%)\b/],
		keywords:[/attr|rect|rgb|url/],
		important:[/\!important/],
		special_chars: [/[}]/]
	},
	html:
	{
		_meta:
		{
			multiLine: /(<!--|-->|'|"|<!DOCTYPE)/
		},
		comment: [SGML_COMMENT],
		special_tags: [/(>[^!]*?<\/)(script|style)>/, "$2<span>$3</span>>"],
		string_1: [STRING1],
		string_2: [STRING2],
		doctype: [/<!DOCTYPE[^>]+>/],
		process: [/<\?[\w-]+[^>]+>/],
		tags: [/(<\/?)([\w:-]+)(\s*>)*/, "<span>$2$3$4</span>"],
		end_tags: [/(\/*>)/, "<span>$2</span>"],
		attributes: [/[\w-]+=/],
		entity: [/&#?\w+;/]
	},
	xml:
	{
		_meta:
		{
			multiLine: /<!\s*(--([^-]|[\r\n]|-[^-]))|(['"])/
		},
		cdata: [CDATA],
		comment: [SGML_COMMENT],
		string_1: [STRING1],
		string_2: [STRING2],
		doctype: [/<!DOCTYPE[^>]+>/],
		process: [/<\?[\w-]+[^>]+>/],
		tags: [/(<\/?)([\w:-]+)(\s*>)*/, "<span>$2$3$4</span>"],
		end_tag: [/(\/*>)/, "<span>$2</span>"],
		attributes: [/[\w:-]+=/],
		entity: [/&#?\w+;/]
	}
};

var highlight = {
	javascript :
	{
		line_comment: 'color:green;font-style:italic',
		block_comment: 'color:green;font-style:italic',
		string_1: 'color:blue',
		string_2: 'color:blue',
		numbers: 'color:#CC33CC',
		regex: "color:maroon",
		ignore: IGNORE,
		keywords: 'color:purple;font-weight:bold',
		special_chars: 'color:teal;font-weight:bold',
		global: 'color:#0000bb;font-weight:bold'
	},
	css :
	{
		block_comment: 'color:#999;',
		string_1: 'color:darkgreen',
		string_2: 'color:darkgreen',
		meta:"color:teal",
		selectors:"color:#CC33CC",
		//mozilla:"color:red",
		properties:"color:#0000ff",
		//colors:"color:maroon",
		//measurement:"color:maroon",
		keywords:"color:teal",
		important:"color:red",
		special_chars: 'color:#CC33CC'
	},
	html :
	{
		comment: "color:green;font-style:italic",
		string_1: "color:blue;font-weight:550",
		string_2: "color:blue;font-weight:550",
		doctype: "color:#4682B4;font-style:italic",
		process: "color:#DA70D6",
		special_tags: "color:#000099;font-weight:bold",
		tags: "color:#800080;font-weight:bold",
		special_end_tags: "color:#000099;font-weight:bold",
		end_tags: "color:#800080;font-weight:bold",
		attributes: "font-weight:bold",
		entity: "color:#FF4500"
	},
	xml :
	{
		cdata: "color:#ff9900",
		comment: "color:green;font-style:italic",
		string_1: "color:blue;font-weight:550",
		string_2: "color:blue;font-weight:550",
		doctype: "color:#4682B4;font-style:italic",
		process: "color:#DA70D6",
		tags: "color:#800080;font-weight:bold",
		end_tag: "color:#800080;font-weight:bold",
		attributes: "font-weight:bold",
		entity: "color:#FF4500"
	}
};

init('html');
