
var _p;

 /*  CodetchTab - wrapper for  tab/panel
/-------------------------------------------------------------------------------*/
function CodetchTab(id,leafName)
{
	this.id = id;
	this.createElements();
	this.leafName = leafName;
}
_p = CodetchTab.prototype;
_p.__defineGetter__("selected",function()
{
	return this.tab.getAttribute('selected')=='true';
});
_p.__defineSetter__("selected",function(val)
{
	//codetch.tabbox.selectedPanel = this.panel
	if(val)codetch.tabbox.selectedTab = this.tab;
	if(!val && this.selected) codetch.tabbox.selectedTab = null;
	return val;
});
_p.__defineGetter__("panel",function()
{
	return this._panel?this._panel:document.getElementById(this.id);
});
_p.__defineGetter__("tab",function()
{
	return this._tab?this._tab:document.getElementById("tab-"+this.id);
});
_p.__defineGetter__("src",function()
{
		return this.panel.getAttribute("src");
});
_p.__defineSetter__("src",function(val)
{
		return this.panel.setAttribute("src", val);
});
_p.__defineGetter__("path",function()
{
		return this.file?this.file.path:this.panel.getAttribute("src");
});
_p.__defineSetter__("path",function(val)
{
		return this.panel.setAttribute("src", val);
});
_p.__defineGetter__("isEditor",function()
{
	return (this.panel && this.panel.className=='editor-box');
});
_p.__defineGetter__("tabgroup",function()
{
	return this.tab.getAttribute("tabgroup");
});
_p.__defineSetter__("tabgroup",function(val)
{
	this.tab.setAttribute("tabgroup", val);
	this.panel.setAttribute("tabgroup", val);
});
_p.__defineGetter__("scrollTop",function()
{
	return this.panel.scrollTop;
});
_p.__defineSetter__("scrollTop",function(val)
{
	return (val!=null)?this.panel.scrollTop = val:null;
});
_p.__defineGetter__("scrollLeft",function()
{
	return this.panel.lastPanel.scrollLeft;
});
_p.__defineSetter__("scrollLeft",function(val)
{
	return (val!=null)?this.panel.scrollLeft = val:null;
});

_p.createElements = function ()
{
	var tab = document.createElementNS(XULNS, "tab");
	tab.setAttribute("id", 'tab-'+this.id);
	tab.setAttribute('crop', "center");
	//tab.setAttribute('flex', 100);
	var panel = document.createElementNS(XULNS, "tabpanel");
	panel.setAttribute("id", this.id);
	tab.setAttribute("linkedpanel", this.id);

	this._tab = tab;
	this._panel = panel;
	panel.doc = this;

	return panel;
};
_p.removeElements = function ()
{
	try {
		this.panel.parentNode.removeChild(this.panel);
		if(this.tab.selected)this.tab.selected = false;
		this.tab.parentNode.removeChild(this.tab);
		this._tab = this._panel = null;
		return true
	}catch (e){
		this.tab.parentNode.advanceSelectedTab(-1, true);
		this.tab.parentNode.removeChild(this.tab);
		this._tab = this._panel = null;
		return false;
	}
};
_p.appendElements = function (group, className, before)
{
	try {
		this._class = className;
		this.panel.className = className+'-box';
		this.tab.className = className+'-tab tabbrowser-tab';
		this.tab.setAttribute('context', "tab-"+className+"-context-menu");
		if(before){
			codetch.tabbox._tabs.insertBefore(this.tab, before);
			codetch.tabbox._tabpanels.insertBefore(this.panel, document.getElementById(before.linkedPanel));
		}else{
			codetch.tabbox._tabs.appendChild(this.tab);
			codetch.tabbox._tabpanels.appendChild(this.panel);
		}
		this.tabgroup = group;
		return true
	}catch (e){
		return false;
	}
};
_p.close = function ()
{
	window.focus();
	var group = this.tabgroup;
	this.removeElements();
	
	if(!codetch.visibleTabs(group).length)codetch.removeTabGroup(group);
	codetch.removeDoc(this.id);

	return true;
};
_p.setStatus = function() {
	return this.panel.setStatus();
};
_p.toPrefOptions = function()
{
	return ":class='"+escape(this._class)+"'"+
			":tabgroup='"+escape(this.tabgroup)+"'"+
			(this.panel.views?
				":views=['"+this.panel.selectedViews.join("','")+"']":'')+
			(this.panel.views?
				":lastPanelView='"+this.panel.lastPanel.view+"'":'')+
			":scrollTop="+this.scrollTop+
			":scrollLeft="+this.scrollLeft;
};
_p.loadOpenOptions = function(options)
{
	if(options.views)
		this.panel.selectedViews = options.views;
	if(options.lastPanelView)
		this.panel.lastPanel = this.panel.panels[options.lastPanelView];
	try{
	if(options.scrollTop)this.scrollTop = options.scrollTop;
	if(options.scrollLeft)this.scrollLeft = options.scrollLeft;
	}catch(e){debuglog(e)}
};

 /*  CodetchDocument - wrapper for files
/-------------------------------------------------------------------------------*/
CodetchDocument.prototype = _p = new CodetchTab();
function CodetchDocument(id,leafName)
{
	this.id = id;
	this._modified = false;
	this._lastModified = this._file = null;
	this.isRemote = false;
	this.createElements();
	this.leafName = leafName;
}
_p.__defineGetter__("isLocal",function()
{
		return this._file && this._file.exists();
});

_p.__defineSetter__("file",function(val)
{
	this._lastModified = val.lastModifiedTime;
	if(!val.isWritable())this.readonly = true;
	return this._file = val;
});
_p.__defineGetter__("file",function()
{
		return this._file;
});
_p.__defineGetter__("currentEditor",function()
{
	return this.panel?this.panel.lastEditor:null;
});
_p.__defineGetter__("sourceEditor",function()
{
	return this.panel.sourceEditor;
});
_p.__defineGetter__("codebox",function()
{
	return this.panel.panels['code'].element;
});
_p.__defineGetter__("writable",function()
{
	return this.file?this.file.isWritable():!this.readonly;
});
_p.__defineGetter__("readable",function()
{
	return this.file?this.file.isReadable():true;
});
_p.__defineGetter__("leafName",function()
{
	return this._leafName;
});
_p.__defineSetter__("leafName",function(val)
{
	this.tab.setAttribute('label', this.modified?val+'*':val);
	return this._leafName = val;
});
_p.__defineGetter__("modified",function()
{
		return this._modified;
});
_p.__defineSetter__("modified",function(val)
{
	this.tab.label = val?this.leafName+"*":this.leafName;
	return this._modified = (val);
});
_p.__defineGetter__("readonly",function()
{
		return this.panel.hasAttribute("readonly");
});
_p.__defineSetter__("readonly",function(val)
{
		return val?this.panel.setAttribute("readonly", (val)):this.panel.removeAttribute('readonly');
});
_p.__defineGetter__("doctype",function()
{
		return this.panel.getAttribute("doctype");
});
_p.__defineSetter__("doctype",function(val)
{
		return this.panel.setAttribute("doctype", val);
});
_p.__defineGetter__("basedoctype",function()
{
		return this.panel.getAttribute("basedoctype");
});
_p.__defineSetter__("basedoctype",function(val)
{
		return this.panel.setAttribute("basedoctype", val);
});
_p.__defineGetter__("filehandler",function()
{
		return this.panel.getAttribute("filehandler");
});
_p.__defineSetter__("filehandler",function(val)
{
		return this.panel.setAttribute("filehandler", val);
});
_p.__defineGetter__("source",function()
{
		return this.panel.source;
});
_p.__defineSetter__("source",function(val)
{
		return this.panel.source = val;
});
_p.__defineGetter__("lineFormat",function()
{
		return this.panel.lineFormat;
});
_p.__defineSetter__("lineFormat",function(val)
{
		return this.panel.lineFormat = val;
});

_p.launch = function ()
{
	if(!this.file || !this.file.isFile()) return false;
	return Exec.runCmd("ls -l", {log:true});
	try{
		if(this.file.isExecutable())
			Exec.runCmd(this.file.path, {log:true});
		else
			this.file.launch();
	}catch(e){
	}
	return;
};

_p.save = function ()
{
	if(!this.file || !this.file.exists()) return this.saveAs();
	var text = this.source;
	var savefile = this.file;
	if(!savefile) return false;
	if(!this.writable){AlertWithTitle(savefile.path, localize('NotWritable'));return CLOSED?this.saveAs():false;}

	return this._save(savefile, text);
};

_p._save = function (savefile, text)
{
	if(this.lineFormat == 'win') text = text.replace(/\n/g, '\r\n');
	else if(this.lineFormat == 'mac') text = text.replace(/\n/g, '\r');
	var str = FileIO.write(savefile, text,'w', 'UTF-8');
	if(savefile){
		codetch.setStatusMsg(localize('FileSaved')+': '+savefile.leafName);
		this.file = savefile;
		this._lastModified = this.file.lastModifiedTime;
		this.leafName = savefile.leafName;
		this.modified = false;
		this.unsaved = false;
		this.isRemote = false;
		this.src = FileIO.path(savefile);
		if(this.basetype == "html"){
			this.panel.panels['design'].refreshPath();
			this.panel.panels['preview'].refreshPath();
		}
		this.panel.refresh(this.panel.lastEditor.view);
	return true;
	}
	return false;
};
_p.saveAs = function (defaultDir)
{
	var savefile = fileBrowse("save", defaultDir?defaultDir:this.file);
	if(!savefile) return false;
	if(this.file && this.file.equals(savefile)) return this.save();
	for(var i in codetch.docs){
		if(codetch.docs[i].file && codetch.docs[i].file.equals(savefile)){
			//document.getElementById("editor-arena").selectedTab = codetch.docs[i].tab;
			alert(localize('AlreadyOpen'));
			return this.saveAs();
		}
	}
	if(savefile.exists() && !savefile.isWritable())
		{AlertWithTitle(savefile.path, localize('NotWritable'));return this.saveAs();}

	var ext = FileIO.ext(savefile);
	var newbasetype = getBaseDoctype(ext)['type'];
	var source = this.source;
	if(this.file){
		FileIO.write(savefile, source);
		return CLOSED?addRecentFile(savefile.path):codetch.openFile(savefile);
	}else if(this.basedoctype != newbasetype){
		var oldgroup = this.tabgroup;
		var next = this.tab.nextSibling;
		window.focus();
		this.removeElements();
		this.createElements();
		this.doctype = ext;
		this.basedoctype = newbasetype;
		this.filehandler = 'default';
		this.appendElements(oldgroup, 'editor', next);
		document.getElementById("editor-arena").selectedTab = this.tab;
		this.source = source;
	}

	var r = this._save(savefile, source);

	return r;
};
_p.close = function ()
{
	if(this.isEditor){
		if(this.modified){
			codetch.tabbox.selectedPanel = this.panel;
			var r = ConfirmAdvanced(this.leafName, localize('ConfirmSave'));
			if(r==0)this.save();
			else if(r==1)return false;
		}
		//GetPrefs().setCharPref('last'+file.panel.getAttribute("basedoctype")+'view', file.panel.getAttribute("cmdline"));
	}
	
	window.focus();
	var group = this.tabgroup;
	this.removeElements();
	if(!codetch.visibleTabs(group).length)codetch.removeTabGroup(group);
	codetch.removeDoc(this.id);

	return true;
};

// Compares internal last modified time with actual file modified time
// this._lastModified is updated on each save(As)/open
// Returns: false if they aren't the same
_p.modifiedOutside = function()
{
	if(!this.file) return false;
	return (this._lastModified != this.file.lastModifiedTime)
};
_p.toPrefOptions = function()
{
	return ":class='"+escape(this._class)+"'"+
			":tabgroup='"+escape(this.tabgroup)+"'"+
			":selected="+this.selected+
			(this.panel.views?
				":views=['"+this.panel.selectedViews.join("','")+"']":'')+
			(this.panel.views?
				":lastPanelView='"+this.panel.lastPanel.view+"'":'')+
			(this.panel.orient?
				":orient='"+this.panel.orient+"'":'')+
			":selectionStart="+this.sourceEditor.selectionStart+
			":selectionEnd="+this.sourceEditor.selectionEnd+
			":line="+this.sourceEditor.endLine+
			":col="+this.sourceEditor.column+
			":scrollTop="+this.scrollTop+
			":scrollLeft="+this.scrollLeft;
};

_p.loadOpenOptions = function(options)
{
	if(options.views)
		this.panel.selectedViews = options.views;
	if(options.orient)
		this.panel.orient = options.orient;
	if(options.source)
		this.source = options.source;
	if(options.selectionStart && options.selectionEnd){
		this.sourceEditor.setSelectionRange(options.selectionStart,options.selectionEnd);
		if(!options.scrollTop)this.sourceEditor.scrollToSelect();
	}else
		this.sourceEditor.goToPosition(parseInt(options.line || 0), parseInt(options.col || 0));
	if(options.lineFormat)
		this.lineFormat = options.lineFormat;
	
	if(options.lastPanelView)
		this.panel.lastPanel = this.panel.panels[options.lastPanelView];
		
	try{
	if(options.scrollTop)this.scrollTop = options.scrollTop;
	if(options.scrollLeft)this.scrollLeft = options.scrollLeft;
	}catch(e){debuglog(e)}
};

CodetchTab.prototype.__defineGetter__("leafName",function()
{
	return this.tab?this.tab.label:this._leafName;
});
CodetchTab.prototype.__defineSetter__("leafName",function(val)
{
	this.tab.setAttribute('label', val);
	return this._leafName = val;
});
