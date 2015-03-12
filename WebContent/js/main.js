require([
    "dojo/i18n!js/nls/applicationMessages",
    "js/panelBuilder/dialogSupport",
    "js/domain",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/hash",
    "dojo/_base/lang",
    "js/applicationWidgets/loadAllApplicationWidgets",
    "js/fieldSpecifications/loadAllFieldSpecifications",
    "js/storage",
    "js/survey",
    "js/panelBuilder/toaster",
    "dojo/topic",
    "js/panelBuilder/translate",
    "js/panelBuilder/PanelBuilder",
    "js/panelBuilder/widgetSupport",
    "dijit/layout/ContentPane",
    "dijit/form/Select",
    "js/panelBuilder/FieldSpecificationCollection",
    "dojo/domReady!"
], function(
    applicationMessages,
    dialogSupport,
    domain,
    domConstruct,
    domStyle,
    hash,
    lang,
    loadAllApplicationWidgets,
    loadAllFieldSpecifications,
    storage,
    survey,
    toaster,
    topic,
    translate,
    PanelBuilder,
    widgetSupport,
    ContentPane,
    Select,
    FieldSpecificationCollection
){
    "use strict";

    // TODO: Add page validation
    // TODO: Add translations for GUI strings used here
    
    var fieldSpecificationCollection = new FieldSpecificationCollection();
    
    // For building panels based on field specifications
    var panelBuilder = new PanelBuilder();

    // For knowing what pages the application support
    var pageSpecifications = {}; 
    
    // For tricking what page the application is on
    var startPage = "page_dashboard";
    var currentSectionID;
    var currentPageID;
    var currentPage;
    
    // Navigation widgets
    var navigationPane;
    var pageNavigationSelect;
    var previousPageButton;
    var nextPageButton;
    var loadLatestButton;
    var loadVersionButton;
    var saveButton;
    var importExportButton;
    
    // The mostly recently loaded project version
    var currentProjectVersionReference; 
    
    function loadLatestClicked(event) {
        console.log("load latest clicked");
                
        // TODO: Check for unsaved data before loading project...
        storage.loadLatestProjectVersion(switchToLoadedProjectData);
    }
    
    function loadVersionClicked(event) {
        console.log("load version clicked");
                
        // TODO: Kludge of loading all stories when load data?
        // domain.buttonFunctions.loadLatestStoriesFromServer();
 
        // TODO: Check for unsaved data before loading project...
        storage.loadAllProjectVersions(loadedProjectVersions);
    }
    
    function loadedProjectVersions(error, versions) {
        console.log("loadedProjectVersions", error, versions);
        if (error) {
            alert("A problem happened when trying to load all the versions of the project:\n" + error);
            return;
        }
        
        console.log("got versions", versions);
        
        versions.sort(function(a, b) {return a.timestamp.localeCompare(b.timestamp);});
        
        // TODO: Translate
        var columns = {timestamp: "Timestamp", committer: "Committer", sha256AndLength: "Reference"};
        dialogSupport.openListChoiceDialog(null, versions, columns, "Project versions", "Load selected version", function (choice) {
            console.log("choice:", choice);
            if (choice) {
                var sha256AndLength = choice.sha256AndLength;
                storage.loadProjectVersion(sha256AndLength, switchToLoadedProjectData);
            }
        });
    }
     
    function switchToLoadedProjectData(error, projectAnswers, envelope) {
        if (error) {
            alert("A problem happened when trying to load the latest version of the project:\n" + error);
            return;
        }
        console.log("loading saved version", projectAnswers);
        var key;
        for (key in projectAnswers) {
            if (projectAnswers.hasOwnProperty(key)) {
                domain.projectData.projectAnswers.set(key, projectAnswers[key]);
            }
        }
        // TODO: A little dangerous to remove stuff, should this be kept?
        var fieldsToRemove = {};
        for (key in domain.projectData.projectAnswers) {
            if (domain.projectData.projectAnswers.hasOwnProperty(key) && !projectAnswers.hasOwnProperty(key)) {
                // Stateful model adds "_watchCallbacks" so don't remove it
                if (!_.startsWith(key, "_")) fieldsToRemove[key] = true;
            }
        }
        for (key in fieldsToRemove) {
            console.log("removing old field/data", key, domain.projectData.projectAnswers.get(key));
            domain.projectData.projectAnswers.set(key, undefined);
        }
        
        // Rebuild the current page to ensure it gets latest data...
        showPage(currentPageID, "forceRefresh");
        
        // Store a reference so can pass it to storage as "previous" for next version to get chain or tree of versions
        currentProjectVersionReference = envelope.__sha256HashAndLength;
        
        // TODO: Translate and improve this feedback
        toaster.toast("Finished loading project data");
        
        /* TODO: !!!!!!!!!!!! Removed for now while testing changeover to field approach !!!!!!!!!!!!!!!
         * 
        // TODO: Kludge of loading all stories when load data?
        console.log("Going to try to load latest stories from server");
        domain.buttonFunctions.loadLatestStoriesFromServer(function (newEnvelopeCount) {
            console.log("Forcing refresh of current page");
            // TODO: KLUDGE: Updating gui a second time so get flicker -- and maybe lose edits?
            if (newEnvelopeCount) showPage(currentPageID, "forceRefresh");
        });
        */
        
        return;
    }
    
    function saveClicked(event) {
        console.log("save clicked", domain.projectData.projectAnswers);
        storage.storeProjectVersion(domain.projectData.projectAnswers, currentProjectVersionReference, saveFinished);
    }
    
    function saveFinished(error, newVersionURI) {
        if (error) {return alert("could not write new version:\n" + error);}
        // TODO: Translate and improve this feedback
        console.log("Save finished to file", newVersionURI);
        currentProjectVersionReference = newVersionURI;
        toaster.toast("Finished saving");
    }
    
    function urlHashFragmentChanged(newHash) {
        console.log("urlHashFragmentChanged", newHash);
        if (currentPageID !== newHash) {
            var pageSpecification = pageSpecifications[newHash];
            if (pageSpecification && pageSpecification.displayType === "page") {
                showPage(newHash);
            } else {
                console.log("unsupported url hash fragment", newHash);
                alert("A page was not found for: " + newHash);
                if (newHash !== startPage) urlHashFragmentChanged(startPage);
            }
        }
    }
    
    function pageNavigationSelectChanged(event) {
        var pageID = event;
        console.log("changing page to:", pageID);
        showPage(pageID);
    }
    
    function showPage(pageID, forceRefresh) {
        if (currentPageID === pageID && !forceRefresh) return;
        
        var pageSpecification = pageSpecifications[pageID];
        if (!pageSpecification) {
            console.log("no such page", pageID);
            alert("No such page: " + pageID);
            return;
        }
        
        // Hide the current page temporarily
        domStyle.set("pageDiv", "display", "none");
        
        if (currentPageID && currentPage) {
            // domStyle.set(currentPageID, "display", "none");
            console.log("destroying", currentPageID, currentPage);
            currentPage.destroyRecursive();
            domConstruct.destroy(currentPage.domNode);
        }
        
        currentPage = createPage(pageID, true);
        
        currentPageID = pageID;
        hash(currentPageID);
        
        previousPageButton.setDisabled(!pageSpecification.previousPageID);
        nextPageButton.setDisabled(!pageSpecification.nextPageID);
        
        // Show the current page again
        domStyle.set("pageDiv", "display", "block");
        
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    
        // Because the page was hidden when created, all the grids need to be resized so grid knows how tall to make header so it is not overwritten
        currentPage.resize();
        
        // Ensure the navigation has the list for this section
        if (currentSectionID !== pageSpecification.section) {   
            currentSectionID = pageSpecification.section;
            var options = pageSelectOptionsForSection(pageSpecification.section);
            pageNavigationSelect.set("options", options);
        }
        
        // Ensure select is pointing to this page; this may trigger an update but it should be ignored as we're already on this page
        pageNavigationSelect.set("value", pageID);
    }
    
    function createPage(pageID, visible) {
        console.log("createPage", pageID);
        
        var pageSpecification = pageSpecifications[pageID];
       
        if (!pageSpecification) {
            console.log("ERROR: No definition for page: ", pageID);
            return;
        }
        
        var pagePane = new ContentPane({
            "id": pageID,
            title: pageSpecification.title,
            // Shorten width so grid scroll bar shows up not clipped
            // Also, looks like nested ContentPanes tend to walk off the right side of the page for some reason
            style: "width: 94%",
            display: "none" // "block" // 
       });
       
       // console.log("about to place pane", pageID);
       // Dojo seems to require these pages be in the visual hierarchy before some components like grid that are added to them are have startUp called.
       // Otherwise the grid header is not sized correctly and will be overwritten by data
       // This is as opposed to what one might think would reduce resizing and redrawing by adding the page only after components are added
       pagePane.placeAt("pageDiv");
       pagePane.startup();
        
       // console.log("Made content pane", pageID);
       
       panelBuilder.buildPanel(pageID, pagePane, domain.projectData.projectAnswers);
       
       if (!pageSpecification.isHeader) {
           var options = ["intentionally skipped", "partially done", "completely finished"];
           var statusEntryID = pageID + "_pageStatus";
           translate.addExtraTranslation(statusEntryID + "::prompt", translate("#dashboard_status_entry::prompt") + " ");
           for (var optionIndex in options) {
               var option = options[optionIndex];
               translate.addExtraTranslation(statusEntryID + "::selection:" + option, translate("#dashboard_status_entry::selection:" + option));
           }
           panelBuilder.addQuestionWidget(pagePane, domain.projectData.projectAnswers, {id: statusEntryID, displayType: "select", dataOptions: options});
       } else {
           console.log("page dashboard as header", pageSpecification.id, pageSpecification.displayType, pageSpecification);
           // Put in dashboard
           var childPageIDs = domain.childPageIDListForHeaderID[pageID];
           console.log("child pages", pageID, childPageIDs);
           if (!childPageIDs) childPageIDs = [];
           for (var childPageIndex = 0; childPageIndex < childPageIDs.length; childPageIndex++) {
               var childPageID = childPageIDs[childPageIndex];
               var statusViewID = childPageID + "_pageStatus_dashboard";
               var childPageSpecification = pageSpecifications[childPageID];
               console.log("childPageID", childPageSpecification, childPageID);
               if (!childPageSpecification) console.log("Error: problem finding page definition for", childPageID);
               if (childPageSpecification && childPageSpecification.displayType === "page") {
                   var prompt = translate(childPageID + "::title", childPageSpecification.displayName) + " " + translate("#dashboard_status_label") + " ";
                   translate.addExtraTranslation(statusViewID + "::prompt", prompt);
                   console.log("about to call panelBuilder to add one questionAnswer for child page's status", childPageID);
                   panelBuilder.addQuestionWidget(pagePane, domain.projectData.projectAnswers, {id: statusViewID, displayType: "questionAnswer", displayConfiguration: [childPageID + "_pageStatus"]});
               }
           }
       }
       
       /*
       var nextPageButtonQuestion = {
           "id": pageID + "_nextPageButton",
           "displayPrompt": "Mark page complete and proceed to next page",
           "displayType": "button"
       };
       
       questionEditor.insertQuestionIntoDiv(nextPageButtonQuestion, pagePane);
       */
       
       // console.log("about to set visibility", pageID);
       if (visible) {
            domStyle.set(pageID, "display", "block");
       } else {
            domStyle.set(pageID, "display", "none");
       }
              
       return pagePane;
    }

    function previousPageClicked(event) {
        // console.log("previousPageClicked", event);
        if (!currentPageID) {
            // Should never get here
            alert("Something wrong with currentPageID");
            return;
        }
        var pageSpecification = pageSpecifications[currentPageID];
        var previousPageID = pageSpecification.previousPageID;
        if (previousPageID) {
            showPage(previousPageID);
        } else {
            // Should never get here based on button enabling
            alert("At first page");
        }
    }
    
    function nextPageClicked(event) {
        // console.log("nextPageClicked", event);
        if (!currentPageID) {
            // Should never get here
            alert("Something wrong with currentPageID");
            return;
        }
        var pageSpecification = pageSpecifications[currentPageID];
        var nextPageID = pageSpecification.nextPageID;
        if (nextPageID) {
            showPage(nextPageID);
        } else {
            // Should never get here based on button enabling
            alert("At last page");
        }
    }

    function wwsButtonClicked() {
        console.log("wwsButtonClicked");
        location.href = "http://www.workingwithstories.org/";
    }
    
    function homeButtonClicked() {
        console.log("homeButtonClicked");
        showPage(startPage);
    }
    
    function debugButtonClicked() {
        console.log("debug domain.projectData", domain.projectData);
    }
    
    function importButtonClicked(projectDefinitionText, hideDialogMethod) {     
        console.log("importButtonClicked", projectDefinitionText);
        
        var updatedProjectAnswers;
        
        try {
            updatedProjectAnswers = JSON.parse(projectDefinitionText);
        } catch(e) {
            alert("Problem parsing project definition text\n" + e);
            return;
        }

        console.log("parsed projectDefinitionText", updatedProjectAnswers);
        
        // TODO: Translate
        dialogSupport.confirm("This will overwrite your current project design.\nAny active survey and any previously stored survey results will remain as-is,\nhowever any new project design might have a different survey design.\nAre you sure you want to replace the current project definition?", function() {

            // TODO: Not sure what to do for what is essentially a new currentProjectVersionReference defined here
            switchToLoadedProjectData(null, updatedProjectAnswers, {__sha256HashAndLength: null});
            
            console.log("Updated OK");
            hideDialogMethod();
        });
    }
        
    function importExportClicked() {
        console.log("importExportClicked");
        var projectDefinitionText = JSON.stringify(domain.projectData.projectAnswers, null, 2);
        dialogSupport.openTextEditorDialog(projectDefinitionText, "#projectImportExportDialog_title", "#projectImportExportDialog_okButtonText", importButtonClicked);
    }
    
    // TODO: somehow unify this with code in widget-questions-table?
    function newSpecialSelect(addToDiv, options) {
        var select = new Select({
            options: options
        });
        select.placeAt(addToDiv);
        return select;
    }
    
    var pageSelectOptions = [];
    
    function pageSelectOptionsForSection(sectionHeaderPageID) {
        console.log("======== pageSelectOptionsForSection", sectionHeaderPageID, domain.childPageIDListForHeaderID);
        var pageIDs = domain.childPageIDListForHeaderID[sectionHeaderPageID];
        var options = [];
        var title = pageSpecifications[sectionHeaderPageID].title;
        options.push({label: title, value: sectionHeaderPageID});
        _.forEach(pageIDs, function (pageID) {
            title = pageSpecifications[pageID].title;
            options.push({label: title, value: pageID});
        });
        return options;
    }
    
    function processAllPanels() {
        var panels = fieldSpecificationCollection.buildListOfPanels();
        console.log("processAllPanels", panels);
        
        var lastPageID = null;
        var lastHeader = null;
        var lastSection = null;
        
        for (var panelIndex = 0; panelIndex < panels.length; panelIndex++) {
            var panel = panels[panelIndex];
            
            // console.log("defining panel", panel.id);
            var title = translate(panel.id + "::title", panel.displayName);
            if (panel.isHeader) {
                title = "<i>" + title + "</i>";
            } else {
                title = "&nbsp;&nbsp;&nbsp;&nbsp;" + title;
            }
            if (panel.displayType !== "page") {
                title += " SPECIAL: " + panel.displayType;
            }
            
            domain.panelDefinitions[panel.id] = panel;      
            
            // For panels that are a "page", add to top level pages choices and set up navigation
            if (panel.displayType === "page") {
                var pageID = panel.id;
                pageSpecifications[pageID] = panel;
                // console.log("pushing page", panel);
                // Make it easy to lookup previous and next pages from a page
                if (lastPageID && !panel.isHeader) pageSpecifications[lastPageID].nextPageID = pageID;
                if (!panel.isHeader) panel.previousPageID = lastPageID;
                lastPageID = pageID;
                
                if (!panel.isHeader) {
                    var list = domain.childPageIDListForHeaderID[lastHeader] || [];
                    list.push(pageID);
                    domain.childPageIDListForHeaderID[lastHeader] = list;
                } else {
                    lastHeader = pageID;
                }
                
                // Looks like Dojo select has a limitation where it can only take strings as values
                // so can't pass page in as value here and need indirect panelDefinitions lookup dictionary
                pageSelectOptions.push({label: title, value: pageID});
                // Put in a dynamic question (incomplete for options) to be used to lookup page status; needed to check it is a select
                domain.questions[panel.id + "_pageStatus"] = {id: pageID + "_pageStatus", displayType: "select"};
            }
            
            // TODO: Should this really be modifying the original???
            panel.title = title;
            panel.questions = fieldSpecificationCollection.buildQuestionsForPanel(panel.id);
            if (panel.section) lastSection = panel.section;
            panel.helpSection = lastSection;
            panel.helpPage = lastPageID;
            panel.section = lastHeader;
        }
        
        var questions = fieldSpecificationCollection.buildListOfQuestions();
        
        // Lump all questions together in domain for use by things like calculating derived values from options for quiz score results
        for (var questionIndex in questions) {
            var question = questions[questionIndex];
            domain.questions[question.id] = question;
        }
        
        // Add default translations for all questions; these can be overriden by local language files which would be searched first
        translate.addExtraTranslationsForQuestions(questions);
        
        var pages = fieldSpecificationCollection.buildListOfPages();
        
        // TODO: These two panels are not in any page
        pages.push(domain.panelDefinitions["panel_addToObservation"]);
        pages.push(domain.panelDefinitions["panel_addToExcerpt"]);
        
        var panelsWithHelp = [];
        pages.forEach(function (page) {
            console.log("page", page, page.id);
            setHelpPageForPanel(page.helpSection, page.id, page.id, panelsWithHelp);
        });
        
    }
    
    // Recursive function
    function setHelpPageForPanel(helpSection, helpPage, panelID, panelsWithHelp) {
        console.log("setHelpPageForPanel", helpSection, helpPage, panelID);
        if (panelsWithHelp.indexOf(panelID) !== -1) return;
        if (!domain.panelDefinitions[panelID]) return console.log("ERROR: Missing panel when generating help for", helpSection, helpPage, panelID);
        // console.log("processing", panelID);
        // TODO: Duplicating these, but should be the same
        domain.panelDefinitions[panelID].helpSection = helpSection;
        domain.panelDefinitions[panelID].helpPage = helpPage;
        
        var fieldSpecs = fieldSpecificationCollection.buildQuestionsForPanel(panelID);
        for (var i = 0; i < fieldSpecs.length; i++) {
            var fieldSpec = fieldSpecs[i];
            // TODO: Modifying original -- should be better way
            fieldSpec.helpSection = helpSection;
            fieldSpec.helpPage = helpPage;
            if (_.isString(fieldSpec.displayConfiguration) && _.startsWith(fieldSpec.displayConfiguration, "panel_")) {
                // console.log("following ", panelID, fieldSpec.id, fieldSpec.displayType);
                setHelpPageForPanel(helpSection, helpPage, fieldSpec.displayConfiguration, panelsWithHelp);
            }
            /*
            if (fieldSpec.displayType === "grid") {
                addNestedPanel(fieldSpec.displayConfiguration);
            }
            */
        }
    }
    
    // Make all of the application pages selectable from the dropdown list and back/next buttons and put them in a TabContainer
    function createLayout() {
        
        console.log("createLayout start");
        
        // Startup needs to be called here to ensure a top level content pane is started
        navigationPane = new ContentPane({}, "navigationDiv");
        navigationPane.startup();
        
        // Any items like buttons added to the navigationPane will have startup() called automatically,
        // since the navigationPane they are being added to has already been started
        
        // var imageButton = widgets.newButton("wwsImageButton", "Working With Stories image button", navigationPane, wwsButtonClicked);
        // imageButton.set("showLabel", false);
        // imageButton.set("iconClass", "wwsButtonImage");
        
        // Document controls
        
        var documentControlsPane = new ContentPane();
        documentControlsPane.placeAt(navigationPane);
        
        saveButton = widgetSupport.newButton(navigationPane, "#button_save", saveClicked);

        loadLatestButton = widgetSupport.newButton(navigationPane, "#button_loadLatest", loadLatestClicked);
        loadVersionButton = widgetSupport.newButton(navigationPane, "#button_loadVersion", loadVersionClicked);

        importExportButton = widgetSupport.newButton(navigationPane, "#button_importExport", importExportClicked);

        var debugButton = widgetSupport.newButton(navigationPane, "#button_debug", debugButtonClicked);
        
        // Page controls
        
        var pageControlsPane = new ContentPane();
        pageControlsPane.placeAt(navigationPane);
        
        var homeButton = widgetSupport.newButton(pageControlsPane, "#button_home", homeButtonClicked);
        homeButton.set("showLabel", false);
        // homeButton.set("iconClass", "dijitEditorIcon dijitEditorIconOutdent");
        homeButton.set("iconClass", "homeButtonImage");

        // TODO: Select width should be determined from contents of select options using font metrics etc.
        pageNavigationSelect = newSpecialSelect(pageControlsPane, []);
        domStyle.set(pageNavigationSelect.domNode, "width", "400px");
        pageNavigationSelect.on("change", pageNavigationSelectChanged);
        
        previousPageButton = widgetSupport.newButton(pageControlsPane, "#button_previousPage", previousPageClicked);
        previousPageButton.set("iconClass", "leftButtonImage");
        
        nextPageButton = widgetSupport.newButton(pageControlsPane, "#button_nextPage", nextPageClicked);
        nextPageButton.set("iconClass", "rightButtonImage");

        // Setup the first page
        var fragment = hash();
        console.log("fragment when page first loaded", fragment);
        if (fragment && fragment !== startPage) {
            urlHashFragmentChanged(fragment);
        } else {
            urlHashFragmentChanged(startPage);
            showPage(startPage);
            currentPageID = startPage;
        }
        
        console.log("createLayout end");
    }
    
    function openSurveyDialog() {
        // TODO: What version of questionnaire should be used? Should it really be the latest one? Or the one active on server?
        console.log("domain.projectData", domain.projectData);
        var questionnaire = domain.getCurrentQuestionnaire();
        
        survey.openSurveyDialog(questionnaire);
    }
    
    function loadedMoreSurveyResults(newEnvelopeCount) {
        if (newEnvelopeCount === 0) {
            // TODO: Translate
            toaster.toast("No new survey results were found.");
        } else {
            // TODO: Translate
            toaster.toast("" + newEnvelopeCount + " new survey result(s) were found.");
        }
    }
    
    function initialize() {
        translate.configure({}, applicationMessages);
        
        // Initialize toaster
        toaster.createToasterWidget("navigationDiv");
        
        loadAllApplicationWidgets(PanelBuilder);
        
        console.log("loadAllFieldSpecifications", loadAllFieldSpecifications);
        // Load the application design
        loadAllFieldSpecifications(fieldSpecificationCollection);
        
        // Setup the domain with the base model defined by field specifications
        domain.setupDomain(fieldSpecificationCollection);

        // Set up callback for requests to open a section
        domain.setOpenSectionCallback(showPage);
        
        // Callback for this button
        // TODO: Temp for testing
        domain.buttonFunctions.enterSurveyResult = openSurveyDialog;
 
        processAllPanels();
        
        // Tell the panelBuilder about the panelSpecifications
        // var questions = fieldSpecificationCollection.buildQuestionsForPanel(panelID);
        panelBuilder.setPanelSpecifications(domain.panelDefinitions);
        
        // Tell the panelBuilder what do do if a button is clicked
        panelBuilder.setButtonClickedCallback(function(panelBuilder, contentPane, model, fieldSpecification, value) {
            domain.buttonClicked(contentPane, model, fieldSpecification, value);
        });
        
        createLayout();
        
        // Update if the URL hash fragment changes
        topic.subscribe("/dojo/hashchange", urlHashFragmentChanged); 
        
        topic.subscribe("loadLatestStoriesFromServer", loadedMoreSurveyResults);
        
        /* TODO: Commented out while testing changeover to fields
        
        // Synchronizes the state of the domain for one status flag with what is on server
        domain.determineStatusOfCurrentQuestionnaire();
        
        // Get the latest project data
        loadLatestClicked();
        */
        
        // turn off initial "please wait" display
        document.getElementById("pleaseWaitDiv").style.display = "none";
    }
    
    initialize();
});