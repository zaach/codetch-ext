
var Codetch = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
	this.params = {};
    this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('codetch.');
	
	if(this.prefs.getBoolPref('launchtab'))
		document.getElementById('codetch-tabpref').setAttribute('checked', this.prefs.getBoolPref('launchtab'));
	if(this.prefs.getBoolPref('editonlaunch'))
		document.getElementById('codetch-launchpref').setAttribute('checked', this.prefs.getBoolPref('editonlaunch'));
  },
  run: function(tab, options){
    return this.prefs.getBoolPref('editonlaunch')?
		this.runEdit(null, options, tab):
		this._run(tab, options);
  },
  _run: function(tab, options) {
    options = options || {};
	this.params = options;
	
	if(tab == null)
		tab = this.prefs.getBoolPref('launchtab');

	// open in tabbrowser
	if(tab){
		this.tab = gBrowser.addTab("chrome://codetch/content/");
		//this.tab.linkedBrowser.mIconURL = "chrome://codetch/skin/ce16.png";
		this.tab.setAttribute("codetch", "true");
		gBrowser.selectedTab = this.tab;
	} //open new floating window
	else{
		window.openDialog("chrome://codetch/content/",
                        "_blank", "chrome,resizable,dialog=no,centerscreen", options);
	}
  },
  
  runEdit: function(path, options, tab){
    options = options || {};
	options.loadURL = path || (gContextMenu && gContextMenu.onLink) ? gContextMenu.getLinkURL() : window.content.document.documentURI;
	
	// check for previous codetch windows
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Components.interfaces.nsIWindowMediator);
    var existingWindow = wm.getMostRecentWindow("mozilla:codetch");
	
	// use floating window if exists and 'open in tab' not specified
    if (existingWindow && !tab) {
      existingWindow.codetch.initParams(options);
      existingWindow.focus();
	  return;
    } // use tabbed window if exists and 'open in float' not specified
	else if(tab!=false && this.tab && this.tab.linkedBrowser.focusedWindow){
		gBrowser.selectedTab = this.tab;
		gBrowser.contentWindow.wrappedJSObject.codetch.initParams(options);
		return;
	}
	// no previous windows, open a new one
	this._run(tab, options);
  },

  editPrefs: function() {
		window.openDialog('chrome://codetch/content/preferences.xul', '_blank', 'chrome,dialog=no,centerscreen,resizable=no');
  }
};

window.addEventListener("load", function(e) { Codetch.onLoad(e); }, false); 
