define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Table= ux.view["meta4:ux:Table"] = function(options) {

        options = ux.checkOptions(options, ["id"]);
        var DEBUG = true; // options.debug || ux.DEBUG; // master DEBUG

        options.template =  options.template ||
            ux.compileTemplate("<thead></thead><tbody></tbody><tfoot></tfoot>");

        var TableHeading =  Marionette.View.extend({ tagName: "th", template: "{{label}}" });
        var TableHeadings =  Marionette.CollectionView.extend({ tagName: "tr", childView: TableHeading });

//        var TableCells = Marionette.View.extend({ tagName: "td" });

        var TableRows = Backbone.View.extend({ initialize: function(options) { this.options = options },
            render: function() {
                var self = this;
                var $table = $();
                DEBUG && console.log("[Table] rows: %o -> %o", this, $table);
                var template = ux.compileTemplate(this.options.template);
                this.collection.each(function(model) {
                    $table.append( template(model.attributes) );
                });
                this.$el.replaceWith($table);
            }
        });

        var view_defn = {
            tagName: "table",
            isNested: true, isNavigator: true,
            template: options.template,
            className: "table table-striped",
            regions: { header: "thead" , body: "tbody", footer: "tfoot" },
            initialize: function(options) {
                var columns = options.columns || options.schema;
                this.columns = new Backbone.Collection( columns );
                ux.initialize(this, options);
                DEBUG && console.log("[Table] init: %s %o -> %o", this.id, this, options);

                var row_template = "<tr>";
                this.columns.each(function(column) { row_template+="<td>{{"+column.id+"}}</td>"; });
                this.row_template = row_template+"</tr>";

                return this;
            },
            onBeforeRender: function() {
                var meta_headers = { model: this.model, collection: this.columns };

                this.header =  new TableHeadings(meta_headers);
                // var meta_rows = { model: this.model, collection: this.collection, template: row_template };
//                this.rows = new TableRows(meta_rows);
                console.log("[Table] onBeforeRender: %o -> %o", this, meta_headers);
            },
            onRender: function() {
                this.showChildView("header", this.header);
 //               this.showChildView("body", this.rows );
                DEBUG && console.log("[Table] onRender: %o", this);
                this.renderRows();
            },
            renderRows: function() {
                var self = this;
                var view = this.getRegion("body");
                DEBUG && console.log("[Table] rows: %o -> %o", this, view);
                if (!view) return;
                var $tbody = $(this.$el, view.el);
                var template = ux.compileTemplate(this.row_template);
                this.collection.each(function(model) {
                    var $row = $(template(model.attributes));
                    $row.on("click", function() {
                        console.log("[Table] select: %o -> %o", self, model);
                        self.trigger("action", "select", { model: model });
                    })
                    $tbody.append( $row );
                    console.log("ROW: %o", $row);
                });
            }
        }

        return Marionette.View.extend(view_defn)
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
