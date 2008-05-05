/////////////////////////////////////////////////
/////////////////////////////////////////////////
//
// Basic JavaScript File and Directory IO module
// By: MonkeeSage, v0.1
// Modified a lil by Zachary Carter
/////////////////////////////////////////////////
/////////////////////////////////////////////////

//alert("included");
if (typeof(JSIO) != 'boolean') {

	var JSIO = true;

	/////////////////////////////////////////////////
	// Basic file IO object based on Mozilla source 
	// code post at forums.mozillazine.org
	/////////////////////////////////////////////////

	// Example use:
	// var fileIn = FileIO.open('/test.txt');
	// if (fileIn.exists()) {
	// 	var fileOut = FileIO.open('/copy of test.txt');
	// 	var str = FileIO.read(fileIn);
	// 	var rv = FileIO.write(fileOut, str);
	// 	alert('File write: ' + rv);
	// 	rv = FileIO.write(fileOut, str, 'a');
	// 	alert('File append: ' + rv);
	// 	rv = FileIO.unlink(fileOut);
	// 	alert('File unlink: ' + rv);
	// }

	var FileIO = {

		localfileCID  : '@mozilla.org/file/local;1',
		localfileIID  : Components.interfaces.nsILocalFile,

		finstreamCID  : '@mozilla.org/network/file-input-stream;1',
		finstreamIID  : Components.interfaces.nsIFileInputStream,

		foutstreamCID : '@mozilla.org/network/file-output-stream;1',
		foutstreamIID : Components.interfaces.nsIFileOutputStream,

		sinstreamCID  : '@mozilla.org/scriptableinputstream;1',
		sinstreamIID  : Components.interfaces.nsIScriptableInputStream,

		suniconvCID   : '@mozilla.org/intl/scriptableunicodeconverter',
		suniconvIID   : Components.interfaces.nsIScriptableUnicodeConverter,

		ioserviceCID  : '@mozilla.org/network/io-service;1',
		ioserviceIID  : Components.interfaces.nsIIOService,

		fprotohandlerIID  : Components.interfaces.nsIFileProtocolHandler,

		open   : function(path) {
			try {
				var file = Components.classes[this.localfileCID]
								.createInstance(this.localfileIID);
				file.initWithPath(path);
				return file;
			}
			catch(e) {
				debugLog(e);
				return false;
			}
		},

		read   : function(file, charset) {
			try {
				var data     = new String();
				var fiStream = Components.classes[this.finstreamCID]
									.createInstance(this.finstreamIID);
				var siStream = Components.classes[this.sinstreamCID]
									.createInstance(this.sinstreamIID);
				fiStream.init(file, 1, 0, false);
				siStream.init(fiStream);
				data += siStream.read(-1);
				siStream.close();
				fiStream.close();
				//if (charset) {
					data = this.toUnicode("UTF-8", data);
				//}
				return data;
			} 
			catch(e) {
				debugLog(e);
				return false;
			}
		},

		readAsync   : function(file, observer) {
			try {
				var ioService=Components.classes[this.ioserviceCID]
									.getService(this.ioserviceIID);
				var fileURI = ioService.newFileURI(file);
				var channel = ioService.newChannelFromURI(fileURI);
				observer =observer?observer:{
					onStreamComplete : function(aLoader, aContext, aStatus, aLength, aResult)
					{
						//alert(aResult);
					}
				};
				var sl = Components.classes["@mozilla.org/network/stream-loader;1"]
									.createInstance(Components.interfaces.nsIStreamLoader);
				sl.init(channel, observer, null);
				return true;
			} 
			catch(e) {
						alert(e);
				return false;
			}
		},

		readURL   : function(path, async) {
			try {
				var ioService=Components.classes[this.ioserviceCID]
									.getService(this.ioserviceIID);
				var scriptableStream = Components.classes[this.sinstreamCID]
									.createInstance(this.sinstreamIID);
				var channel=ioService.newChannel(path,null,null);
				var input=channel.open();
				scriptableStream.init(input);
				var str=scriptableStream.read(input.available());
				scriptableStream.close();
				input.close();
				return str;
			}
			catch(e) {
				debugLog(e);
				return false;
			}
		},

		readURLAsync   : function(path, load, error, progress) {
			try {
                var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();

                // QI the object to nsIDOMEventTarget to set event handlers on it:

                request.QueryInterface(Components.interfaces.nsIDOMEventTarget);
                request.addEventListener("load", load, false);
                request.addEventListener("error", error, false);
                try{
                    //request.addEventListener("progress", progress, false);
                }catch(e){}

                // QI it to nsIXMLHttpRequest to open and send the request:

                request.QueryInterface(Components.interfaces.nsIXMLHttpRequest);
                request.open("GET", path, true);
                request.send(null);

			}
			catch(e) {
				debugLog(e);
				return false;
			}
		},
		write  : function(file, data, mode, charset) {
			try {
				var foStream = Components.classes[this.foutstreamCID]
									.createInstance(this.foutstreamIID);
				netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
				//if (charset) {
					data = this.fromUnicode("UTF-8", data);
				//}
				var flags = 0x02 | 0x08 | 0x20; // wronly | create | truncate
				if (mode == 'a') {
					flags = 0x02 | 0x10; // wronly | append
				}
				foStream.init(file, flags, 0664, 0);
				foStream.write(data, data.length);
				// foStream.flush();
				foStream.close();
				return true;
			}
			catch(e) {
				//throw e;
				debugLog(e);
				return false;
			}
		},

		create : function(file) {
			try {
				file.create(0x00, 0664);
				return true;
			}
			catch(e) {
				debugLog(e);
				return false;
			}
		},

		unlink : function(file) {
			try {
				file.remove(false);
				return true;
			}
			catch(e) {
				debugLog(e);
				return false;
			}
		},

		path   : function(file) {
			try {
				return 'file:///' + file.path.replace(/\\/g, '\/')
							.replace(/^\s*\/?/, '').replace(/\ /g, '%20');
			}
			catch(e) {
				return false;
			}
		},
		url   : function(file) {
			try {
				var ios = Components.classes[ioserviceCID].
					getService(ioserviceIID);
				var fileHandler = ios.getProtocolHandler("file").
					QueryInterface(fprotohandlerIID);
				return fileHandler.getURLSpecFromFile(file);
			}
			catch(e) {
				return false;
			}
		},
		ext   : function(file) {
			var rv=null;
			try {
				var leafName  = file.leafName;
				var dotIndex  = leafName.lastIndexOf('.');
				rv=(dotIndex >= 0) ? leafName.substring(dotIndex+1) : "";
				return rv;
			}
			catch(e) {
				return null;
			}
		},

		toUnicode   : function(charset, data) {
			try{
				var uniConv = Components.classes[this.suniconvCID]
									.createInstance(this.suniconvIID);
				uniConv.charset = charset;
				data = uniConv.ConvertToUnicode(data);
			} 
			catch(e) {
				debugLog(e);
				// foobar!
			}
			return data;
		},

		fromUnicode : function(charset, data) {
			try {
				var uniConv = Components.classes[this.suniconvCID]
									.createInstance(this.suniconvIID);
				uniConv.charset = charset;
				data = uniConv.ConvertFromUnicode(data);
				data += uniConv.Finish();
			}
			catch(e) {
				debugLog(e);
				// foobar!
			}
			return data;
		}

	}


	/////////////////////////////////////////////////
	// Basic Directory IO object based on JSLib 
	// source code found at jslib.mozdev.org
	/////////////////////////////////////////////////

	// Example use:
	// var dir = DirIO.open('/test');
	// if (dir.exists()) {
	// 	alert(DirIO.path(dir));
	// 	var arr = DirIO.read(dir, true), i;
	// 	if (arr) {
	// 		for (i = 0; i < arr.length; ++i) {
	// 			alert(arr[i].path);
	// 		}
	// 	}
	// }
	// else {
	// 	var rv = DirIO.create(dir);
	// 	alert('Directory create: ' + rv);
	// }

	// ---------------------------------------------
	// ----------------- Nota Bene -----------------
	// ---------------------------------------------
	// Some possible types for get are:
	// 	'ProfD'				= profile
	// 	'DefProfRt'			= user (e.g., /root/.mozilla)
	// 	'UChrm'				= %profile%/chrome
	// 	'DefRt'				= installation
	// 	'PrfDef'				= %installation%/defaults/pref
	// 	'ProfDefNoLoc'		= %installation%/defaults/profile
	// 	'APlugns'			= %installation%/plugins
	// 	'AChrom'				= %installation%/chrome
	// 	'ComsD'				= %installation%/components
	// 	'CurProcD'			= installation (usually)
	// 	'Home'				= OS root (e.g., /root)
	// 	'TmpD'				= OS tmp (e.g., /tmp)

	var DirIO = {

		sep        : '/',

		dirservCID : '@mozilla.org/file/directory_service;1',
	
		propsIID   : Components.interfaces.nsIProperties,
	
		fileIID    : Components.interfaces.nsIFile,

		get    : function(type) {
			try {
				var dir = Components.classes[this.dirservCID]
								.createInstance(this.propsIID)
								.get(type, this.fileIID);
				return dir;
			}
			catch(e) {
				return false;
			}
		},

		open   : function(path) {
			return FileIO.open(path);
		},

		create : function(dir) {
			try {
				dir.create(0x01, 0755);
				return true;
			}
			catch(e) {
				debugLog(e);
				return false;
			}
		},

		read   : function(dir, recursive) {
			var list = new Array();
			try {
				if (dir.isDirectory()) {
					if (recursive == null) {
						recursive = false;
					}
					var files = dir.directoryEntries;
					list = this._read(files, recursive);
				}
			}
			catch(e) {
				debugLog(e);
				// foobar!
			}
			return list;
		},

		_read  : function(dirEntry, recursive) {
			var list = new Array();
			try {
				while (dirEntry.hasMoreElements()) {
					list.push(dirEntry.getNext()
									.QueryInterface(FileIO.localfileIID));
				}
				if (recursive) {
					var list2 = new Array();
					for (var i = 0; i < list.length; ++i) {
						if (list[i].isDirectory()) {
							files = list[i].directoryEntries;
							list2 = this._read(files, recursive);
						}
					}
					for (i = 0; i < list2.length; ++i) {
						list.push(list2[i]);
					}
				}
			}
			catch(e) {
			   // foobar!
			}
			return list;
		},

		unlink : function(dir, recursive) {
			try {
				if (recursive == null) {
					recursive = false;
				}
				dir.remove(recursive);
				return true;
			}
			catch(e) {
				debugLog(e);
				return false;
			}
		},

		path   : function (dir) {
			return FileIO.path(dir);
		},
		url   : function (dir) {
			return FileIO.url(dir);
		},

		split  : function(str, join) {
			var arr = str.split(/\/|\\/), i;
			str = new String();
			for (i = 0; i < arr.length; ++i) {
				str += arr[i] + ((i != arr.length - 1) ? 
										join : '');
			}
			return str;
		},

		join   : function(str, split) {
			var arr = str.split(split), i;
			str = new String();
			for (i = 0; i < arr.length; ++i) {
				str += arr[i] + ((i != arr.length - 1) ? 
										this.sep : '');
			}
			return str;
		}
	
	}

	if (navigator.platform.toLowerCase().indexOf('win') > -1) {
		DirIO.sep = '\\';
	}

}
