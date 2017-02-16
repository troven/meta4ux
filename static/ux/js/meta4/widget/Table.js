define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Table= ux.view["meta4:ux:Table"] = function(options) {

        options = ux.checkOptions(options, ["id", "columns"]);
        var DEBUG = options.debug || ux.DEBUG; // master DEBUG

        options.template =  options.template ||
            ux.compileTemplate("<table><thead></thead><tbody></tbody><tfoot></tfoot></table>");

        var TableHeading =  Backbone.Marionette.ItemView.extend({ tagName: "th", template: "{{label}}" });
        var TableHeadings =  Backbone.Marionette.CollectionView.extend({ tagName: "tr", childView: TableHeading });

        var TableCell =  Backbone.Marionette.ItemView.extend({ tagName: "td" });
        var TableColumns =  Backbone.Marionette.CollectionView.extend({ tagName: "tr", childView: TableHeading,
            childViewOptions: function(model, index) {

                return { model: model, collection: this.columns };
            }
        });
        var TableRows = Backbone.Marionette.CollectionView.extend({ tagName: "tr", childView: TableColumns,
            childViewOptions: function(model, index) {
                return { model: model, collection: this.columns };
            }
        });

        var view_defn = {
            isNested: true, isNavigator: true,
            template: options.template,
            className: "table table-striped",
            regions: { header: "table>thead" , body: "table>tbody", footer: "table>.tfoot" },
            initialize: function(options) {
                DEBUG && console.log("Table: init: %s %o -> %o", this.id, options, this.$el);
                ux.initialize(this, options);
                this.columns = new Backbone.Collection(this.options.columns);
                return this;
            },
            onRender: function() {
                this.header.show(new TableHeadings({ model: this.model, collection: this.columns }));

                var meta = { model: this.model, collection: this.collection, columns: this.columns };
                this.body.show(new TableRows(meta));
            }
        }

        return Backbone.Marionette.LayoutView.extend(view_defn)
    }

    // Widget meta-data allows runtime / editor to inspect basic capabilities

    return {
        "id": "Table",
        "label": "Table",
        "comment": "A widget that manages a Table",
        "emits": [],
        "mixins": [ "isNavigator", "isNested" ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.Table
    }

})
