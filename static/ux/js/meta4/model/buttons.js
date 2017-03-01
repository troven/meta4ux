define(["underscore", "meta4/ux/ux.core"], function (_, ux) {

    return [
        {
            "id": "crud:create",
            "buttons": [
                {
                    "id": "cancel",
                    "label": "Cancel",
                    "css": "pull-left"
                },
                {
                    "id": "save",
                    "label": "OK",
                    "css": "pull-right"
                }
            ]
        },
        {
            "id": "crud:read",
            "buttons": [
                {
                    "id": "cancel",
                    "label": "Cancel",
                    "css": "pull-left",
                    "goto": "views:home"
                },
                {
                    "id": "create",
                    "label": "Create",
                    "css": "pull-right"
                }
            ]
        },
        {
            "id": "crud:update",
            "buttons": [
                {
                    "id": "cancel",
                    "label": "Cancel",
                    "css": "pull-left"
                },
                {
                    "id": "save",
                    "label": "Save",
                    "css": "pull-right"
                }
            ]
        },
        {
            "id": "crud:nested",
            "buttons": [
                {
                    "id": "cancel",
                    "label": "Cancel",
                    "css": "pull-left"
                }
            ]
        },
        {
            "id": "nested:crud:create",
            "buttons": [
                {
                    "id": "cancel",
                    "label": "Cancel",
                    "css": "pull-left"
                },
                {
                    "id": "save",
                    "label": "OK",
                    "css": "pull-right"
                }
            ]
        },
        {
            "id": "nested:crud:read",
            "buttons": [
                {
                    "id": "create",
                    "label": "New",
                    "css": "pull-right"
                }
            ]
        },
        {
            "id": "nested:crud:update",
            "buttons": [
                {
                    "id": "cancel",
                    "label": "Cancel",
                    "css": "pull-left"
                },
                {
                    "id": "save",
                    "label": "OK",
                    "css": "pull-right"
                }
            ]
        },
        {
            "id": "form:save",
            "buttons": [
                {
                    "id": "cancel",
                    "label": "Cancel",
                    "css": "pull-left"
                },
                {
                    "id": "save",
                    "label": "OK",
                    "css": "pull-right"
                }
            ]
        }
    ]
});
