
var UE = null;
var INITIATED = false;
var CLOSED = false;
var CMD_SETS = false;
var RCMD_SETS = true;

const DEBUG_ALERT = false;
const DEBUG_MODE = true;
const DEBUG_CONSOLE = true;

const nsIWebNavigation = Components.interfaces.nsIWebNavigation;
const pageLoaderIface = Components.interfaces.nsIWebPageDescriptor;

var gExternalBrowsers=[];
var gDefView;
var gLocalFileTree;
var gBrowserMenuCount=0;
var gDoctypeData;
var loadWin;
var gViewMenuCount=0;
var gEditorPrefBranch=null;


function Test()
{

}

function getVersion()
{var rdfs = Components.classes["@mozilla.org/rdf/rdf-service;1"]
            .getService(Components.interfaces.nsIRDFService);

var ds = Components.classes["@mozilla.org/extensions/manager;1"]
           .getService(Components.interfaces.nsIExtensionManager).datasource;

return ds.GetTarget(rdfs.GetResource("urn:mozilla:item:{420ed894-c19f-4318-a83f-bacae374db28}"),
  rdfs.GetResource("http://www.mozilla.org/2004/em-rdf#version"), true)
  .QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
}

function StyleRuleSetter()
{

}
StyleRuleSetter.prototype = {
	rules: {},
	get document() { return this._document?this._document:window.document; },
	set document(doc) { this._document = doc; },
	get sheet() { return this.document.styleSheets[this.document.styleSheets.length-1]; },
	
	getRule: function (name){
		return this.rules[name]?this.sheet.cssRules[this.rules[name]]:null;
	},
	setRule: function (name, css)
	{
		if(this.getRule(name))
			this.getRule(name).cssText = css;
		else
			this.rules[name] = this.sheet.insertRule(css, this.sheet.cssRules.length);
	},
	deleteRule: function (name)
	{
		if(this.getRule(name))
			this.setRule(name, '');
	}
};

//http://64.233.161.104/search?q=cache:al5n2Gn6-hcJ:mozilla.feedjack.org/user/582/+extensionManager+xpcom&hl=en&gl=us&ct=clnk&cd=8&client=firefox-a
var Exts = {
	INSPECTOR_GUID: 'inspector@mozilla.org',
	FIREBUG_GUID: 'firebug@software.joehewitt.com',
	VENKMAN_GUID: '{f13b157f-b174-47e7-a34d-4815ddfdfeb8}',
	FIREFTP_GUID: '{a7c6cf7f-112c-4500-a7ea-39801a327e5f}',
	_EM: '',
	get EM() { return _EM?_EM:_EM = XPCU.createInstance('@mozilla.org/extensions/manager;1', 'nsIExtensionManager'); },
	isInstalled: function (GUID)
	{
		//var e = XPCU.createInstance('@mozilla.org/extensions/manager;1', 'nsIExtensionManager');

		return (gExtensionList[GUID]);
	}
}
///////////////////////////////////////////////////////////////////////////////////////////////////

var PrefsObserver =
{
    observe: function(subject, topic, data)
    {
        if (data == "codetch.firstrun")	
			alert('observe');
    }
};

  /*-------------------------------------------------------------------------------/
 /   Codetch Object - Master Wrapper                                              /
/-------------------------------------------------------------------------------*/

var codetch = {
	window:window,               // original window codetch instance was initiated from
	currentWindow:window,        // window that is currently using the codetch object
	tabbox:null,                 // tabbox element that holds file handlers
	tmpFile:null,                // temp file that is automatically removed
	recentFiles:[],              // array of recently opened local files
	docs:{},                     // hash of opened documents, key=unique id, value=CodetchDocumentClass
	dialogReturn:null,
	errorReports:{},             // errors for open documents found
	closeHistory:{},             // hash of files closed during session
	tabGroups:[],                // array of tab groups, key=name
	targetID:null,               // ID of the target document of an action (like a context click)
	DIALOG_ACCEPT:0,
	DIALOG_CANCEL:1,
	_ssln:null,
	styleSetter:null,
	
	get selectedTabGroup(){ return this.tabbox.getAttribute('tabgroup')},
	set selectedTabGroup(val){ return this.tabbox.setAttribute('tabgroup', val)},
	test:function ()
	{
	},
	init:function ()
	{
		this.tabbox = document.getElementById("editor-arena");
		
	    this.consoleService = Components.classes['@mozilla.org/consoleservice;1'].
	        getService(Components.interfaces.nsIConsoleService);

	    this.finder = Components.classes["@mozilla.org/embedcomp/rangefind;1"].createInstance()
	        .QueryInterface(Components.interfaces.nsIFind);
		
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('codetch.');
		this.wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Components.interfaces.nsIWindowMediator);
	
	    this.consoleService.registerListener(CodetchConsoleListener);

		setTimeout('codetch.setWindowTitle(codetch.fileLongName())', 100);
		this.styleSetter = new StyleRuleSetter();
		this.version = getVersion();
		this.setStatusMsg('Ready');
		//this.setTabGroup(this.selectedTabGroup);
		
	},
	
	// load initial paramaters, usually durings start up
	initParams:function(options){
		options = options || {};
		if('loadURL' in options)
			this.open(options.loadURL, options);
	},
	uninit:function ()
	{
		this.consoleService.unregisterListener(CodetchConsoleListener);
	},

	// input: string cmd, hash{} params
	// Calls an internal command using codetch as the caller
	// cammands are stored in a hash
	doCommand: function(cmd, params){
		if(this.cammands[cmd])
			return this.commands[cmd].call(this, params);
		else
			return goDoCommand(cmd);
	},
	hasFiles:function ()
	{
		return (this.fileCount()!=0);
	},
	visibleTabs:function (group) // any files in the current tab group?
	{
		if(!this.hasFiles()) return [];
		return this.tabbox._tabs.getElementsByAttribute('tabgroup', group?group:this.selectedTabGroup);
	},
	// returns number of documents open
	fileCount:function ()
	{
		var n = 0;
		for(var i in this.docs)
			n++;
		return n;
	},
	// add new document to docs hash
	addDoc:function (doc)
	{
		return this.docs[doc.id] = doc;
	},
	// remove document from docs hash
	removeDoc:function (id)
	{
		var temp = [];
		for(var i in this.docs)
			if(i!=id) temp[i] = this.docs[i];
			
		this.docs = temp;
		return true;
	},
	// returns selected document's unique ID
	selectedId:function ()
	{
		if(!this.hasFiles()) return null;
		return this.tabbox.selectedPanel.getAttribute('id');
	},
	// returns number of documents that are editors
	editorCount:function ()
	{
		var n = 0;
		for(var i in this.docs)
			if(this.docs[i].isEditor)n++;
		return n;
	},
	// returns true if current doc is an editor
	isEditorSelected:function ()
	{
		return (this.hasFiles() && this.getFile().isEditor);
	},
	// return doc ID  based on file path
	fileIfOpen:function (file)
	{
		var els = this.tabbox.getElementsByAttribute('src', file);
		for(var i=0;i<els.length;i++){
			if(els[i].hasAttribute('id'))
				return els[i].getAttribute('id');
		}
		return false;
	},

/* Tab Methods
-------------------------------------------------------------------------------*/
	addTabGroup:function (name, options)
	{
		options = options || {};
		var i = 0;
		if(!name) name = prompt(localize('EnterGroupName'));
		if(!name || this.tabGroups[name]) return false;

		this.tabGroups[this.tabGroups.length] = name;
		this.tabGroups[name] = true;
		this.styleSetter.setRule('tabgroup-'+name, '#editor-arena[tabgroup="'+name+'"] *[tabgroup="'+name+'"]{visibility: visible!important;}');
		//this.tabbox.selectedTab.selected = false;
		this.setTabGroup(name);
		
		if(!options.noDefault)return this.newLocalPage('newtabgroup.xhtml', {tabgroup:name});
		return name;
	},
	removeTabGroup:function (name)
	{
		if(this.tabGroups.length <= 1)return false;
		var temp = [];
		for(var i=0;i<this.tabGroups.length;i++)
			if(this.tabGroups[i]!=name){
				temp[temp.length] = this.tabGroups[i];
				temp[this.tabGroups[i]] = true;
			}
			
		//alertObject(temp);
		this.tabGroups = temp;
		if(name == this.selectedTabGroup)
			this.setTabGroup(this.tabGroups[0]);
		return true;
	},
	newBrowserPage:function (page, options)
	{
		options = options || {};
		options.class = 'browser-page';
		var doc = this.addTab(options.title||localize('Loading'), options);
		if(!options.noSelect)
			this.tabbox.selectedTab = doc.tab;
		doc.src = page;
		doc.loadOpenOptions(options);
		
		goUpdateFileMenuItems();
		return doc;
	},
	newLocalPage:function (page, options)
	{
		options = options || {};
		options.class = 'local-page';
		page = page.indexOf('chrome://')==0?page:'chrome://codetch/content/pages/'+page;
		var doc = this.addTab(options.title||localize('Loading'), options);
		if(!options.noSelect)
			this.tabbox.selectedTab = doc.tab;
		doc.tab.setAttribute('context', "tab-browser-page-context-menu");
		doc.src = page;
		doc.loadOpenOptions(options);
		
		goUpdateFileMenuItems();
		return doc;
	},
	addTab:function (title, options)
	{
		options = options || {};
		var uid = genuid();
		var doc = new CodetchTab(uid,title);
		doc.appendElements(options.tabgroup||this.selectedTabGroup, options.class);

		this.addDoc(doc);
		return doc;
	},
	setTabGroup:function (name, overide, noselect)
	{
		if(!this.tabGroups[name]) return this.addTabGroup(name, {noDefault:true});
		if(!overide && this.selectedTabGroup == name)
			return this.selectedTabGroup;

		if (this.tabGroups[name]) this.selectedTabGroup = name;
		
		var setElements = this.visibleTabs();
		if(setElements.length && !noselect){
			this.tabbox.selectedTab = setElements[0];
			this.tabbox.selectedPanel = document.getElementById(this.tabbox.selectedTab.linkedPanel);
		}

		return this.selectedTabGroup;
	},

/* File IO Methods
-------------------------------------------------------------------------------*/
	
	newEditor:function (ext, type, options)
	{
		options = options || {};
		ext = (ext)?ext:GetStringPref('defaultdoctype');
		gDefView = 'cmd_viewCode';//GetStringPref('last'+getBaseDoctype(ext)+'view');
		var tabgroup = options.tabgroup || this.selectedTabGroup;
		var uid = genuid();
		var doc = new CodetchDocument(uid,localize('Untitled')+(ext?'.'+ext:''));

		doc.doctype = ext;
		doc.basedoctype = type;
		doc.filehandler = 'default';

		this.addDoc(doc);

		doc.appendElements(tabgroup, 'editor');

		doc.selected = true;

		return doc;
	},
	newFile:function (ext, type, defaultFile)
	{
		ext = (ext)?ext:GetStringPref('defaultdoctype');
		if(!type || !defaultFile){
			var ob = getBaseDoctype(ext);
			type = ob['type'];
			if(!defaultFile){
				var f = FileIO.open(getConfigPath());
				f.append('doctypes');
				f.append(ob['file']);
				defaultFile = f.path;
			}
		}

		var importFile = FileIO.open(osPath(defaultFile));

		var doc = this.newEditor(ext, type);
		var str = '';

		if((importFile) && importFile.exists())
			str = FileIO.read(importFile, 'UTF-8');
		//else alert('fail');

		doc.source = doc.originalSource = str;
		doc.modified = false;
		doc.unsaved = true;
		doc.src = doc.leafName;
		doc.lineFormat = 'unix';
		doc.sourceEditor.setSelectionRange(0,0);
		doc.currentEditor.setStatus();

		this.setWindowTitle(this.fileLongName());
		this.setStatusMsg(localize('NewFile'));
		goUpdateFileMenuItems();
		return doc;
	},
	
	open:function (path, options)
	{
		options = options || {};
		if(path.match(/^about:\w*/)) // no loading about: pages
			return false;
		switch(options['class'] || 'editor'){
			case 'browser-page':
				this.newBrowserPage(path, options);
			break;
			case 'local-page':
				this.newLocalPage(path, options);
			break;
			case 'editor':
			default:
				var proto = getBrowserPath(path);
				proto = proto.substr(0,proto.indexOf(':'));
				switch(proto){
					case 'file': return this.openPath(path, false, options);
					break;
					case 'http':
					case 'https':
						return this.openRemote(path, options);
					break;
				}
			break;
		}
		return false;
	},
	openFile:function (newfile, options)
	{
		options = options || {};
	try {
		if(!newfile) newfile = fileBrowse("open");
		if(!newfile) return false;

		for(var id in this.docs){
			if(this.docs[id].file && this.docs[id].file.equals(newfile)){
				this.tabbox.selectedTab = this.docs[id].tab;
	 			return this.docs[id];
			}
		}
		var str = FileIO.read(newfile, 'UTF-8');
	}catch (ex){
		alert(localize('OpenFileFail'));
		debugLog(newfile.path+'-----\n'+ex);
		removeRecentFile(newfile.path);
		return false;
	}
		if(newfile){
			var type = FileIO.ext(newfile);
			var basetype = getBaseDoctype(type)['type'];

			var doc = this.newEditor(type, basetype, options);
			doc.leafName = newfile.leafName;

			//var doc = this.getFile();
			doc.file = newfile;
			doc.originalSource = str;
			doc.src = FileIO.path(newfile);
			if(doc.basedoctype=="html"){
				doc.sourceEditor.source = str;
				this.loadURI(FileIO.path(newfile));
			}else 
				doc.source = str;

			doc.modified = false;
			doc.lineFormat = str.match(/\r\n/)?'win':str.match(/\r/)?'mac':'unix';
			doc.loadOpenOptions(options);
			doc.currentEditor.setStatus();

			addRecentFile(newfile.path);
			this.setStatusMsg(localize('FileOpened'));
			this.setWindowTitle(this.fileLongName());
		}
		goUpdateFileMenuItems();
		return doc;
	},
	loadURI:function (path)
	{
		var loadFlags = Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE;
		if(this.getDesignElement()) this.getDesignElement().webNavigation.loadURI(path,loadFlags,null,null,null);
		this.getPanel('preview').element.webNavigation.loadURI(path,loadFlags,null,null,null);
	},
	openPath:function (path, importit, options)
	{
	try {
		var p = osPath(path);
		var newfile = FileIO.open(p);
		if(newfile && newfile.exists() && newfile.isFile())
		  return (importit)?this.importFile(newfile):this.openFile(newfile, options);
		else if(newfile.isFile())
		  throw 'The file is missing or has been moved.';
	}catch (ex){
		alert(p+'\n'+localize('OpenPathFail'));
		debugLog(ex);
	}
		return false;
	},
	openRemote:function (sURI, options)
	{
		options = options || {};
	try {
		if(!sURI) sURI = prompt(localize('OpenRemote'), "http://");
		var id = this.fileIfOpen(sURI);
		if(id){
				this.tabbox.selectedTab = this.docs[id].tab;
	 			return this.docs[id];
		}
		if(sURI){
			//var load = FileIO.readURL(sURI);
			//if(!load) throw sURI;
			var type = getExt(sURI);
			switch(type){ // set type by extension
				case 'css':// ignore these types, they retain type
				case 'txt':
				case 'js':
				case 'xml':
				case 'txt':
				break;
				case 'xul':// set to xml for security
					type = 'xml';
				break;
				default:// the rest, just go with html
					type = 'html';
				break;
			}
			var basetype = getBaseDoctype(type)['type'];

			var doc = this.newEditor(type, basetype, options);
			
			var loaded = FileIO.readURLAsync(sURI,
			    function onLoad(e){
			        load = e.target.responseText;
			        doc.source = doc.originalSource = load;
			        doc.lineFormat = load.match(/\r\n/)?'win':load.match(/\r/)?'mac':'unix';
			        doc.tab.removeAttribute("busy");
			        doc.loadOpenOptions(options);
			        codetch.setStatusMsg(localize('RemoteFileOpened'));
			    },
			    function onError(e){alert("Error " + e.target.status + " occurred while receiving the document.");},
			    function onProgress(e){
			        var percentComplete = (e.position / e.totalSize)*100;
			        if(doc.tab.selected)
			        codetch.setStatusMsg(localize("Loading")+' '+percentComplete+'%');
			    });
			
			doc.src = doc.leafName = sURI;
			doc.modified= false;
			doc.isRemote = true;
			this.setWindowTitle(sURI);
			//doc.source = doc.originalSource = load;
			//doc.lineFormat = load.match(/\r\n/)?'win':load.match(/\r/)?'mac':'unix';
			//doc.loadOpenOptions(options);

			this.loadURI(sURI);
			doc.tab.setAttribute("busy", "true");

			this.setStatusMsg(localize('Loading'));
		}
		window.focus();
		goUpdateFileMenuItems();
		return doc;
	}catch (ex){
		alert(localize('OpenRemoteFail')+': '+sURI);
		debugLog(sURI+'\n'+ex);
		this.setStatusMsg(localize('OpenRemoteFail'));
		return false;
	}
	},
	importFile:function (newfile)
	{
	try {
		if(!newfile) newfile = fileBrowse("open");
		if(!newfile || !newfile.exists()) return;

		var str = FileIO.read(newfile);
		if(str){
			var doc = this.getFile();
			doc.currentEditor.focus();
			doc.currentEditor.insertFragment(str);
			return;
		}
	}catch (ex){
		alert(localize('OpenFileFail'));
		debugLog(ex);
	}
	},
	revertToSave:function (id)
	{
		var doc = this.getFile(id);
		doc.source = FileIO.read(doc.file);
		doc.panel.setAttribute("src", FileIO.path(doc.file));
		//doc.modified = false;
	},
	revertToOpen:function (id)
	{
		var doc = this.getFile(id);
		doc.source = doc.originalSource;
		//doc.modified = false;
	},
	modify:function ()
	{
		var doc = this.getFile();
		if(!doc.modified){
			doc.modified = true;
			//doc.tab.label = doc.leafName+"*";
		}
	},
	closeFile:function (id)
	{
		if(!this.hasFiles()) return false;
		if(this.targetID && !id) id = this.targetID;
		if(id && id!=this.tabbox.selectedPanel.getAttribute('id')){
			var r = this.docs[id].close();
			this.tabbox.selectedPanel = document.getElementById(this.tabbox.selectedTab.linkedPanel);
			return r;
		}
		var tabbox = document.getElementById("editor-arena");
		var next = this.tabbox.selectedTab.nextSibling;
		var prev = this.tabbox.selectedTab.previousSibling;
		if(this.getFile().close()){
			this.setWindowTitle('');
			if(prev && prev.getAttribute('tabgroup')!=this.selectedTabGroup)
				prev = this.visibleTabs()[0];
			if(next && next.getAttribute('tabgroup')!=this.selectedTabGroup)
				next = this.visibleTabs()[this.visibleTabs().length-1];
			if(next)
				this.selectTab(next);
			else if(prev)
				this.selectTab(prev);
			else if(this.visibleTabs().length)
				this.selectTab(this.visibleTabs()[0]);
			goUpdateFileMenuItems();
			return true;
		}else
			return false;
	},
	selectTab:function (tab)
	{
	    if(this.tabbox._tabs._selectNewTab)
	        this.tabbox._tabs._selectNewTab(tab);
	    else
	        this.tabbox.selectedTab = tab;
	},
	// use tabgroup = '*' to close all open docs
	closeAll:function (tabgroup)
	{
		var cont = true;
		if(!tabgroup)tabgroup = this.selectedTabGroup;
		var elms = this.tabbox._tabpanels.getElementsByAttribute('tabgroup', tabgroup);
		while(cont && elms.length){
		    cont = this.docs[elms[0].getAttribute('id')].close();
		}
		goUpdateFileMenuItems();
		return cont;
	},
	closeAllBut:function (id)
	{
		var cont = true;
		if(this.targetID && !id) id = this.targetID;
		if(!id) id = this.tabbox.selectedPanel.getAttribute('id');
		//this.selectFile(0);
		var tabgroup = this.docs[id].tabgroup;
		var elms = this.tabbox._tabs.getElementsByAttribute('tabgroup', tabgroup);
		var dn = elms.length;
		var i = 0;
		while(cont && elms.length>1){
			if(elms[i].linkedPanel == id) i++;
		    else cont = this.docs[elms[i].linkedPanel].close();
		}
		this.tabbox.selectedTab = document.getElementById('tab-'+id);
		this.tabbox.selectedPanel = document.getElementById(id);
		goUpdateFileMenuItems();
		return cont;
	},
	
	saveFile:function (id)
	{
		var doc = this.getFile(id);
		if(!doc.save)return false;
		doc.save();
		goUpdateCommand("cmd_revert");
		return doc.file;
	},
	saveFileAs:function (def, id)
	{
		var doc = this.getFile(id);
		if(!doc.saveAs)return false;
		doc.saveAs(def);
		goUpdateCommand("cmd_revert");
		return doc;
	},
	saveAll:function ()
	{
		for(var i=0;i<this.fileCount();i++){
			this.saveFile();
			this.nextFile();
		}
		goUpdateCommand("cmd_revert");
	},
	
	// change the tab group of a file
	changeTabGroup:function (group, id)
	{
		var doc = this.getFile(id);
		if(!group || !doc)
			return;
		var sel = doc.selected;
		var oldgroup = doc.tabgroup;
		doc.tabgroup = group;
		if(this.visibleTabs(oldgroup).length==0)
			this.removeTabGroup(oldgroup);
		if(sel){
			this.setTabGroup(group);
			this.tabbox.selectedTab = doc.tab;
		}
	},
	launchFile:function (id)
	{
		var doc = this.getFile(id);
		doc.launch();
		return doc;
	},

/* Document and Editor Handling/Switching Methods
-------------------------------------------------------------------------------*/

	get doc(){return this.getFile()},
	set doc(obj){this.tabbox.selectedTab = obj.tab;return obj;},

	// Retreive file by id
	// if id parameter, use that
	// else use already specified targetID
	// else use selected tab
	getFile:function (id)
	{
		if(this.targetID && !id) id = this.targetID;
		if(!id) id = this.tabbox.selectedTab.linkedPanel
		return this.docs[id];
	},
 
	// Retreive the current file editing pane
	getFileEditor:function (id)
	{
		var f = this.getFile(id);
		return f?f.panel:null;
	},

	// set the current file editing pane
	setFileEditorById:function (id)
	{
		//var r= this.tabbox.selectedPanel = document.getElementById(id);
		return this.tabbox.selectedTab = document.getElementById('tab-'+id);
	},

	// Retreive the Design Element (like the editor with HTML)
	getDesignElement:function ()
	{
		var el = this.getPanel('design').element;
		return el?el:null;
	},
	// Retreive the design element document
	getDesignDocument:function ()
	{
		return this.getDesignElement()?this.getDesignElement().contentDocument:null;
	},
	// Retreive the design element editor
	getDesignEditor:function ()
	{
		return this.getDesignElement()?this.getDesignElement().getEditor(this.getDesignElement().contentWindow):null;
	},
	// Retreive the design element html editor
	getDesignHTMLEditor:function ()
	{
		return this.getDesignElement()?this.getDesignElement().getHTMLEditor(this.getDesignElement().contentWindow):null;
	},
	// Retreive the design element text editor
	getDesignTextEditor:function ()
	{
		var editor = this.getDesignEditor();
		return editor?editor.QueryInterface(Components.interfaces.nsIPlaintextEditor):null;
	},

	// Retreive the code editing textbox
	getCodeBox:function ()
	{
		return this.getPanel('code').element;
	},

	// Retreive the preview win document
	getPreviewDocument:function ()
	{
		return this.getPanel('preview').element.contentDocument;
	},

	// Retreive a panel by mode (code, design, preview, reference)
	getPanel:function (val)
	{
		return this.getFileEditor().panels[val];
	},

	// Retreive the currently selected panel
	getCurrentPanel:function ()
	{
		return this.getFileEditor().selectedPanel;
	},

	// Retreive the current/last selected editor
	getCurrentEditor:function ()
	{
		return this.getFile().currentEditor;
	},

	// Retreive the current mode
	getView:function (val)
	{
		return this.getFileEditor().selectedView;
	},

	// set the mode
	switchView:function (val)
	{
		return this.getFileEditor().selectedView=val;
	},

	// Retreive a Codetch file by its index
	selectFile:function (val)
	{
		if(!this.hasFiles()) return false;
		return this.tabbox.selectedIndex = val;
	},
	// select next file
	nextFile:function ()
	{
		if(!this.hasFiles()) return false;
		return this.tabbox._tabs.advanceSelectedTab(1);
	},
	// select previous file
	previousFile:function (val)
	{
		if(!this.hasFiles()) return false;
		return this.tabbox._tabs.advanceSelectedTab(-1);
	},

/* Other Methods
-------------------------------------------------------------------------------*/

	getSelection:function (val)
	{
		var editor = this.getCurrentEditor();
		switch(editor.getAttribute('mode')){
			case 'design':
				return editor.htmleditor.outputToString("text/html", 1);
			break;
			case 'code':
				return editor.element.value.substring(editor.element.selectionStart,editor.element.selectionEnd);
			break;
			default:
				return '';
			break;
		}
		return '';
	},
	fileLongName:function (val)
	{
		if(!this.hasFiles()) return '';
		var doc = this.getFile();
		if(doc.isEditor){
			var extra = ' ['+(doc.writable?'R/W':'R')+']';
			if(doc.file) return doc.file.path+extra;
			else if(doc.src!='') return doc.src+extra;
			else return doc.leafName+extra;
		}else return doc.leafName;
	},
	setStatusMsg:function (val, reset)
	{
		document.getElementById("generalstatus").value = val;
		if(!reset){
			clearTimeout(this._to);
			this._to = setTimeout(function(){codetch.setStatusMsg('Beta '+codetch.version, 1)}, 3000);
		}
		return val;
	},
	setWindowTitle:function (val)
	{
		//debugLog(val);
		return  document.title = "Codetch" + ((val)?" - "+val:'');
	},
	updateOuput:function (val)
	{
		var out = document.getElementById("output-buffer").inputField;
		var bottom = out.scrollHeight - out.clientHeight - out.scrollTop;
		var oldtop = out.scrollTop;
		out.value += val;
		if(!bottom)
			out.scrollTop = out.scrollHeight - out.clientHeight; // scroll to the bottom
		else 
			out.scrollTop = oldtop;
		this.setStatusMsg('Output logged');
		return val;
	},
	
	// Set editor type attributes. Useful for setting styles based on current editor (hiding toolbars, panels, ect)
	setWorkAreaDoctypes:function (base, ext, plugin)
	{
		var area = document.getElementById("workarea");
		base?area.setAttribute('basetype',base):
			area.removeAttribute('basetype');
		ext?area.setAttribute('exttype',ext):
			area.removeAttribute('exttype');
		plugin?area.setAttribute('filehandler',plugin):
			area.removeAttribute('filehandler');
		//debugLog(base);
	},
	setWorkAreaPanels:function (panels)
	{
		var area = document.getElementById("workarea");
		panels?area.setAttribute('editorpanels',panels):
			area.removeAttribute('editorpanels');
	},

	find:function (query,usecase,regex,wrap)
	{
		this._query = query;
		this._usecase = usecase;
		this._regex = regex;
		this._wrap = wrap;
		//this._selection = selection;
	},
	findNext:function (query,usecase,regex,wrap,dialog)
	{
		if(dialog)this.find(query,usecase,regex,wrap);

		query = (query==null)?this._query:query;usecase = (usecase==null)?this._usecase:usecase;regex = (regex==null)?this._regex:regex;wrap = (wrap==null)?this._wrap:wrap;
		if(query==null) return false;

		var r = this.getPanel('code').findNext(query,usecase,regex,wrap);
		if(!r){
			if(!dialog)	
				alert("No matches found");
			return false;
		}
		return r;
	},
	findAll:function (query,replacement,usecase,regex,wrap,selection,doreplace)
	{
		if(query != this._query)this.find(query,usecase,regex,wrap);
		//query = (query==null)?this._query:query;usecase = (usecase==null)?this._usecase:usecase;regex = (regex==null)?this._regex:regex;wrap = (wrap==null)?this._wrap:wrap;selection = (selection==null)?this._selection:selection;

		var r = doreplace?this.getPanel('code').replaceAll(query,replacement,usecase,regex,wrap,selection)
				:this.getPanel('code').findAll(query,replacement,usecase,regex,wrap,selection);
		if(!r)
			return false;
		return r;
	},
	findAllInOpen:function (query,replacement,usecase,regex,wrap,selection,doreplace)
	{
		if(query != this._query)this.find(query,usecase,regex,wrap);
		var results=[],r,n=0;
		for(var i in this.docs){
			var code = this.docs[i].panel.panels['code'];
			r = doreplace?code.replaceAll(query,replacement,usecase,regex,wrap,selection)
				:code.findAll(query,replacement,usecase,regex,wrap,selection);
			//this.nextFile();
			if(n==0)results = r;
			else for(var j=0;j<r.length;j++)results.push(r[j]);
			n++;
		}
		if(!results || !results.length)
			return false;
		return results;
	},

/* Browser Methods
-------------------------------------------------------------------------------*/

	browserStop:function ()
	{
		this.getFileEditor().element.parentNode.stop();
	},
	browserLoadURI:function (uri)
	{
		this.getFileEditor().element.parentNode.loadURI(uri);
	},
	browserOpenURI:function ()
	{
		var addr = prompt(localize('OpenRemote'), "http://");
		if(addr) this.browserLoadURI(addr);
	},
	browserOpenLocal:function ()
	{
		var local = getFilePath();
		if(local) this.getFileEditor().element.parentNode.loadURI(local);
	},
	browserReload:function ()
	{
		this.getFileEditor().element.parentNode.reload();
	},
	browserGoBack:function ()
	{
		this.getFileEditor().element.parentNode.goBack();
	},
	browserGoForward:function ()
	{
		this.getFileEditor().element.parentNode.goForward();
	},

/* Temporary File Handling Methods
-------------------------------------------------------------------------------*/
	externalPreview:function (val)
	{
		var doc = this.getFile(),
		path;
		if(val==null) val = GetStringPref('defaultbrowser');
		if(doc.isEditor){
			if(GetBoolPref('previewtmp') || !doc.file){
				this.createTempFile();
				path = this.tmpFile.path;
			}else{
				if(doc.modified && (ConfirmAdvanced(doc.file.leafName, localize('ConfirmSave'))==0))
					this.saveFile();
				path = doc.file.path;
			}
			path = getBrowserPath(path);
	
			if(doc.site && doc.site.testPath){
				path.replace(getBrowserPath(doc.site.localPath), doc.site.testPath);
			}
		}else{
			path = doc.src;
		}
		if(val=='')this.newBrowserPage(path);
		else launchPreview(val, path);
	},
	createTempFile:function (path)
	{
		try{
			this.removeTempFile();
			this.tmpFile = this._createTempFile(path, this.getFile().doctype);
			FileIO.write(this.tmpFile, this.getCurrentEditor().source);
			return this.tmpFile;
		}catch(e){
			debugLog(e);
			return false;
		}
	},
	_createTempFile:function (path, ext)
	{
		try{
			var doc = this.getFile();
			path = path?path:doc.file?doc.file.parent.path:DirIO.get('TmpD').path;
			var name = "~"+parseInt(Math.random()*Math.pow(10,16));
			var f = FileIO.open(path);
			f.append(name+"."+ext);
			return f;
		}catch(e){
			debugLog(e);
			return false;
		}
	},
	removeTempFile:function ()
	{
		try{
			if(this.tmpFile && this.tmpFile.exists())this.tmpFile.remove(false);
			this.tmpFile = null;
			return true;
		}catch(e){
			debugLog(e);
			return false;
		}
	},
	openReferenceURL:function (url)
	{
		if(!url) return false;
		return this.newBrowserPage(url)
		if(!this.hasFiles() || !GetBoolPref('openinreference'))
			return openBrowserURL(url);
		//goDoCommand('cmd_viewReference');
		this.getPanel('reference').loadURL(url);
		return true;
	},
	toggleAreaVisibility:function (id)
	{
		var node= document.getElementById('brd_'+id);
		var cmd= document.getElementById('cmd_toggle'+id.capitalize());
		if(node.hasAttribute('hidden')){
			node.removeAttribute('hidden');
		}else{
			node.setAttribute('hidden', true);
		}
		if(cmd)cmd.setAttribute('checked', !(node.hasAttribute('hidden')));
		return true;
	},
	openSupportPanel:function (id)
	{
		var panel = document.getElementById(id);
		var node = panel;
		while(node && node.nodeType == node.ELEMENT_NODE){
			if(node.showPanel && node.hasAttribute('collapsed'))
				node.showPanel();
			else if(node.hasAttribute('collapsed')){
				node.removeAttribute('collapsed');

			if(node.previousSibling)
				node.previousSibling.removeAttribute('state');
			if(node.nextSibling)
				node.nextSibling.removeAttribute('state');
			}
			if(node.hasAttribute('hidden') && node.getAttribute('guitype')=='panel_area'){
				this.toggleAreaVisibility(node.getAttribute('observes').replace('brd_',''));
			}else if(node.hasAttribute('hidden'))
				node.removeAttribute('hidden');
			node=node.parentNode;
		}
		if(panel.parentNode.selectedItem)
			panel.parentNode.selectedItem = panel;

		return true;
	},	
	
	openDialog:function(name, options){
		var win = this.window;
		switch(name){
			case 'new':win.newFileDialog(options);
			break;
			case 'about':win.aboutDialog(options);
			break;
			case 'pref':win.preferencesDialog(options);
			break;
			case 'browser':win.browserDialog(options);
			break;
		}
	}
};

function hideWindowChrome(el){
}

function deleteFile(path){

	try{
		var p = osPath(path),
		file = FileIO.open(p);

		if(file.isFile() && ConfirmWithTitle(file.leafName, localize('ConfirmDelete')))
			file.remove(false);
		else if(file.isDirectory() && ConfirmWithTitle(file.leafName, localize('ConfirmDeleteDir')))
			file.remove(true);
		else
			return false;

		return true;
	}catch(e){
		debugLog(e);
		return false;
	}
}

function createDirectory(path, filename){
	try{
		var p = osPath(path),
		dir = DirIO.open(p);
		if(!dir.isDirectory()) dir = dir.parent;
		
		if(!filename) filename = prompt(localize('PromptFileName'));
		if(!filename) return false;
		dir.append(filename);
	
		if(dir.exists()) return false;
		DirIO.create(dir);
		return dir;
	}catch(e){
		debugLog(e);
		return false;
	}
}
function createFile(path, filename){
	try{
		var p = osPath(path),
		dir = DirIO.open(p);
		if(!dir.isDirectory()) dir = dir.parent;
		
		if(!filename) filename = prompt(localize('PromptFileName'));
		if(!filename) return false;
		dir.append(filename);
	
		if(dir.exists()) return false;
		FileIO.create(dir);
		return dir;
	}catch(e){
		debugLog(e);
		return false;
	}
}

function renameFile(path, filename){
	try{
		var p = osPath(path),
		file = DirIO.open(p);
		//if(!dir.isDirectory()) dir = dir.parent;

		if(!filename) filename = prompt(localize('PromptFileName'), file.leafName);
		if(!filename || filename==file.leafName) return false;
		var newfile = file.parent;newfile.append(filename);
	
		if(newfile.exists()) {alert('Cannot rename the file. '+newfile.path+' already exists.');return false;}
		file.copyTo(null, filename);
		file.remove(file.isDirectory());
		return newfile;
	}catch(e){
		debugLog(e);
		return false;
	}
}

// also deprecated
function buildSiteMenu(menuPopup)
{
	//alert(gSiteXML.firstChild.xml);
	var siteNodes = gSiteXML.selectNodes('/*/*');
	//alert(siteNodes[0].xml);
	while(menuPopup.childNodes.length>1)menuPopup.removeChild(menuPopup.firstChild);
	for(var i=0;i<siteNodes.length;i++){
        var itemNode = document.createElementNS(XULNS, "menuitem");
        menuPopup.parentNode.insertItemAt(0, siteNodes[i].getAttribute('name'),
		getBrowserPath(siteNodes[i].childNodes[1].getAttribute('path')));
	}
}

// menu functions for validators
function validateHTMLW3C(source)
{
	var path = 'http://qa-dev.w3.org/wmvs/HEAD/check?uri=data:text/html,' + encodeURIComponent(source)+'&ss=1';
	codetch.openReferenceURL(path);
}
function validateXMLW3C(source)
{
	var path = 'http://qa-dev.w3.org/wmvs/HEAD/check?uri=data:text/xml,' + encodeURIComponent(source)+'&ss=1';
	codetch.openReferenceURL(path);
}
function validateRDFW3C(source)
{
	var path = 'http://www.w3.org/RDF/Validator/ARPServlet?RDF=' + encodeURIComponent(source);
	codetch.openReferenceURL(path);
}
function validateCSSW3C(source)
{
	var path = 'http://jigsaw.w3.org/css-validator/validator?text=' + encodeURIComponent(source);
	codetch.openReferenceURL(path);
}

// Retreive the doctpye from an extension
function getBaseDoctype(ext)
{
	try{
		if(!ext || ext == '') throw '';
		var all = gDoctypeData.getAllResources();
		while (all.hasMoreElements()) {
			var target = all.getNext();
			if(!target.isContainer() &&
				eval('/\\b'+ext+'\\b/i').test(target.getTarget(DOCNS+'exts').getValue())){
				return {'type':target.getTarget(DOCNS+'type').getValue(),
				'file':target.getTarget(DOCNS+'default').getValue()};
				}
		}
		return {'type':'txt', 'file':'default.txt'};
	}catch(e){
		//alert(e);
		return {'type':'txt', 'file':'default.txt'};
	}
}

// file tree sidebar: menulist function
function loadLocalFiles(path, set)
{
	path = path || treePath(gLocalFileTree);
	var p = osPath(path);
	var dir = DirIO.open(p);
	if(dir && !dir.isDirectory()) path = getBrowserPath(dir.parent.path);
	if(path){
		path = path.replace('file:///Root','NC:FilesRoot');
		gLocalFileTree.setAttribute('ref', path);
		if(set) document.getElementById('file-site-list').label=osPath(path.replace('NC:FilesRoot','Root'));
		gLocalFileTree.builder.rebuild();
	}
}

function upOneDirectory(){
	try{
		var path = gLocalFileTree.getAttribute('ref');
		var p = osPath(path);
		var dir = DirIO.open(p);
		if(dir.parent) return loadLocalFiles(getBrowserPath(dir.parent.path), true);
	}catch(e){
		return loadLocalFiles('file:///Root', true);
	}
	return false;
}
function treePath(tree){
	try{
		var n = tree.view.selection.currentIndex;
		return tree.view.getCellValue(n, tree.columns?tree.columns['Name']:'Name');
	}catch(e){
		return tree.ref;
	}
	return null;
}
function deleteTreeFile(path){
	try{
		var r = deleteFile(path || treePath(gLocalFileTree));
		if(r)gLocalFileTree.builder.rebuild();
		return r;
	}catch(e){
		return false;
	}
}
function renameTreeFile(path){
	try{
		var r = renameFile(path || treePath(gLocalFileTree));
		if(r)gLocalFileTree.builder.rebuild();
		return r;
	}catch(e){
		return false;
	}
}
function createTreeDir(path){
	var r = createDirectory(path || treePath(gLocalFileTree));
	gLocalFileTree.builder.rebuild();
	return r;
}

function createTreeFile(path){
	var r = createFile(path || treePath(gLocalFileTree));
	gLocalFileTree.builder.rebuild();
	return r;
}
function editTreeFile(path){
	path = path || treePath(gLocalFileTree);
	return codetch.openPath(path);
}
// tree event handler for the sidebar trees
function treeEvent(tree, event)
{

try{
	var b = tree.treeBoxObject;
		var n = tree.view.selection.currentIndex;
		var value = tree.view.getCellValue(n, tree.columns?tree.columns['Name']:'Name');
	if(event.type=="select"){
		switch(tree.id){
			case 'local-file-tree':
				var size = tree.view.getCellText(n, tree.columns?tree.columns['Content-Length']:'Content-Length');
				tree.nextSibling.firstChild.value = 
					'Date: '+tree.view.getCellText(n, tree.columns?tree.columns['LastModifiedDate']:'LastModifiedDate')+
					(size?'   Size: '+Math.round(size/1024)+'KB':'');
			break;
			case 'bookmark-tree':
			break;
			case 'snippet-tree':previewSnippet(value);
			break;
		}
	}else if(event.type=="dblclick"){
		switch(tree.id){
			case 'local-file-tree':return codetch.openPath(value);
			break;
			case 'bookmark-tree':return codetch.openReferenceURL(value);
			break;
			case 'snippet-tree':insertSnippet(value);
			break;
		}
	}else if(event.type=="click"){
	}
	return false;
	}catch(e){
		debugLog(e);
		return false;
	}
}

// load xml doc from local file
function loadLocalSnippetXML(path)
{
	try{
		var p = osPath(path),
		newfile = FileIO.open(p);
		if(!newfile.isFile()) return null;
		var snippetXml = document.implementation.createDocument("","",null);
		var c = FileIO.read(newfile);var x = c.indexOf('?>');
		if(x==-1) return null;
		snippetXml.loadXML(c.slice(x+2));
		return snippetXml;
	}catch(e){
		debugLog(e);
		return null;
	}
}


function previewSnippet(path)
{
	try{
		var iframe = document.getElementById('snippet-preview');
		iframe.contentWindow.document.body.innerHTML = '';
		var code = '',
		snippetXml = loadLocalSnippetXML(path),
		root = snippetXml.getElementsByTagName('snippet')[0],
		text = snippetXml.getElementsByTagName('insertText');
		for(var i=0;i<text.length;i++)
			code += (text[i].firstChild.nextSibling && text[i].firstChild.nextSibling.nodeType==4)?
			text[i].firstChild.nextSibling.text:text[i].firstChild.text;
		
		var idoc = iframe.contentWindow.document;
		
		if(root.getAttribute('preview')=='html'){
			iframe.contentWindow.document.body.innerHTML = code;
			iframe.contentWindow.document.body.style.fontFamily='Tahoma';
			iframe.contentWindow.document.body.style.fontSize='10px';
		}else{
			code = code.replace(/</g, '&lt;');
			idoc.open();
			idoc.write('<pre>' + code.trim() + '</pre>');
			idoc.close();
		}
		
		return true;
	}catch(e){
		debugLog(e);
		return false;
	}
}
function insertSnippet(path)
{
	try{
		if(!path){
			var tree = document.getElementById('snippet-tree');
		
			var n = tree.view.selection.currentIndex;
			path = tree.view.getCellValue(n, tree.columns?tree.columns['Name']:'Name');
		}
		var after = before = '',
		r = false,
		snippetXml = loadLocalSnippetXML(path),
		root = snippetXml.getElementsByTagName('snippet')[0],
		text = snippetXml.getElementsByTagName('insertText');

		for(var i=0;i<text.length;i++)
			if(text[i].getAttribute('location')=='afterSelection')
				after += (text[i].firstChild.nextSibling && text[i].firstChild.nextSibling.nodeType==4)?
				text[i].firstChild.nextSibling.text:text[i].firstChild.text;
			else before += (text[i].firstChild.nextSibling && text[i].firstChild.nextSibling.nodeType==4)?
				text[i].firstChild.nextSibling.text:text[i].firstChild.text;

		codetch.getCurrentEditor().element.focus();
		if(root.getAttribute('type')=='wrap')
			codetch.getCurrentEditor().insertFragment((before+codetch.getSelection()+after).replace(']]&gt;',']]>'));
		else
			codetch.getCurrentEditor().insertFragment((before+after).replace(']]&gt;',']]>'));
	}catch(e){
		debugLog(e);
		return false;
	}
	return false;
}
function snippetDialog(mode, path)
{
	var tree = document.getElementById('snippet-tree');
	path = path || treePath(tree);
	try{
		var p = osPath(path),
		newfile = FileIO.open(p);
		if(mode=='edit' && !newfile.isFile()) return false;
		window.openDialog('chrome://codetch/content/dialogs/snippet.xul', 'snippet', 'chrome,dependent,centerscreen,alwaysRaised,modal=yes,dialog,resizable=no',mode, path);
		if(codetch.dialogReturn == codetch.DIALOG_ACCEPT){
			previewSnippet(path);
			tree.builder.rebuild();
		}

		return true;
	}catch(e){
		debugLog(e);
		return false;
	}
}

function createSnippetDir(path){
	var tree = document.getElementById('snippet-tree'),
	r = createDirectory(path || treePath(tree));
	tree.builder.rebuild();
	return r;
}



function deleteSnippet(path){
	try{
		var tree = document.getElementById('snippet-tree'),
		n = tree.view.selection.currentIndex;
		if(!path){
			path = tree.view.getCellValue(n, tree.columns?tree.columns['Name']:'Name');
		}
		var r = deleteFile(path);
		tree.builder.rebuild();
		return r;
	}catch(e){
		debugLog(e);
		return false;
	}
}


function genuid(){
	return parseInt(Math.random()*(new Date()).getTime())+''+parseInt(Math.random()*Math.pow(10,16));
}

// dialog opening functions

function newFileDialog(options)
{
	window.openDialog("chrome://codetch/content/dialogs/new.xul", "new_file", "modal,centerscreen,chrome,resizable=no");
}

function aboutDialog(options)
{
	window.openDialog("chrome://codetch/content/about.xul", "about_codetch", "modal,centerscreen,chrome,resizable=no");
}

function preferencesDialog(options)
{
	window.openDialog("preferences.xul", "codetch_prefs",
		"chrome,modal=yes,centerscreen,dialog=yes,resizable=yes");
	gStylesheet.deleteRule(gRule_1+2);
	gStylesheet.deleteRule(gRule_1+1);
	gStylesheet.deleteRule(gRule_1);
	initPrefs();
}

function browserDialog(options)
{
	window.openDialog("chrome://codetch/content/dialogs/previewBrowsers.xul", "bowsers", "modal,centerscreen,chrome,resizable=no");
	loadExternalBrowsers();
}


// editor observers

var cmdDragObserver = { 
  onDragStart: function (evt,transferData,action){
    var txt=evt.target.hasAttribute("command")?evt.target.getAttribute("command"):evt.target.getAttribute("oncommand");
    transferData.data=new TransferData();
    transferData.data.addDataForFlavour("text/unicode",txt);
  }
};

var editorDDObserver = {
  getSupportedFlavours : function () {
    var flavours = new FlavourSet();
    flavours.appendFlavour("text/unicode");
    return flavours;
  },
  onDragOver: function (evt,flavour,session){},
  onDrop: function (evt,dropdata,session){
	alert(dropdata.data);
    if (dropdata.data!=""){
	if(dropdata.data.indexOf('(') != -1) eval(dropdata.data);
	else goDoCommand(dropdata.data);
    }
  }
};

const designDocListener=
{
  NotifyDocumentCreated: function NotifyDocumentCreated() {goUpdateUndoMenuItems()},
  NotifyDocumentWillBeDestroyed: function NotifyDocumentWillBeDestroyed() {},
  NotifyDocumentStateChanged: function NotifyDocumentStateChanged(isChanged)
  {
    codetch.modify();goUpdateUndoMenuItems();
  }
};

// not used, causes crashes
const designObserver=
{
  observe: function observe(aSubject, aTopic, aData)
  {
    // we currently only use this to update undo
    alert('observe');
  },
  editAction: function observe(aSubject, aTopic, aData)
  {
    // we currently only use this to update undo
    alert('editaction');
  }
};

// turn on/off editor CSS use
function editorCSSPref(val)
{
  try {
	if (!gEditorPrefBranch){
		var prefService= Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		if (prefService)
			gEditorPrefBranch = prefService.getBranch('editor.');
	}
	if (gEditorPrefBranch){
		gEditorPrefBranch.setBoolPref("use_css", val);
	}
  }
  catch(ex) {
    dump("failed to get editor prefs!\n");
  }
  return null;
}

function openTabSession()
{
	var tabhistory = GetStringPref('tabhistory'),
	curfile,options,hashes,doc,seldoc;
	//alert(tabgroup);
	if(tabhistory!=''){
		var tabs = tabhistory.split(' ');
		for(var i=0;i<tabs.length;i++){
			debugLog(tabs[i]);
			curfile = tabs[i].split(':'); // split into key=value pairs
			options = {};
			
			// backwards compatibility for class and tabgroup
			if(!curfile[1] || !curfile[1].match('='))
				curfile[1] = "class='"+(curfile[1]||'editor')+"'";
			if(!curfile[2] || !curfile[2].match('='))
				curfile[2] = "tabgroup='"+unescape(curfile[2]||codetch.selectedTabGroup)+"'";

			// create options hash from key=value pairs
			for(var j=1;j<curfile.length;j++){
				hashes = curfile[j].split('=');
				if(hashes[1])options[hashes[0]] = eval(unescape(hashes[1]));
			}

			doc = codetch.open(unescape(curfile[0]), options);
			if(options.selected)
				seldoc = doc;
		}
	}
	// set selected doc after done loading all
	if(seldoc)seldoc.selected = true;
}

function saveTabSession()
{
	var files = codetch.docs,
	doc;
	if(codetch.hasFiles()){
		var tabs = [];
		for(var i in files){
			doc = files[i];
			if(doc.file && doc.file.exists()){
				// local files
				tabs[tabs.length] = escape(doc.file.path)+doc.toPrefOptions();
			}else if(doc.isEditor){
				// remote files
				if(!doc.unsaved)tabs[tabs.length] = escape(doc.src)+doc.toPrefOptions();
			}else if(doc.src){
				// browser pages
				debugLog('browser-'+doc.src);
				tabs[tabs.length] = escape(doc.src)+doc.toPrefOptions();
			}
		}
		GetPrefs().setCharPref('tabhistory',tabs.join(' '));
				debugLog(tabs.join(' '));
	}else{
		GetPrefs().setCharPref('tabhistory','');
	}
	GetPrefs().setCharPref('selectedtabgroup', codetch.selectedTabGroup);
}

function addRecentFile(val)
{
	for(var i=0;i<codetch.recentFiles.length;i++){
		if(escape(val) == codetch.recentFiles[i])codetch.recentFiles.splice(i,1);
	}
	codetch.recentFiles.unshift(escape(val));
	codetch.recentFiles = codetch.recentFiles.slice(0,GetIntPref('filehistorylength'));
	//alert(codetch.recentFiles.join());
}

function removeRecentFile(val)
{
	for(var i=0;i<codetch.recentFiles.length;i++){
		if(escape(val) == codetch.recentFiles[i])codetch.recentFiles.splice(i,1);
	}
}

function loadRecentFiles()
{
	var files = GetStringPref('recentfiles');
	codetch.recentFiles = (files)?files.split(' '):[];
	codetch.recentFiles = codetch.recentFiles.slice(0,GetIntPref('filehistorylength'));
}
function saveRecentFiles()
{
	//alert(codetch.recentFiles.join(' '));
	GetPrefs().setCharPref('recentfiles',codetch.recentFiles.join(' '));
}
function fillRecentMenu(menuPopup)
{
  var itemNode;
	while(menuPopup.childNodes.length>2)menuPopup.removeChild(menuPopup.lastChild);
	for(var i=0;i<codetch.recentFiles.length;i++){
        itemNode = document.createElementNS(XULNS, "menuitem");
        itemNode.setAttribute("label", (i+1)+" "+unescape(codetch.recentFiles[i]));
        itemNode.setAttribute("accesskey", (i+1));
        itemNode.setAttribute("value", codetch.recentFiles[i]);
        itemNode.setAttribute("crop", 'center');
        menuPopup.appendChild(itemNode);
	}
}
function openAllRecent()
{
	for(var i=0;i<codetch.recentFiles.length;i++){
		codetch.openPath(codetch.recentFiles[i]);
	}
}

function fillWindowMenu(menuPopup)
{
	while(menuPopup.childNodes.length>gViewMenuCount)menuPopup.removeChild(menuPopup.lastChild);
	var n=1,itemNode;
	for(var i in codetch.docs){
        itemNode = document.createElementNS(XULNS, "menuitem");
        itemNode.setAttribute("label", (n)+" "+unescape(codetch.docs[i].leafName));
        itemNode.setAttribute("accesskey", (n));
        itemNode.setAttribute("type", "radio");
        itemNode.setAttribute("oncommand", "codetch.setFileEditorById('"+i+"')");
		itemNode.linkedPanel = i;
		itemNode.setAttribute('context', "tab-"+codetch.docs[i]._class+"-context-menu");
        if(i==codetch.tabbox.selectedPanel.getAttribute('id'))itemNode.setAttribute("checked", true);
        menuPopup.appendChild(itemNode);
		n++;
	}
}
function fillWindowList(menuList, tabgroup)
{
	if(!tabgroup)tabgroup = '*';
	while(menuList.childNodes.length)menuList.removeChild(menuList.lastChild);
	var doc=null,itemNode;
	for(var i in codetch.docs){
		doc =  codetch.docs[i];
		if(tabgroup== '*' || doc.tabgroup == tabgroup){
        itemNode = document.createElementNS(XULNS, "listitem");
        itemNode.setAttribute("label", codetch.docs[i].leafName);
        itemNode.setAttribute("type", "checkbox");
        itemNode.setAttribute("oncommand", "codetch.setFileEditorById('"+i+"')");
        if(i==codetch.tabbox.selectedPanel.getAttribute('id'))itemNode.setAttribute("checked", true);
        menuList.appendChild(itemNode);
		}
	}
}

function fillTabGroupToolMenu(menuPopup, num)
{
	while(menuPopup.childNodes.length>2)menuPopup.removeChild(menuPopup.lastChild);
	for(var i=0;i<codetch.tabGroups.length;i++){
        var itemNode = document.createElementNS(XULNS, "menuitem");
        itemNode.setAttribute("label", codetch.tabGroups[i]);
        itemNode.setAttribute("accesskey", codetch.tabGroups[i].charAt(0));
        itemNode.setAttribute("type", "radio");
        itemNode.setAttribute("name", "tabgroups");
        itemNode.setAttribute("oncommand", "codetch.setTabGroup('"+codetch.tabGroups[i]+"')");
        if(codetch.tabGroups[i]==codetch.selectedTabGroup)itemNode.setAttribute("checked", true);
        menuPopup.appendChild(itemNode);
	}
}
function fillTabGroupContextMenu(menuPopup)
{
	while(menuPopup.childNodes.length>2)menuPopup.removeChild(menuPopup.lastChild);
	for(var i=0;i<codetch.tabGroups.length;i++){
        var itemNode = document.createElementNS(XULNS, "menuitem");
        itemNode.setAttribute("label", codetch.tabGroups[i]);
        itemNode.setAttribute("accesskey", codetch.tabGroups[i].charAt(0));
        itemNode.setAttribute("type", "radio");
        itemNode.setAttribute("name", "tabgroups");
        itemNode.setAttribute("oncommand", "codetch.changeTabGroup('"+codetch.tabGroups[i]+"')");
        if(codetch.tabGroups[i]==codetch.selectedTabGroup)itemNode.setAttribute("checked", true);
        menuPopup.appendChild(itemNode);
	}
}
function addExternalBrowser(path, name)
{
	gExternalBrowsers[path] = name;
}
function loadExternalBrowsers()
{
	gExternalBrowsers = [];
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
function fillBrowserMenu(menuPopup)
{
	while(menuPopup.childNodes.length>gBrowserMenuCount)menuPopup.removeChild(menuPopup.lastChild);
	for(var i in gExternalBrowsers){
		var itemNode = document.createElementNS(XULNS, "menuitem");
		itemNode.setAttribute("label", localize('PreviewIn')+' '+gExternalBrowsers[i]);
		itemNode.setAttribute("value", i);
		itemNode.setAttribute("tooltiptext", i);
		itemNode.setAttribute("observes", 'cmd_tabsOpen');
		itemNode.setAttribute("oncommand", "codetch.externalPreview(this.value)");
		if(GetStringPref('defaultbrowser') == i)itemNode.setAttribute("key", 'key_externalPreview');
		menuPopup.appendChild(itemNode);
	}
	if(GetStringPref('defaultbrowser')==''){
		document.getElementById('extension-browser-menuitem').setAttribute("key", 'key_externalPreview');
	}
}
function searchTreeEvent(tree, event)
{
	var b = tree.treeBoxObject;
	var n = tree.currentIndex;
	if(n<0) return false;
	if(event.type=="dblclick"){
		if(tree.results && tree.results[n].absoluteLine){
			var result = tree.results[n];
			if(codetch.docs[result.fileid]){
			var codebox = codetch.docs[result.fileid].sourceEditor;
			if(!codebox.selected)
				codebox.selected = true;
			codebox.goToPosition(result.absoluteLine, result.absoluteColumn, result.absoluteColumn+(tree.results['replacement']?tree.results['replacement'].length:result[0].length));
			//alert(codebox.selection);
			//event.stopPropagation();
			//codebox.element.focus();
			}
			return false;
		}
	}
	return true;
}

function fillSearchResults(results)
{
	codetch.openSupportPanel('find-results');
	var tree = document.getElementById('search-result-tree');
	tree.results = results;
	var children = document.getElementById('search-result-children');
	var count = document.getElementById('search-result-count');
	count.value = results.length+(results.length==1?' match found.':' matches found.');
	if(results['replacement']) count.value += ' Replaced by "'+results['replacement']+'"';
	while(children.firstChild)children.removeChild(children.lastChild);
	for(var i=0;i<results.length;i++){
		var item = document.createElementNS(XULNS, "treeitem");
		var row = document.createElementNS(XULNS, "treerow");
		var cellfile = document.createElementNS(XULNS, "treecell");
		cellfile.setAttribute("label", osPath(results[i].file));
		var cellline = document.createElementNS(XULNS, "treecell");
		cellline.setAttribute("label", results[i].absoluteLine);
		var cellcol = document.createElementNS(XULNS, "treecell");
		cellcol.setAttribute("label", results[i].absoluteColumn);
		var cellmatch = document.createElementNS(XULNS, "treecell");
		cellmatch.setAttribute("label", results[i][0]);
		var cellcontext = document.createElementNS(XULNS, "treecell");
		cellcontext.setAttribute("label", '...'+results[i].context.substring(results[i].column-25, results[i].column+results[i][0].length+25)+'...');

		item.appendChild(row);
		row.appendChild(cellfile);
		row.appendChild(cellline);
		row.appendChild(cellcol);
		row.appendChild(cellmatch);
		row.appendChild(cellcontext);

		children.appendChild(item);
	}
}

function menuToggleView(node, event)
{
  if (event.button == 2) {
    goDoCommandParams('cmd_togglePanel', paramString(event.target.getAttribute('value')))
    closeMenus(event.target);
  }else{
	codetch.switchView(event.target.getAttribute('value'));
  }
}
// Closes all popups that are ancestors of the node.
function closeMenus(node)
{
  if ("tagName" in node) {
    if (node.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
    && (node.tagName == "menupopup" || node.tagName == "popup"))
      node.hidePopup();

    closeMenus(node.parentNode);
  }
}
function fillPanelViewMenu(menuPopup)
{
	while(menuPopup.childNodes.length)menuPopup.removeChild(menuPopup.lastChild);
	if(codetch.getFileEditor() && codetch.getFileEditor().views){
	var views = codetch.getFileEditor().views;
	for(var i=0;i<views.length;i++){
        var itemNode = document.createElementNS(XULNS, "menuitem");
        itemNode.setAttribute("label", views[i].label);
        itemNode.setAttribute("accesskey", views[i].getAttribute('accesskey'));
        itemNode.setAttribute("value", views[i].panel);
        itemNode.setAttribute("class", views[i].className);
        itemNode.setAttribute("onclick", "menuToggleView(this, event);");
        itemNode.setAttribute("type", 'checkbox');
		if(views[i].checked)
			itemNode.setAttribute("checked", 'true');
        menuPopup.appendChild(itemNode);
	}
	}else{
        var itemNode = document.createElementNS(XULNS, "menuitem");
        itemNode.setAttribute("label", localize('Default'));
        itemNode.setAttribute("disabled", true);
        menuPopup.appendChild(itemNode);
	}
}

function lineFormatPopup(){
	var popup = $('lineformat-menu-popup'), set;
	for(var i=0;i<popup.childNodes.length;i++){
		set = (!codetch.doc.lineFormat || popup.childNodes[i].getAttribute('value') == codetch.doc.lineFormat);
		popup.childNodes[i].setAttribute('disabled', set);
		popup.childNodes[i].setAttribute('checked', set);
	}
	
}

function toggleSidebarRight(){
	var wc = $('workcolumns');
	var right = wc.getAttribute('dir')=='rtl';
	wc.setAttribute('dir', right?'ltr':'rtl');
	$('cmd_toggleSidebarDir').setAttribute('checked', !right);
	return !right;
}

function fillToolbarToggleMenu(menuPopup)
{
	while(menuPopup.childNodes.length)menuPopup.removeChild(menuPopup.lastChild);
	var tb = document.getElementById('editor-toolbox')
	tb = tb.getAttribute('dock')=='tabs'?tb:document.getElementById('main-toolbox');
	var toolbars = tb.getElementsByTagName('toolbar');
	for(var i=0;i<toolbars.length;i++){
        var itemNode = document.createElementNS(XULNS, "menuitem");
        itemNode.setAttribute("label", toolbars[i].getAttribute('name'));
        itemNode.setAttribute("accesskey", toolbars[i].getAttribute('name').charAt(0));
        itemNode.setAttribute("value", toolbars[i].getAttribute('id'));
        itemNode.setAttribute("type", 'checkbox');
		itemNode.setAttribute("checked", !toolbars[i].hidden);
        menuPopup.appendChild(itemNode);
	}
}

function toggleToolboxDock()
{
	var tb = document.getElementById('editor-toolbox')
	dockToolboxAt(tb.getAttribute('dock')=='tabs'?'menu':'tabs');
}
function dockToolboxAt(val)
{
	var basetoolbox = document.getElementById('editor-toolbox'),
	menutoolbox = document.getElementById('main-toolbox'),b1,b2,el;
	//if(val == basetoolbox.getAttribute('dock')) return;

	if(val == 'menu'){b1=basetoolbox;b2=menutoolbox;}
	else if(val=='tabs'){b1=menutoolbox;b2=basetoolbox;}
	else return;

	var kids = b1.getElementsByTagName('toolbar');
	while(kids.length){
		el = kids[0];
		b1.removeChild(el);
		b2.appendChild(el);
	}
	basetoolbox.setAttribute('dock', val);
	document.getElementById('cmd_toggleToolboxDock').setAttribute('checked',(val=='tabs'));
}


function closeMainWindow()
{
	if(!INITIATED) return true;
	CLOSED = true;
	saveTabSession();
	debugLog('Closing Codetch\n');
	debugLog('*********************\n');
	return codetch.closeAll('*');
}
function unloadApp()
{
	if(!INITIATED) return true;
	codetch.removeTempFile();
	codetch.uninit();
	saveRecentFiles();
	if(!CLOSED)
		return closeMainWindow();
	return true;
}
function startApp()
{
	// if version is different, do first run
	if (GetStringPref("version")!=getVersion()){
		// loading window
		loadWin = infoWin('chrome://codetch/skin/Throbber.gif','Codetch Install','...Installing Codetch configuration files, please wait...');
		
		//install configuration files in user dir
		copyFiles();
		
		loadWin.close();
		// set new version number
		GetPrefs().setCharPref('version', getVersion());

		// add IE to browser list if ieview is installed
		/*
		loadExternalBrowsers();
		var prfs = GetPrefsService().getBranch("ieview.");
		if(prfs && prfs.prefHasUserValue("ieapp") && !gExternalBrowsers[prfs.getCharPref("ieapp")]){
			addExternalBrowser(prfs.getCharPref("ieapp"), 'Internet Explorer');
			saveExternalBrowsers();
		}
		*/
	}
	//copyToCodetch();
}

function init()
{
	if(INITIATED) return; // prevent double loading
	INITIATED = true;

	if(loadWin)loadWin.close();
    dump("***********************************\n");
    dump("Starting up Codetch Application...\n");
    dump("***********************************\n\n");
	try{
		codetch.test();
	}catch(e){
		AlertWithTitle(localize('InitErrorTitle'), localize('InitErrorText'))
		if(ConfirmWithTitle(localize('CopyErrorTitle'), localize('CopyErrorText')))
			copyToClipboard(e+'\n'+navigator.platform);
		
		dump("Codetch Fatal Error.. closing.\n");
		window.close();
	}	

	// sets up commands if updaters aren't responding
	setUpGlobalCommands();
	
	dockToolboxAt(document.getElementById('editor-toolbox').getAttribute('dock'));

	// load doctype RDF
    var dpath = DirIO.open(getDoctypesPath());
    dpath.append("doctypes.rdf");
	gDoctypeData = new RDFDataSource(getBrowserPath(dpath.path));

	initPrefs();
	editorCSSPref(true);
	
	codetch.init();

	// load tab session
	if(GetBoolPref('loadtabset')) {
		openTabSession();
	}
	if(!codetch.selectedTabGroup)
		codetch.setTabGroup(GetStringPref("selectedtabgroup"), true);
	
	// params aren't passed when opening as a tab, so we grap params from browser Codetch object
	var browserWindow = codetch.wm.getMostRecentWindow("navigator:browser");
	var params = window.arguments?window.arguments[0]:browserWindow?browserWindow.Codetch.params:{};
	// init with params
	codetch.initParams(params);
	
	if(GetBoolPref('welcomescreen') && !codetch.hasFiles())
		codetch.newLocalPage('chrome://codetch/content/welcome.xul');

	if(codetch.visibleTabs('Group 1').length == 0)
		codetch.removeTabGroup('Group 1')

	var gSnippetFileTree = document.getElementById('snippet-tree');
	gSnippetFileTree.ref = getBrowserPath(GetFilePref("snippetdir").path);

	gLocalFileTree = document.getElementById('local-file-tree');
	// prevent the windows bug of accessing the floppy drive
	if(gLocalFileTree.ref=='')
		gLocalFileTree.ref = (gOS==gWin)?'file:///C:/':'NC:FilesRoot';

	if(gLocalFileTree.ref!='NC:FilesRoot')
		document.getElementById('file-site-list').label = osPath(gLocalFileTree.ref);
		
  var itemNode = document.createElementNS(XULNS, "menuitem");
  itemNode.setAttribute("label", userDocsDir().path);
  itemNode.setAttribute("value", getBrowserPath(userDocsDir().path));

	document.getElementById('file-site-list-popup').appendChild(itemNode);
	
	//alert(document.getElementById('file-site-list').childNodes.length);

	// set default menu lengths
	gViewMenuCount = document.getElementById('view-popup').childNodes.length;
	kFixedFontFaceMenuItems = document.getElementById('font-menu-popup').childNodes.length;
	gBrowserMenuCount = document.getElementById('external-browser-popup').childNodes.length;

	//UE = document.getElementById('utility-editor');

	//set up other extensions
	if(Exts.isInstalled(Exts.FIREFTP_GUID))
		document.getElementById('cmd_fireftp').setAttribute('disabled', false);
}

window.addEventListener('error', debugLog, false);
loadExtensionList();
startApp();
