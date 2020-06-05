<%-- The following 4 lines are ASP.NET directives needed when using SharePoint components --%>

<%@ Page Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" MasterPageFile="~masterurl/default.master" Language="C#" %>

<%@ Register TagPrefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%-- The markup and script in the following Content element will be placed in the <head> of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
    
   <!-- <SharePoint:ScriptLink name="sp.js" runat="server" OnDemand="true" LoadAfterUI="true" Localizable="false" /> -->
   <script type="text/javascript" src="/_layouts/15/sp.runtime.js"></script> 
    <script type="text/javascript" src="/_layouts/15/sp.js"></script>
    <!-- Add your CSS styles to the following file -->
   
    <link rel="stylesheet" href="../Content/jquery-ui/jquery-ui.css"/>
    <link rel="stylesheet" href="../Content/App.css"/>
 <!--   <link rel="stylesheet" href="../Content/jquery-ui/jquery-ui.structure.css"/>
    <link rel="stylesheet" href="../Content/jquery-ui/jquery-ui.theme.css"/> -->

    <!-- Add your JavaScript to the following file -->
   <!--  <script type="text/javascript" src="../Scripts/App.js"></script> -->
    <script type="text/javascript" src="../Scripts/jquery-3.4.1-min.js"></script>
    <script type="text/javascript" src="../Scripts/jquery-ui.js"></script> 
    <script type="text/javascript" src="../Scripts/lodash-4.17.15.js"></script>
    <script type="text/javascript" src="../Scripts/md5.js"></script>
    <script type="text/javascript" src="../Scripts/moment.js"></script>
    <script type="text/javascript" src="../Scripts/jQuery.HillbillyTabs.4.js"></script> 
   <!-- <script type="text/javascript" src="../Scripts/HillbillyTabs.4.CEWP.js"></script> -->
<script type="text/javascript" src="../Scripts/keywords.js"></script> 


   
    <script type="text/javascript">
        jQuery(document).ready(function ($) {

            if (typeof jQuery != 'undefined')
                console.log('jQuery version is',jQuery.fn.jquery);
            else
                console.log('jQuery is undefined');


            if ($ === jQuery)
                console.log('$ === jQuery');

            if (!$)
                console.log('$ is not defined');


            console.log('jQuery version is', $.fn.jquery);
           // console.log('Hillbilly tabs is', $.fn.HillbillyTabs);

            $.fn.tabby();

            var tabConfiguration = [];

		    var thisTab = {
			    title: "Key Words",
			    webParts: ["Key Words"]
		    }
		
            tabConfiguration.push(thisTab);

            tabConfiguration.push({
			    title: "Search Paths",
			    webParts: ["Search Paths"]
            });

            tabConfiguration.push({
			    title: "Results List",
			    webParts: ["Results List"]
            }); 

           
		

            $.fn.HillbillyTabs({ tabConfiguration: tabConfiguration });

            $("[id^=Hero-WP]").attr('style', "");

        }); 
        
</script> 

     
  
</asp:Content>
   


<%-- The markup in the following Content element will be placed in the TitleArea of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
    Key Word App
</asp:Content>

<%-- The markup and script in the following Content element will be placed in the <body> of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">

    <div class="hyperlink">
       <p><asp:HyperLink runat="server" 
            NavigateUrl="JavaScript:window.location = _spPageContextInfo.webAbsoluteUrl + '/Lists/KeyWords/AllItems.aspx';" 
            Text="Key Word List" /></p>
    </div>

    <div class="hyperlink">
       <p><asp:HyperLink runat="server" 
            NavigateUrl="JavaScript:window.location = _spPageContextInfo.webAbsoluteUrl + '/Lists/SearchPaths/AllItems.aspx';" 
            Text="Paths to include in search" /></p>
    </div>

    <div class="hyperlink">
       <p><asp:HyperLink runat="server" 
            NavigateUrl="JavaScript:window.location = _spPageContextInfo.webAbsoluteUrl + '/Lists/ResultsList/AllItems.aspx';" 
            Text="Results List" /></p>
    </div>


    <div class="button">
           <span>Search and update findings:</span>
           <asp:Button id="btnUpdate"
           OnClientClick="updateBtn(); return false;"
           Text="Update"
           runat="server"/>
    </div>


    <div>
        <p>
 
    <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" ID="SearchPathsZone" Title="loc:full" >
            </WebPartPages:WebPartZone>
            </p>
    </div>

    
   <div>
        <p>

    <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" 
      ID="KeyWordsListZone" Title="loc:full" />
        </p>
    </div>

    <div>

        <p>
    <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" 
      ID="ResultsListZone" Title="loc:full" />
       </p>
    </div>

    



    <div id="tabsContainer"></div> 
    
  
</asp:Content>




