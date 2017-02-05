define(["jquery", "underscore", "marionette", "Handlebars", "core", "oops", "ux"],
    function ($,_, Marionette, handlebars, core, oops, ux) {

    /* *****************************************************************************************************************
     UX Layouts
     **************************************************************************************************************** */

    return {

        Home: function(options, navigator) {
            if (!options) throw new ux.oops.Arguments("meta4:ux:home:oops:missing-options");
            if (!navigator) throw new ux.oops.Arguments("meta4:ux:home:oops:missing-navigator");
            if (!navigator.views) throw new core.oops.Arguments("meta4:ux:home:oops:invalid-navigator");
//            if (!options.el) throw new core.oops.Arguments("meta4:ux:home:oops:missing-el");

            // Render an initial "Home" View
            if (_.isString(options)) options = navigator.views.get(options);

            var _DEBUG = options.debug?true:false;

            var id = options[ux.idAttribute];
            if (!id) {
                _DEBUG && console.log("UX Widget (%s): %o", [ux.typeAttribute], options)
                throw new Error("meta4:ux:home:oops:missing-home-id:"+ux.idAttribute);
            }

            // make sure we have an el && a Widget
            options[ux.typeAttribute] = options[ux.typeAttribute] || "Home";

            // Render Home View - over-ride using 'home.type'

            console.log("Home (%s): %o -> %o", id, options, navigator)
            var home = navigator.views.view(id, options, navigator);
            if (!home) throw new Error("meta4:ux:home:oops:missing-home");

            // render & show
            home.render();
            $("body").empty().append(home.$el);

            _DEBUG && console.log("UX Home (%s): %o", id, options);
            return home;
        },

        // Modals


        Modal: function(view) {
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
        },

        Preview: function(filename) {
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
        },


        // System Dialogs

        Alert: function(options) {
            options = _.extend({message: "Oops!"}, options)
            alert(options.message)
        },

        Confirm: function(options) {
            options = _.extend({message: "Confirm?"}, options)
            return confirm(options.message)
        },

        Notify: function(options) {
            if (!options || !options.message) return
            ux._notifications = ux._notifications || new Backbone.Collection()
            ux._notifications.add(options)
        },

        Lock: function(options) {
            alert("LOCKED")
        }

    }
});
