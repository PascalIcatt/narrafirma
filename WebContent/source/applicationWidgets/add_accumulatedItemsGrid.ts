import kludgeForUseStrict = require("../kludgeForUseStrict");
import PanelBuilder = require("../panelBuilder/PanelBuilder");
import m = require("mithril");

"use strict";

function add_accumulatedItemsGrid(panelBuilder: PanelBuilder, model, fieldSpecification) {
    return m("div", "add_accumulatedItemsGrid UNFINISHED");
    
    // TODO: Fix for Mithril
    /*
    var questionContentPane = panelBuilder.createQuestionContentPaneWithPrompt(fieldSpecification);
    
    var label = panelBuilder.newContentPane({
        // content: translate(id + "::prompt", fieldSpecification.displayPrompt)
        content: "<b>UNFINISHED accumulatedItemsGrid: " + fieldSpecification.id + "</b>"             
    });
    label.placeAt(questionContentPane);
    return label;
    */
}

export = add_accumulatedItemsGrid;
