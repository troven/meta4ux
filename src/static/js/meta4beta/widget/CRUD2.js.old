define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment";
	var iconAttribute = ux.iconAttribute || "icon";

	ux.view.CRUD2 = ux.view["meta4:ux:CRUD2"] = function(options) {
		options = ux.checkOptions(options, ["id", "views"]);
		var DEBUG = options.debug || ux.DEBUG

		options.template =  options.template || ux.compileTemplate("<div class='ux_crud '><div class='crud_header clearfix'></div><div class='crud_body clearfix'>loading ...</div><div class='crud_footer clearfix'></div>");

		var Footer = Backbone.Marionette.CompositeView.extend({
            "template": "<div class='ux-crud2-buttons clearfix'></div>",
            "childViewOptions" : {
                "tagName": "span",
                "template": "<button class='btn btn-{{state}} pull-{{align}}' data-trigger='{{id}}'>{{label}}</button>&nbsp;"
            },
            collection: new Backbone.Collection(),
            "childViewContainer": ".ux-crud2-buttons",
            "childView": Backbone.Marionette.ItemView
		});

		var Header = Backbone.Marionette.ItemView.extend({
		    "template": "<div><img class='pull-right' height='32' src='{{icon}}'/><h3>{{label}}</h3><p>&nbsp;{{comment}}</p></div>",
		    initialize: function(opts) {
		        ux.initialize(this,opts)
		    }
		 });

		var CRUD = Backbone.Marionette.LayoutView.extend( _.extend({
			isNested: true, isActionable: true, isSelectable: true, isStateMachine: true,
            template: options.template,
            events: {
                "click [data-trigger]": "doAction",
                "click [data-action]": "doAction"
            },
            regions: { header: ".crud_header" , body: ".crud_body", footer: ".crud_footer" },
			initialize: function(_options) {
			    _.defaults(_options, { buttons: {}, transitions: {}, model: true, views: {} } )

                this.can = _.extend({ create: true, read: true, update: true, delete: true }, _options.can)

                _.defaults(_options.buttons, {
                    "add": {
                        "label": "Add", "state": "primary", disabled: false,
                        "align": "left"
                    },
                    "save": {
                        "label": "Save", "state": "primary", disabled: false,
                        "align": "left"
                    },
                    "remove": {
                        "label": "Delete" , "state": "default", disabled: false,
                        "align": "left"
                    },
                    "cancel": {
                        "label": "Cancel" , "state": "default", disabled: false,
                        "align": "right"
                    }
                })

                _.defaults(_options.transitions, {
                    init: { initialized: 'read' },
                    saving: {
                        saved: "read",
                        cancel: "read"
                    },
                    "delete": {
                        confirm: "read",
                        cancel: "read"
                    },
                    create: {
                        save: "saving",
                        cancel: "read",
                        finish: "read"
                    },
                    select: "update",
                    read: {
                        add: "create",
                        select: "update",
                        update: "update",
                        remove: "delete"
                    },
                    update: {
                        save: "saving",
                        remove: "delete",
                        cancel: "read",
                    }
                })

                // minimal 'master/detail'
                _options.views.selected = _options.views.selected
                if (!_options.views.selected && this.can.update) _options.views.selected = _options.views.update

                _options.views.selected = _options.views.selected
                    || _options.views.view || _options.views.read
                    || (this.can.update && _options.views.update)

                // pick a sensible 'home' screen
                _options.views.home = _options.views.home || _options.views.body || _options.views.read || _options.views.view || {}

                // crud
                if (this.can.create && !_options.views.create ) _options.views.create = _options.views.update || {}

                // start from home
				_options.views.body = _options.views.home

				ux.initialize(this, _options)
DEBUG && console.log("init CRUD2 (%s): %o %o %o", _options.id, this, _options, this.can)

                // bind child/nested events
				this.on("nested:childview:select", this.onSelectItem)
				this.on("nested:finished", this.onFinished)
				this.on("nested:action", this.onAction)

				return this;
			},

			onRender: function() {
                if (!this.body.currentView) {
                    this.footer.show( new Footer() )
                    this.trigger('initialized')
                }
			},

            onValidate: function() {
DEBUG && console.log("onValidate: %o", this)
                var view = this.body.currentView;
                if (view.model && view.model.validate) {
                    this.$el.css({ opacity: 0.5 })
                    this.$el.attr("disabled", true)

                    view.model.validate()

                    this.$el.css({ opacity: 1.0 })
                    this.$el.attr("disabled", false)
                }

            },

			showButtons: function(to) {
			    var footer = this.footer.currentView
                if (!footer) {
DEBUG && console.log("No footer for buttons: %o %o", this, to)
                    return
                }
                var buttons = footer.collection

                var tx = this.transitions[to]
                if (!tx) {
DEBUG && console.log("Mute Buttons: %o %o %o", this, to, tx)
                    buttons.each(function(button) {
                        button.disabled = true
                    })
                    return
                }

                var self = this
                buttons.reset()
DEBUG && console.log("showButtons: %o %o", this, to)
                _.each(tx, function(v,k) {
                    var button = self.options.buttons[k]
                    if (button) {
                        _.defaults(button, { id: k , label: k, align: "left", state: "default", disabled: false  })
                        buttons.add( button )
                    }
                })
			},

			showViewState: function(state, meta) {
                var bodyView = this.getNestedView(state, meta)
                if (!bodyView) return false


//                if (!bodyView.options.modal) {
console.log("showViewState: %o %s %o %o", this, state, meta, bodyView)
                    this.body.show(bodyView)
                    this.showHeader(bodyView, meta)
                    this.showButtons(state)
//                } else {
//console.log("renderViewState: %o %s %o %o", this, state, meta, bodyView)
//                    bodyView.render();
//                    bodyView.trigger("show")
//                }

                return bodyView;
			},

			showHeader: function(bodyView, meta) {
			    var options = bodyView.options
                var header = options.views && options.views.header
console.log("showHeader: %o %o", this, header)
                if (header===false) {
                    this.header.currentView && this.header.currentView.destroy()
                    return false;
                }

                if (header===true || !header) {
                    var headerOptions = _.extend( _.pick(options, labelAttribute, commentAttribute, iconAttribute))
                    var headerView = new Header( headerOptions )
console.log("Header Model: %o %o", this, headerOptions)
                    this.header.show( headerView )
                    return headerView
                } else {
                    var headerView = this.getNestedView(header, meta)
console.log("Header: %o %o %o", this, headerView, meta)
                    if (headerView) this.header.show(headerView)
                    return headerView
                }

			},

// Action Menus
            onAction: function(action, model) {
console.log("onAction: %s %o %o", action, this, model)
                this.trigger(action, model)
            },

// Row Select
            onSelectItem: function(view) {
console.log("Select Item: %o", view)
                this.trigger("select", view.model)
            },

// Edit / Save / Cancel
            onSaving: function() {
                var self = this;
                var commit = function(view) {
                    if (view.body) {
console.log("Commit Body: %o", view.body)
                         return commit(view.body)
                    } else if (view.currentView) {
console.log("Commit Current: %o", view.currentView)
                         return commit(view.currentView)
                    } else {
                        var saved = view.model.save()
console.log("Saving: %o -> %o", view.model, saved)
                        return saved
                    }
                }
                var saved = commit(self.body)
                // empty the transition stack
                setTimeout(function() {
console.log("doSaved: %o %o", self, saved)
                    saved && self.trigger("saved")
                }, 0)
            },

            onEdit: function() {
console.log("onEdit: %o %o", this, arguments)
            },

            onCancel: function() {
console.log("onCancel: %o", this)
            },

            onFinished: function(model) {
console.log("onFinished: %o %o", this, model)
                model.save()
                this.trigger("finish")
            },

// CRUD operations

            onCreate: function() {
console.log("onCreate: %o", this)
                var model = this.collection.add( {} )
                var view = this.showViewState("create", { model: model })
console.log("onCreated: %o %o %o", this, model, view)
            },
            onRead: function() {
console.log("onRead: %o", this)
                this.showViewState("read", { collection: this.collection })
            },
            onUpdate: function(model) {
                var view = this.showViewState("update", { model: model })
DEBUG && console.log("onUpdate: %o %o %o", this, model, view)
            },
            onDelete: function() {
                var model = this.body.currentView.model
DEBUG && console.log("onDelete: %o %o", this, model)
                if (!this.can.delete) return;
                var y_or_n = confirm("Delete?")
                if (y_or_n) {
                    model.destroy()
                    this.trigger("confirm")
                }
                return y_or_n
            },

		}  ) )

		return CRUD;
	}

    return ux;
})
