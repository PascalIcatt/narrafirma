import kludgeForUseStrict = require("../../kludgeForUseStrict");
"use strict";

var panel: Panel = {
    id: "panel_addCollectionSessionActivity",
    displayName: "Add story collection session activity",
    displayType: "panel",
    section: "collection",
    modelClass: "CollectionSessionActivity",
    panelFields: [
        {
            id: "order",
            valueType: "string",
            required: true,
            displayType: "text",
            displayName: "Order",
            displayPrompt: "Specify the order in which to do this collection activity (e.g. 1, 2a, 2b, 3)"
        },
        {
            id: "collectionSessionActivity_name",
            valueType: "string",
            required: true,
            displayType: "text",
            displayName: "Name",
            displayPrompt: "Please give this activity a <strong>name</strong>."
        },
        {
            id: "collectionSessionActivity_type",
            valueType: "string",
            valueOptions: [
                "ice-breaker",
                "sharing stories (no task)",
                "sharing stories (simple task)",
                "discussing stories",
                "twice-told stories exercise",
                "timeline exercise",
                "landscape exercise",
                "my own exercise",
                "other"
            ],
            required: true,
            displayType: "select",
            displayName: "Type",
            displayPrompt: "What <strong>type</strong> of activity is this?"
        },
        {
            id: "collectionSessionActivity_plan",
            valueType: "string",
            required: true,
            displayType: "textarea",
            displayName: "Plan",
            displayPrompt: "Describe the <strong>plan</strong> for this activity."
        },
        {
            id: "collectionSessionActivity_optionalParts",
            valueType: "string",
            required: true,
            displayType: "textarea",
            displayName: "Optional elaborations",
            displayPrompt: "Describe any optional <strong>elaborations</strong> you might or might not use in this activity."
        },
        {
            id: "collectionSessionActivity_duration",
            valueType: "string",
            required: true,
            displayType: "text",
            displayName: "Length",
            displayPrompt: "<strong>How long</strong> will this activity take?"
        },
        {
            id: "collectionSessionActivity_recording",
            valueType: "string",
            required: true,
            displayType: "textarea",
            displayName: "Recording",
            displayPrompt: "How will stories be <strong>recorded</strong> during this activity?"
        },
        {
            id: "collectionSessionActivity_materials",
            valueType: "string",
            required: true,
            displayType: "textarea",
            displayName: "Materials",
            displayPrompt: "What <strong>materials</strong> will be needed for this activity?"
        },
        {
            id: "collectionSessionActivity_spaces",
            valueType: "string",
            required: true,
            displayType: "textarea",
            displayName: "Spaces",
            displayPrompt: "What <strong>spaces</strong> will be used for this activity?"
        },
        {
            id: "collectionSessionActivity_facilitation",
            valueType: "string",
            required: true,
            displayType: "textarea",
            displayName: "Facilitation",
            displayPrompt: "What sort of <strong>facilitation</strong> will be necessary for this activity?"
        },
        {
            id: "SPECIAL_templates_storyCollectionActivities",
            valueType: "none",
            displayType: "templateList",
            displayConfiguration: "storyCollectionActivities",
            displayPrompt: "Copy an activity from a template"
        }
    ]
};

export = panel;
