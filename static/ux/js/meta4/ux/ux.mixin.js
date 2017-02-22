define(["jquery", "underscore", "marionette", "Handlebars", "core", "ux", "oops" ],
	function ($,_, Marionette, handlebars, core, ux, oops) {

    var ux = core.ux = core.ux || { meta: {} }
	ux.idAttribute = core.idAttribute || "id";
	ux.typeAttribute = core.typeAttribute || "widget";
	ux.labelAttribute = core.labelAttribute || "label";
	var DEBUG = ux.debug = false // || core.DEBUG;

    ux.mixin = ux.mixin || {}
	ux._viewIDcounter = 1

	/* *****************************************************************************************************************
		UX Mix-ins
	**************************************************************************************************************** */

	ux.mixer = function(options) {
		if (!this.render) throw "meta4:ux:mixin:oops:not-view"
	// auto-extend and initialize Views with is[Mixin] i.e. isAttachable properties
// DEBUG && console.debug("Init Mixin(%s): %o %o", this.id, this, options)
		this.debug = (options.debug || DEBUG)?true:false;

		var self = this;
		for (var k in self) {
			if (k.indexOf("is")==0 && (self[k]===true || self.options[k]===true)) {
				var method = k.substring(2);
				var optionKey = method.toLowerCase();
				var _mixin = ux.mixin[method];
				var _disabled = (options[k]===false)
// _DEBUG && console.debug("Mixin (%s) %s -> %o %o %o (%s)", options.id, k, self, options, _mixin, !_disabled)
				if (_mixin && !_disabled) {
					_.defaults(self,_mixin);
					_.defaults(self.options, options);
					 var defaults = _.extend({}, options[optionKey] || options);

					var initializer = self["initialize"+method];
					initializer && initializer.call(self, defaults);
                    self[k] = true;
				} else {
                    self[k] = false;
                }
			}
		}
	}

	ux.mixin.attach = function(mixinName, eventList, vents, self, options) {
		if (arguments.length!=5) throw "meta4:ux:mixin:oops:incorrect-arguments"
		if (!vents) "meta4:ux:mixin:oops:no-vents#"+options.id
		var fnName = "attach"+mixinName
		var fn = self[fnName]
		if (!fn) throw "meta4:ux:mixin:oops:missing-"+fnName;

		_.each(eventList, function(eventName) {
			if (!vents || !vents.once) {
				console.error("Invalid VENT (%s): %o %o %o %o", mixinName, eventList, vents, self, options)
			} else {
DEBUG && console.log("Attach Listener (%s:%s) -> %o to %o / %o", mixinName, eventName, vents, self, options)

				vents.once(eventName, function(e,ui) {
DEBUG && console.log("Re-Attach (%s:%s) -> %o / %o", mixinName, eventName, self, options)
					fn.call(self, options)
					self["_is"+mixinName+"Attached"]=true
				})
			}
		})
		return self;
	}

	// Pop Over

	ux.mixin.PopOver = {
		initializePopOver: function(options) {
			if (this.model) {
				ux.mixin.attach("PopOver", ["change"], this.model, this, options)
			}
			ux.mixin.attach("PopOver", ["render"], this, this, options)
		},
		attachPopOver: function(options) {
			var self = this;
			if (!options || _.isEmpty(options)) return;
			// defaults
			var _options = _.extend({
			    selector: "[about]", trigger: "hover", placement: "top", html: true,
				title: function() {
					var about = $(this).attr( "about");
					var _title  = options.label || $(this).text() || about;
DEBUG && console.log("PopOver Title: %o %o %o ", this, _title, options)
					var template = ux.compileTemplate(_title);
					return template(self.model.attributes)
				},
				content: function() {
					var about = $(this).attr( "about");
					if (options.view) {
						var view = new options.view(options);
						// if we have a model, use it. if view has a collection, lookup the model & use it. otherwise use our options
						view.model = options.model?model:(that.collection?that.collection.get(about):new Backbone.Model(options));
						// return the rendered HTML for the popover content
						return view.render().el;
					}
					var template = ux.compileTemplate(options.comment || $(this).attr("title") || "");
					return template(self.model.attributes)
				},
			}, options);

//DEBUG && console.log("About PopOver() %o %o %o ", self.$el, this, options)

//			if (!$el||!$el.length) throw "meta4:ux:mixin:oops:element-not-found#"+options.selector;
			setTimeout(function() {
				var $el = options.selector?$(options.selector,self.$el):self.$el;
                $el.popover && $el.popover(_options);
//DEBUG && console.debug("Attached PopOver(): %o %o %o %o" , self, _options, $el, self.$el);
			},100)
			return self;
		}
	}

	ux.mixin.ButtonContext = {
        initializeButtonContext: function(options) {
        },

        getButtonsCollection: function(buttons_id) {
            if (!buttons_id) throw "meta4:ux:crud:oops:missing-buttons-id";
            if (!this.navigator)  throw "meta4:ux:crud:oops:missing-buttons-navigator";

            console.log("getButtons: %s -> %o", this.options.buttons, this);
            var modelButtons = this.navigator.models.get(this.options.buttons);
            if (!modelButtons) throw "meta4:ux:crud:oops:missing-buttons-model";
            var viewButtons = modelButtons.get(buttons_id);
            if (!viewButtons) return false;
            var buttons = viewButtons.get("buttons");
            if (!buttons) throw "meta4:ux:crud:oops:missing-button-set#"+buttons_id;
            return buttons;
        },

        getButtonsWidget: function(buttons_id, meta) {
            var buttons = this.getButtonsCollection(buttons_id);
            if (!buttons) {
                console.log("Missing Buttons: %o", buttons);
                return false;
            }
            var widget = _.extend({ id: this.id+"#buttons", widget: "Buttons", template: "<div/>", collection: buttons}, meta );
            var view = new Marionette.CollectionView(widget);
            console.log("Buttons Widget: %o -> %o -> %o", widget, buttons, view);
            return view;
        }

    }

	ux.mixin.Attachable = {
		initializeAttachable: function(options) {
			ux.mixin.attach("Attachable", ["change"], this.model, this, options)
			ux.mixin.attach("Attachable", ["render"], this, this, options)
		},
		doAttachEvent: function(event) {
		},
		doDetachEvent: function(event) {
		},
		doAttach: function(that) {
		},
		doDetach: function(that) {
		}
	}

	ux.mixin.Draggable = {
		initializeDraggable: function(options) {
			var self = this
			console.log("Init Drag: ", this)
			return this
		},
		attachDraggable: function(options) {
			if (!this.$el) return this;

			var self = this;
			options = _.extend({ selector: "li" }, this.options, options)
			var _DEBUG = DEBUG || options.debug

			var $el = $(options.selector,this.$el);
_DEBUG && console.debug("Attach Drag:", options.selector, this.$el, $el) ;
			var templateKey = "template";
			$el.draggable({
				appendTo: "body",
				revert: false,
				hoverClass:"ux_hovering",
				helper: function (e,ui) {
					var $about = $("[about]", this);
					var about = $about.attr("about");
					var model = null;
					if (self.collection) {
						model = self.collection.get(about);
					} else {
						model = self.model;
					}
					if (!model) {
_DEBUG && console.log("Missing Draggable Model: ", $(this), self.collection, self.model);
						throw "meta4:ux:mixin:oops:missing-model";
					}
					var $helper = null;
					var View = options.view || ux.view[ model.id || model.get("widget") || model.get("type") ];

//console.log("Drag Model: ", model.id, model);
					if (model.has(templateKey)) {
						var template = model.get(templateKey);
						View = Backbone.Marionette.ItemView.extend({ "template": template, model: model });
						var view = new View();
						view.render();
						$helper = $(view.el);
_DEBUG && console.log("Render Drag Template: ", model.id, model, $helper);
					} else if (View) {
//console.warn("View FROM:", options.view, ux.view[ model.id || model.get("widget") || model.get("type") ], self.itemView);
                        var dummyCollection = new Backbone.Collection([ { idAttribute: "urn:example:1", "label": "Example One"}, { idAttribute: "urn:example:2", "label": "Example Two"}]);
						var view_options = { idAttribute: model.id, "type": model.id, "model": model, label: model.get("label"), styleName: "popover-content", collection: dummyCollection }
_DEBUG && console.log("Render Drag Widget: ", model.id);
						var Widget = View(view_options)
						var view = new Widget(view_options);
//DEBUG && console.debug("Drag View: %o %o %o %o %o", model.id, Widget, view, model, $helper );
						view.render();
						$helper = $(view.el);
					} else $helper = $(this).clone();

					$helper.data("meta4:ux:model:drag", model);
					$helper.addClass("ux_draggable")
					return $helper;
				}
			})
//			$el.disableSelection();
		},
		doEventDrag: function(ui, event) {
			var model = $(event.helper).data("meta4:ux:model:drag");
			this.triggerMethod("drag", model, ui, event);
		},
		onDrag: function(model, ui, event) {
_DEBUG && console.debug("onDrag:", this, model, ui, event);
		}
	}

	ux.mixin.Droppable = {

		initializeDroppable: function(options) {
			var self = this;
//			var _DEBUG = DEBUG || options.debug
//_DEBUG && console.warn("init Droppable: %o %o", this, options)
			ux.mixin.attach("Droppable", ["render"], this, this, options)
		},

		attachDroppable: function(_options) {
			if (!this.$el) return this;

			var self = this;
			var _DEBUG = DEBUG || _options.debug

			var options = _.extend({
				accept: "*", selector: "li", tolerance: "pointer",
				activeClass: "bg-danger", hoverClass: "bg-warning",
				drop: function(event,ui) {
					var $item = ui.draggable;
					var newIndex = $item.parent().children().index($item);
					var view = $item.data('data-ux-view');
//_DEBUG &&
console.debug("doDrop: %o %o %o %o", self, event, ui, view);
					if (!view)  throw "meta4:ux:droppable:oops:missing-drag-view";

					if (self._parent && self._parent.children.findByCid(view.cid)) return

					self.triggerMethod("drop", view, newIndex);
				}
			}, _options)

			var $el = $(this.$el).closest(options.selector);
			$el.droppable(options);
//_DEBUG && console.debug("Attach Drop: %o %o %o", _options, options, $el);
			return $el;
		},
		onDropViewModel: function(view, newIndex) {
			var _DEBUG = DEBUG || this.options.debug
//_DEBUG &&
console.debug("onDrop: %o %o %o", this, view, newIndex);
			this.collection.add(view.model, {at: newIndex})
			this.render();
//_DEBUG &&
console.debug("onDropped: %o %o %o %o %o", view, newIndex, view.model);
		}
	}

	ux.mixin.Sortable = {
		initializeSortable: function(options) {
			var self = this;
//DEBUG && console.log("Init Sortable: %o %o", this, options)
			this.collection && ux.mixin.attach("Sortable", ["sync"], this.collection, this, options);
			ux.mixin.attach("Sortable", ["show"], this, this, options);
			return this;
		},
		attachSortable: function(_options) {
			if (!this.$el) return this;
			var self = this;
			var options = _.extend({ items: "li",
				placeholder: "placeholder",
				forcePlaceholderSize: true,
				tolerance: "pointer",
				helper: "clone",
				connectWith: ".ui-sortable",
				forceHelperSize: true,
				appendTo: "body",
				removeOnDrop: false,
				removeOnDropOut: false,
				cursor: "auto"
			}, _options)

			if (!options.connectWith && !options.containment) options.containment = "parent";

			var _DEBUG = DEBUG || options.debug;

			var $el = this.$el;
_DEBUG && console.debug("Attach Sortable: %o %o %o", _options, options, $el)

			var getItemModel = function(ui, collection) {
				var id = ux.identity(ui.item);
				if (!id) throw "meta4:ux:sortable:oops:missing-drop-id";
				return collection?collection.get(id):null;
			}

			options.start = function(e,ui) {
				ui.item.data("ux_collection", self.collection);
				var id = ux.identity(ui.item)
console.log("start drag (%s): %o %o - %o %o %o -> %o", id, e, ui, this, self, ui.item.data(), core);
				if (!id) return;
//				if (!id) throw "meta4:ux:sortable:oops:missing-drag-id";
				var model = self.collection.get(id);
				if (!model) return;
				//throw "meta4:ux:sortable:oops:missing-drag-model#"+id;

				self.trigger("drag", model, self.collection, e, ui)
			}

			options.sortupdate = function(e, ui) {
				  var $item = ui.item;
				  var newIndex = $item.parent().children().index($item);
				  var view = $item.data('data-ux-view');
				  // do not use silent to notify other obversers.
_DEBUG && console.log("Sorted Collection: %o %o", self.collection, model)
				  this.collection.remove(model);
				  this.collection.add(model, {at: newIndex});
			}

			options.receive = function(e,ui) {
				var collection = ui.item.data("ux_collection")
_DEBUG && console.log("Received Collection: %o %o", self.collection, collection)
				var model = getItemModel(ui, collection)
				if (!model) throw "meta4:ux:sortable:oops:missing-drop-model#";

				ui.sender.sortable("cancel") // let the BB do the work
//DEBUG && console.log("dropped", self, this, e, ui.item, id, model)

				// events
				self.triggerMethod("dropped", model, collection, e, ui)
				// update the from/to collections
				options.removeOnDrop && collection.remove(model)
				self.collection.add(model);
			}
			options.out = function(e,ui) {
				var collection = ui.item.data("ux_collection")
_DEBUG && console.log("Drop Out Collection: %o %o", self.collection, collection)
				var model = getItemModel(ui, collection)
_DEBUG && console.log("Drop Out: %o %o %o", e, ui, model)
				if (!model) return
				// events
				self.triggerMethod("dropOut", model, collection, e, ui)
				// update the from/to collections
				if (options.removeOnDropOut) {
					collection.remove(model)
//					self.collection.remove(model);
				}
			}

			options.activate = function(e,ui) { $(this).addClass("ux_drop_zone") }
			options.deactivate = function(e,ui) { $(this).removeClass("ux_drop_zone") }

			$el.sortable(options)
			$el.disableSelection()
			return $el;
		},

		onAddChild: function(view) {
		  view.$el.data('data-ux-view', view);
//_DEBUG && console.log("onAddChild: %o %o", view.model.cid, view.model)
		}
	}

	ux.mixin.Hideable = {
		isHideable: true,
		initializeHideable: function(options) {
		},
		hide: function() {
			if (this.is_hidden) return;
DEBUG && console.debug("Hide", this)
			var $html = $(".fade", this.$el);
			$html.removeClass('in');
			this.$el.fadeOut();
			this.is_hidden = true;
			return this;
		},
		reveal: function() {
			if (this.is_hidden===false) return;
			var $html = $(".fade", this.$el);
DEBUG && console.debug("Reveal", this, $html)
			$html.addClass('in');
			this.$el.fadeIn();
			this.delegateEvents(this.options.events);
			this.is_hidden = false;
			return this;
		}
	}

	ux.mixin.Affixed = {
		isAffixed: true,
		initializeAffixed: function(options) {
		},
		affix: function(options) {
			options = _.extend({
				offset: {
					top: 100,
					bottom: function () {
						return (this.bottom = $('.bs-footer').outerHeight(true))
					}
				}
			}, options || this.options);
			this.$el.affix(options);
			return this;
		}
	}

	ux.mixin.Selectable = {
		initializeSelectable: function(options) {
//console.debug("Is Selectable: %o %o", this, options);
		},

		select: function(selected, event) {
			var _DEBUG = this.options?this.options.debug:DEBUG;

			if (!selected) throw "meta4:ux:mixin:oops:missing-selection";
			var model = null;
			if (_.isFunction(selected)) {
				model = selected(event);
			}
			if (_.isString(selected)) {
				model = this.collection.get(selected);
			}
			if (selected instanceof Backbone.Model) {
				model = selected;
			}
			if (selected instanceof Backbone.Collection) {
				model = selected.models[0];
			}

			if (model && this.selectItem) {
			    this.selectItem(model, event);
            } else if (!model) {
_DEBUG && console.log("** Unknown model for selection: ", selected, event);
				throw "meta4:ux:mixin:oops:unknown-selection";
			}
			return model;
		},

		// default event-handler for model selections
		doEventSelect: function(event) {
            var _DEBUG = true; // this.options?this.options.debug:DEBUG;

			if (!event) throw "meta4:ux:mixin:oops:select:event-missing";
			event.stopImmediatePropagation();
            if (this.model) {
                _DEBUG && console.debug("doEventSelect: %o %o %o", this, event, this.model );
                return this.doSelect(event, this.model);
            }

            var $about = $(event.currentTarget).closest("[data-id]");
_DEBUG && console.log("doEventSelect (%s) %o %o ", event, this, $about);
			if ($about.length && this.collection) {
				var focus = $about.attr("data-id");
				// handle flat and nested (via _all) collections
				var model = this.collection._all?this.collection._all.get(focus):this.collection.get(focus);
				if (model) {
_DEBUG && console.debug("doEventSelect ID: %o %o -> %o %o %o ", this, event, this.collection, focus, model );
					return this.doSelect(event, model);
				}
			}

			console.error("event: %o $about :%o focus: %o", event, $about, focus);
			throw "meta4:ux:mixin:oops:select:not-found";
		},

		// Fire select/deselect events on source model and create/update a Selection model
		doSelect: function(event, model) {
            var _DEBUG = this.options?this.options.debug:DEBUG;
			if (!model) throw "meta4:ux:mixin:oops:select:model-missing";
                var isSelectable = (this.isSelectable && !(this.options.isSelectable===false) );
                _DEBUG && console.debug("doSelect : %o %o -> %s", this, event, isSelectable);
                if (isSelectable) {
                    this.triggerMethod("select", model, event );
                }
			return this;
		}
	}

	// Actionable
	// triggers event based on data-trigger

	ux.mixin.Actionable = {

		initializeActionable: function(options) {
		    // if (this._isActionable) throw "isActionable: "+options.id;
		    // this._isActionable = true;
DEBUG && console.log("Mixin Actionable(%s) %o %o", this.id, this, options );
            if (!options.isSelectable===false) {
                this.on("select", this.doSelectActionEvent);
            }
		},

        attachExplicitActions: function() {
            var _DEBUG = this.options.debug?true:false;
            var self = this;
            var $actions = $("[data-action]", this.$el);
            $actions.unbind("click");
            var meta = { model: this.model , collection: this.collection };
            // console.log("attachExplicitActions: %o -> %o", this, $actions);
            $actions.click(function(e) {
                var $this = (e?$(e.currentTarget):$(this)).closest("[data-action]");
                var event = $this.data();
                _DEBUG && console.log("onExplicitEventAction: %o -> %o ->%o", self, $this, event);
                self.trigger( event.action, meta);
                self.trigger( "action", event.action, meta );
            });
        },

        doEventAction: function(e, meta) {
            var _DEBUG = this.options.debug?true:false;
            var $this = (e?$(e.currentTarget):$(this)).closest("[data-action]");
            var event = $this.data();
            _DEBUG && console.log("doEventAction: %o -> %o ->o", this, $this, e);

            var model = this.model;
            var meta = _.extend({ model: model , collection: this.collection },meta);

            _DEBUG && console.log("triggerEventAction: %s -> %o %o -> %o", event.action, event, this, meta);
            this.trigger( event.action, meta);
            this.trigger( "action", event.action, meta );
        },

        doSelectActionEvent: function(model, event) {
            var _DEBUG = this.options.debug?true:false;
            var $action = $("[data-action]", $(event.currentTarget));
            _DEBUG && console.log("doSelectAction: %s ->  %o -> %o -> %o -> %o", action, this, model, event, $action);
            var action_data = $action.data();
            var action = action_data.action || model.get("action") || model.id;

            if (!action) {
                console.log("no-select-action: %o -> %o", this, model);
                return;
            }
			var model = this.collection?this.collection.get(action): this.model;
			var meta = { model: model , collection: this.collection };

			this.triggerMethod( "action", action, meta );
            this.triggerMethod( ""+action, meta );
            _DEBUG && console.log("ACTION:%s -> %o %o", action, this, meta );

            // is nested
            // this.showNested && this._views["action"] && this.showNested( "action", meta, this.navigator );

			return this;
		}
	};


	ux.mixin.Navigator = {

		initializeNavigator: function(options) {
            this.on("select", this.doSelectNavigate);
		},

        doSelectNavigate: function(model) {
            var self = this;
            if (!model) throw "meta4:ux:mixin:oops:missing-select-navigate";

            self.trigger("selected", model); // HACK because we can't seem to bind two events (e.g. this & IQ)
            var goto = model.get("goto") || model.get("id");
            self.trigger("navigate", goto, model);
        },
        doEventNavigate: function(e) {
			var go_to = this.model.id;
            if (!go_to) {
                var $this = $(e.currentTarget);
                go_to = $this.attr("data-navigate") || $this.attr("data-trigger");
                console.warn("Click Event (%s): %o --> %o", go_to, this, arguments);
            }
			if (!go_to) throw "meta4:ux:mixin:oops:missing-navigate";
            console.warn("doEventNavigate: (%s) %o", go_to, this);
//            this.navigateTo(go_to, this.model);
            this.navigator.trigger("navigate", go_to);
		},
		onNavigate: function(go_to, model) {
            console.log("navigateTo (%s): %o -> %o", go_to, this, model);
            if (_.isString(go_to)) {
                this.navigateTo(go_to);
            } else {
                go_to = model.get("view") || model.id;
                this.navigateTo(go_to);
            }
		},

		navigateTo: function(go_to, meta, navigator) {
			var viewId = false, eventId = false;
console.log("navigateTo (%s): %o", go_to, this);
            navigator = (navigator || this.navigator);

            meta = _.extend({ model: this.model , collection: this.collection }, meta) ;

            // split event and target view
			var where = go_to?go_to.split("@"):0
			if (where.length>1) { viewId = where[1]; eventId = where[0]; }
			else viewId = go_to;

			var self = this
			var _view = this.showNested(viewId, meta, navigator);
			if (_view) {
                // deferred event, if specified
				if (eventId) {
                    setTimeout(function() {
                        _view.triggerMethod(eventId);
                    },1);
                }
                return _view;
			} else {
                console.error("Navigator View: %o %o %s", this, navigator, viewId)
                navigator.trigger("navigate", go_to);
            }
			return false;
		}
	}



	ux.mixin.Templating = {
		initializeTemplating: function(options) {
		    var self = this;

			this.getTemplate = function(t) {
				t = t || options.template || this.template || false;
				if (!t || _.isFunction(t)) return t;
//console.log("UX getTemplate() %o %o %o ", this, options, t);
				var template = (self.navigator?self.navigator.templates[t]:false) || ux.compileTemplate(t)
				return template;
			}
		}
	}

	ux.mixin.Nested = {

            initializeNested: function(options) {
			// nested views
		    var self = this;
            self._views = options._views;
		    var _DEBUG = options.debug?true:false;
//	        view._views = view._resolveNested(options.views)
_DEBUG && console.log("nested-init (%s) %o %o", self.id, options, self._views)
            this.on("render", function() {
                console.log("nested-render: %o", self.id, self);
                self.showNestedRegions();
             })
		},

        attachedNestedViews: function($views) {
            $views = $views || $("[data-view]", this.$el);
            var self = this;

            $views.each(function() {
                var $view = $(this);
                var view_id = $view.attr("data-view");
                var view = self.getNestedView(view_id, { model: self.model });
                view.on("navigate", function(g, m) {
                    self.DEBUG && console.log("navigate-parent: %o -> %s -> %o", this, g, m);
                    self.trigger("navigate", g, m);
                });
                self.DEBUG && console.log("Template View: %o -> %s -> %o", this, view_id, view);
                $view.append( view.render().$el );
            });
        },

		showNestedRegions: function(meta) {
            var _DEBUG = this.options.debug?true:false;
			var self = this
			if (!self._views) {
                console.warn("nested: no-region-views: %s -> %o -> %o", self.id, self, meta);
			    return;
//			    throw new Error("meta4:ux:mixin:oops:view-not-nested");
            }
            meta = meta || { model: this.model, collection: this.collection };

            if (self.getRegions) {
                _DEBUG && console.log("nested-region: %s -> %o -> %o -> %o", self.id, self, meta, self.getRegions());
                _.each(self.getRegions(), function(ignore, region) {
                    var view = self._views[region];
                    if (view) self.__showNested( self, view, region, meta );
                    else {
                        _DEBUG && console.warn("nested-region: missing region %s for view %o", region, self);
                    }
                })
            } else {
                console.warn("nested-region: no-regions: %s -> %o", self.id, self);
            }
		},

		__showNested: function(self, v, k, meta) {
		    var _DEBUG = self.options.debug || DEBUG;
            var subview = self.getNestedView(v, meta);
            if(!subview) throw new Error("meta4:ux:mixin:oops:missing-view#"+view_id);

            if (subview.isHome) {
//                DEBUG && console.warn("nested-home: %s -> %o", self.id, subview);
                this.showNestedHome(subview);
            } else if (v.el) {
//                DEBUG && console.warn("nested-dom: %s -> %o", self.id, subview);
                subview.render();
			} else if (self.getChildView && self.getRegion(k)) {
//                DEBUG && console.warn("nested-view: %s --> %o -> %o", k, self, subview);
                self.showChildView(k,subview);
			} else {
			    console.log("Invalid Region: %o @ %s --> %o -> %o", self, k, self.getRegion(k), _.keys(self));
			    throw new Error("meta4:ux:mixin:oops:invalid-view#"+k);
            }
		},

		// nested view[]{} hierarchy and return a k/v of widgets
        _resolveNested:function(views, _views) {
            if (!views) return _views || {};
            _views = _views || {};

            var self = this;
            var _DEBUG = this.options.debug?true:false;

            var _resolveView = function(view,key) {
            	if (_.isString(view)) {
            		var _view = views[view] && _resolveView(views[view],view) || (self.navigator?self.navigator.views.get(view):false);
_DEBUG && console.log("resolve view: %s -> %o --> %o", key, view, _view);
					view = _view;
            	}

            	if (_.isObject(view)) {
            	    view.id = view.id || self.id+"#"+key;
            	    var id = ux.uid(key);
            	    _views[id] = view;
            	}
            	return view;
            }
            _.each(views, _resolveView);
            return _views;
        },

        showNestedHome: function(view) {
            if(!view) throw new Error("meta4:ux:mixin:oops:missing-view#"+view_id);

            // if (view.isHome) {
            //     view.render();
            //     this.$el.empty().append(view.$el);
            //     console.log("nested home (%s): %o -> %o", this.id, this.$el, view);
            //     view.trigger("show");
            // }
        },

        showNested: function(view_id, meta, navigator) {
            var _DEBUG = this.options.debug?true:false;

            var view = this.getNestedView(view_id, meta, navigator);
            if(!view) return false;

            if (view.isHome) {
                this.showNestedHome(view);
                throw new Error("meta4:ux:mixin:oops:deprecated:home#+"+view_id);
            } else if (this.body) {
                this.body.show(view);
                _DEBUG && console.log("show nested (%s): %o -> %o", this.id, this, view);
            } else {
                var $el = view.render().$el;
                this.$el.replaceWith($el);
                _DEBUG && console.log("render nested (%s): %o -> %o", this.id, this.$el, view);
                view.trigger("show");
            }
            return view;
        },

        getNestedView: function(conf, meta, navigator) {
			if (!conf) {
			    console.error("nested: no-view-definition");
			    return false;
            }
            var self = this, widget = false;
            meta = meta || { };
            navigator = navigator || this.navigator;
            var _DEBUG = conf.debug || false;

            // assume model is over-ridden unless explictly false
            if (meta.model===false) {
                meta.model = this.model;
            }

            if(!navigator) throw new Error("meta4:ux:mixin:oops:missing-navigator");
            if (!navigator.views) throw new Error("meta4:ux:mixin:oops:invalid-navigator");

            // resolve "conf" as a view configuration
		    if (_.isFunction(conf)) {
		    	widget = conf(meta, navigator);
		    	conf = {}
		    } else if (_.isArray(conf)) {
		        var views = conf;
                // conf is an ordered list of preferred views
                conf = false;
		        _.each(views, function(view_id) {
                    // try to resolve locally then globally
                    conf = conf || this._views[view_id];//  || navigator.views.get(view_id);
                });
            } else if (_.isString(conf)) {
                // try to resolve locally then globally
                var view_id = conf;
                conf = (this._views?this._views[view_id]:false); // || navigator.views.get(view_id);
                if (!conf) {
                    _DEBUG && console.warn("Missing nested view: %s", view_id);
                    return false;
                }
                _DEBUG && console.log("nested-view: %s -> %o ->%o", view_id, conf, navigator.views);
            }

            // instantiate view (conf) as a Widget

            if (_.isObject(conf)) {
                if (!meta.collection) delete meta.collection;
                if (!meta.model || conf.model===true) delete meta.model;
                var _options= _.extend({}, conf, meta);
                _DEBUG && console.log("nested::models: %s -> %o %o", _options.id, conf, meta);
                if (!_options.id) throw new core.oops.Error("meta4:ux:mixin:oops:unidentified-nested-view", meta);
                widget = navigator.views.view(_options.id, _options, navigator);
                _DEBUG && console.log("nested:widget: %s -> %o -> %o", _options.id, _options, widget);
		    } else throw new core.oops.Error("meta4:ux:mixin:oops:invalid-view-def", conf);

            // bind our parent's navigator
            widget.navigator = navigator;

            if (widget) this.listenToNestedEvents(widget, conf.when);
				// widget.on("all", function() {
				// 	if (arguments[0].indexOf("nested:")<0) {
				// 		arguments[0] = "nested:"+arguments[0];
				// 	}
				// 	console.log("trigger: %s %o <- %o", arguments[0], self, widget);
				// 	trigger.apply(self, arguments);
				// })

            return widget;
		},

        listenToNestedEvents: function(widget, when) {
            var self = this;
            var trigger = this.triggerMethod?this.triggerMethod:this.trigger; // Prefer marionette
            when = _.extend({}, widget.options?widget.options.when:{}, when);

            // bubble nested:events to parent
            _.each(when, function captureNestedEvent(then, when) {
                if (when.indexOf("nested:")==0 && then)   {
                    console.log("WHEN: %s THEN: %s-> %o <-- %o", when, then, self, widget);
                    widget.on(when.substring(7), function triggerNestedEvent() {
                        var args = Array.prototype.slice.call(arguments);
                        args = [when].concat(args);
                        console.log("nested:trigger: %s / %s -> %o <- %o", when, then, this, args);
                        trigger.apply(self, args);
                    });
                }
            });
        }

//		attachNestedListeners: function(widget) {
//			var self = this
//			var listensTo = this.options.listensTo || []
//			widget._isNested = true
//			_.each(listensTo, function(event) {
//				widget.on(event, function() {
//					if (arguments[0].indexOf("nested:")<0) {
//						arguments[0] = "nested:"+arguments[0]
//						trigger.apply(self, arguments)
//					}
//
//				})
//			})
////				if (event=="all") widget.on(event, self.onNestedAll)
//		},
//
//		onNested: function() {
//			var trigger = this.triggerMethod?this.triggerMethod:this.trigger // Prefer marionette
//			if ( arguments[0] == "nested" ) {
//				var args = Array.prototype.slice.call(arguments,1)
//				trigger.apply(this, args)
//			} else {
//				trigger.apply(this, arguments)
//			}
//		}
	}


	ux.mixin.ActionMenu = {

		initializeActionMenu: function(options) {
			if (!options.actions) return;
			var actions = options.actions;

			if (_.isArray(actions.collection)) {
				actions = _.each(actions.collection, function(v,k) {
					if (_.isString(v)) {
						return { id: v, label: v, icon: v }
					}
					if (_.isObject(v)) {
						return _.defaults(v, {label: v.id, icon: v.id })
					}
					if (v===true) {
						return { id: k, label: k, icon: k }
					}
				})
			}

//DEBUG && console.log("ActionMenu(%s) %o %o", this.id, this, options );
			this.on("render", this.renderActionMenu);
		},

		renderActionMenu: function() {
			var self = this
			var options = _.extend({
				model: this.model, isPopOver: false,
				className: "action_menu btn-group pull-right",
				template: "<button class='clearfix btn btn-xs dropdown-toggle' data-toggle='dropdown'><i class='caret'></i></button><ul class='dropdown-menu'></ul>",
				onSelect: function(selection) {
					var vent = self._parent?self._parent:self
//DEBUG &&
console.log("doMenuAction %o %o", selection, vent, (self==vent)?"self":"parent" )

					// call both action forms
					vent.triggerMethod(selection.id, { model: self.model  } )
					this.triggerMethod("action", selection.id, { model: self.model  } )
				}
			}, this.options.actions)

			var $container = options.actionViewContainer?$(options.actionViewContainer, this.$el):this.$el

			var TriggerView = ux.view.MenuButton(options)
			var triggerView = new TriggerView(options)
			triggerView.render().$el.prependTo($container)
		},
	}


	ux.mixin.xCommon = {
		DEBUG: false, isCommon: true,
		initializeCommon:function(options) {
//			var idAttribute = core.idAttribute;
//			options = ux.checkOptions(options, idAttribute);
//			this[idAttribute] = options[idAttribute];
//			this.domEvents = options.events;
DEBUG && console.debug("Mixin Common(%s) %o", this.id || options.id, this)
//			ux.mixin.initializeSelectable.apply(this, [options])
//			ux.mixin.initializeHideable.apply(this, [options])
//			this.template = this.getTemplate(this.template || options.template)
		},
		show: function() {
console.warn("Showing: ", this)
			this.render();
			this.triggerMethod("show")
		},
        doEventTrigger: ux.mixin.Actionable.doAction,
		position: function(event) {
//			if (this.show) this.show();
//			else console.warn("Can't show new position: ", this, event);
			if (!event) throw "meta4:ux:position:oops:missing-event";
            var x = event.screenX?event.screenX:event.pageX;
            var y = event.pageY?event.pageY:event.screenY;
            if (!x || !y) throw "meta4:ux:position:oops:invalid-coords";
			var halfHeight =  (this.$el.height()/2);
			var width = this.$el.width();
			var offsetX = x+width>$(document).width()?x-width:0;
			var offsetY = y-halfHeight<0?0:-halfHeight;

   			this.$el.css({ position: "absolute", top: y+offsetY, left: x+offsetX, "margin-left": 0 });

            if (offsetX) {
                this.$el.removeClass("right");
                this.$el.addClass("left");
            } else {
                this.$el.removeClass("left");
                this.$el.addClass("right");
            }
//DEBUG &&
console.log("UX ViewPort: (%o, %o)", width, $(document).width());
console.log("UX Position: %o (%o, %o) - (%o, %o)", event, x, y, offsetX, offsetY);
			return this.$el.position()
		},
		triggerMethod: Marionette.triggerMethod,
	}

	ux.mixin.HoverPanel = {
		initializeHoverPanel:function(options) {
            if (!this.isHoverPanel || !options.isHoverPanel) {
                return this;
            }

            this.on("show", this.renderHoverPanel);
		},
		renderHoverPanel: function() {
            if (!this.isHoverPanel || !options.isHoverPanel) {
                return this;
            }
			var self = this
			var options = _.extend({ selector: "."}, this.options.hoverpanel);
			if (!options.selector) return
//DEBUG &&
			var $item = options.selector=="."?$(this.$el):$(this.$el).find(options.selector)
			if (!$item || $item.length==0) return
console.debug("renderHoverPanel (%s): %o %o %o", this.options.id, self, options, $item)

			var position = function($this, event) {
				var pageWidth = $(document).width()
				var width = $this.width()
				var x = event.clientX-32, y = event.clientY-32
				if ( x+width>pageWidth) x = pageWidth - $this.width()
				if (x<0) x = 0
				if (y<0) y=0
				$this.css({ position: "absolute", top: y, left: x, "margin-left": 0 });
				return $this.position()
			}

			// attach document listener to remove ALL hover panels on click
			var destroyHoverPanels = function() {
				$(".hoverpanel").each(function() {
					var $this = $(this)
					var view = $this.data("hoverpanel")
					$this.removeClass("hoverpanel")
					view && view.destroy()
					$(".hoverdetail").remove()
				})
			};

			var $body = $("body")
			if (!$body.hasClass("hoverpanel_active")) {
				$body.addClass("hoverpanel_active")
				$(document).on("click.hoverpanel", destroyHoverPanels)
			}
			this.on("destroy", destroyHoverPanels)

			// each selected item gets it's own hover panel
			$item.each(function() {
				var $this=$(this)
				var showPanel = false, removePanel = false
				var hoverpanelView = _.extend({}, $this.attr("data-view"), options.view);

                hoverpanelView.id = hoverpanelView.id || (self.id || core.uuid() ) + "_hover_panel";
//DEBUG &&
console.debug("attach HoverPanel (%o) -> %o", $this, hoverpanelView)

				showPanel = function($event) {
					var view = $this.data('hoverpanel')
DEBUG && console.debug("already HoverPanel (%o): %o", view, $this)
					if (view) return
					destroyHoverPanels()

					view = ux.views.view(hoverpanelView)
					$this.addClass("hoverpanel")
					$this.data('hoverpanel', view)
					view.model = self.model
					view.collection = self.collection

					view.render()
					view.$el.addClass("hoverdetail")
					view.$el.css("zIndex", 2000)
					view.$el.appendTo("body")
					var coords = position(view.$el, $event)
//console.debug("show HoverPanel (%o): %o %o", viewId, view, coords)

					$this.off("mouseenter.hoverpanel", showPanel)
					view.$el.mouseleave(function() {
DEBUG && console.debug("hide HoverPanel: %o %o %o", view, this, $this)
//						view.$el.fadeOut('fast')
						$this.on("mouseleave.hoverpanel", removePanel)
					})
				}

				removePanel = function($event) {
					var view = $this.data('hoverpanel')
DEBUG && console.debug("destroy HoverPanel: %o %o %o", view, this, $this)
					view && view.destroy();
					$this.data('hoverpanel', null)
					$this.on("mouseenter.hoverpanel", showPanel)
					$this.off("mouseleave.hoverpanel", removePanel)
				}

				$this.on("mouseenter", showPanel)
			})
		}
	}

	ux.mixin.StateMachine = {

		initializeStateMachine: function(_options) {
			var _DEBUG = _options.debug || DEBUG
			_.extend(this,Backbone.StateMachine)

			// initial transition to 'welcome'
			if (!_options.transitions) {
				_options.transitions = { init: { initialized: 'start' } }
			}

			// merge global transitions with sub-view transitions
			_.each(_options.views, function(view,k) {
				if (view && view.transitions) {
console.log("State View: %s %o", k, view)
					_options.transitions[k] =  _.extend(view.transitions, _options.transitions[k])
				}
			})
			// initialize state machine
			this.transitions = _options.transitions
			this.states = _options.states || {}

			var self = this
			// merge sub-view state
			_.each(_options.views, function(view,k) {
				self.states[k] =  {}
			})

			_DEBUG && console.debug("Init StateMachine: %o %o", this, _options)
			this.startStateMachine()
			this.on("transition", this.onTransition)
		},

		onTransition: function(from, to, model) {
			var self = this
			setTimeout(function() {
//			console.debug("onTransition: NO-OP: %o %o", from, to)
				self.triggerMethod(to, model)
			}, 0)
		}

	}

	return ux
});
