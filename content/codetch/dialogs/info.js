
function prefill()
{
  // unwrap all the args....
  // arguments[0] --> the image src url
  // arguments[1] --> the alert title
  // arguments[2] --> the alert text
//alertObject(window.arguments);
  document.getElementById('alertImage').setAttribute('src', window.arguments[0].GetString(0));
  document.getElementById('alertTitleLabel').setAttribute('value', window.arguments[0].GetString(1));
  document.getElementById('alertTextLabel').setAttribute('value', window.arguments[0].GetString(2));
  document.title = window.arguments[0].GetString(1);
}


//-----------------------------------------------------------------------------------
function alertObject(obj, win)
{
  var names = "";
  for (var i in obj)
  {
	try{
    if (i == "value")
      names += i + ": " + obj.value + "\n";
    else if (i == "id")
      names += i + ": " + obj.id + "\n";
    else
      names += i +"\t=\t"+String(obj[i])+ "\n";
	}catch(e){
      names += i + ": " + String(e) + "\n";
	}
  }
  var out = "-----" + obj + "------\n"+names + "-----------\n";
  if(win){
	var tab = codetch.newBrowserPage('about:blank', obj.toString());
	  tab.panel.document.location = "data:text/plain," + encodeURIComponent(out);
  }else alert(out);
}