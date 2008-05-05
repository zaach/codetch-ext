// JavaScript Document

const SERVER_URL = "/xul/server.php";

//Start phpRequest Object
function RequestLoader() {
 	this.params = new Array();
	this.req = new XMLHttpRequest();
 	this.server = '';
	this.text = this.xml = null;
	this.onCatchResponse = function(){};
}

RequestLoader.prototype.addParam = function (name,value) {
	//Add a new pair object to the params
	this.params[this.params.length] = {name:name,value:value};
}

RequestLoader.prototype.execute = function (target, method, sync){

 	var targetURL = target? target:this.server;
	
	sync = (sync);
	
  //Make the connection and send our data
  try {
    var txt = "?1";
    for(var i in this.params) {
      txt += '&'+this.params[i].name+'='+this.params[i].value;
    }
	
    //if(method=='POST'){
    //	this.req.open("POST", targetURL+txt, sync, null, null);  
    //	this.req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	//}else
    	this.req.open("GET", targetURL+txt, sync, null, null);
	//alert(sync);
	//if(sync) this.req.onreadystatechange = this.catchResponse;
    this.req.send(null);
	if(!sync)
		return this.catchResponse();
  }catch (e){
    alert('An error has occured calling the external site: '+e);
    return false;
  } 
	return true;
}

RequestLoader.prototype.catchResponse = function () {
  //Make sure we received a valid response
  switch(this.req.readyState) {
    case 1,2,3:
      alert('Bad Ready State: '+this.req.status+'-'+this.req.statusText);
      return false;
    break;
    case 4:
      if(this.req.status !=200) {
        alert('The server respond with a bad status code: '+this.req.status+'-'+this.req.statusText);
        return false;
      } else {
        var responseText = this.text = this.req.responseText;
        var responseXML = this.xml = this.req.responseXML;
      }
    break;
  }
  this.onCatchResponse();
  //this.req.onreadystatechange = null;
  return responseText;
}