define(["jquery", "underscore", "backbone", "marionette", "ux",

    "meta4beta/view/form/Form", "meta4beta/view/form/FormFields",
    "meta4beta/view/form/FormValidate", "meta4beta/view/form/HTMLEditor"
],
    function ($, _, Backbone, Marionette, ux) {

   ux.meta.Form =  ux.meta["meta4:ux:Form"] = {
        "triggers": [ "invalid", "valid", "commit", "change" ],
        "mixins": false,
        "views": true,
        "collection": true,
        "options": true,
        "schema": true
    }

    ux.view.fields = ux.view.fields || {}
    ux.view.validators = ux.view.validators || {}

 	return ux;
})

