var codetch,codetchParent;

function initCodetch(){
	if(!codetch && parent.codetch){
		codetch = parent.codetch;
		parentCodetch = parent;
	}else{
		// check for previous codetch windows
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							.getService(Components.interfaces.nsIWindowMediator);
		var codetchWindow = wm.getMostRecentWindow("mozilla:codetch");
		var browserWindow = wm.getMostRecentWindow("navigator:browser");
		
		// Check browser first (since Codetch as a tab usually has problems accessing window parents)
		if(browserWindow && browserWindow.Codetch
			&& browserWindow.Codetch.tab && browserWindow.Codetch.tab.linkedBrowser.contentWindow){
			codetch = browserWindow.gBrowser.contentWindow.wrappedJSObject.codetch;
			parentCodetch = browserWindow.gBrowser.contentWindow.wrappedJSObject;
		}else if(codetchWindow){
			codetch = codetchWindow.codetch;
			parentCodetch = codetchWindow;
		}
	}
}

initCodetch();