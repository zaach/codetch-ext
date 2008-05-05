
var codeFormatCommands = {'cmd_bold':'b','cmd_italic':'i','cmd_em':'em','cmd_strong':'strong','cmd_code':'code',
				'cmd_cite':'cite','cmd_underline':'u','cmd_strikethrough':'strike','cmd_subscript':'sub','cmd_samp':'samp',
				'cmd_superscript':'sup','cmd_abbr':'abbr','cmd_acronym':'acronym','cmd_var':'var','cmd_tt':'tt',
				'cmd_ol':'ol','cmd_ul':'ul','cmd_li':'li','cmd_dt':'dt','cmd_dl':'dl','cmd_dd':'dd',
				'cmd_increaseFont':'big','cmd_decreaseFont':'small','cmd_blockquote':'blockquote'};

/* Updaters
-------------------------------------------------------------------------------*/

// update menu items that rely on focus
function goUpdateFocusMenuItems()
{
  //goUpdateCommand("cmd_tester");
  goUpdateCommand("cmd_undo");
  goUpdateCommand("cmd_redo");
  goUpdateCommand("cmd_cut");
  goUpdateCommand("cmd_copy");
  goUpdateCommand("cmd_paste");
  goUpdateCommand("cmd_selectAll");
  goUpdateCommand("cmd_delete");
  goUpdateCommand("cmd_refresh");
  goUpdateCommand("cmd_inspect");
  goUpdateCommand("cmd_goToLine");
  goUpdateCommand("cmd_browserOpen");
  //goUpdateCommand("cmd_print");
  goUpdateCommand("cmd_toUpperCase");
  goUpdateCommand("cmd_toLowerCase");
  goUpdateCommand("cmd_toTitleCase");
  goUpdateCommand("cmd_duplicateLine");
  goUpdateCommand("cmd_joinLines");
  goUpdateCommand("cmd_goToLine");
  goUpdateCommand("cmd_formatBlock");
  goUpdateCommand("cmd_outdent");
  goUpdateCommand("cmd_li");
  goUpdateCommand("cmd_dl");
  goUpdateCommand("cmd_removeStyles");
  goUpdateCommand("cmd_removeList");
  goUpdateCommand("cmd_removeLinks");
	updateCodeInsertion();
}

// update menu items that rely on the current selection
function goUpdateSelectMenuItems()
{
  //goUpdateCommand("cmd_tester");
  goUpdateCommand("cmd_cut");
  goUpdateCommand("cmd_copy");
  goUpdateCommand("cmd_delete");
  goUpdateCommand("cmd_selectAll");
  goUpdateCommand("cmd_toUpperCase");
  goUpdateCommand("cmd_toLowerCase");
  goUpdateCommand("cmd_toTitleCase");
  goUpdateCommand("cmd_joinLines");
  //goUpdateCommand("cmd_print");
  goUpdateCommand("cmd_formatBlock");
  goUpdateCommand("cmd_outdent");
  goUpdateCommand("cmd_li");
  goUpdateCommand("cmd_dl");
  goUpdateCommand("cmd_removeStyles");
  goUpdateCommand("cmd_removeList");
  goUpdateCommand("cmd_removeLinks");
  updateCodeInsertion();
}

// update menu items that relate to undo/redo
function goUpdateUndoMenuItems()
{
  goUpdateCommand("cmd_undo");
  goUpdateCommand("cmd_redo");
  //alert('updated undo/redo');
}

// update menu items that depend on clipboard contents
function goUpdatePasteMenuItems()
{
  goUpdateCommand("cmd_paste");
}

// update menu items that rely on the files opened/closed
function goUpdateFileMenuItems()
{
	//alert('updating!');
  goUpdateCommand("cmd_undo");
  goUpdateCommand("cmd_redo");
  goUpdateCommand("cmd_tabsOpen");
  goUpdateCommand("cmd_filesOpen");
  goUpdateCommand("cmd_browserOpen");
  goUpdateCommand("cmd_saveAll");
  goUpdateCommand("cmd_refresh");
  goUpdateCommand("cmd_inspect");
  goUpdateCommand("cmd_revert");
  goUpdateCommand("cmd_revertOpen");
  //goUpdateCommand("cmd_print");
  goUpdateCommand("cmd_goToLine");

  goUpdateCommand("cmd_formatBlock");
  goUpdateCommand("cmd_removeStyles");
  goUpdateCommand("cmd_removeList");
  goUpdateCommand("cmd_removeLinks");
  goUpdateCommand("cmd_li");
  goUpdateCommand("cmd_dl");
  updateCodeInsertion();
}

// update menu items that rely on the switching current file
function goUpdateSwitchMenuItems()
{
  //goUpdateCommand("cmd_tabsOpen");
  goUpdateCommand("cmd_refresh");
	goUpdateCommand("cmd_filesOpen");
	goUpdateCommand("cmd_revert");
	goUpdateCommand("cmd_revertOpen");
  goUpdateCommand("cmd_browserOpen");
}

// update style batch of commands. should be using states but...this works?
function updateCodeInsertion()
{
	try{
		var controller = top.document.commandDispatcher.getControllerForCommand('cmd_bold');
		var ci = document.getElementById('codeInsertion');
		if(!codetch.visibleTabs().length) return ci.setAttribute('disabled', true);
		if ( controller && controller.isCommandEnabled('cmd_bold'))
			ci.removeAttribute('disabled');
		else ci.setAttribute('disabled', true);
	}catch(e){}
	return true;
}

/* Command Setup
-------------------------------------------------------------------------------*/

// Thanks to Composer team for the command table, I was unsure of how to set it up
var gJSCommandControllerID = 0;
//-----------------------------------------------------------------------------------
function GetCommandTable()
{
  var controller;
  if (gJSCommandControllerID)
  {
    try { 
      controller = top.controllers.getControllerById(gComposerJSCommandControllerID);
    } catch (e) {}
  }
  if (!controller)
  {
    //create it
    controller = Components.classes["@mozilla.org/embedcomp/base-command-controller;1"].createInstance();

    var editorController = controller.QueryInterface(Components.interfaces.nsIControllerContext);
    editorController.init(null);
    //editorController.setCommandContext(codetch.getDesignEditor());
    top.controllers.insertControllerAt(0, controller);
  
    // Store the controller ID so we can be sure to get the right one later
    gJSCommandControllerID = top.controllers.getControllerId(controller);
  }

  if (controller)
  {
    var interfaceRequestor = controller.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
    return interfaceRequestor.getInterface(Components.interfaces.nsIControllerCommandTable);
  }
  return null;
}
function goDoCommandParams(command, params)
{
  try
  {
    var controller = top.document.commandDispatcher.getControllerForCommand(command);
    if (controller && controller.isCommandEnabled(command))
    {
      if (controller instanceof Components.interfaces.nsICommandController)
      {
        controller.doCommandWithParams(command, params);
      }
      else
      {
        controller.doCommand(command);
      }
    }
  }
  catch (e)
  {
    dump("An error occurred executing the "+command+" command\n");
  }
}
function pokeMultiStateUI(uiID, cmdParams)
{
  try
  {
    var commandNode = document.getElementById(uiID);
    if (!commandNode)
      return;

    var isMixed = cmdParams.getBooleanValue("state_mixed");
    var desiredAttrib;
    if (isMixed)
      desiredAttrib = "mixed";
    else
      desiredAttrib = cmdParams.getCStringValue("state_attribute");

    var uiState = commandNode.getAttribute("state");
    if (desiredAttrib != uiState)
    {
      commandNode.setAttribute("state", desiredAttrib);
    }
  } catch(e) {}
}

function doStatefulCommand(commandID, newState)
{
  var commandNode = document.getElementById(commandID);
  if (commandNode)
      commandNode.setAttribute("state", newState);
  //window.focus();   // needed for command dispatch to work

  try
  {
    var cmdParams = newCommandParams();
    if (!cmdParams) return;

    cmdParams.setCStringValue("state_attribute", newState);
    goDoCommandParams(commandID, cmdParams);

    pokeMultiStateUI(commandID, cmdParams);

    ResetStructToolbar();
  } catch(e) { dump("error thrown in doStatefulCommand: "+e+"\n"); }
}

// for quick passing of arguments as string params 
function paramString(str)
{
      var params = Components.classes["@mozilla.org/embedcomp/command-params;1"];
      params = params.createInstance(Components.interfaces.nsICommandParams);
      params.setStringValue("state_data", str);
	return params;
}

// set up global commands
function setUpGlobalCommands(){
	var commandTable = GetCommandTable();

	commandTable.registerCommand("cmd_filesOpen", fileCommands);
	commandTable.registerCommand("cmd_save", fileCommands);
	commandTable.registerCommand("cmd_saveAs", fileCommands);
	commandTable.registerCommand("cmd_saveAsTemplate", fileCommands);
	commandTable.registerCommand("cmd_saveAll", fileCommands);
	commandTable.registerCommand("cmd_tabsOpen", tabCommands);
	commandTable.registerCommand("cmd_close", tabCommands);
	commandTable.registerCommand("cmd_closeAll", tabCommands);
	commandTable.registerCommand("cmd_closeTabGroup", tabCommands);
	commandTable.registerCommand("cmd_closeAllBut", tabCommands);
	commandTable.registerCommand("cmd_inspect", inspectorCommand);
	commandTable.registerCommand("cmd_refresh", refreshCommand);
	commandTable.registerCommand("cmd_revert", revertCommands);
	commandTable.registerCommand("cmd_revertOpen", revertCommands);
	commandTable.registerCommand("cmd_externalPreview", tabCommands);

	commandTable.registerCommand("cmd_browserOpen", browserCommands);
	commandTable.registerCommand("cmd_browserGoBack", browserCommands);
	commandTable.registerCommand("cmd_browserGoForward", browserCommands);
	commandTable.registerCommand("cmd_browserStop", browserCommands);
	commandTable.registerCommand("cmd_browserReload", browserCommands);
	commandTable.registerCommand("cmd_browserLoadURI", browserCommands);
	commandTable.registerCommand("cmd_browserOpenLocal", browserCommands);
	commandTable.registerCommand("cmd_browserOpenURI", browserCommands);
	
	commandTable.registerCommand("cmd_goToLine", goToLineCommand);

	commandTable.registerCommand("cmd_togglePanel", switchViewController);

	commandTable.registerCommand("cmd_toUpperCase", modifyTextCommand);
	commandTable.registerCommand("cmd_toLowerCase", modifyTextCommand);
	commandTable.registerCommand("cmd_toTitleCase", modifyTextCommand);
	commandTable.registerCommand("cmd_duplicateLine", modifyTextCommand);
	commandTable.registerCommand("cmd_joinLines", modifyTextCommand);

	commandTable.registerCommand("cmd_formatBlock", formatBlockCommand);
	commandTable.registerCommand("cmd_justify", alignCommand);
	commandTable.registerCommand("cmd_hilitecolor", colorCommand);
	commandTable.registerCommand("cmd_forecolor", colorCommand);
	commandTable.registerCommand("cmd_fontfamily", fontFaceCommand);
	commandTable.registerCommand("cmd_fontsize", fontSizeCommand);
	commandTable.registerCommand("cmd_insertLink", linkCommand);
	commandTable.registerCommand("cmd_insertAnchor", anchorCommand);
	commandTable.registerCommand("cmd_insertImage", imageCommand);
}


/* Commands
-------------------------------------------------------------------------------*/
var fileCommands = {
    supportsCommand : function(cmd){
		switch (cmd){
			case 'cmd_save':
			case 'cmd_saveAs':
			case 'cmd_saveAsTemplate':
			case 'cmd_saveAll':
			case 'cmd_filesOpen':
				return true;
			break;
		}
		return false;
	},
    isCommandEnabled : function(cmd){
		if (codetch.isEditorSelected())
			return true;
		else if (cmd=='cmd_saveAll' && codetch.hasFiles() && codetch.editorCount())
			return true;
		return false;
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
	},
    doCommand : function(cmd){
		switch (cmd){
			case 'cmd_save':codetch.saveFile();break;
			case 'cmd_saveAs':codetch.saveFileAs();break;
			case 'cmd_saveAll':codetch.saveAll();break;
			case 'cmd_saveAsTemplate':codetch.saveFileAs(FileIO.open(GetFilePref("templatedir").path));break;
		}
    },
    onEvent : function(evt){ }
};

/* tab Commands
-------------------------------------------------------------------------------*/
var tabCommands = {
    supportsCommand : function(cmd){
		switch (cmd){
			case 'cmd_close':
			case 'cmd_closeAll':
			case 'cmd_closeAllBut':
			case 'cmd_closeTabGroup':
			case 'cmd_externalPreview':
			case 'cmd_tabsOpen':
				return true;
			break;
		}
		return false;
	},
    isCommandEnabled : function(cmd){
	//alert(codetch.hasFiles())
		return (codetch.hasFiles());
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var n = aParams.getStringValue(aParams.getNext());
		codetch.closeAllBut(n);
	},
    doCommand : function(cmd){
		switch (cmd){
			case 'cmd_close':codetch.closeFile();break;
			case 'cmd_closeAll':codetch.closeAll('*');break;
			case 'cmd_closeTabGroup':codetch.closeAll();break;
			case 'cmd_closeAllBut':codetch.closeAllBut();break;
			case 'cmd_externalPreview':codetch.externalPreview();break;
		}
    },
    onEvent : function(evt){ }
};

var revertCommands = {
    supportsCommand : function(cmd){
		switch (cmd){
			case 'cmd_revert':
			case 'cmd_revertOpen':
				return true;
			break;
		}
		return false;
	},
    isCommandEnabled : function(cmd){
		if(!codetch.isEditorSelected()) return false;
		switch (cmd){
			case 'cmd_revert':return (codetch.getFile().file);break;
			case 'cmd_revertOpen':return (codetch.getFile().originalSource);break;
		}
		return false;
    },
    doCommand : function(cmd){
		switch (cmd){
			case 'cmd_revert':codetch.revertToSave();break;
			case 'cmd_revertOpen':codetch.revertToOpen();break;
		}
    },
    onEvent : function(evt){ }
};

/* browser Commands
-------------------------------------------------------------------------------*/
var browserCommands = {
    supportsCommand : function(cmd){
		switch (cmd){
			case 'cmd_browserOpen':
			case 'cmd_browserGoBack':
			case 'cmd_browserGoForward':
			case 'cmd_browserReload':
			case 'cmd_browserLoadURI':
			case 'cmd_browserStop':
			case 'cmd_browserOpenLocal':
			case 'cmd_browserOpenURI':
				return true;
			break;
		}
		return false;
	},
    isCommandEnabled : function(cmd){
	//alert(codetch.hasFiles())
		return (codetch.hasFiles() && codetch.getFile()._class == 'browser-page');
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var n = aParams.getStringValue(aParams.getNext());
		codetch.browserLoadURI(n);
	},
    doCommand : function(cmd){
		switch (cmd){
			case 'cmd_browserGoBack':codetch.browserGoBack();break;
			case 'cmd_browserGoForward':codetch.browserGoForward();break;
			case 'cmd_browserReload':codetch.browserReload();break;
			case 'cmd_browserLoadURI':codetch.browserLoadURI();break;
			case 'cmd_browserStop':codetch.browserStop();break;
			case 'cmd_browserOpenLocal':codetch.browserOpenLocal();break;
			case 'cmd_browserOpenURI':codetch.browserOpenURI();break;
		}
		return true;
    },
    onEvent : function(evt){ }
};

var testCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_tester");
	},
    isCommandEnabled : function(cmd){
		return true;
    },
    doCommand : function(cmd){
		alert("this is a test!");
    },
    onEvent : function(evt){ }
};

var goToLineCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_goToLine");
	},
    isCommandEnabled : function(cmd){
		if(!codetch.isEditorSelected()) return false;
		return (cmd=="cmd_goToLine" && (codetch.getPanel('code').hasAttribute('selected')));
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var num = aParams.getStringValue(aParams.getNext());
		codetch.getPanel('code').goToLine(num);
	},
    doCommand : function(cmd){
		var num = prompt('Go to line (1-'+codetch.getPanel('code').lines+'):','0');
		num = parseInt(num);
		if(num || num==0)
			codetch.getPanel('code').goToLine(num);
	},
    onEvent : function(evt){ }
};

var modifyTextCommand = {
    supportsCommand : function(cmd){
		switch (cmd){
			case 'cmd_toUpperCase':
			case 'cmd_toLowerCase':
			case 'cmd_toTitleCase':
			case 'cmd_duplicateLine':
			case 'cmd_joinLines':
				return true;
			break;
		}
		return false;
	},
    isCommandEnabled : function(cmd){
		if(!codetch || !codetch.isEditorSelected())return false;
		var ed = codetch.getCurrentEditor();
		if(!ed || (ed && !ed.selected))
			return false;
		var sel = !document.getElementById('cmd_copy').hasAttribute('disabled');
		switch (cmd){
			case 'cmd_toUpperCase':return (ed.upperCase && sel);break;
			case 'cmd_toLowerCase':return (ed.lowerCase && sel);break;
			case 'cmd_toTitleCase':return (ed.titleCase && sel);break;
			case 'cmd_duplicateLine':return (ed.duplicateLine);	break;
			case 'cmd_joinLines':return (ed.joinLines && sel);break;
		}
		return false;
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {},
    doCommand : function(cmd){
		var ed = codetch.getCurrentEditor();
		switch (cmd){
			case 'cmd_toUpperCase':ed.upperCase();break;
			case 'cmd_toLowerCase':ed.lowerCase();break
			case 'cmd_toTitleCase':ed.titleCase();break;
			case 'cmd_joinLines':ed.joinLines();break;
			case 'cmd_duplicateLine':ed.duplicateLine();break;
		}
	},
    onEvent : function(evt){ }
};

var formatBlockCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_formatBlock");
	},
    isCommandEnabled : function(cmd){
		if(!codetch || !codetch.isEditorSelected()) return false;
		var v = codetch.getView();
		return (cmd=="cmd_formatBlock" && (v!='preview' && v!='reference'));
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var tag = aParams.getStringValue(aParams.getNext());
		if(codetch.getCurrentEditor().getAttribute('mode') == 'design'){
			codetch.getDesignElement().contentWindow.focus();
			codetch.getCurrentEditor().htmleditor.setParagraphFormat(tag);
		}else{
			if(tag)
			placeTag(tag);
		}
	},
    doCommand : function(cmd){ },
    onEvent : function(evt){ }
};

var alignCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_justify");
	},
    isCommandEnabled : function(cmd){
		if(!codetch.hasFiles()|| !codetch.isEditorSelected()) return false;
		var v = codetch.getView();
		return (cmd=="cmd_justify" && (v!='preview' && v!='reference'));
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var param = aParams.getStringValue(aParams.getNext());
			if(param=='full')param = "justify";
		if(codetch.getCurrentEditor().getAttribute('mode') == 'design'){
			codetch.getDesignElement().contentWindow.focus();
			codetch.getCurrentEditor().htmleditor.align(param);
		}else{
			placeCode('<div style="text-align: '+param+'">', '</div>');
		}
	},
    doCommand : function(cmd){ },
    onEvent : function(evt){ }
};

var colorCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_hilitecolor" || cmd=="cmd_forecolor");
	},
    isCommandEnabled : function(cmd){
		if(!codetch.hasFiles()|| !codetch.isEditorSelected()) return false;
		var v = codetch.getView();
		return ((cmd=="cmd_forecolor" || cmd=="cmd_hilitecolor") && (v!='preview' && v!='reference'));
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var param = aParams.getStringValue(aParams.getNext());
		var cmd = aCommand.replace('cmd_', '');
		if(codetch.getCurrentEditor().getAttribute('mode') == 'design'){
			var editor = codetch.getDesignHTMLEditor();
			codetch.getDesignElement().contentWindow.focus();
			if(cmd=='hilitecolor' && editor.selection=='')
				editor.setBackgroundColor(param);
			else {
			codetch.getDesignElement().contentWindow.focus();
				codetch.getDesignDocument().execCommand(cmd, false, param);
			}
		}else{
			if(cmd=='hilitecolor') placeCode('<span style="background-color: '+param+'">', '</span>');
			else placeCode('<span style="color: '+param+'">', '</span>');
		}
	},
    doCommand : function(cmd){ },
    onEvent : function(evt){ }
};

var fontFaceCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_fontfamily");
	},
    isCommandEnabled : function(cmd){
		return (codetch.isEditorSelected());
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var param = aParams.getStringValue(aParams.getNext());
		if(codetch.getCurrentEditor().getAttribute('mode') == 'design'){
			codetch.getDesignElement().contentWindow.focus();
			codetch.getDesignDocument().execCommand("fontname", false, param);
		}else if(param){
			codetch.getPanel('code').element.focus();
			placeCode('<span style="font-family: '+param+'">', '</span>');
		}
	},
    doCommand : function(cmd){ },
    onEvent : function(evt){ }
};

// have to develope a valid alternative for using the font tag later
var fontSizeCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_fontsize");
    },
    isCommandEnabled : function(cmd){
		return (codetch.hasFiles() && codetch.isEditorSelected());
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var param = aParams.getStringValue(aParams.getNext());
		if(codetch.getCurrentEditor().getAttribute('mode') == 'design'){
			codetch.getDesignElement().contentWindow.focus();
			codetch.getDesignDocument().execCommand("fontsize", false, param);
		}else if(param){
			codetch.getPanel('code').element.focus();
			placeCode('<font size="'+param+'">', '</font>');
		}
	},
    doCommand : function(cmd){ },
    onEvent : function(evt){ }
};

var linkCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_insertLink");
    },
    isCommandEnabled : function(cmd){
		return (codetch.hasFiles() && codetch.isEditorSelected());
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {	},
	doCommand : function(cmd){
		if(codetch.getCurrentEditor().getAttribute('mode') == 'design'){
		var editor = codetch.getDesignHTMLEditor();
			var a = editor.createElementWithDefaults('href');
			var url = prompt('URL:');
			if(!url) return false;
			a.setAttribute('href', url);
			editor.insertLinkAroundSelection(a);
		}else{
			placeCode('<a href="" title="">', '</a>');
		}
		return true;
	},
	onEvent : function(evt){ }
};

var anchorCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_insertAnchor");
    },
    isCommandEnabled : function(cmd){
		return (codetch.isEditorSelected());
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {	},
	doCommand : function(cmd){
		if(codetch.getCurrentEditor().getAttribute('mode') == 'design'){
			var editor = codetch.getDesignHTMLEditor();
			var a = editor.createElementWithDefaults('namedanchor');
			var url = prompt('Anchor Name:');
			if(!url) return false;
			a.setAttribute('name', url);
			a.setAttribute('id', url);
			editor.insertElementAtSelection(a, false);
		}else{
			placeCode('<a name="" id="">', '</a>');
		}
		return true;
	},
	onEvent : function(evt){ }
};

var imageCommand = {
    supportsCommand : function(cmd){
		return (cmd=="cmd_insertImage");
    },
    isCommandEnabled : function(cmd){
		return (codetch.hasFiles() && codetch.isEditorSelected());
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {	},
	doCommand : function(cmd){
		if(codetch.getCurrentEditor().getAttribute('mode') == 'design'){
			var editor = codetch.getDesignHTMLEditor();
			var a = editor.createElementWithDefaults('img');
			var url = prompt('Image Source:');
			var alt = prompt('Alt text:');

			a.setAttribute('src', url);
			a.setAttribute('alt', alt);
			editor.insertElementAtSelection(a, false);
		}else{
			insertCode('<img src="" alt="" />');
		}
	},
	onEvent : function(evt){ }
};

var switchViewController = {
    supportsCommand : function(cmd){
		switch (cmd){
			case 'cmd_togglePanel':
				return true;
			break;
		}
		return false;
	},
    isCommandEnabled : function(cmd){
		if(!codetch.hasFiles() || !codetch.getFile() || !codetch.isEditorSelected()) return false;
		//var v = codetch.getView();
		switch (cmd){
			case 'cmd_togglePanel':
				return true;
			break;
		}
		return false;
    },
	getCommandStateParams: function(aCommand, aParams, aRefCon) {},
	doCommandParams: function(aCommand, aParams, aRefCon) {
		var view = aParams.getStringValue(aParams.getNext());
		//alert(view);
		codetch.getFileEditor().togglePanel(view);
	},
    doCommand : function(cmd){
    },
    onEvent : function(evt){ }
};


var inspectorCommand = {
    supportsCommand : function(cmd){
		return (cmd=='cmd_inspect');
	},
    isCommandEnabled : function(cmd){
		return (cmd=='cmd_inspect' && Exts.isInstalled(Exts.INSPECTOR_GUID) && codetch.hasFiles()
		&& (!codetch.isEditorSelected() || (codetch.isEditorSelected() && codetch.getPanel('preview'))));
    },
    doCommand : function(cmd){
		doInspect();
    },
    onEvent : function(evt){ }
};

var refreshCommand = {
    supportsCommand : function(cmd){
		return (cmd=='cmd_refresh');
	},
    isCommandEnabled : function(cmd){
		return (cmd=='cmd_refresh' && codetch.hasFiles() && codetch.getFileEditor().refresh);
    },
    doCommand : function(cmd){
		doRefresh();
    },
    onEvent : function(evt){ }
};


 /* Controllers specific to our Code Editor.
/  Gives it support for some Designer only commands
-------------------------------------------------------------------------------*/

// give our code editor commands
var codeFormatController = {
    supportsCommand : function(cmd){
		return (codeFormatCommands[cmd]);
	},
    isCommandEnabled : function(cmd){
		return (codeFormatCommands[cmd] && codetch.hasFiles() && codetch.isEditorSelected());
    },
    doCommand : function(cmd){
		placeTag(codeFormatCommands[cmd]);
    },
    onEvent : function(evt){ }
};

var codeInsertionController = {
    supportsCommand : function(cmd){
		switch (cmd){
			case 'cmd_insertHR':
			case 'cmd_indent':
			case 'cmd_outdent':
				return true;
			break;
		}
		return false;
	},
    isCommandEnabled : function(cmd){
		if(!codetch.isEditorSelected()) return false;
		switch (cmd){
			case 'cmd_insertHR':
			case 'cmd_indent':
			case 'cmd_outdent':
				return true;
			break;
		}
		return false;
    },
    doCommand : function(cmd){
		switch (cmd){
			case 'cmd_insertHR':insertCode('<hr />');break;
			case 'cmd_indent':codetch.getPanel('code').indent();break;
			case 'cmd_outdent':codetch.getPanel('code').outdent();break;
			break;
		}
    },
    onEvent : function(evt){ }
};

// toggle line numbers
var codeLineNumberController = {
    supportsCommand : function(cmd){
		return (cmd=='cmd_toggleLineNumbers');
    },
    isCommandEnabled : function(cmd){
		if(!codetch.hasFiles() || !codetch.isEditorSelected()) return false;
		return true;
    },
    doCommand : function(cmd){
		toggleLineNumbers();
    },
    onEvent : function(evt){ }
};

/* Support Functions
-------------------------------------------------------------------------------*/
function launchFireFTP()
{
	codetch.newBrowserPage('chrome://fireftp/content/fireftp.xul');
}

// inspect page with DOM Inspector
function doInspect()
{
	if(codetch.isEditorSelected()){
		codetch.getPanel('preview').refresh();
		setTimeout('window.openDialog("chrome://inspector/content/", "_blank", "chrome,all,dialog=no", codetch.getPreviewDocument())', 100);
	}else{
		var eldoc = codetch.getFile().panel.document;
		window.openDialog("chrome://inspector/content/", "_blank", "chrome,all,dialog=no", eldoc);
	}
}

// refresh
function doRefresh()
{
	if(codetch.getFileEditor().refresh)
		codetch.getFileEditor().refresh();
}

// print
function doPrint()
{
	try{
		if(codetch.getFileEditor().print)
			codetch.getFileEditor().print();
	}catch(e){
		alert(localize('PrintError')+'\n'+e);
	}
}


// insert a simple two part tag
function placeTag(tag)
{
	placeCode('<'+tag+'>', '</'+tag+'>');
}

// Insert a two part code around the selection
function placeCode(begin, finish)
{
	var codebox = codetch.getCodeBox(),
	str = codebox.selectionStart,
	end = codebox.selectionEnd,
	selection = codebox.value.substring(str,end);

	insertCode(begin+selection+finish);
	end = codebox.selectionStart;
	codebox.setSelectionRange(str+begin.length, end - finish.length)
}

function insertCode(code)
{
	goDoCommandParams('cmd_insertText', paramString(code));
}

function toggleLineNumbers(){ // toggle line #s
	var on=GetBoolPref("linenumbers");
	var area = document.getElementById('workarea');
	if(!on)
		area.className=area.className.replace(/(\s*)lines-off/g,'');
	else
		area.className += ' lines-off';
	GetPrefs().setBoolPref('linenumbers',!on);
	document.getElementById('cmd_toggleLineNumbers').setAttribute('checked', GetBoolPref("linenumbers"));
}
function toggleLivePreview(code)
{
	GetPrefs().setBoolPref('autorefresh', !GetBoolPref('autorefresh'));
	document.getElementById('cmd_toggleLivePreview').setAttribute('checked', GetBoolPref('autorefresh'))
}

function insertGMTDate()
{
	var date = (new Date()).toGMTString();
	insertCode(date);
}
function insertDate()
{
	var date = (new Date()).toLocaleDateString();
	insertCode(date);
}
function insertTime()
{
	var date = (new Date()).toLocaleTimeString();
	insertCode(date);
}
function insertTimeStamp()
{
	var date = (new Date()).getTime();
	insertCode(date);
}
function insertShortDate()
{
	var date = (new Date());
	insertCode(date.getMonth()+'/'+date.getDay()+'/'+date.getFullYear());
}
function insertFilePath()
{
	insertCode(codetch.fileLongName());
}
function insertFileDir()
{
	if(codetch.getFile().file)insertCode(codetch.getFile().file.parent.path);
}
function insertFileName()
{
	insertCode(codetch.getFile().leafName);
}

/*      goDoCommand('cmd_selectBeginLine');
          goDoCommand('cmd_beginLine');
          goDoCommand('cmd_selectEndLine');
          goDoCommand('cmd_endLine');
          goDoCommand('cmd_selectCharNext');
          goDoCommand('cmd_charNext');
          goDoCommand('cmd_selectCharPrevious');
          goDoCommand('cmd_charPrevious');
          goDoCommand('cmd_selectLineNext');
          goDoCommand('cmd_lineNext');
          goDoCommand('cmd_selectLinePrevious');
          goDoCommand('cmd_linePrevious');
	goDoCommand("cmd_scrollLineUp");
	cmd_selectTop
	cmd_selectBottom
	cmd_moveTop
	cmd_moveBottom
	cmd_wordPrevious
	cmd_wordNext
	cmd_selectWordPrevious
	cmd_selectWordNext
	cmd_deleteWordForward
	cmd_deleteWordBackward
	cmd_selectPageUp
	cmd_selectPageDown
	cmd_movePageUp
	cmd_movePageDown
	cmd_cutOrDelete

*/

