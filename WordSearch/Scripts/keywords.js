


/* Pre-condition: an includeInView function has been defined */





    //Set to 'true' to get a lot of output in console
    doLog = true;
       
    //Array containing URLs currently in  list
    var existingURLs;

    //Contains the results of previous pulls in results list. Hash as follows: key -> Title, properties: Title,URL,inREST.  inREST is true if the URL is also found in the REST pull results, but initially set to false in app.
    var parsedListData;


    //Makes ajax call given a REST endpoint
    function makeAjaxGetCall(restEndpoint) {
        doLog && console.log('Endpoint in makeAjaxCall is', restEndpoint);
        return $.ajax({

            url: restEndpoint,
            method: "GET",
            headers: { "accept": "application/json; odata=verbose" }
        })

      
    } //makeAjaxGetCall


    
    function listPostRender(ctx) {


       
        //Include CSS in script. 
         
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = ctx.HttpRoot + "/SearchApp/css/search.css";
        head.appendChild(link); 


        //Remove Title column from the rendered output
     /*  var fieldName = "Title"; // here Date is field or column name to be hide
        var header = document.querySelectorAll("[displayname=" + fieldName + "]")[0].parentNode;
        var index = [].slice.call(header.parentNode.children).indexOf(header) + 1;
        header.style.display = "none";
        for (var i = 0, cells = document.querySelectorAll("td:nth-child(" + index + ")") ; i < cells.length; i++) {
            cells[i].style.display = "none";
        }
*/



        doLog && console.log('jquery version is', $().version);
        doLog && console.log('listPostRender !!');
        $(".hash").click(function (event) {
            doLog & console.log('You just clicked the element: ', this);
            event.stopPropagation();
        });

        //Increase width of Comment and item modified column
        $("div[displayname='Comment']").attr("id", "commentColumn");
        $("div[displayname='Date Item Last Modified']").attr("id", "dateModifiedColumn");

       $("#btnUpdate").click(updateBtn);
     

    }

  


    function updateBtn() {

        //Track various aspects of the items required to run application
        var listInfo = { 'sameKeyWords': false,              //True is the results list has the same 'Category' column entries as the the master key word list. If not 'true', app will force user to stop until corrected.
            'masterListKeyWords': null,                      //List of search terms read from master list. 
            'resultsListCategoryColumnKeywords': null,       //List of key words pulled from the 'Category' column in results list
            'masterListName': null,
            'resultsListName': null,
            'pathsListName' : null,                         //List containing the URLs of paths to use and ignore
            'queryPaths' : null,                             //String containing KQL format of paths to use and ignore in query
            'resultsListEntityTypeFullName': null,
            'resultsListElementCount': 0,                   //Item count of results list before new items added
            'resultsListFinalElementCount': 0,              //Item count of results list after new items have been added
            'targetSite': null,                             //Site containing the results list, master list. The appweb when used in an add-in
            'processedResults': [],                         //Array of messages to be displayed to user indicating results of URL processing
            'finalResults' : []                             //Array of messges to be displayed to user indicating status of updates/item creation to results list
        };

       
       
        //Results list name
        listInfo.resultsListName = "ResultsList";

        doLog && console.log('Target list name is', listInfo.resultsListName);

        //Grab app web site in which results list is found
        listInfo.targetSite = _spPageContextInfo.webAbsoluteUrl; //decodeURIComponent(getQueryStringParameter("SPAppWebUrl"));

        //Name of master list containing words to look for
        listInfo.masterListName = "KeyWords"

        //Name of list which contains the paths that the search will use as well as ignore
        listInfo.pathsListName = "Search Paths";

        //Used to string together an HTML enabled message displayed in modal so that user can see what is occuring.
        var modalMessage = "Executing portal search for key words....";

        //Results of 'Category' column update and new item creation in results list
        var listSaveAndUpdatedResults;


        //Get the paths that will be searched
        getURLPathInformation(listInfo.pathsListName,listInfo.targetSite).then(function(data) {

            var kqlPathCriteria = _.reduce(data, function(acc, el) {

                if (acc == "")
                    return (el.doSearch) ? "Path:"+el.path+" " : "-Path:"+el.path+" ";
                else
                   return (el.doSearch) ? acc+"Path:"+el.path+" " : acc+"-Path:"+el.path+" ";
            },"")

            //Add type of items 
            kqlPathCriteria += "contentclass:STS_ListItem";

            listInfo.queryPaths = kqlPathCriteria;
            doLog && console.log('queryPaths are',listInfo.queryPaths);
            
        })

        .then(function(data) {

            doLog && console.log('calling getListEntityTypeName....');
            return getListEntityTypeName(listInfo.resultsListName, listInfo.targetSite)

        })
            
            
        .then(function (data) {
          
                //Save 'Category' entries
                listInfo.resultsListEntityTypeFullName = data ;
               
                //Grab current results list item count prioir to any updates
                return getMasterListKeyWords(listInfo.masterListName, listInfo.targetSite)


        })
       


        .then(function (data) {

          
            listInfo.masterListKeyWords = data;

            doLog && console.log('Master list key words are',  listInfo.masterListKeyWords);

            //Grab list of keywords already set up in results list's 'Category' column 
            return getCurrentListCategoryFields(listInfo.resultsListName, listInfo.targetSite)

                        
        })

       .then(function (data) {

           doLog && console.log('Current master list \'Category\' column entries in ', listInfo.resultsListName, ' are', data);
                      
           //Save 'Category' entries
           listInfo.resultsListCategoryColumnKeywords = data;  
                  
           //Compare lists of key words
           listInfo.sameKeyWords = _.isEqual(listInfo.masterListKeyWords.sort(), listInfo.resultsListCategoryColumnKeywords.sort());
           doLog && console.log('Key words lists are equal:', listInfo.sameKeyWords);
           
           //Grab current results list item count prior to any updates
           return getlistItemCount(listInfo.resultsListName, listInfo.targetSite)

       })

        
        .then(
            function (data) {

                doLog && console.log('List item count is ', data.d.ItemCount);
                listInfo.resultsListElementCount = data.d.ItemCount;

                //Show pop-up with info about current lists and give user the ability to stop application
                return displayApplicationParametersModal("Key Word Search",listInfo,modalMessage);

            }) 
    
        .then(function (data) {

            //Working dialog that shows progression of work in applicaiton i.e. 'Please Wait' dialog
            dialog = data;

            //Prepare endpoint to get current results list items prioir to any updates
           // var existingListDataEndpoint = listInfo.targetSite + "/_api/Web/Lists/GetByTitle('" + listInfo.resultsListName + "')/items?$select=ID,Title,URL,Category&$top=200";
            var existingListDataEndpoint = listInfo.targetSite + "/_api/Web/Lists/GetByTitle('" + listInfo.resultsListName + "')/items?$select=ID,Title,URL,Category,deletionCandidate&$top=200";
            return makeRestCallExisting(existingListDataEndpoint)

        },

           //Either user decided to terminate application voluntarily or word lists don't match so user had no choice but to terminate application using 'Stop' button
            function (data) {
                console.log("updateBtn: promise 1 was rejected with data", data);
                dialog = data;
                return breakChain(3000);
            })

            .then(function (data) {

                 doLog && console.log('data is', data);

                 if (data.length > 0) {

                     //Returns array consisting of all URLs  returned from results list pull
                     //existingURLs = _(data).flatten().map('URL.Url').value();
                     existingURLs = _.map(data, 'URL.Url');

                     //Create object with keys of hash values
                     //var tmp1 = _.chain(data).keyBy('Title').value();
                     var tmp1 = _.keyBy(data, 'Title');


                     //var tmp2 = _.map(tmp1, function (el) { return _.chain(el).extend( {possibleTimeMod: false, inREST:false},el).omit(['__metadata','URL']).value()
                     //});


                     //Create array of properties to use.  URL is returned by SharePoint as an object, so we grab the 'Url' portion of the object and remap to the property named 'URL'
                     //Note that the SharePoint 'ID' REST call brings in both 'Id' and 'ID' - removed 'Id'
                    /* var tmp2 = _.map(tmp1, function (el) {
                         return _.chain(el).extend({ ID: el.ID, possibleTimeMod: false, inREST: false, newURL: el.URL.Url, newCategory: el.Category ? el.Category.results : [] }, el)
                         //       .omit(['__metadata', 'URL']).extend({ URL: el.newURL }).omit(['newURL']).value()
                      .omit(['__metadata', 'URL', 'Category', 'Id']).value()
                     }); */

                  /*   var tmp3 = _.map(tmp2, function (el) {
                         return _.chain(el).extend({ URL: el.newURL, Category: el.newCategory }).value();
                     }); */

                     var tmp4 = _.map(tmp1, function (el) {
                         //return { Title: el.Title, ID: el.ID, possibleTimeMod: false, inREST: false, URL: el.URL.Url, Category: el.Category ? el.Category.results : [] }
                         return { Title: el.Title, ID: el.ID, possibleTimeMod: false, inREST: false, URL: el.URL.Url, deletionCandidate: el.deletionCandidate, Category: el.Category ? el.Category.results : [] }
                     });



                     //parsedListData = _.keyBy(tmp3, 'Title');
                     parsedListData = _.keyBy(tmp4, 'Title');

                     doLog && console.log('Fetch of existing parsed list data is', parsedListData, 'containing ', _.size(parsedListData), 'elements');

                 }
                 //The results list was empty, so create appropriate objects
                 else {
                     parsedListData = {};
                     existingURLs = [];
                 }

                 //Grab the results of a portal search looking for items that contain key words from the master list
                // return getRawSearchResults(listInfo.masterListKeyWords)
                return getRawSearchResults(listInfo.masterListKeyWords, listInfo.queryPaths, listInfo.targetSite)

               
             },
             function (data) {
                 console.log("promise was rejected with data", data);
                 return breakChain();
             })
         

             .then(function (data) {

                 modalMessage+="COMPLETE<br/>Processing results....";
                 updateModalDialogImmediate(modalMessage, SP.UI.ModalDialog.get_childDialog());
                 doLog && console.log('Processing search results with data....', data);
                
                 //Process the data returned by search
                 return processRestData(data, listInfo)
             },
             function (data) {
                 console.log("updateBtn: promise 2 was rejected with data", data);
                 return breakChain();
             })
           
            .then(function (data) {

                doLog && console.log('processRestData returned -', data);
                modalMessage+="COMPLETE<br/><br/>";
                
                //Set up results messages to display the user based on the data returned from 'processRestData'
                listInfo.processedResults.forEach(function (item) {
                    modalMessage += item + "<br/>"
                });

                modalMessage += "<br/>";
                
                buttonInfo = { message: "Press button to continue and save results", label: "Save" };
                                
                return updateModalDialogWithButton(modalMessage,SP.UI.ModalDialog.get_childDialog(),buttonInfo)
                    .then(function () {

                        removeModalDialogButton(SP.UI.ModalDialog.get_childDialog());

                        modalMessage += "Updating list....";
                        updateModalDialogImmediate(modalMessage, SP.UI.ModalDialog.get_childDialog());

                        doLog && console.log('Firing off saveResults');

                        /*Saved these for testing purposes
                            return saveResults(data.slice(0, 4), listInfo.targetSite, listInfo.resultsListName)
                            return saveResults(data, listInfo.targetSite, listInfo.resultsListName)
                            return saveResultsWrapper(data.slice(0, 4), listInfo.targetSite, listInfo.resultsListName, 3);
                        */

                        //Initiate step to save results to list
                        return saveResultsWrapper(data, listInfo.targetSite, listInfo.resultsListName, 200, listInfo.resultsListEntityTypeFullName);
                    })


            },
            function (data) {
                console.log("updateBtn: promise 3 was rejected with data", data);
                return breakChain();
            })



           .then(function (data) {

               listSaveAndUpdatedResults = data;

               modalMessage += "COMPLETE<br/><br/>";

               console.log('Finished processing results');

               buttonInfo = { message: "Press button to finish", label: "Continue" };

               
               //Show user final results of what happened in the application
               return updateModalDialogWithButton(modalMessage, SP.UI.ModalDialog.get_childDialog(),buttonInfo)

           },
           function (data) {
               console.log("updateBtn: promise 3 was rejected with data", data);
               return breakChain();
           })

           //List updates are finished, so show user the results
           .then(function (data) {
                              
               doLog && console.log('updateBtn: Finished processing results');

               return getlistItemCount(listInfo.resultsListName, listInfo.targetSite).then(function (data) {

                   listInfo.resultsListFinalElementCount = data.d.ItemCount;

                   console.log('Results list has ', listInfo.resultsListFinalElementCount, 'items after update');

                   //Close the 'Please Wait' dialog
                   dialog.close(SP.UI.DialogResult.OK);

                   return displayFinalResultsModal("Key Word Processing Results", listInfo, listSaveAndUpdatedResults)

               })


            },
           function (data) {
               console.log("updateBtn: promise 4 was rejected with data", data);
               return breakChain();
           })


           .always(function () {

               dialog.close(SP.UI.DialogResult.OK);
               location.reload();

        
        });


    } //updateBtn



    //Used to reject a promise after a provided delay
    function breakChain(delay) {

        //If delay is empty, set to 1/2 second 
        if (!delay)
            delay = 500;

        var deferred = $.Deferred();

        var timer = setTimeout(function() {return deferred.reject()}, delay)

        return deferred.promise();
    }


    function getURLPathInformation(pathURLList, targetSite) {

        var deferred = $.Deferred();

        var restEndpoint = targetSite + "/_api/Web/Lists/GetByTitle('" + pathURLList + "')/items?$select=URL,IncludeSearchPath";

        makeAjaxGetCall(restEndpoint).then(function (data) {

            doLog && console.log('raw URL path info ', data);

            //Iterate over results parsing out paths and what to do with them in search
            var paths = _.map(data.d.results, function (el) {

                //Put a forward slash on URL. Not essential, but keeps standardization
                if (!/^.+\/$/.test(el.URL.Url))
                    el.URL.Url+="/";
               
                return { path:el.URL.Url, doSearch:el.IncludeSearchPath };
                
            });

            deferred.resolve(paths);

        });

        return deferred.promise();

        

    } //getURLPathInformation




    //Grab list of key words user from master list.  This list is separate from the results list.
    function getMasterListKeyWords(keyWordsListName, targetSite) {

        var deferred = $.Deferred();

        var restEndpoint = targetSite + "/_api/Web/Lists/GetByTitle('" + keyWordsListName + "')/items?$select=Title";

        makeAjaxGetCall(restEndpoint).then(function (data) {

            doLog && console.log('raw key word data is', data);

            var keyWords = _.map(data.d.results, function (el) {
                return el.Title;
            })

            deferred.resolve(keyWords);

        });

        return deferred.promise();

    } //getMasterListKeyWords

    //Get list of items that have been set up in Category column in the results list
    function getCurrentListCategoryFields(resultsListName, site) {

        var deferred = $.Deferred();

        var restEndpoint = site + "/_api/Web/Lists/GetByTitle('" + resultsListName + "')/fields?$filter=EntityPropertyName eq 'Category'";

        doLog && console.log("REST endpoint is", restEndpoint);

        makeAjaxGetCall(restEndpoint).then(function (data) {

            doLog && console.log('getCurrentListCategoryFields: Raw Category object is', data);

            var currentCategories = data.d.results[0].Choices.results;

            deferred.resolve(currentCategories);

        });

        return deferred.promise();

    } //getCurrentListCategoryFields


    function getListEntityTypeName(resultsListName, site) {

        var deferred = $.Deferred();

        var restEndpoint = site + "/_api/Web/Lists/GetByTitle('" + resultsListName + "')";

        doLog && console.log("getListEntityTypeName: REST endpoint is", restEndpoint);

        makeAjaxGetCall(restEndpoint).then(function (data) {

            doLog && console.log('getListEntityTypeName: Return value is:', data);

            var listItemEntityTypeFullName = data.d.ListItemEntityTypeFullName

            deferred.resolve(listItemEntityTypeFullName);

        });

        return deferred.promise();


    } //getListEntityTypeName



  
    //Iterate over all search terms.  On a per search term basis, modify the items returned so that the first position in each item array is the search term
   // function getRawSearchResults(terms, termResults) {
function getRawSearchResults(terms, queryPath, targetSite, termResults ) { 

        var termResults = termResults || [];

        doLog && console.log("Processing term", terms[0]);


        //Get rest data 
      //  return wrapRestNew(200, 0, terms[0]).then(function (data) {
        return wrapRestNew(200, 0, queryPath+" "+terms[0], targetSite).then(function (data) {

            //Grab data in which we are interested from the returned results
            var results = data.map(function (el) { return el.results });

            results = _.flatten(results);

            //Add current search term to each item returned
            results = _.chain(results).map(function (el) { return el.Cells.results }).map(function (el) { el.unshift(terms[0]); return el }).value();

            //Add individual sears
            termResults = termResults.concat(results);

            //Process next search term (if any)
            if (terms.length != 1)
              //  return getRawSearchResults(terms.slice(1), termResults);  //do we need the return
                return getRawSearchResults(terms.slice(1), queryPath, targetSite, termResults);
            else
                return termResults;


        });

    } //getRawSearchResults



    //Returns the count of items in specified list
    function getlistItemCount(resultsListName, targetSite) {

        //REST endpoint to grab current results list item count
        var itemCountEndpoint = targetSite + "/_api/Web/Lists/GetByTitle('" + resultsListName + "')/ItemCount";

        return makeAjaxGetCall(itemCountEndpoint);

    } //getlistItemCount

        
  
   //Call rest in blocks of 'rowLimit' items. This gets us past the maximum number of items SharePoint can return which is 500.
    function wrapRestNew(rowLimit, startRow, searchTerm, targetSite, allResults) {

        var allResults = allResults || [];
        doLog && console.log('In wrapRestNew with startRow', startRow, 'and search term', searchTerm);
        return makeRestCallNew(startRow, rowLimit, searchTerm, targetSite).then(function (data) {
            var relevantResults = data.d.query.PrimaryQueryResult.RelevantResults;
            allResults = allResults.concat(relevantResults.Table.Rows);
            if (relevantResults.TotalRowsIncludingDuplicates > startRow + relevantResults.RowCount) {
                return wrapRestNew(rowLimit, startRow + relevantResults.RowCount, searchTerm, targetSite, allResults);
            }
            return allResults;
        });

    } //wrapRestNew



 //Make actual rest call to grab items that match 'searchTerm'
  function makeRestCallNew(startRow, rowLimit, searchTerm, targetSite) {

     // var targetSite = ctx.HttpRoot;

      doLog && console.log("makeRestCallNew: Starting...");
     /* var restEndpoint = targetSite + "/_api/search/query?sourceid='8b51d032-e661-41f6-928d-da3cdb0a0e74'&startRow=" + startRow + "&rowlimit=" + rowLimit +
                                      "&trimduplicates=false&querytext='\"" + searchTerm + "\"'"; */

    var restEndpoint = targetSite + "/_api/search/query?startRow=" + startRow + "&rowlimit=" + rowLimit +
                                  "&trimduplicates=false&querytext='" + searchTerm + "'";  


      doLog && console.log('makeRestCallNew: rest endpoint is', restEndpoint);
      doLog && console.log('makeRestCallNew: making ajax call in makeRestCall');

      return $.ajax({
          //     url: "https://site/hq/j6/j67sandbox/testsearch/_api/search/query?sourceid='75e8c27f-a1f2-4135-bfe0-2820fb4c27e1'&rowlimit=1000",
          //  url: "https://site/hq/j6/j67sandbox/testsearch/_api/search/query?sourceid='75e8c27f-a1f2-4135-bfe0-2820fb4c27e1'&$top=1000",

          //worked but did not return duplicates
          // url: "https://site/hq/j6/j67sandbox/testsearch/_api/search/query?sourceid='75e8c27f-a1f2-4135-bfe0-2820fb4c27e1'&startRow="+startRow+"&rowlimit="+rowLimit,
          // url: "https://site/hq/j6/j67sandbox/testsearch/_api/search/query?sourceid='75e8c27f-a1f2-4135-bfe0-2820fb4c27e1'&startRow="+startRow+"&rowlimit="+rowLimit +
          //       "&trimduplicates=false&querytext='"+searchTerm+"'",
          url: restEndpoint,


          method: "GET",
          headers: {
              "Content-Type": "application/json;odata=verbose", "Accept": "application/json;odata=verbose"
          }
      });

  } //makeRestCallNew




  
 
 //Grab the items currently in the results list 
  function makeRestCallExisting(restEndpoint,allResults) {

      var allResults = allResults || [];
    
            doLog && console.log('rest endpoint in makeRestCallExisting is', restEndpoint);
          
            return makeAjaxGetCall(restEndpoint).then(function (data) {
                doLog && console.log('data returned from call to makeAjaxGetCall is', data);
                var results = data.d.results;
                allResults = allResults.concat(results);
                if (data.d.__next) 
                    
                    return makeRestCallExisting(data.d.__next,allResults);
                return allResults;

            });

         
} //makeRestCallExisting



function displayWorkingDialog(message) {

    var dialog = SP.UI.ModalDialog.showWaitScreenWithNoClose("Please wait", message, 500, 800);
    
    var dialogTextArea = $(".ms-textXLarge.ms-alignCenter", dialog.get_html())[0];
    $(dialogTextArea).removeClass("ms-alignCenter ms-textXLarge").addClass("ms-textLarge");

    return dialog;
}


function updateModalDialogImmediate(message, dialogNode) {

    console.log('updatemodaldialog: Immediate with message', message);

    // $(".ms-textXLarge.ms-alignCenter", dialogNode.get_html())[0].innerHTML = message;
    $(".ms-textLarge", dialogNode.get_html())[0].innerHTML = message;

  

}

function updateModalDialog(message, interval, dialogNode) {

    var deferred = $.Deferred();

   console.log('updatemodaldialog: with message', message, 'and interval',interval);

    //  $(".ms-textXLarge.ms-alignCenter", dialogNode.get_html())[0].innerHTML = message;
   $(".ms-textLarge", dialogNode.get_html())[0].innerHTML = message;
   
    var timeoutID = setTimeout(function () { console.log('updatemodaldialog: timer expired'); return deferred.resolve(); }, interval);
   
   return deferred.promise();
    
}

function updateModalDialogWithButton(message, dialogNode, buttonInfo) {

    var deferred = $.Deferred();

    var btnDiv = document.createElement('div');
    btnDiv.setAttribute("id", "btnContainer");
    //  btnDiv.innerText = buttonInfo.message;
    btnDiv.innerHTML = buttonInfo.message;

    //Container to which button will be added
    var divBtnContainer = document.createElement('div');
    divBtnContainer.setAttribute("id", "buttonContainer");


    //Button definition
    var btnContinue = document.createElement('button');
    btnContinue.innerHTML = buttonInfo.label;
    btnContinue.setAttribute("id", "btnContinue");
    $(btnContinue).click(function () { return deferred.resolve(); });

    divBtnContainer.appendChild(btnContinue);
    btnDiv.appendChild(divBtnContainer);

    doLog && console.log('updateModalDialogWithButton: with message', message);


    //Parent div for all modal contents
    var dialogDiv = $(".ms-textLarge", dialogNode.get_html())[0];

    dialogDiv.innerHTML = message;
    dialogDiv.appendChild(btnDiv);
  

    return deferred.promise();

}


function removeModalDialogButton(dialogNode) {

    var parentNode = dialogNode.get_html();

    var targetNode = $("#btnContainer", parentNode)[0];
     
    $(targetNode).remove();
}


//Display the results after all processing and item saves/updates
function displayFinalResultsModal(modalTitle, listInfo, saveResults) {

    var deferred = $.Deferred();

    var resultsListSite = listInfo.targetSite;
    var resultsListName = listInfo.resultsListName;
    

    //Create close button which will close the modal
    var btnClose = document.createElement('button');
    btnClose.innerHTML = "Finish";
    btnClose.setAttribute("id", "btnClose");
    $(btnClose).click(function () { SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.OK, "App is finished") });

    //Container to which buttons will be added
    var divBtnContainer = document.createElement('div');
    divBtnContainer.setAttribute("id", "buttonContainer");
    
    //Create container to hold contents of the modal
    var divContainer = document.createElement('div');
    divContainer.setAttribute("id", "modalContainer");
    $(divContainer).addClass("ms-textLarge");

    $('<div>', { text: "Results list name: " + resultsListSite + "/" + resultsListName }).appendTo(divContainer);

    listInfo.finalResults.forEach(function (message) {
        $('<div>', { html: message+"<br/>" }).appendTo(divContainer);
    });

    if (saveResults.categoryUpdatedAttempts != 0)
        $('<div>', { html: "<br/>Attempted to update 'Category' field for " + saveResults.categoryUpdatedAttempts + " URL(s) with " + saveResults.categoryUpdatedCount + " successful updates." }).appendTo(divContainer);

    if (saveResults.itemsCreatedAttempts != 0)
        $('<div>', { html: "Attempted to add " + saveResults.itemsCreatedAttempts + " URL(s) to the list. Successfully added " + saveResults.itemsCreatedCount + " items.<br/>" }).appendTo(divContainer);

    if (saveResults.urlMarkedforDeletionAttempts != 0)
        $('<div>', { html: "Attempted to mark " + saveResults.urlMarkedforDeletionAttempts + " URL(s) for deletion. Successfully marked " + saveResults.urlMarkedforDeletionCount + " items for deletion.<br/>" }).appendTo(divContainer);

    $('<div>', { html: "Results list URL count after after updates/additions is " + listInfo.resultsListFinalElementCount +".<br/>" }).appendTo(divContainer);

    divBtnContainer.appendChild(btnClose);
    divContainer.appendChild(divBtnContainer);
    
   
    var modalOptions = {

        width: 800,
        height: 500,
        title: modalTitle,
        html: divContainer,
        dialogReturnValueCallback: function (dialogResult, retValue) {
            console.log("displayFinalResultsModal: closing modal returned dialogResult: ", dialogResult, "and retValue'", retValue, "'");
            return deferred.resolve(retValue);
  
        }

    };

    SP.SOD.execute('sp.ui.dialog.js', 'SP.UI.ModalDialog.showModalDialog', modalOptions);

    return deferred.promise();


} //displayFinalResultsModal


//Provide the user a modal showing basic information on lists, list counts, etc. to be used in the application
 function displayApplicationParametersModal(modalTitle, listInfo , modalMessage) {

     var deferred = $.Deferred();

     var currentSite = listInfo.targetSite;
     var listsAreEqual = listInfo.sameKeyWords;

     var resultsListName = listInfo.resultsListName;
     var resultsListElementCount = listInfo.resultsListElementCount;
     var resultsListKeyWords = listInfo.resultsListCategoryColumnKeywords;

     var masterListName = listInfo.masterListName;
     var masterListKeyWords = listInfo.masterListKeyWords;



     //Create modal buttons 
     var btnContinue = document.createElement('button');
     btnContinue.innerHTML = "Continue";
     btnContinue.setAttribute("id", "btnContinue");
     $(btnContinue).click(continueApplication);

     var btnStop = document.createElement('button');
     btnStop.innerHTML = "Close";
     btnStop.setAttribute("id", "btnStop");
     $(btnStop).click(stopApplication);

     //Container to which buttons will be added
     var divBtnContainer = document.createElement('div');
     divBtnContainer.setAttribute("id", "buttonContainer");



     //Create container to hold contents of the modal
     var divContainer = document.createElement('div');
     divContainer.setAttribute("id", "modalContainer");
     $(divContainer).addClass("ms-textLarge");



     var divResultsListName = $('<div>', { text: "Results list for URL analysis: '" + currentSite + "/" + resultsListName + "'" }).appendTo(divContainer);
     $('<div>', { html: "Master key word list: '" + currentSite + "/" + masterListName + "'" }).appendTo(divContainer);
     $('<div>', { html: "Results list currently contains " + resultsListElementCount + " URL entries. <br/><br/>" }).appendTo(divContainer);


     $('<div>', { html: "Results list \'Category\' column entries => " + resultsListKeyWords + "<br/><br/>" }).appendTo(divContainer);
     $('<div>', { html: "Master key word list entries => " + masterListKeyWords + "<br/><br/>" }).appendTo(divContainer);




     //Alert use that the master key words list and what the 'Category' column offers for choices are not equal.
     if (!listsAreEqual) {
         $('<div>', { html: "The key words in the master key word list do not match the choices in the 'Category' column in the results list - please correct.<br/><br/>" }).appendTo(divContainer);
         divContainer.appendChild(divBtnContainer);
         divBtnContainer.appendChild(btnStop);
     }
     else {
         $('<div>', { html: "Press 'Close' to terminate the application or 'Continue' to begin URL processing.<br/><br/>" }).appendTo(divContainer);
         divContainer.appendChild(divBtnContainer);
         divBtnContainer.appendChild(btnStop);
         divBtnContainer.appendChild(btnContinue);
     }




     var modalOptions = {

         width: 800,
         height: 500,
         title: modalTitle,
         html: divContainer,
         dialogReturnValueCallback: function (dialogResult, retValue) {
             console.log("modalOptions: closing modal returned dialogResult: ", dialogResult, "and retValue'", retValue, "'");

             var dialog;

             if (dialogResult == SP.UI.DialogResult.cancel) {
                 dialog = displayWorkingDialog("Terminating application....");
                 return deferred.reject(dialog);
             }
             else {
                 dialog = displayWorkingDialog(modalMessage);
                 return deferred.resolve(dialog);
             }

         }

     };

     SP.SOD.execute('sp.ui.dialog.js', 'SP.UI.ModalDialog.showModalDialog', modalOptions);

     return deferred.promise();


     function stopApplication() {

         doLog && console.log("stopApplication: Executing stopApplication");
         SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.cancel, "Stop button pressed");
     }



     function continueApplication() {
         doLog && console.log("continueApplication: Executing continueApplication");
         SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.OK, "Continue button pressed");
     }




} //displayApplicationParametersModal




function processRestData(data,listInfo) {

 //   var x = 0;

    //Number of items in results list prioir to any updates/saves
    var initialResultsListCount = listInfo.resultsListElementCount;

    //Count of URLs returned from the search that exceed 255 characters.
    var urlTooLong = 0;

    //Processed REST pull data to be analyzes
    var results = data;

    doLog && console.log('Total number of search results to be processed: ', results.length);

    var deferred = $.Deferred();

    doLog && console.log('In processRestData..');
    

    //Iterate over all items returned from the REST search call
    $.each(results, function (index, el) {

        var searchTerm = el.shift();

        //Item URL
        //var path = el.Cells.results[6].Value;  SP 2013
        var path = el[6].Value;

        //Item is of document type
        //var isDocument = el.Cells.results[29].Value; SP 2013
        var isDocument = el[30].Value;

        //Item last modified time
        //var lastModifiedTime = el.Cells.results[30].Value; SP 2013
        var lastModifiedTime = el[9].Value;

        //String upon which to create our hash
        var toHash = path + lastModifiedTime;
               
        var hash = md5(toHash);
        
        //Made this an always true comparison to allow for easy troubleshooting
        //  if (index > -1) {
        if (index < results.length) {

            var urlExists = false;

            doLog && console.log('processRestData: Determining existence of following item:', 'Element path is ', path, 'IsDocument: ', isDocument, 'Last modified time', lastModifiedTime, 'MD5 hash:', hash);

            /* If the REST hash doesn't exist in the results list array (i.e. this REST item has already been found and saved), then the REST item might be a new item.
            * Note that due to the search criteria, a URL-timeMod combination can return more than one result so we need to address those.  
            * This case is added to parsedListData below so it could appear again and need to address.
            * This is handled through parsedListData[hash]['possibleModTime']
            */
            if (!parsedListData[hash] || parsedListData[hash]['possibleTimeMod']) {

                //Check if the REST URL already exists in the results list.  If so, the modifiedTime most likely changed, among various scenarios.
                if (existingURLs.indexOf(path) != -1) {

                    urlExists = true;

                    doLog && console.log('processRestData: URL', path, 'found in REST pull already exists in results list. The REST pull URL has hash value', hash, 'Category', searchTerm, ' and has modification time of', lastModifiedTime);

                    //Add the item to the parsedList data for future use. Note the 'possibleTimeMod' property

                    //Take care of the same computed hash calculated from the REST pull  under various search terms. E.g - pull return same URL+timeMod for search on 'green' and 'red'
                    if (!parsedListData[hash])
                        parsedListData[hash] = { 'Title': hash, 'URL': path, 'possibleTimeMod': true, 'Category': [searchTerm], 'ItemLastModified': lastModifiedTime, 'IsDocument': isDocument };
                    else
                        parsedListData[hash].Category.push(searchTerm);

                    //Add the item to the parsedList data for future use. Note the 'possibleTimeMod' property   
                    //parsedListData[hash] = { 'Title': hash, 'URL': path, 'possibleTimeMod': true };

                }

                    //We have  brand new REST result that should be saved  - URL is not in the results
                else {

                    //Grab URLs that have length greater than 255 characters, to inlcude spaces.  These cause an error whern attempting to save into list.
                    if (path.length > 255) {
                     //   console.error('The URL', path, 'exceeds 255 characters and will be skipped');
                        console.error('The URL', path, 'exceeds 255 characters and will be skipped');
                        urlTooLong++;
                    }
                    else {

                        //This is a brand new URL that does not exist in reults list.
                        if (!urlExists) {
                            doLog && console.log('The url', path, 'does not exist so adding item with hash', hash, 'and modification time', lastModifiedTime);
                            parsedListData[hash] = { 'Title': hash, 'URL': path, 'newItem': true, 'Category': [searchTerm], 'ItemLastModified': lastModifiedTime, 'IsDocument': isDocument };

                        } //if

                      
                    } //else

                } //else


            } //if

                //The REST pull data matches an item in the results list, so set corresponding property. 
                //Check to see if the list of search terms needs to be updated
            else {

                //If not a new item, then item already exists in the results list. If a 'newItem' (URL does not exist in results list) , then this is the second occurence of this URL
                if (!parsedListData[hash]['newItem']) {

                    parsedListData[hash]['inREST'] = true;

                    //Determine if searchTerm associated with REST result is currently in the results list, if not update add it.
                    //What happens if a term is already in the list?  This code should only be executed once and never again on future invocation.
                    //This is because parsedListData does not change.  Verify this****
                    if (parsedListData[hash].Category.indexOf(searchTerm) == -1) {
                        parsedListData[hash].Category.push(searchTerm);

                        //Set flag that the item Category should be updated
                        parsedListData[hash]['updateCategory'] = true;

                    } //if

                } //if

                    //New item that has already been encountered using another searchTerm, so add the searchTerm
                else
                    parsedListData[hash].Category.push(searchTerm);

        
            } //else

        }

    }); //each

       
    //Gather result metrics

    /*These are URLs found in the REST results that generate a different hash than an exisiting URL already in results list.  
    * This is indicative of a modification time change and these items need to be saved as separate items in the results list
    */
    var duplicateURLCount = _.filter(parsedListData, 'possibleTimeMod').length;
    
    /*Grab count of items in results list that hashed to an item in the REST pull.  Eseentially the results list item hash matches what the REST pull hash for that item. 
    * No action needs to be taken for these results.
    */
    var listUrlsInRestPullCount = _.filter(parsedListData, ['inREST', true]).length;

    /* Grab count of items in list that did not hash to an item in the REST pull.  
    *  This means that the item either no longer exists in SharePoint(via REST pull) or modified time has changed which would affect hash.
    *  Ignore items having deletionCandidate = true as these have been analyzed in a previous invocation of the app
    */
    //var listUrlsNotInRestPullCount = _.filter(parsedListData, ['inREST', false]).length;
    var listUrlsNotInRestPullCount = _.filter(parsedListData, function (el) {
        return (el.inREST == false && !el.deletionCandidate);
    }).length;

    //URLs in results list that have previously been identified as no longer valid since the URLs either no longer exist in SharePoint or the same URL
    //with a newser time stamp was found.
    var listUrlsAlreadyMarkedForDeletion = _.filter(parsedListData, function (el) {
        return (el.deletionCandidate);
    }).length;

    /* Count of URLs found in search but not currently in results list
     * These are new URLs.
     */
    var urlsInPullNotInListCount = _.filter(parsedListData, ['newItem', true]).length;
    
    /* The count of existing items that need to have the category updated.  
     *This should be 0, as the category feature was added after the initial results list was populated. 
     */
    var listUrlsToUpdateCategoryCount = _.filter(parsedListData, ['updateCategory', true]).length;
    
    //Print a listing of all URLs in the results list not found in the REST PULL
    doLog && console.warn("URLs in the search results list that were not found in the current REST pull:");
    _.filter(parsedListData, function (el) {
        if (el.inREST == false)
            doLog && console.warn(el.URL)
    });


    //Grab all of the items that needed to be updated or added or marked for deletion to the results list
    var itemsToUpdate = _.filter(parsedListData, function (el) {
        // return (el.updateCategory || el.possibleTimeMod || el.newItem || (el.inREST == false) )

        /*
        * (el.inREST == false && el.deletionCandidate == 'false') 
        *  Rational is that we want to remove any items currently with deletionCandidate 'true' from itemsToUpdate because otherwise
        *  the field will be set to 'true' again.
        */
        return (el.updateCategory || el.possibleTimeMod || el.newItem || (el.inREST == false && el.deletionCandidate == false))

    });

    var itemsToUpdateCount = itemsToUpdate.length;


    //Print out the results of the app
    console.log('COMPLETE processRestData: Finished analyzing ', results.length, 'items from the REST pull.');
    listInfo.processedResults.push("Portal search found " + results.length + " items containing at least one key word.");
    listInfo.finalResults.push("Analyzed " + results.length + " items found in search.");

    console.log('COMPLETE processRestData: Initial and final counts of entries in list \'parsedListData\' are', initialResultsListCount, 'and', _.size(parsedListData), 'respectively');
    listInfo.processedResults.push("Results list currently has " + initialResultsListCount + " URL entries prior to any updates.");
    listInfo.finalResults.push("Results list had " + initialResultsListCount + " URLs before update.");

    console.log('COMPLETE processRestData: Found ' + urlsInPullNotInListCount + ' in REST pull that are not in results list.  These will be added to results list');
    listInfo.processedResults.push("Found " + urlsInPullNotInListCount + " URLs in search results that do not exist in results list - these will be added to list.");
    listInfo.finalResults.push("There were " + urlsInPullNotInListCount + " URLs in search results that did not exist in results list.");

    console.log('COMPLETE processRestData: There are', duplicateURLCount, 'URLs that were found with different last modified timestamp in the REST pull and already existed in the results list.  These findings are generally due to item\'s last modification date changing');
    listInfo.processedResults.push("Found " + duplicateURLCount + " URLs in search results that already exist in the results list but timestamp has changed - these will be added to list.");
    listInfo.finalResults.push("There were " + duplicateURLCount + " URLs found in search results already existing in results list but timestamp has changed.");

    console.log('COMPLETE processRestData: There are', listUrlsInRestPullCount, 'URLs that were found in the REST pull and had a matching last modification timestamp. No action taken on these as they are current in the results list.');
    listInfo.processedResults.push('There are ' + listUrlsInRestPullCount + ' URLs that were found in the portal search which had 100% match to a URL in results list - no action required.');


    console.log('COMPLETE processRestData: There are', listUrlsNotInRestPullCount, " URLs that are in results list, but not found in search - these will be marked as 'Deletion Candidate' in results list.");
    listInfo.processedResults.push('There are ' + listUrlsNotInRestPullCount + " URLs that are in results list but were either not found in the search or the same URL was found with a newer timestamp - these will be marked as 'Deletion Candidate' in results list.");
    listInfo.finalResults.push("There were " + listUrlsNotInRestPullCount + " URLs that were to be marked 'Deletion Candidate' in the results list.");

    console.log('COMPLETE processRestData: There are', listUrlsAlreadyMarkedForDeletion, " URLs in the results list that were previously marked as 'Deletion Candidate' from a previous iteration of the Key Word App.  No action taken on these items.");
    listInfo.processedResults.push('There are ' + listUrlsAlreadyMarkedForDeletion + " URLs that are in results list that were previously marked as 'Deletion Candidate' from a previous iteration of the Key Word App.  No action taken on these items.");
    listInfo.finalResults.push("There were " + listUrlsAlreadyMarkedForDeletion + " URLs that were previously marked 'Deletion Candidate' in the results list. No action taken on these items.");

    console.log('COMPLETE processRestData: There are', listUrlsToUpdateCategoryCount, 'URLs for which the Category field needs to be updated.  This should generally be \'0\'');
    listInfo.processedResults.push("There are " + listUrlsToUpdateCategoryCount + " URLs for which the 'Category' column needs to be updated.");
    listInfo.finalResults.push("There were " + listUrlsToUpdateCategoryCount + " URLs for which the 'Category' column was to be updated");

    console.log('COMPLETE processRestData: There are', itemsToUpdateCount, 'items which will be either updated or added to the results list');

    /* Somewhat clunky, but used to allow the deferred.promise() to be called before resolve
     * This was done after a refactoring of code. We want the caller of the function processRestData to wait until
     * processRestData is complete.
     */
    setTimeout(function () {
           deferred.resolve(itemsToUpdate);
    },500); 


    return deferred.promise();


} //processRestData


/*Breaks up calls to 'saveResults' based on number of items in 'parsedDataArray'.  This is needed as testing indicated that 'saveResults' caused stack space
 * to be completely consumed when 'parsedDataArray' had a sufficent number of elements and 'saveResults' was provided with the entire contents of 'parsedDataArray'
 * parsedDataArray - contains all items to be added or updated
 * site - URL of site where results list is
 * resultsList - name of results list
 * itemProcessingLimit - integer value that will determine the number of items in 'parsedDataArray' passed to the function 'saveResults' at one time
 * listItemEntityTypeFullName - SP.Data.EntityTypeName
 * saveCounts - JSON object tracking the resullts of list modifications
*/
function saveResultsWrapper(parsedDataArray, site, resultsList, itemProcessingLimit, listItemEntityTypeFullName, saveCounts) {

    var saveCounts = saveCounts || { "itemsCreatedAttempts": 0, "itemsCreatedCount": 0, "categoryUpdatedAttempts": 0, "categoryUpdatedCount": 0, "urlMarkedforDeletionAttempts": 0, "urlMarkedforDeletionCount": 0 };
  
    //No items to process
    if (parsedDataArray.length == 0)
        return saveCounts;

    //Number of items to process is greater than itemProcessingLimit, so the next call will have at least one item to process
    else if (parsedDataArray.length > itemProcessingLimit)

        return saveResults(parsedDataArray.slice(0, itemProcessingLimit), site, resultsList, listItemEntityTypeFullName, saveCounts ).then(function (data) {
            console.log("saveResultsWrapper: completed saving " + itemProcessingLimit + " items");
            return saveResultsWrapper(parsedDataArray.slice(itemProcessingLimit), site, resultsList, itemProcessingLimit, listItemEntityTypeFullName, saveCounts)

        });

    //Number of items to process is equal to or less than the itemProcessingLimit, so this is the last call
    else

        return saveResults(parsedDataArray.slice(0), site, resultsList, listItemEntityTypeFullName, saveCounts).then(function (data) {
            console.log("saveResultsWrapper: completed saving " + parsedDataArray.length + " items");
            return saveResultsWrapper([], site, resultsList, itemProcessingLimit, listItemEntityTypeFullName, saveCounts)

        });


} //saveResultsWrapper




/*
 * parsedDataArray - contains all analyzed data
 * site - SharePoint site containing the results list
 * listItemEntityTypeFullName - SP.Data.EntityTypeFullName
 * saveCounts - object containing the number of attempts to save items created and items updated and the actual success numbers of saves
 */
function saveResults(parsedDataArray, site, resultsList, listItemEntityTypeFullName, saveCounts  ) {

    if (parsedDataArray.length > 0) {

        var item = parsedDataArray.shift();

        doLog && console.log('saveResults: Examining item', item);

        //Mark item for possible deletion
        if (item.inREST == false) {
            saveCounts.urlMarkedforDeletionAttempts++;
            return markItemForDeletion(item.ID, site, resultsList, listItemEntityTypeFullName).then(function (data) {
                 console.log('saveResults:Finished marking item for deletion', item.ID);
                saveCounts.urlMarkedforDeletionCount++;
                return saveResults(parsedDataArray, site, resultsList, listItemEntityTypeFullName, saveCounts )
            },
            function (data) {
               console.error('saveResults: Unable to mark item for item', item, "for deletion. Update call returned", data);
               return saveResults(parsedDataArray, site, resultsList, listItemEntityTypeFullName, saveCounts )
            });

        }

        if (item.updateCategory) {
            saveCounts.categoryUpdatedAttempts++;
            return updateCategoryColumn(item.ID, item.Category, site, resultsList, listItemEntityTypeFullName).then(function (data) {
                console.log('saveResults:Finished updating Category for item with ID', item.ID);
                saveCounts.categoryUpdatedCount++;
                return saveResults(parsedDataArray, site, resultsList, listItemEntityTypeFullName, saveCounts )
            },
            function (data) {
               console.error('saveResults: Unable to update category of item', item, "Update call returned", data);
               return saveResults(parsedDataArray, site, resultsList, listItemEntityTypeFullName, saveCounts)
            });
        }
        else if (item.possibleTimeMod || item.newItem) {
            saveCounts.itemsCreatedAttempts++
            return createListItem({ "Title": item.Title, "ItemLastModified": item.ItemLastModified, "IsDocument": item.IsDocument, "URL": item.URL, "Category": item.Category }, site, resultsList, listItemEntityTypeFullName).then(function (data) {
                console.log('saveResults:Finished adding item with URL', item.URL);
                saveCounts.itemsCreatedCount++;
                saveResults(parsedDataArray, site, resultsList, listItemEntityTypeFullName, saveCounts);
            },
            function (data) {
                console.error('saveResults: Unable to create item', item, "Save call returned", data);
                return saveResults(parsedDataArray, site, resultsList, listItemEntityTypeFullName, saveCounts)
            });
        }
    }
    else
        return saveCounts;

} //saveResults
    
    

/* Update a 'Category' column in the results list for an existing item
 * List ID of item to be updated
 * categories: array of values to assign the Categories field
 * site: SharePoint site containing the list to update
 * resultsList: name of list to update
 * listItemEntityTypeFullName: SP.Data.EntityFullName
 */ 
function updateCategoryColumn(ID, categories, site, resultsList, listItemEntityTypeFullName) {

    doLog && console.log("updateCategoryColumn: Id", ID, "; Categories", categories, "; site ", site, " ; resultsList", resultsList);

 /*  var reqBody = JSON.stringify({
        '__metadata': { 'type': 'SP.Data.SearchResultsListItem' },
        'Category': { '__metadata': { 'type': 'Collection(Edm.String)' }, 'results': categories }

    }); */

    var reqBody = JSON.stringify({
        '__metadata': { 'type': listItemEntityTypeFullName },
        'Category': { '__metadata': { 'type': 'Collection(Edm.String)' }, 'results': categories }

    });


    var restEndpoint = site + "/_api/Web/Lists/GetByTitle('" + resultsList + "')/items(" + ID + ")";

    doLog && console.log('updateCategoryColumn: calling ajax with restEndpoint', restEndpoint);

    return $.ajax({
        url: restEndpoint,
        type: "POST",
        data: reqBody,
        headers: {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            //   "content-length": reqBody.length,
            "IF-MATCH": "*",
            "X-HTTP-Method": "MERGE"
        }
    })
   .done(function (data) {
        doLog && console.log('updateCategoryColumn: success updating item with list ID', ID);
   })
   .fail(function (data) {
       doLog && console.log('updateCategoryColumn: failure updating item with list ID', ID, 'with message', data);
   });


} //updateCategoryColumn


//Mark an exiting item for deltion using the 'deletionCandidate' column of the results list
function markItemForDeletion(ID, site, resultsList, listItemEntityTypeFullName) {
  
    doLog && console.log("markItemForDeletion: Id", ID, "; site ", site, " ; resultsList", resultsList);

 /*   var reqBody = JSON.stringify({
        '__metadata': { 'type': 'SP.Data.SearchResultsListItem' },
        'deletionCandidate': "true"
   
    }); */

    var reqBody = JSON.stringify({
        '__metadata': { 'type': listItemEntityTypeFullName },
        'deletionCandidate': "true"

    });



    var restEndpoint = site + "/_api/Web/Lists/GetByTitle('" + resultsList + "')/items(" + ID + ")";

    doLog && console.log('updateCategoryColumn: calling ajax with restEndpoint',restEndpoint);

    return $.ajax({
        url: restEndpoint,
        type: "POST",
        data: reqBody,
        headers: {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "IF-MATCH": "*",
            "X-HTTP-Method": "MERGE"
        }
    })
   .done(function (data) {
      doLog && console.log('markItemForDeletion: success updating item with list ID', ID);
   })
   .fail(function (data) {
       doLog && console.log('markItemForDeletion: failure updating item with list ID', ID, 'with message', data);
   });


} //markItemForDeletion



//Create a list item in the results list
function createListItem(itemProperties, site, resultsList, listItemEntityTypeFullName) {

    /*
    var body = JSON.stringify({
        '__metadata': { 'type': 'SP.Data.ACCMSearchResultsListItem' },
        'Title': itemProperties.Title,
        'ItemLastModified': itemProperties.ItemLastModified,
        'IsDocument': itemProperties.IsDocument,
        'URL': {
            '__metadata': { 'type': 'SP.FieldUrlValue' },
            'Description': itemProperties.URL,
            'Url': itemProperties.URL
        },
        'Category': { '__metadata': { 'type': 'Collection(Edm.String)' }, 'results': itemProperties.Category }
    }); 

  /*  var body = JSON.stringify({
        '__metadata': { 'type': listItemEntityTypeFullName },
        'Title': itemProperties.Title,
        'ItemLastModified': itemProperties.ItemLastModified,
        'IsDocument': itemProperties.IsDocument,
        'URL': {
            '__metadata': { 'type': 'SP.FieldUrlValue' },
            'Description': itemProperties.URL,
            'Url': itemProperties.URL
        },
        'Category': { '__metadata': { 'type': 'Collection(Edm.String)' }, 'results': itemProperties.Category }
    }); */

    var body = JSON.stringify({
        '__metadata': { 'type': listItemEntityTypeFullName },
        'Title': itemProperties.Title,
        'ItemLastModified': itemProperties.ItemLastModified,
        'IsDocument': itemProperties.IsDocument,
        'URL': {
            '__metadata': { 'type': 'SP.FieldUrlValue' },
            'Description': itemProperties.URL,
            'Url': itemProperties.URL
        },
    'Category': { '__metadata': { 'type': 'Collection(Edm.String)' }, 'results': itemProperties.Category }
    });

    doLog && console.log('createListItem: body is ->', body);
    var restEndpoint = site + "/_api/Web/Lists/GetByTitle('" + resultsList + "')/items";

    return $.ajax({
        url: restEndpoint,
        type: "POST",
        contentType: "application/json;odata=verbose",
        data: body,

        headers: {
            "Accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "content-length": body.length
        }
    })
    .done(function (data) {
        doLog && console.log('createListItem: success saving item', data.d);

    })
    .fail(function (data) {
        doLog && console.log('createListItem: failure saving', data)
    });

} //createListItem

  



    function listPreRender(ctx) {
        doLog && console.log('pre render with ctx', ctx);
        
        for (i = 0; i < ctx.ListSchema.Field.length; i++) {

            ctx.ListSchema.Field[i].DisplayName = ctx.ListSchema.Field[i].DisplayName.replace(/^deletionCandidate$/, "Deletion Candidate");
            ctx.ListSchema.Field[i].DisplayName = ctx.ListSchema.Field[i].DisplayName.replace(/^IsQuarantined$/, "Is Quarantined");
            ctx.ListSchema.Field[i].DisplayName = ctx.ListSchema.Field[i].DisplayName.replace(/^Category$/, "Key Word Category");
            ctx.ListSchema.Field[i].DisplayName = ctx.ListSchema.Field[i].DisplayName.replace(/^IsDocument$/, "Is Document");
            ctx.ListSchema.Field[i].DisplayName = ctx.ListSchema.Field[i].DisplayName.replace(/^ItemLastModified$/, "Date Item Last Modified");
        }
       

    } //listPreRender


    function addClickEvent(ctx,field) {

       return retValue = "<div class='hash'><b>"+ctx.CurrentItem.Title+"</b></div>";


}


function getQueryStringParameter(paramToRetrieve) {
    var params =
        document.URL.split("?")[1].split("&");
    var strParams = "";
    for (var i = 0; i < params.length; i = i + 1) {
        var singleParam = params[i].split("=");
        if (singleParam[0] == paramToRetrieve)
            return singleParam[1];
    }
}

    

    function overrideHeader(ctx) {

        var html = RenderHeaderTemplate(ctx);
        html+="<button id ='btnUpdate' class='getData' type='button'>Test Data</button>";

        return html;
    }

    function formatLastModified(item) {
        return moment(item.CurrentItem.ItemLastModified).format("YYYY-MM-DD HH:mm:ss Z");
    }


    

   
	
    




