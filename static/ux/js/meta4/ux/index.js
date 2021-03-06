define(["jquery", "underscore", "marionette", "Handlebars", "core", "meta4/ux/ux.core"],
	function ($,_, Marionette, Handlebars, core, ux) {

	// default to Moustache renderer

	Marionette.Renderer.render = function(template, data) {
		return _.isFunction(template)?template(data):Handlebars.compile(template)(data);
	}

	// setup some default constants

    var ux = core.ux = core.ux || {};

	ux.idAttribute = "id";
	ux.typeAttribute = "widget";
    ux.editorAttribute = "editor";
	ux.labelAttribute = "label";

	ux.meta = ux.meta || {};
	ux.DEBUG = false;

    ux.mixin = ux.mixin || {}
    ux._viewIDcounter = 1

    return ux
});
