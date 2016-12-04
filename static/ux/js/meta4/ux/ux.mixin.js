define(["jquery", "underscore", "marionette", "Handlebars", "core", "ux" ],
	function ($,_, Marionette, handlebars, core, ux) {

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
		var _DEBUG = options.debug || DEBUG

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
					_.defaults(self.options,options);
					 var defaults = _.extend({}, options[optionKey] || options)

					var initializer = self["initialize"+method];
// DEBUG && console.debug("Apply Mixin(): ", options.id, method, optionKey, defaults)
					initializer && initializer.call(self, defaults);
				}
			}
		}
	}

	ux.mixin.attach = function(mixinName, eventList, vents, self, options) {
		if (arguments.length!=5) throw "meta4:ux:oops:incorrect-arguments"
		if (!vents) "meta4:ux:oops:no-vents#"+options.id
		var fnName = "attach"+mixinName
		var fn = self[fnName]
		if (!fn) throw "meta4:ux:oops:missing-"+fnName;

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
			if (!options || _.isEmpty(options)) return
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

//			if (!$el||!$el.length) throw "meta4:ux:oops:element-not-found#"+options.selector;
			setTimeout(function() {
				var $el = options.selector?$(options.selector,self.$el):self.$el
				$el.popover(_options);
//DEBUG && console.debug("Attached PopOver(): %o %o %o %o" , self, _options, $el, self.$el);
			},100)
			return self;
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
						throw "meta4:ux:oops:missing-model";
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
			var self = this
//DEBUG && console.log("Init Sortable: %o %o", this, options)
			this.collection && ux.mixin.attach("Sortable", ["sync"], this.collection, this, options)
			ux.mixin.attach("Sortable", ["show"], this, this, options)
			return this
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

			if (!options.connectWith && !options.containment) options.containment = "parent"

			var _DEBUG = DEBUG || options.debug

			var $el = this.$el;
_DEBUG && console.debug("Attach Sortable: %o %o %o", _options, options, $el)

			var getItemModel = function(ui, collection) {
				var id = ux.identity(ui.item)
				if (!id) throw "meta4:ux:sortable:oops:missing-drop-id";
				return collection?collection.get(id):null
			}

			options.start = function(e,ui) {
				ui.item.data("ux_collection", self.collection)
				var id = ux.identity(ui.item)
console.log("start drag (%s): %o %o - %o %o %o", id, e, ui, this, self, ui.item.data())
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
//DEBUG && console.debug("Init Selectable: %o %o", this, options)
		},

		select: function(selected, event) {
			var _DEBUG = DEBUG || this.options?this.options.debug:false

			if (!selected) throw "meta4:ux:oops:missing-selection";
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
			if (model && this.selectItem) this.selectItem(model, event)
			else if (!model) {
_DEBUG && console.log("** Unknown model for selection: ", selected, event);
				throw "meta4:ux:oops:unknown-selection";
			}
			return model;
		},

		// default event-handler for model selections
		doEventSelect: function(event) {
			if (!event) throw "meta4:ux:oops:select:event-missing";
			var _DEBUG = this.options?this.options.debug:DEBUG
			event.stopImmediatePropagation()
			event.preventDefault()

			var $about = $(event.currentTarget).closest("[data-id]");
_DEBUG &&console.log("doEventSelect (%s) %o %o ", event, this, $about)
			if ($about.length && this.collection) {
				var focus = $about.attr("data-id")
				// handle flat and nested (via _all) collections
				var model = this.collection._all?this.collection._all.get(focus):this.collection.get(focus);
				if (model) {
_DEBUG && console.debug("doEventSelect ID: %o %o -> %o %o %o ", this, event, this.collection, focus, model );
					return this.doSelect(event, model);
				}
			}

			if (this.model) {
_DEBUG && console.debug("doEventSelect: %o %o %o", this, event, this.model );
				return this.doSelect(event, this.model);
			}

			console.error("event: %o $about :%o focus: %o", event, $about, focus)
			throw "meta4:ux:oops:select:not-found";
		},

		// Fire select/deselect events on source model and create/update a Selection model
		doSelect: function(event, model) {
			if (!model) throw "meta4:ux:oops:select:model-missing";
			this.triggerMethod("select", model, event );
			return this;
		}
	}

	// Actionable
	// triggers event based on data-trigger

	ux.mixin.Actionable = {
		initializeActionable: function(options) {
DEBUG && console.log("Mixin Actionable(%s) %o %o", this.id, this, options );
		},

		doEventAction: function(e) {
            if (!e || !e.currentTarget) throw "meta4:ux:oops:missing-action-target"
			var $this = $(e.currentTarget);

			var action = $this.attr("data-trigger") || $this.attr("data-action")
			if (!action) throw "meta4:ux:oops:missing-action-trigger"

			var model = this.collection?this.collection.get(action): false
			var meta = _.extend({}, { model: model || this.model, collection: this.collection }, $this.data() )

			// call both action forms
			this.triggerMethod( "action:"+action, meta )
			this.triggerMethod("action", action, meta )
console.log("trigger [action:%s] %o %o", action, this, meta );

			// trigger navigate?
			var go_to = $this.attr("data-navigate")
			if (go_to) {
				this.triggerMethod("navigate", go_to, meta )
console.log("navigate [%s] %o %o", go_to, this, meta );
			}

			ux.muffle(e);
			return this;
		}
	}


	ux.mixin.Navigator = {

		initializeNavigator: function(options) {
//			this.on("nested:navigate", this.onNavigate)
		},
		doNavigate: function(e) {
//			if (!this._resolveNested) return
			var $this = $(e.currentTarget)
			var go_to = $this.attr("data-navigate") || $this.attr("data-trigger")
			if (!go_to) throw "meta4:ux:oops:missing-navigate";
//DEBUG &&
console.log("doNavigate (%s): %o", go_to, this)
			this.triggerMethod("navigate", go_to)
			e.stopImmediatePropagation();
		},
//		onNavigate: function(model) {
//			if (! model || !this.getNestedView) return
//			var go_to = model.get("view") || model.id
//			this.navigateTo(go_to)
//		},
		navigateTo: function(go_to, meta) {
			var viewId = false, eventId = false;
console.log("navigateTo (%s): %o", go_to, meta)

			// split view@event syntax into 2 tokens
			var where = go_to?go_to.split("@"):0
			if (where.length>1) { viewId = where[1]; eventId = where[0]; }
			else viewId = go_to;
			var self = this
			var _view = this.getNestedView(viewId, meta)

			// FIX: MenuButton seems to double trigger
			if (_view) {
				this.body && this.body.show(_view)
				setTimeout(function() {
					eventId && _view.triggerMethod(eventId)
				},0)
				_.each(this._views, function(conf, _viewId) {
					if (_viewId.indexOf(viewId)==0 || conf.id.indexOf(viewId)==0) {
						self.triggerMethod("navigate:home", _viewId, _view)
					}
				})
				return _view;
			}
			console.error("Missing View: %o %o %s", this, ux.views, viewId)
			return false;
		}
	}



	ux.mixin.Templating = {
		initializeTemplating: function(options) {
			this.getTemplate = function(t) {
				t = t || this.options.template || this.template
//console.log("UX getTemplate() %o %o %o %o", this, options, t, ux.templates[t] );
				if (!t || _.isFunction(t)) return t;
				var template = ux.templates[t] || ux.compileTemplate(t)
				return template;
			}
		}
	}

	ux.mixin.Nested = {

		initializeNested: function(options) {
			// nested views
		    var view = this;
		    var _DEBUG = options.debug || DEBUG
	        view._views = view._resolveNested(options.views)
_DEBUG && console.log("Init Nested(%s) %o %o", view.id, options, view._views)
            this.on("show", function() {
                view.showAllNested()
             })
		},

		showAllNested: function(meta) {
			var self = this
			if (!self.getNestedView || !self._views) throw "meta4:ux:oops:view-not-nested";

			_.each(self._views, function(v,k) {
				self.__showNested( self, v, k, meta )
			})
		},

		__showNested: function(self, v, k, meta) {

//_DEBUG && console.log("__showNested (%s): %s", this.options.id, k)
		    var _DEBUG = self.options.debug || DEBUG
			if (v.el) {
//_DEBUG && console.log("Nested DOM: (%s @ %s) %o %o %o", k, v.el, v, self, subview)
                var subview = self.getNestedView(v, meta)
                if (subview) {
                        self.listenTo(subview)
                        subview.render()
//                        .$el.appendTo( $(v.el) )
                }
			} else if (self[k] && self[k].show && self.regions[k]) {
				var subview = self.getNestedView(v, meta)
				if (subview) {
//_DEBUG && console.log("Show Nested (%s): %o %o %o", k, v, self, subview)
					self.listenTo(subview)
					self[k].show(subview)
				}
			}
		},

		// nested view[]{} hierarchy and return a k/v of widgets
        _resolveNested:function(views, _views) {
            if (!views) return _views || {};
            var self = this;
            _views = _views || {}
            var _resolveView = function(view,key) {
            	if (_.isString(view)) {
//            		key = view
            		var _view = views[view] && _resolveView(views[view],view) || ux.views.get(view)
//console.log("_resolveView: %o %o -> %o / %o", key, view, _view, ux.views.attributes)
					view = _view
            	}
//            	else if (_.isArray(view)) ux.nested(view,_views)

            	if (_.isObject(view)) {
            	    view.id = view.id || self.id+"#"+key
            	    var id = ux.uid(key)
//console.log("---> %s %s %o -> %o", key, id, view, _views)
            	    _views[id] = view
//console.log("ResolvedView (%s) %o", id, view)
//					view.views && self._resolveNested(view.views, _views)
            	}
            	return view;
            }

//console.log("_resolveViews: %o %o", self, views)
            _.each(views, _resolveView)
            return _views
        },

		getNestedView: function(conf, meta) {
			if (!conf) return false;
    	    var widget = false
            meta = meta || {}
            if (meta.model===false) meta.model = this.model

		    if (_.isFunction(conf)) {
		    	widget = conf(meta);
		    	conf = {}
		    } else {

                // try to resolve locally then globally
		    	if (_.isString(conf)) conf = this._views[conf] || ux.views.get(conf);

		    	if (_.isObject(conf)) {
					meta = _.extend({}, conf, meta)
					meta.id = conf.id || "_ux_"+ux._viewIDcounter++
					widget = ux.views.view(meta.id, meta );
		    	}
		    }

            if (widget && !widget._isNested && !conf.isDetached) {
				var self = this
				var trigger = this.triggerMethod?this.triggerMethod:this.trigger // Prefer marionette
				widget._isNested = true
				widget.on("all", function() {
					if (arguments[0].indexOf("nested:")<0) {
						arguments[0] = "nested:"+arguments[0]
					}
					trigger.apply(self, arguments)
				})
            }
            return widget
		},

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
			if (!options.actions) return
			var actions = options.actions

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
			this.on("render", this.renderActionMenu)
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


	ux.mixin.Common = {
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
			this.on("show", this.renderHoverPanel)
		},
		renderHoverPanel: function() {
			var self = this
			var options = _.extend({ selector: "."}, this.options.hoverpanel)
			if (!options.selector) return
//DEBUG &&
			var $item = options.selector=="."?$(this.$el):$(this.$el).find(options.selector)
			if (!$item || $item.length==0) return
console.debug("renderHoverPanel: %o %o %o", self, options, $item)

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
