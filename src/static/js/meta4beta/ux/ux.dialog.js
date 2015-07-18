define(["jquery", "underscore", "marionette", "Handlebars", "core", "meta4beta/ux/ux.mixin"],
	function ($,_, Marionette, handlebars, core, ux) {

    var ux = ux = ux || {meta: {}}
	ux.idAttribute = core.idAttribute
	ux.typeAttribute = core.typeAttribute
	ux.labelAttribute = core.labelAttribute

    ux.mixin = ux.mixin || {}
	ux._viewIDcounter = 1

	/* *****************************************************************************************************************
		UX Layouts
	**************************************************************************************************************** */

	ux.Home = function(options) {
        // Render an initial "Home" View
        if (_.isString(options)) options = ux.views.get(options)
		if (!options) throw "meta4:ux:oops:unknown-home";

		var _DEBUG = options.debug

		if (!options[ux.idAttribute]) {
_DEBUG && console.log("UX Widget (%s): %o", [ux.typeAttribute], options)
		    throw "meta4:ux:oops:missing-home-"+ux.idAttribute;
		}

		// make sure we have an el && a Widget
        options = _.extend({ el: options.el || "body" }, options)
        options[ux.typeAttribute] = options[ux.typeAttribute] || "Home"

        // Render Home View - over-ride using 'home.type'
        var home = ux.views.view(options[ux.idAttribute], options)
        if (!home) throw "meta4:app:boot:oops:missing-home";

		home.on("action", function(action) {
			alert("action:"+action)
		})
		home.on("navigate", function(go_to) {
			alert("navigate:"+go_to)
		})

        // render & show
        home.render()
_DEBUG && console.log("UX Home (%s): %o", options[ux.idAttribute], options)
        home.triggerMethod("show")
        return home
    }

	// Modals


	ux.Modal = function(view) {
		var $body = $("body")
		var $overlay = $("<div class='overlay'/>").appendTo($body)
		$overlay.css({"z-index": '10000'})
		var $this = $("<div class='overlay_wrapper panel'/>").appendTo($overlay)
		$this.css({"position": "absolute", "display": "none" })
		if (!view) return $overlay

		view.$el = $this

		view.on("show", function() {
			setTimeout(function() {
				ux.position.modal(view.$el)
				view.$el.css({ "z-index": 100+parseInt($overlay.css("z-index")), opacity: "100%" })
				view.$el.fadeIn('fast')
			},10)
		})
		var removeAll = function(doneDestroy) {
			$overlay.remove()
			if (!doneDestroy) view.destroy()
		}

		view.on("destroy", function() { removeAll(true) })
		$(document).keyup(function(e) { if (e.keyCode == 27) removeAll() })
		$overlay.click(removeAll)
		$this.click(ux.muffle)

		return view;
	}

	ux.Preview = function(filename) {
		var $body = $("body")
		var $overlay = $("<div class='overlay'/>").appendTo($body)
		$overlay.css("z-index", 1000000)

		var $iframe = $("<iframe border='0'/>")
		$iframe.css( { "z-index": 1000001, "opacity": "100%", "position": "absolute", top: "3%", left: "3%", width: "94%", height: "94%" })
		$iframe.attr("src", filename)
		$iframe.appendTo($overlay)

		var removeAll = function() {
			$iframe.remove()
			$overlay.remove()
		}

		$(document).keyup(function(e) { if (e.keyCode == 27) removeAll() })
		$overlay.click(removeAll)
	}


    // System Dialogs

	ux.Alert = function(options) {
		options = _.extend({message: "Oops!"}, options)
		alert(options.message)
	}

	ux.Confirm = function(options) {
		options = _.extend({message: "Confirm?"}, options)
		return confirm(options.message)
	}

	ux.Notify = function(options) {
		if (!options || !options.message) return
		ux._notifications = ux._notifications || new Backbone.Collection()
		ux._notifications.add(options)
	}

	ux.Lock = function(options) {
		alert("LOCKED")
	}


	return ux
});
