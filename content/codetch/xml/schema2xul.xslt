<?xml version="1.0" encoding="UTF-8"?>
<!-- I am flattered that YOU are viewing my code {;-) but please observe my copyright.   -->
<!-- =================================================================================== -->
<!--              Copyright (c) 2001 X-Power Computing Group Inc.                        -->
<!-- =================================================================================== -->
<!--
		@id		schema2xul.xslt
		@author	Franklin de Graaf "franklin@xpower.com"
		@description
		This is the transformation stylesheet to transform an XML Schema document to a
		xul document which has widgets for selecting a XUL element, a corresponding
		XUL attribute and a corresponding attribute value.
		@todo
		(1) 
		@notes
-->
<!-- =================================================================================== -->
<xsl:stylesheet
	version="1.0"
	xmlns:xsd="http://www.w3.org/2001/XMLSchema"
	xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
   xmlns:html="http://www.w3.org/1999/xhtml"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
>

	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
		<!-- Change method= to { xml | html | xhtml } -->
		<!-- Can't get indent to work, no matter how I try it -->

<!-- =================================================================================== -->
<xsl:template match="/">
<!-- =================================================================================== -->
<!-- stylesheets -->
<!--
<?xml-stylesheet href="chrome://xulmaker/skin/xulmaker.css" type="text/css"?>
-->
	<xsl:processing-instruction name="xml-stylesheet">
		<xsl:attribute name="href">chrome://xulmaker/skin/xulmaker.css</xsl:attribute>
		<xsl:attribute name="type">text/css</xsl:attribute>
	</xsl:processing-instruction>

	<html:style type="text/css">
		<xsl:text>
			window { background-color: lightgrey; padding: 20px 20px 20px 20px }
		</xsl:text> 
	</html:style>

	<xsl:call-template name="window"/>

</xsl:template>

<!-- =================================================================================== -->
<xsl:template name="window">
<!-- =================================================================================== -->

	<window
		windowtype="dev:schema"
		xmlns:html="http://www.w3.org/1999/xhtml"
		xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
		xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
		id="main"
		class="dialog"
		scroll="true"
		orient="vertical"
		width="800px"
		height="400px"
		persist="screenX screenY width height collapsed"
	>
	<!--
		onload="Init();"
	<label value="Elements, Attributes and Attribute Values" style="font-size:18pt;font-weight:bold;color:blue;"/>
	-->
	<html:h1>Elements, Attributes and Attribute Values</html:h1>
	<xsl:call-template name="elementbox"/>
	<xsl:call-template name="attributebox"/>
	<xsl:call-template name="valuebox"/>
	
	</window>
</xsl:template>

<!-- =================================================================================== -->
<xsl:template name="elementbox">
<!-- =================================================================================== -->
<groupbox flex="1">
	<caption label="Elements" style="font-weight:bold"/>
	<menulist editable="true">
		<menupopup>
			<xsl:apply-templates select="//xsd:element"/>
		</menupopup>
	</menulist>
</groupbox>
	
</xsl:template>

<!-- =================================================================================== -->
<xsl:template name="attributebox">
<!-- =================================================================================== -->
<groupbox flex="1">
	<caption label="Attributes" style="font-weight:bold"/>
	<menulist editable="true">
		<menupopup>
			<xsl:apply-templates select="//xsd:complexType[@name='windowElementType']//xsd:attribute"/>
<!--
			<xsl:variable name="xpath">//xsd:complexType[@name='windowType']//xsd:attribute</xsl:variable>
			<xsl:apply-templates select="$xpath"/>
-->
		</menupopup>
	</menulist>
</groupbox>
	
</xsl:template>

<!-- =================================================================================== -->
<xsl:template name="valuebox">
<!-- =================================================================================== -->
<groupbox flex="1">
	<caption label="Attribute Values" style="font-weight:bold"/>
	<menulist editable="true">
		<menupopup>
			<xsl:apply-templates select="//element"/>
		</menupopup>
	</menulist>
</groupbox>
	
</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:element">
<!-- =================================================================================== -->
	<xul:menuitem>
		<xsl:value-of select="./@name"/>
	</xul:menuitem>
</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:attribute">
<!-- =================================================================================== -->
	<menuitem>
		<xsl:value-of select="./@name"/>
	</menuitem>
</xsl:template>

<!-- =================================================================================== -->
</xsl:stylesheet>
