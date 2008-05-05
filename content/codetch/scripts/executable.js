function setExecutableDefaults()
{
	// shell
	// windows - c:\WINDOWS\system32\cmd.exe || CODETCH\INSTALL\DIR\hstart.exe
	// unix    - /bin/bash
	
	// ftp
	// windows - c:\WINDOWS\system32\ftp.exe
	// unix    - /usr/bin/ftp
	
	// ssh
	// windows - CODETCH\INSTALL\DIR\ssh.exe
	// unix    - /usr/bin/ssh
	
	// svn
	// windows - 
	// unix    - /usr/bin/svn
	
	// ruby
	// windows - c:\ruby\bin\ruby.exe
	// unix    - /usr/bin/ruby
}

var Exec = {
	output: '',
	init: function ()
	{
		this.isWin = (platform.indexOf("win") != -1);
		this.isMac = (platform.indexOf("mac") != -1);
		this.isUnix = !this.isWin && !this.isMac;
		//this.isUnix = (platform.indexOf("unix") != -1 || platform.indexOf("linux") != -1 || platform.indexOf("sun") != -1);
		
		this._shell = this.isWin?getComponentsDir().path+'\\hstart.exe':'/bin/bash';
		
		var log = getLogDir();
		log.append("ceout.log");
		this.log = log;
		this.pathToLog = this.isWin?this.fixWinPath(log.path):log.path;

		// ftp
		// windows - c:\WINDOWS\system32\ftp.exe
		// unix    - /usr/bin/ftp
		
		// ssh
		// windows - CODETCH\INSTALL\DIR\ssh.exe
		// unix    - /usr/bin/ssh
		
		// svn
		// windows - CODETCH\INSTALL\DIR\svn.exe
		// unix    - /usr/bin/svn

		// cvs
		// windows - CODETCH\INSTALL\DIR\cvs.exe
		// unix    - /usr/bin/svn

		// ruby
		// windows - c:\ruby\bin\ruby.exe
		// unix    - /usr/bin/ruby
	},
	fixWinPath: function(path)
	{
		return path.replace('Documents and Settings', 'DOCUME~1')
			.replace('Application Data', 'APPLIC~1')
			.replace('Program Files', 'PROGRA~1');
	},
	
	// return the shell binary
	get shell(){
		//var path = 'c:\\WINDOWS\\system32\\cmd.exe'
		var bin = FileIO.open(this._shell);
		return bin;
	},
	
	// return the ruby binary
	get ruby(){
		var path = '/usr/bin/ruby';
		var bin = FileIO.open(path);
		return bin;
	},

	// run a process with arguments
	runProcess: function (bin, args){
		try{
			var process = Components.classes['@mozilla.org/process/util;1'].getService(Components.interfaces.nsIProcess);
			process.init(bin);
			var arguments = args||[] ;

			return process.run(false, arguments, arguments.length,{});
		}catch(e){
			alert(e);
		}
		return null;
	},
	
	// Run a command
	runCmd: function (cmd, options){
		options = options || {};
		var cmdLine = [],
		log = options.logFile||this.pathToLog,
		logStr = null;
		if(options.log)
			cmd += ' > '+log;
		//alert(cmd);
		//cmdLine = ['/c', cmd]; // cmd
		cmdLine = this.isWin?['/NOWINDOW', 'cmd /c "'+cmd+'"']:['-c', cmd];
		var r = this.runProcess(this.shell, cmdLine);
		if(options.log && !options.logFile){
			this._interval = setInterval(function(){Exec.readLog()}, 100);
			this._ints = 0;
		}
		return r;
	},
	readLog: function (){
		if(!this.log.exists())
			return;
		this._ints++;
		var logStr = FileIO.read(this.log, 'UTF-8');
		if(logStr){
			clearInterval(this._interval);
			this.output = logStr;
			FileIO.write(this.log, '');
			// send output to gui
			codetch.updateOuput(this.output);
		}
	}
};

Exec.init();
