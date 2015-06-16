
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
        "sanitize": {
            message: "Only Alpha/Numeric and _-",
            pattern: /^\w+$/
        },
        "friendly": {
            message: "Invalid punctuation",
            pattern: /^[\w\.\']{2,}([\s][\w\.\']{2,})+$/
        },
        "username": {
            message: "Not a valid username",
            pattern: /^[\w\d\_\.]{4,}$/
        },
        "domain": {
            message: "Not a valid domain name",
            pattern: /^([a-z][a-z0-9\-]+(\.|\-*\.))+[a-z]{2,6}$/
        },
        "phone": {
            message: "Invalid phone number",
            pattern: /\+?\(?\d{2,4}\)?[\d\s-]{3,}/

        },
        "ipv4": {
            message: "Invalid IP address",
            pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        },
        "email": {
            message: "Invalid Email address",
            pattern: /^[\w\-]{1,}([\w\-\+.]{1,1}[\w\-]{1,}){0,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/
        },
        "url": {
            message: "Invalid URL",
            pattern: /^(http|https):\/\/(([A-Z0-9][A-Z0-9_\-]*)(\.[A-Z0-9][A-Z0-9_\-]*)+)(:(\d+))?\/?/i
        },
        "number": {
            message: "Invalid number",
            pattern: /^[0-9]*\.?[0-9]*?$/
        },
        "currency": {
            message: "Invalid currency number",
            pattern: /^\$?(?=\(.*\)|[^()]*$)\(?\d{1,3}(,?\d{3})?(\.\d\d?)?\)?$/
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
