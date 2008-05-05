<?xml version="1.0" encoding="UTF-8"?>
<!-- I am flattered that YOU are viewing my code {;-) but please observe my copyright.   -->
<!-- =================================================================================== -->
<!--              Copyright (c) 2001 X-Power Computing Group Inc.                        -->
<!-- =================================================================================== -->
<!--
		@id		schema2html.xslt
		@author	Franklin de Graaf "franklin@xpower.com"
		@description
		This is the transformation stylesheet to transform an XML Schema document to an
		html document.
		@todo
		(1) 
		@notes
-->
<!-- =================================================================================== -->
<xsl:stylesheet
	version="1.0"
	xmlns:xsd="http://www.w3.org/2001/XMLSchema"
	xmlns:html="http://www.w3.org/1999/xhtml"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
>
<xsl:param name="page">page</xsl:param>
<xsl:param name="xsl:page">xsl:page</xsl:param>
<xsl:param name="xml:page">xml:page</xsl:param>
<xsl:param name="xsd:page">xsd:page</xsl:param>


	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
		<!-- Change method= to { xml | html | xhtml } -->
		<!-- Can't get indent to work, no matter how I try it -->
		
	<xsl:variable name="page1"><xsl:value-of select="$page"/></xsl:variable>
	<xsl:variable name="page2"><xsl:value-of select="$xsl:page"/></xsl:variable>
	<xsl:variable name="page3"><xsl:value-of select="$xml:page"/></xsl:variable>
	<xsl:variable name="page4"><xsl:value-of select="$xsd:page"/></xsl:variable>

	

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
			body {
				padding: 20px 20px 20px 20px;
				font-family: sans-serif;
			}
			p {
				font-family: serif;
			}
			p.element-name {
				font-style: italic;
			}
			p.element-type {
			}
			p.attribute {
			}
			h1 {
				padding: 20px 20px 20px 20px;
				background-color: navy;
				color: white;
			}
			h2 {
			}
			h2.element-name {
				padding: 10px 10px 10px 10px;
				color: white;
				background-color: grey;
			}
			h2.element-type {
				padding: 10px 10px 10px 10px;
				color: white;
				background-color: lightgrey;
			}
			li.attribute-name {
				color: green;
			}
			li.attribute-value {
				color: orange;
			}
			h3 {
				color: black;
				/* top, right, bottom, left */
				margin: 10px 0px 0px 20px;
				padding: 0px 0px 0px 0px;
			}
			.contains-box {
				border: solid 1px black;
				margin: 0px 0px 0px 20px;
				padding: 5px 5px 5px 5px;
			}
		</xsl:text> 
	</html:style>

	<xsl:call-template name="body">
		<xsl:with-param name="page5"><xsl:value-of select="$page"/></xsl:with-param>
	</xsl:call-template>

</xsl:template>

<!-- =================================================================================== -->
<xsl:template name="body">
<!-- =================================================================================== -->
<xsl:param name="page5">nopage</xsl:param>
	<html:body>
<!--
		:1:<xsl:value-of select="$page1"/>:1:
		:2:<xsl:value-of select="$page2"/>:2:
		:3:<xsl:value-of select="$page3"/>:3:
		:4:<xsl:value-of select="$page4"/>:4:
		:5:<xsl:value-of select="$page5"/>:5:
-->
		<html:h1>XUL Elements, Attributes and Attribute Values</html:h1>
		<xsl:call-template name="content"/>
		<xsl:apply-templates select="//xsd:element[@name]"/><!-- only elements with name attribute -->
	
	</html:body>
</xsl:template>

<!-- =================================================================================== -->
<xsl:template name="content">
<!-- =================================================================================== -->


		<html:h2>Table of Contents</html:h2>
		<html:table border="1px" cellpadding="0px 0px 10px 0px">
			<xsl:for-each select="//xsd:element[@name]"><!-- only elements with name attribute -->
				<xsl:variable name="no"><xsl:number/></xsl:variable>

				<xsl:choose>
					<xsl:when test="($no -1) mod 5 = 0">
						<html:tr>
						</html:tr>
							<xsl:call-template name="contentitem"/>
					</xsl:when>
					<xsl:otherwise>
							<xsl:call-template name="contentitem"/>
					</xsl:otherwise>
				</xsl:choose>
							
			</xsl:for-each>
		</html:table>
	
</xsl:template>

<!-- =================================================================================== -->
<xsl:template name="contentitem">
<!-- =================================================================================== -->

	<html:td>
		<html:a>
			<xsl:attribute name="href">
				#<xsl:value-of select="./@name"/>
			</xsl:attribute>
			<xsl:value-of select="./@name"/>
		</html:a>
	</html:td>

</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:element" mode="nameonly">
<!-- =================================================================================== -->

	<html:a>
		<xsl:attribute name="href">
			#<xsl:value-of select="./@name"/>
		</xsl:attribute>
		<xsl:value-of select="./@name"/>
	</html:a>
	<xsl:text>, </xsl:text>

</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:element">
<!-- =================================================================================== -->

	<xsl:variable name="typename"><xsl:value-of select="substring-after(./@type,'xul:')"/></xsl:variable>
	<html:a><xsl:attribute name="name"><xsl:value-of select="./@name"/></xsl:attribute></html:a>
	<html:h2 class="element-name">
		&lt;<xsl:value-of select="./@name"/>&gt;
	</html:h2>
	<xsl:if test="./xsd:annotation/xsd:documentation">
		<html:p class="element-name">[<xsl:value-of select="./xsd:annotation/xsd:documentation"/>]</html:p>
	</xsl:if>
	<!-- namespace() and local-part() are not supported in Mozilla -->
	<!--
	<p><xsl:value-of select="./@type"/></p>
	<p><xsl:value-of select="local-part(./@type)"/></p>
	<p><xsl:value-of select=".[local-part(./@type)]"/></p>
	-->
	<!--(this works)
	<p>[<xsl:value-of select="substring-after(./@type,'xul:')"/>]</p>
	<xsl:apply-templates select="//xsd:complexType['windowElementType' = @name]"/>
	(this doesn't)
	<xsl:apply-templates select="//xsd:complexType[ substring-after(./@type,'xul:') = @name]"/>
	-->
	<xsl:apply-templates select="//xsd:complexType[ $typename = @name]"/>

		
</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:complexType">
<!-- =================================================================================== -->

	<!--h2 class="element-type"><xsl:value-of select="./@name"/></h2-->
	<xsl:variable name="class"><xsl:value-of select="substring-after(.//xsd:extension/@base,'xul:')"/></xsl:variable>
	<html:a><xsl:attribute name="href">#<xsl:value-of select="$class"/></xsl:attribute><xsl:value-of select="$class"/></html:a>
	<html:p class="element-type"><xsl:value-of select="./xsd:annotation/xsd:documentation"/></html:p>
	<html:h3>Contains</html:h3>
	<html:div class="contains-box">
<!--
		<xsl:apply-templates select="./xsd:complexContent//xsd:element" mode="nameonly"/>
-->
		<xsl:for-each select="./xsd:complexContent//xsd:element">
			<xsl:variable name="elementName"><xsl:value-of select="substring-after(./@ref,'xul:')"/></xsl:variable>
			<xsl:apply-templates select="//xsd:element[@name=$elementName]" mode="nameonly"/>
		</xsl:for-each>
		<xsl:apply-templates select="./xsd:complexContent//xsd:group" mode="ref"/>
	</html:div>
	<html:h3>Attributes</html:h3>
	<html:ul>
		<xsl:apply-templates select=".//xsd:attribute"/>
	</html:ul>

</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:group" mode="ref">
<!-- =================================================================================== -->

	<xsl:variable name="groupName"><xsl:value-of select="substring-after(./@ref,'xul:')"/></xsl:variable>
	<xsl:value-of select="$groupName"/><xsl:text>: </xsl:text>
	<xsl:apply-templates select="//xsd:group[@name=$groupName]"/>
	<html:br/>


</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:group">
<!-- =================================================================================== -->

	<xsl:for-each select=".//xsd:element">
		<xsl:variable name="elementName"><xsl:value-of select="substring-after(./@ref,'xul:')"/></xsl:variable>
		<xsl:apply-templates select="//xsd:element[@name=$elementName]" mode="nameonly"/>
	</xsl:for-each>

</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:attribute">
<!-- =================================================================================== -->

	<xsl:variable name="attributeType"><xsl:value-of select="substring-after(./@type,'xul:')"/></xsl:variable>
	<html:li class="attribute-name"><xsl:value-of select="./@name"/></html:li>
	<html:p><xsl:value-of select="./xsd:annotation/xsd:documentation"/></html:p>
	<xsl:apply-templates select="//xsd:simpleType[ $attributeType = @name]"/>
	
</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:simpleType">
<!-- =================================================================================== -->

<!--
	<li><xsl:value-of select="./@name"/></li>
	<p><xsl:value-of select="./xsd:annotation/xsd:documentation"/></p>
	<h4>Values</h4>
-->
	<html:ul>
		<xsl:apply-templates select="./xsd:restriction/xsd:enumeration"/>
	</html:ul>

</xsl:template>

<!-- =================================================================================== -->
<xsl:template match="xsd:enumeration">
<!-- =================================================================================== -->

	<html:li class="attribute-value"><xsl:value-of select="./@value"/></html:li>
	<html:p><xsl:value-of select="./xsd:annotation/xsd:documentation"/></html:p>

</xsl:template>

<!-- =================================================================================== -->
</xsl:stylesheet>
