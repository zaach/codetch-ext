// JavaScript Document

Document.prototype.loadXML=function(s)
{
	var tempdoc=(new DOMParser).parseFromString(s,"text/xml");
	while(this.hasChildNodes())
		this.removeChild(this.lastChild);
	var cs=tempdoc.childNodes;
	var l=cs.length;
	for(var i=0;i<l;i++)
		this.appendChild(this.importNode(cs[i],true));

};

Document.prototype.clear=function()
{
	while(this.hasChildNodes())
		this.removeChild(this.lastChild);
};

Node.prototype.__defineGetter__("xml",function()
{
	return(new XMLSerializer).serializeToString(this);
});

Attr.prototype.__defineGetter__("xml",function()
{
	var val=(new XMLSerializer).serializeToString(this);
	return this.nodeName+"=\""+val.replace(/\"/g,"&quot;")+"\"";
});

Text.prototype.__defineGetter__("text",function()
{
	return this.nodeValue;
});

Node.prototype.__defineGetter__("text",function()
{
	var cs=this.childNodes;
	var l=cs.length;
	var sb=new Array(l);
	for(var i=0;i<l;i++)
		sb[i]=cs[i].text;
	return sb.join("");
});

Node.prototype.selectNodes=function(sExpr)
{
	var doc=this.nodeType==9?this:this.ownerDocument;
	var nsRes=doc.createNSResolver(this.nodeType==9?this.documentElement:this);
	var xpRes=doc.evaluate(sExpr,this,nsRes,5,null);
	var res=[];
	var item;
	while((item=xpRes.iterateNext()))
		res.push(item);
	return res;
};

Node.prototype.selectSingleNode=function(sExpr)
{
	var doc=this.nodeType==9?this:this.ownerDocument;
	var nsRes=doc.createNSResolver(this.nodeType==9?this.documentElement:this);
	var xpRes=doc.evaluate(sExpr,this,nsRes,9,null);
	return xpRes.singleNodeValue;
};

Node.prototype.transformNode=function(oXsltNode)
{
	var doc=this.nodeType==9?this:this.ownerDocument;
	var processor=new XSLTProcessor();
	processor.importStylesheet(oXsltNode);
	var df=processor.transformToFragment(this,doc);
	return df.xml;
};

Node.prototype.transformNodeToObject=function(oXsltNode,oOutputDocument)
{
	var doc=this.nodeType==9?this:this.ownerDocument;
	var outDoc=oOutputDocument.nodeType==9?oOutputDocument:oOutputDocument.ownerDocument;
	var processor=new XSLTProcessor();
	processor.importStylesheet(oXsltNode);
	var df=processor.transformToFragment(this,doc);
	while(oOutputDocument.hasChildNodes())
		oOutputDocument.removeChild(oOutputDocument.lastChild);
	var cs=df.childNodes;
	var l=cs.length;
	for(var i=0;i<l;i++)
		oOutputDocument.appendChild(outDoc.importNode(cs[i],true));
};
