define(["jquery", "underscore", "backbone", "marionette", "ux", "backgrid"], function ($,_, Backbone, Marionette, ux) {

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";

    var Grid = function(options) {
        options = ux.checkOptions(options, ["id", "label", "collection"]);
        options = _.extend({debug: true, paging: false, selectable: false}, options);

//		if (options.columns instanceof Array) options.columns = new Backbone.Collection(options.columns);
//		if (!(options.columns instanceof Backbone.Collection)) throw "meta4:ux:oops:invalid-column-collection";

        var DEBUG = true;//options.debug?true:false;

        var map2cell = {
            "boolean":	"boolean",
            "string": 	Backgrid.StringCell,
            "number":	Backgrid.NumberCell,
            "integer":	Backgrid.IntegerCell,
            "email":	Backgrid.EmailCell,
            "datetime":	Backgrid.DatetimeCell,
            "date":		Backgrid.DateCell,
            "time":		Backgrid.TimeCell,
            "select":	Backgrid.SelectCell,
            "lookup":	Backgrid.SelectCell,
            "anyURI":	Backgrid.UriCell,
        }
        // Backgrid.SelectCell.extend({
        //     // It's possible to render an option group or use a
        //     // function to provide option values too.
        //     optionValues: [["Male", "m"], ["Female", "f"]]
        // })
        // handle columns
        var Schema2Column = function(c,k) {
            var widget = (c.type ||  "string").toLowerCase();
            var editor = c.editor || c.widget;

            // _.isUndefined(c.sortable)?true:c.sortable?true:false

            var col = {
                name:       c.id || c.name || k,
                label:      c.label || c.id,
                editable:   _.isUndefined(c.editable)?true:c.editable?true:false,
                renderable: _.isUndefined(c.visible)?true:c.visible?true:false,
                sortable:   false,
                editor: 	c.editor || editor,
                cell:       c.cell || widget
            };

            if (c.options) {
                var optionValues = ux.fact.Collection(c.options);

                // TODO: refactor
                col.optionValues = _.map(optionValues.toJSON(), function(v,k) { return [v.id, v.label] });

                col.formatter = Backgrid.SelectFormatter;
                col.editor = Backgrid.SelectCellEditor;
                console.log("Schema2Column: %s -> %o -> %o", col.name, col, optionValues);
            }
            return col;
        }

        // build Widgets

        var GridFooter = null;
        if (options.paging) {
            GridFooter = Backgrid.Extension.Paginator.extend({
                lastPage: 0,
                fastForwardHandleLabels: { first: "&le;", prev: "&lang;", next: "&rang;", last: "&ge;" }
            });
            DEBUG && console.debug("Grid Footer: %o %o", options.paging, GridFooter);
        }

        var Grid = Backgrid.Grid.extend( _.extend({
            className: "backgrid",
            footer: GridFooter,
			// events: { "click": "doEventSelectRow" },
            emptyText: "No "+options.label,
            initialize: function (options) {
                var self = this;

                ux.initialize(this, options);

                DEBUG && console.debug("[Grid] init: %o %o css: %o", this, options, this.className);

                this.columns = _.map(options.columns || options.schema, Schema2Column);
                // this.columns = new Backbone.Collection(_columns;
                DEBUG && console.debug("[Grid] columns: %o", this.columns );

                if (options.selectable) {
                    this.columns.add({ name: "_selected_", cell: "select-row", headerCell: Backgrid.Extension.SelectAllHeaderCell });
                }

                var meta = _.omit(options, ["el", "id", "attributes", "className", "tagName", "events", "columns"]);
                meta.columns = this.columns;
                meta.collection = this.collection;

               this.row = Backgrid.Row.extend({
                   columns: this.columns,
                   events: { "click": "doEventSelectRow" },
                   initialize: function() {
DEBUG && console.log("[Grid] Row Initialize: %o", this);
                   },
                   doEventSelectRow: function (that,x) {
DEBUG && console.log("[Grid] Row Selected: %o %o %o", this, that, x);
//                       ux.mixin.Common.doSelect.call(this, this.model);
                   }
               } );

                var Header = options.header || Backgrid.Header;
                this.header = new Header(meta);
                console.log("[Grid] Header init: %o -> %o", this.header, meta);

                var Body = options.body || this.body;
                this.body = new Body(meta);

                var Footer = options.footer || this.footer;
                if (Footer) {
                    this.footer = new Footer(meta);
                    console.log("[Grid] Footer init: %o -> %o", this.footer, meta);
                }

//				this.listenTo(this.columns, "all", function (event, x, y, z) {
//DEBUG && console.debug("Changed %s Columns: %o %o", event, self.options, self.columns);
////					self.header = new Header(meta);
//					self.initialize(options);
//				});

//				this.listenTo(this.columns, "reset", function () {
//DEBUG && console.log("Reset Columns: %o %o", this, this.columns)
//				  this.header = new (this.header.remove().constructor)(meta);
//				  this.body = new (this.body.remove().constructor)(meta);
//				  if (this.footer) {
//					this.footer = new (this.footer.remove().constructor)(meta);
//				  }
//				  this.render();
//				});
//
//				this.listenTo(this.collection, "backgrid:select", function () {
//console.log("BackGrid Selected: %o %o", self, this);
//				});

                this.on("backgrid:rendered", this.onRendered);
            },

            onRendered: function() {
                this.$el.parent().addClass("backgrid-container");
                this.$el.addClass("backgrid");
                console.log("[Grid] onRender: %o", this.$el);
            },

            doEventSelectRow: function (ui, event) {
                console.log("[Grid] Row Selected: %o %o", this, event );
            }

        }, ux.mixin.Common ) );

        return Grid;
    }

    // Widget meta-data allows runtime / editor to inspect basic capabilities

    return {
        "id": "Grid",
        "label": "Grid",
        "comment": "A spreadsheet-like widget that allows editing of rows & columns",
        "mixins": [ "isSelectable" ],
        "views": false,
        "collection": true,
        "options": true,
        "schema": true,

        "fn": Grid
    }
});
