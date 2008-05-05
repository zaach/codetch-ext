
// from chromedit

const emid="420ed894-c19f-4318-a83f-bacae374db28";

function getBrowser(fileName)
{
	if(navigator.userAgent.search(/Firefox|GranParadiso|Flock/gi) != -1) return "ff";
	if(navigator.userAgent.search(/Thunderbird/gi) != -1) return "tb";
	return "moz";
}
// Returns the user's documents directory
function userDocsDir() {
  var dir = null;
  if (gOS == gMac)
    dir = DirIO.get("UsrDocs");
  else if (gOS == gWin)
    dir = DirIO.get("Pers");
  else
    dir = DirIO.get("Home");
  return dir;
}

function getChromeDir(fileName)
{
    return DirIO.get('UChrm');
}
var gExtensionDir;
function getExtensionDir()
{
	if(gExtensionDir)
		return gExtensionDir.clone();
    var dirLocal = DirIO.get('ProfD');
    dirLocal.append("extensions");
    dirLocal.append("{"+emid+"}");

	//check for testing pointer file
	if(!dirLocal.isDirectory()){
		var dir = FileIO.read(dirLocal);
		dirLocal = DirIO.open(dir.replace(/\n|\r/g,''));
	}

    if (dirLocal.exists() && dirLocal.isDirectory()){
	  gExtensionDir = dirLocal;
      return dirLocal.clone();
    }else{
	  throw 'Given extension installation directory does not exist: "'+dirLocal.path+'"';
	}
    return null;
}
function getComponentsDir()
{
    var dirLocal = getExtensionDir();

    dirLocal.append("components");
    return dirLocal.clone();
}

function getExtDefaultsDir()
{
    var dirLocal = getExtensionDir();

    dirLocal.append("defaults");
    return dirLocal.clone();
}
function getExtDefaultsPath()
{
    return getExtDefaultsDir().path||null;
}

function getCodetchDir()
{
    var dirLocal = DirIO.get('ProfD');
    dirLocal.append("codetch");
    return dirLocal.clone();
}
function getCodetchPath()
{
    return getCodetchDir().path;
}

function getLogDir()
{
    var dirLocal = getCodetchDir();
    dirLocal.append("log");
    return dirLocal.clone();
}
function getLogPath()
{
    return getLogDir().path;
}
function getConfigDir()
{
    var dirLocal = getCodetchDir();
    dirLocal.append("configuration");
    return dirLocal.clone();
}
function getConfigPath()
{
    return getConfigDir().path;
}
function getConfigSubDir(dir)
{
	try{
	    var dirLocal = getConfigDir();
	    dirLocal.append(dir);
	    return dirLocal.clone();
	}catch(e){return null;}
}

function getDoctypesDir()
{
    return getConfigSubDir('doctypes');
}
function getDoctypesPath()
{
    return getDoctypesDir().path;
}

function getTemplatesDir()
{
    return getConfigSubDir('templates');
}
function getTemplatesPath()
{
    return getTemplatesDir().path;
}

function getProjectsDir()
{
    return getConfigSubDir('projects');
}
function getProjectsPath()
{
    return getProjectsDir().path;
}

function getIconsDefaultPath()
{
    var p = DirIO.get('AChrom').path;
    var dirLocal = DirIO.open(p);
    dirLocal.append("icons");
    dirLocal.append("default");
    return dirLocal.path;
}

function checkPaths()
{
	alert(getIconsDefaultPath());
	alert(getExtDefaultsPath());
}

function copyFiles()
{
//try {
	if(getBrowser()=="moz") return;
	/*
	var iconFiles = ["codetch-main.ico"];
	var iconsDefaultsDir = getIconsDefaultPath();
	var extDefaultsDir = getExtDefaultsPath();

	var iconFile = FileIO.open(iconsDefaultsDir);

	for (i=0;i<iconFiles.length;i++) {
		copyFromDef(iconFiles[i], iconFile);
	}*/
	copyToCodetch();

	//}catch(e){
		//alert('Installation Failure. \n'+e);
	//}
}

// if 'remove' is true, remove the entire codetch app folder and place new one
// else install on top of old installation
function copyToCodetch(remove)
{
	var codetchDir = getCodetchDir();
	var defualtsDir = getExtDefaultsDir();

	// create the main Codetch directory
	if(codetchDir.exists() && (remove || !codetchDir.isExecutable()))
		codetchDir.remove(true);

	if(!codetchDir.exists())
		codetchDir.create(0x01, 0775);
	
	var configDir = defualtsDir.clone();
	configDir.append('configuration');
	cloneDirectory(codetchDir, configDir, true, remove);
	
	removeCVSDirs(codetchDir, true);
}

// clone a directory, recursively adding files if they don't exists or in overwriting mode
function cloneDirectory(parentDestDir, sourceFile, recur, overwrite)
{
	var destinationDir = parentDestDir.clone(),
	file;
	destinationDir.append(sourceFile.leafName);
	if (recur == null)
		recur = false;
	if (overwrite == null)
		overwrite = false;
	
	// if overwrite is true, we overwrite all files when copying
	if(overwrite && destinationDir.exists()) destinationDir.remove(true);
	
	// if folder doesn't exist in destination, just copy whole thing
	if (destinationDir && !destinationDir.exists() && sourceFile.exists()) {
		sourceFile.copyTo(parentDestDir, sourceFile.leafName);
		
	}else if(destinationDir.exists() && sourceFile.exists()){ // it exsts, so we go through and copy contents one file at a time
		var files = sourceFile.directoryEntries;
		while (files.hasMoreElements()) {
			file = files.getNext()
						.QueryInterface(FileIO.localfileIID);
			if(file.isDirectory() && recur) cloneDirectory(destinationDir, file, recur, overwrite);
			else copyFile(destinationDir, file, overwrite);
		}
	}
}
// remove CVS directories
function removeCVSDirs(dir, recur)
{
	var dir = dir.clone(),
	file;
	if (recur == null)
		recur = false;

	if (dir.exists() && dir.isDirectory()) {
		var files = dir.directoryEntries;
		while (files.hasMoreElements()) {
			file = files.getNext()
						.QueryInterface(FileIO.localfileIID);
			if(file.leafName.toUpperCase()=='CVS')
				file.remove(true);
			else if(recur && file.isDirectory())
				removeCVSDirs(file, recur);
		}
	}
}

// only copies to new file or if overwrite is true
function copyFile(destDir, fromFile, overwrite)
{
	var target = destDir.clone();
	target.append(fromFile.leafName);
	if(overwrite && target.exists()) target.remove(true);
	if (target && !target.exists()) {
		fromFile.copyTo(destDir, fromFile.leafName);
	}
}

function copyFromDef(name, toFile, remove)
{
	var target = toFile.clone();
	target.append(name);
	if(remove && target.exists()) target.remove(true);
	if (target && !target.exists()) {
		var fromFile = FileIO.open(getExtDefaultsPath());
		fromFile.append(name);
		fromFile.copyTo(toFile, name);
	}
}
