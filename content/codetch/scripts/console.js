
// XXX DEBUG
function debugconsole(aText)
{
  var csClass = Components.classes['@mozilla.org/consoleservice;1'];
  var cs = csClass.getService(Components.interfaces.nsIConsoleService);
  cs.logStringMessage(aText);
}
this.mConsoleListener = {
            console: this, 
            observe : function(aObject) { this.console.appendItem(aObject); }
          };
		  /*          try {
            // Try to QI it to a script error to get more info
            var scriptError = aObject.QueryInterface(Components.interfaces.nsIScriptError);
            
            // filter chrome urls
            if (!this.showChromeErrors && scriptError.sourceName.substr(0, 9) == "chrome://")
              return;
 
            this.appendError(scriptError);
          } catch (ex) {
            try {
              // Try to QI it to a console message
              var msg = aObject.QueryInterface(Components.interfaces.nsIConsoleMessage);
              if (msg.message)
                this.appendMessage(msg.message);
              else // observed a null/"clear" message
                this.clearConsole();
            } catch (ex2) {
              // Give up and append the object itself as a string
              this.appendMessage(aObject);
            }
          }*/
var CodetchConsoleListener = 
{
    observe : function(object)
    {
        try
        {
            if (object instanceof Components.interfaces.nsIScriptError)
            {
				var editorid = codetch.fileIfOpen(object.sourceName);
                    if(editorid){
						//alertObject(object, 1);
						if(!codetch.errorReports[editorid])
							codetch.errorReports[editorid] = [];
						codetch.errorReports[editorid].push(object);
					}
            }
            else if(object.message == '');
                //alertObject(object);
        }
        catch (exc)
        {
                //alertObject(object, 1);
        }
    }
}