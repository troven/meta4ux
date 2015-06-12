
define(["jquery", "underscore", "backbone", "marionette", "core", "ux",
    "html_editor", "select2"
],
    function ($, _, Backbone, Marionette, scorpio4, ux) {

	var DEBUG = true

    ux.view.validators = ux.view.validators || {}

    // Validation - move to .fact.?
    ux.view.validators = {
        "required": {
            message: "required",
            fn: function(v) { return v?true:false }
        },
        "email": {
            message: "Invalid email address",
            regexp: /^[\w\-]{1,}([\w\-\+.]{1,1}[\w\-]{1,}){0,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/
        },
        "url": {
            message: "Invalid Web Address",
            regexp: /^(http|https):\/\/(([A-Z0-9][A-Z0-9_\-]*)(\.[A-Z0-9][A-Z0-9_\-]*)+)(:(\d+))?\/?/i
        },
        "number": {
            message: "Not a number",
            regexp: /^[0-9]*\.?[0-9]*?$/
        },
        "currency": {
            message: "Not a currency",
            regexp: /^[0-9]*\.?[0-9]*?$/
        },
        "date": {
        },
        "time": {
        },
        "datetime": {
        }
    }
 	return ux;
})
