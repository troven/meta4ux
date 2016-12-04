define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    var HTMLPages = function(options) {
        options = ux.checkOptions(options);
        options = _.extend({
            editable: true,
            editing: false,
            edited: {rows: 20, cols: 120, toolbar: {}},
            attached: {},
            metaKey: "template",
            autoHide: true
        }, options);
        var DEBUG = ux.DEBUG && true;

        var editor_options = _.extend({
            "font-styles": true, //Font styling, e.g. h1, h2, etc. Default true
            "emphasis": true, //Italics, bold, etc. Default true
            "lists": true, //(Un)ordered lists, e.g. Bullets, Numbers. Default true
            "html": true, //Button which allows you to edit the generated HTML. Default false
            "link": false, //Button to insert a link. Default true
            "image": false, //Button to insert an image. Default true,
            "color": true, //Button to change color of font - extra dependency (un-resolved)
            "reference": true,
            "viewer": true,
            "gallery": true,
            "dummy": true,
            "stylesheets": ["../jscript/vendor/bootstrap-wysiwyg5/wysiwyg-color.css"],
            "locale": "en"
        });

        editor_options.toolbar = _.extend({
            "reference": function (locale, _options) {
                var label = (locale.reference && locale.reference.edit) || "Reference";
                return "<li><div class=''><a class='btn' data-scorpio4-event='reference' title='" + label + "'><i class='cog'></i>&nbsp;Reference</a></div></li>";
            },
            "viewer": function (locale, _options) {
                var label = (locale.reference && locale.reference.edit) || "Viewer";
                return "<li><div class=''><a class='btn' data-scorpio4-event='viewer' title='" + label + "'>Viewer</a></div></li>";
            },
            /*
             "galleryx": function(locale, _options) {
             var label = (locale.reference && locale.reference.edit) || "Gallery";
             return "<li><div class='btn-group'><a class='btn' data-scorpio4-event='gallery' title='" + label + "'>Gallery</a></div></li>";
             },
             */
            "gallery": function (locale, _options) {
                var label = (locale.reference && locale.reference.edit) || "Dummy";
                console.debug("Toolbar: Extra: %o %o", locale, _options);
                var html =
                    "<li class='dropdown'>" +
                    "<a class='btn dropdown-toggle' data-scorpio4-event='dummy' data-toggle='dropdown' href='#' title='" + label + "'>" +
                    "<i class='icon-briefcase'></i>&nbsp;<b class='caret'></b></a>" +
                    "<ul class='dropdown-menu'>" +
                    "<li><a data-wysihtml5-action='insertProperty' data-wysihtml5-action-value='{{test_1}}'>Test 1</a></li>" +
                    "<li><a data-wysihtml5-action='insertProperty' data-wysihtml5-action-value='{{test_2}}'>Test 2</a></li>" +
                    "</ul>" +
                    "</li>";
                return html;
            },

            "thing": function (locale, _options) {
                var label = (locale.reference && locale.reference.edit) || "Thing";
                return "<li><div class='btn-group'><a class='btn' data-scorpio4-event='thing' title='" + label + "'>" + label + "</a></div></li>";
            },
        }, options.edited.toolbar);


        //    ************************************************  ****************************************************
        // ************************************************ PAGES ****************************************************
        //    ************************************************ ****************************************************

        ux.view["meta4:ux:HTMLPages"] = function (options) {
            options = ux.checkOptions(options);
            options = _.extend({editable: false, editing: false, edited: false, attached: false}, options);
            var DEBUG = ux.DEBUG && true;

            var HTML = Backbone.Marionette.ItemView.extend({
                template: "<div class='ux_sample'><label data-id='{{id}}'>{{label}}</label><div class='ux_toggled ux_preview'>{{{template}}}</div></div>"
            });
//		var HTML = ux.view["meta4:ux:HTML"](options);
            if (!HTML) throw "meta4:ux:oops:missing-widget";

            var Pages = Backbone.Marionette.CompositeView.extend(_.extend({
                itemView: HTML, tagName: "ul", className: "nav-list",
                template: "<div><label data-id='{{id}}'>{{label}}</label><ul></ul><div>",
                itemViewContainer: "ul",
                events: {
                    'click [data-id]': 'doEventSelect',
                    'dblclick [data-id]': 'doActivate',
                    'dragstart': 'doEventDrag',
                },
                initialize: function () {
                    ux.model(options, this);
                    console.debug("Init Pages:", this);
//				this.listenTo(this.collection, "change", this.render);
                },
                selectItem: function (model) {
                    this.$el.find(".active").removeClass("active");
                    var $item = this.$el.find("[data-id='" + model.id + "']");
                    console.debug("Select Item:", model, $item);
                    $item.addClass("active");
                },
                onShow: function () {
                    var self = this;
                    setTimeout(function () {
                        var $facts = ux.factualize(self, options.factualizer);
                        var $drags = self.initializeDraggable(options.draggable);
                    })
                    return this;
                },
                doActivate: function (event, ui) {
                    console.debug("Activate Item:", model, $item);
                },
            }, ux.mixin.Common, ux.mixin.Draggable));

            return Pages;
        }

    };

        // Widget meta-data allows runtime / editor to inspect basic capabilities

        return {
            "id": "HTMLPages",
            "label": "HTMLPages",
            "comment": "A rich HTML editor based on wysihtml5",
            "mixins": [ ],
            "views": false,
            "collection": false,
            "options": true,
            "schema": false,

            "fn": HTMLPages
        }

})
