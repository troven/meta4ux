define(["jquery", "underscore", "backbone", "marionette", "ux", "meta4/widget/form2/FormLayout"],
    function ($, _, Backbone, Marionette, ux, FormLayout) {

    ux.view.fields = ux.view.fields || {}
    ux.view.validators = ux.view.validators || {}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Form",
        "label": "Form",
        "comment": "Manage data capture &amp; validation using a collection of fields",
        "mixins": false,
        "views": true,
        "collection": true,
        "options": true,
        "schema": true,
        "fn": FormLayout
    };

})

