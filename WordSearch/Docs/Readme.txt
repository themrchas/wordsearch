How to get from appweb to host web:

https://www.codeproject.com/Articles/1020972/Using-the-SharePoint-REST-API-in-a-SharePoint-Add
https://blogs.msdn.microsoft.com/nickpinheiro/2015/01/30/build-a-sharepoint-hosted-app-to-access-list-data-in-your-host-web-using-the-rest-api-in-10-easy-steps/

https://www.sharepointnutsandbolts.com/2012/11/access-end-user-data-in-host-web-from.html

Advanced add-in stuff: docs.microsoft.com/en-us/dev/sp-add-ins/sharepoint-add-ins - look at UX design for addins


Use this as query:
https://j67km.sharepoint.com//_api/search/query?querytext='-Path:https://j67km.sharepoint.com/sites/classic/* contentclass=STS_Web'

Note the difference between = and :


contentclass=STS_ListItem_DocumentLibrary - document library files
STS_ListItem - list and doc lib items

This excludes the site keywordtest and below from result
{searchTerms?} Path:http://sp-dev-sp/sites/dev/socafdev/* -Path:http://sp-dev-sp/sites/dev/socafdev/keywordstest  contentclass:STS_ListItem Beavis

Remove addin via powershell:
Install powershell extensions for VSC / SharePoint Online Client Components SDK
https://sharepoint.stackexchange.com/questions/142793/office-365-powershell-script-to-uninstall-the-sharepoint-app

Why VS puts each list in its own feature.
https://stackoverflow.com/questions/25857722/visual-studio-unexpectedly-adding-feature-on-load


http://www.markrackley.net/2018/04/08/the-return-of-hillbillytabs-part-4/


Why does url have keywordsearch2 ??
Allow a intuitive way to update the choice field in results list
When you accept the results in the dialog, the 'Continue' button appears, but so does a 'Please Wait' message
'Processing search result with data in  console yields a huge number of findings
Modify verbiage so that 'Portal search found ### items...' reflects the fact that one item can contain more than one word. 

6/5 - Continue to edit jslinkwordsearch.js so that the coorrect column names appear; test actual code; remove 'Hash' from results webpart in hillbilly wparts



