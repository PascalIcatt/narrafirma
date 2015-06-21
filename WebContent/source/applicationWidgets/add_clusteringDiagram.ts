import ClusteringDiagram = require("./ClusteringDiagram");
import PanelBuilder = require("../panelBuilder/PanelBuilder");
import m = require("mithril");

"use strict";

function add_clusteringDiagram(panelBuilder: PanelBuilder, model, fieldSpecification) {
    // clustering diagram using a list of 2D objects
    console.log("add_clusteringDiagram", model, fieldSpecification);
    // console.log("clusteringDiagram module", clusteringDiagram);
    
    var diagramName = fieldSpecification.displayConfiguration;
    
    // var questionContentPane = panelBuilder.createQuestionContentPaneWithPrompt(contentPane, fieldSpecification);
    
    // var clusteringDiagram = new ClusteringDiagram(questionContentPane, model, fieldSpecification.id, diagramName, true);
    
    /* TODO: Who should be responsible for updating this data? Is redraw called or is that bypassed as an html component?
    var watcher = model.watch(diagramName, function() {
        // console.log("updating clusteringDiagram for model field change", model, fieldSpecification);
        var newData = model[diagramName];
        clusteringDiagram.updateDiagram(newData);
    });
    
    // Klugde to get the contentPane to free the watcher by calling remove when it is destroyed
    // This would not work if the content pane continued to exist when replacing this component
    contentPane.own(watcher);
    */
    
    // return clusteringDiagram;
    
    return m("div", "Put clustering diagram here");
}

export = add_clusteringDiagram;
