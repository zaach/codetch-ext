/*
Install Codetch
By Zach Carter.
*/

const APP_AUTHOR    = "Zachary Carter";
const APP_DISPLAY_NAME    = "Codetch";
const APP_NAME            = "codetch";
const APP_PACKAGE         = "/"+APP_AUTHOR+"/"+APP_DISPLAY_NAME;
const APP_VERSION         = "0.4.0.20061026";

const APP_JAR_FILE        = APP_NAME+".jar";
const APP_CONTENT_FOLDER  = "content/"+APP_NAME+"/";
const APP_SKIN_FOLDER  = "skin/classic/";
const APP_LOCALE          = {"en-US","es-AR","de-DE","da-DK"};
//const APP_LOCALE_FOLDER   = "locale/" + APP_LOCALE + "/"+APP_NAME+"/";

const APP_SUCCESS_MESSAGE = APP_DISPLAY_NAME+" can now be found under the Tools menu, as a toolbar icon or accessed by the hotkey CTRL-F9 \n Please restart the application or open a new window for completion.";


var profilecf = folder = getFolder("Profile", "chrome");
var chromef = getFolder("chrome");
var codetchf = getFolder("Profile", "codetch");

var existsInApplication   = File.exists(getFolder(chromef, APP_JAR_FILE));
var existsInProfile       = File.exists(getFolder(folder, APP_JAR_FILE));

var chromeFlag = PROFILE_CHROME;

var err;
initInstall(APP_NAME, APP_PACKAGE, APP_VERSION);

// If the extension exists in the application folder or it doesn't exist in the profile folder and the user doesn't want it installed to the profile folder
if(existsInApplication || (!existsInProfile && !confirm("Do you want to install the extension into your profile folder?\n(Cancel will install into the application folder)")))
{
    folder      = getFolder("chrome");
    chromeFlag = DELAYED_CHROME;
}

setPackageFolder(folder);
err = addFile(APP_AUTHOR, APP_VERSION, "chrome/" + APP_JAR_FILE, folder, null);


if (err == SUCCESS) {
  var iconfolder = getFolder(getFolder("chrome", "icons"), "default");
  //addFile(name, "ce-main.xpm", iconfolder, "");
	err = addFile(APP_NAME, "defaults/codetch-main.ico", iconfolder, "");
}

if (err == SUCCESS) addCodetchFiles();

if (err == SUCCESS) 
{ 
	var jar = getFolder(folder, APP_JAR_FILE);

	registerChrome(CONTENT | chromeFlag, jar, APP_CONTENT_FOLDER);
	for(var i=0;i<APP_LOCALE.length;i++)
		registerChrome(LOCALE  | chromeFlag, jar, "locale/" + APP_LOCALE[i] + "/"+APP_NAME+"/");
	registerChrome(SKIN | chromeFlag, jar, APP_SKIN_FOLDER);

	err = performInstall();

	if(err == SUCCESS || error == 999) 
   {
		alert(APP_NAME + " " + APP_VERSION + " has been succesfully installed.\n"
			+APP_SUCCESS_MESSAGE
			+"Please restart your browser before continuing.");
	} 
   else 
   { 
		alert("Install failed. Error code: " + err);
		cancelInstall(err);
	}
} 
else 
{
	alert("Failed to create " +APP_JAR_FILE +"\n"
		+"You probably don't have appropriate permissions \n"
		+"for the installation directory. \n");
	cancelInstall(err);
}

function addCodetchFiles() {
	var target = codetchf;
	if (!File.exists(target)) {
		File.dirCreate(target);
	}

 	err = addFile(APP_NAME, "defaults/codetch-main.ico", target, "");

	var target = getFolder(target, "configuration");
	if (!File.exists(target)) {
		File.dirCreate(target);
	}

	err = addDirectory(APP_NAME, "defaults/configuration", target, '');
}