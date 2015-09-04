define(["jquery", "underscore", "backbone", "marionette", "ux",

    "meta4beta/widget/PickList",
    "meta4beta/widget/form/Form", "meta4beta/widget/form/FormFields",
    "meta4beta/widget/form/FormValidate", "meta4beta/widget/form/HTMLEditor"
],
    function ($, _, Backbone, Marionette, ux) {

    ux.view.fields = ux.view.fields || {}
    ux.view.validators = ux.view.validators || {}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Form",
        "label": "Form",
        "comment": "Manage data capture& validation using a collection of fields",
        "mixins": false,
        "views": true,
        "collection": true,
        "options": true,
        "schema": true,

        "fn": ux.view.Form
    }

})

