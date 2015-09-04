define(["jquery", "underscore", "backbone", "marionette", "ux", "mixitup"], function ($, _, Backbone, Marionette, ux, mixitup) {

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";
    var commentAttribute = ux.commentAttribute || "comment";

    ux.view.Gallery = ux.view.Gallery = ux.view["meta4:ux:Gallery"] = function(options) {
        options = ux.checkOptions(options, ["id"]);
        _.defaults(options, { child: {} })
        var DEBUG = options.debug || ux.DEBUG;

        var GalleryItem = Backbone.Marionette.ItemView.extend( {
            isHoverPanel: true, isPopOver: true, isActionable: true, isTemplating: true,
            isSelectable: true,
            className: "gallery-item mix",
            template: options.child.template || "<img data-id='{{id}}' src='{{image.url}}'/>",
            events: {
                "click [data-id]": "doAction",
                "click [data-id]": "doEventSelect",
                "dblClick [data-id]": "doEventSelect"
            },
            initialize: function(_options) {
                ux.initialize(this, _options)
            }
        });

        var config = {
            isSortable: true, isCommon: true,
            isPopOver: true, isSelectable: true, isHoverPanel: true,
            isNestedView: true,
            childView: GalleryItem,
            events: {
                'sortstart': 'doEventDrag',
                "click [data-id]": "doEventSelect"
            },
            childViewOptions: function() {
                return this.options.child || {}
            },
            initialize: function(_options) {
                ux.initialize(this, _options)
                this.childView.template = _options || child.template
                if (_options.empty) {
                    this.emptyView = GalleryItem
                    this.emptyView.template = _options || empty.template
                    this.emptyViewOptions = function() { return _.extend({ "template": ""}, _options.empty) }
                }

                return this;
            },

            onShow: function() {
                var options = _.extend({ itemSelector: ".gallery-item", filter: "*" }, this.options.isotope );
                $(this.$el).mixItUp(options);
            }
        }

        return Backbone.Marionette.CollectionView.extend( config );
    }

    // Widget meta-data allows runtime / editor to inspect basic capabilities

    return {
        "id": "Gallery",
        "label": "Gallery",
        "comment": "A widget that shows a Gallery of items",

        "triggers": [ "action", "select" ],
        "mixins": [ "isSelectable", "isActionable" ],
        "collection": true,
        "options": true,
        "child": true,

        "fn": ux.view.Gallery
    }
})
