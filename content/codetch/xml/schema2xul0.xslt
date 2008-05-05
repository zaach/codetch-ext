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
	xmlns="http://www.w3.org/1999/xhtml"
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
<!--
	<xsl:processing-instruction name="xml-stylesheet">
		<xsl:attribute name="href">chrome://xulmaker/skin/xulmaker.css</xsl:attribute>
		<xsl:attribute name="type">text/css</xsl:attribute>
	</xsl:processing-instruction>
-->

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
		orient="vertical"
		persist="screenX screenY width height collapsed"
	>
	<!--
		onload="Init();"
	-->
	
	<toolbox id="ttolbox0">
		<menubar id="menubar0">
			<menu label="File">
				<menupopup>
					<menuitem label="New"/>
					<menuitem label="Open"/>
					<menuitem label="Close"/>
				</menupopup>
			</menu>
			<menu label="Edit">
				<menupopup>
					<menuitem label="Cut"/>
					<menuitem label="Copy"/>
					<menuitem label="Paste"/>
				</menupopup>
			</menu>
		</menubar>
		<toolbar id="toolbar0">
			<toolbarbutton label="hello"/>
			<toolbarbutton label="goodbye"/>
		</toolbar>
	</toolbox>
<!--
	<xsl:call-template name="elementbox"/>
-->

	<xsl:apply-templates select="//element"/>	

<!--
	<statusbar id="statusbar0">
		<description value="statusbar"/>
	</statusbar>
-->	
	</window>
</xsl:template>

<!-- =================================================================================== -->
<xsl:template name="elementbox">
<!-- =================================================================================== -->
<!-- apparently we can't call templates beyond a depth of one -->
	<label value="HELLO2"/><textbox/>

</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="schema">
<!-- =================================================================================== -->
Schema:
	<xsl:value-of select="@xmlns"/>	
<br/>
	<xsl:apply-templates/>
</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="element">
<!-- =================================================================================== -->
Element:
	<xsl:value-of select="@name"/>	
	<xsl:apply-templates/>
<br/>
</xsl:template>

<!-- =================================================================================== -->
</xsl:stylesheet>
