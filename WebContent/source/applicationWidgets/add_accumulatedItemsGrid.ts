import kludgeForUseStrict = require("../kludgeForUseStrict");
import PanelBuilder = require("../panelBuilder/PanelBuilder");
"use strict";

function add_accumulatedItemsGrid(panelBuilder: PanelBuilder, contentPane, model, fieldSpecification) {
    var questionContentPane = panelBuilder.createQuestionContentPaneWithPrompt(contentPane, fieldSpecification);
    
    var label = panelBuilder.newContentPane({
        // content: translate(id + "::prompt", fieldSpecification.displayPrompt)
        content: "<b>UNFINISHED accumulatedItemsGrid: " + fieldSpecification.id + "</b>"             
    });
    label.placeAt(questionContentPane);
    return label;
}

export = add_accumulatedItemsGrid;
