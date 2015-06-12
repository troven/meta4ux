define(["jquery", "underscore", "backbone", "marionette", "core", "ux", "backbone_statemachine"], function ($,_, Backbone, Marionette, core, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";

    ux.view.Wizard = ux.view["meta4:ux:Wizard"] = function(options) {
		options = ux.checkOptions(options);
		var DEBUG = true && ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='ux_wizard container modal-content'><header class='ux_wizard_header modal-header'></header><div class='ux_wizard_body modal-body'></div><footer class='ux_wizard_footer modal-footer'></footer></div>");

        var Header = Backbone.Marionette.ItemView.extend({
        	template: "<h2>{{label}}</h2><div>{{comment}}</div>"
		})

        var Footer = Backbone.Marionette.ItemView.extend({
            template: "<span class='btn btn-default pull-left' data-navigate='cancel'>Cancel</span><span class='btn btn-primary pull-left hide' data-navigate='previous'>Previous</span><span class='btn btn-success pull-right hide' data-navigate='finish'>Finish</span><span class='btn btn-primary pull-right hide' data-navigate='next'>Next</span>",
            events: {
                "click [data-navigate]": "doNavigate"
            },
            initialize: function(options, _wizard) {
                ux.initialize(this,options)
                this._wizard=_wizard;
            },
            doNavigate: function(e) {
                var step = $(e.currentTarget).attr("data-navigate")
console.log("Wizard Navigate (%s): %o %o ", step, $(e.currentTarget), e)
                this._wizard.triggerMethod(step)
            },
            onShow: function() {
                this.showButtons(this.options.buttons)
            },
            showButtons: function(buttons) {
            	if (!buttons) buttons = { "cancel":true, "finish": true }

                $("[data-navigate]", this.$el).addClass("hide")
                _.each(buttons, function(v,k) {
                    var $button = $("[data-navigate='"+k+"']", this.$el)
//console.debug("showButton: %o %o %o", v,k, $button)
                    v?$button.removeClass("hide"):$button.addClass("hide")
                })
            }

        })

		var StatefulWizard = _.extend({
			isNested: true,
	 		template: options.template,
		 	regions: { header: ".ux_wizard_header" , body: ".ux_wizard_body", footer: ".ux_wizard_footer" },
			initialize: function(_options) {
                this.options.views.header = _options.views.header || _.pick(options, ["label", "comment"])
                this.options.views.footer = _options.views.footer || { buttons: { previous: false, cancel: true, next: true, finish: false } }

//				this.options.views.header.allowMissingEl = true
//				this.options.views.footer.allowMissingEl = true

				this.model = new Backbone.Model()
				ux.initialize(this, _options)

				// initial transition to 'welcome'
                _options.transitions = _.extend({
                	init: { initialized: 'start' }
				}, _options.transitions)

                // merge global transitions with sub-view transitions
				_.each(_options.views, function(view,k) {
				    if (view.transitions) {
				    	_options.transitions[k] =  _.extend(view.transitions, _options.transitions[k])
				    }
				})
				// initialize state machine
				this.transitions = _options.transitions
				this.states = _options.states || _options.views
				this.on("transition", this.onTransition)
				this.startStateMachine()
//console.debug("Init Wizard: %o %o", this, options)
				return this;
			},
			onTransition: function(from,to) {
				if (!this.body) return; // we're probably finished - or broken
//console.debug("Wizard Model: %o %o", this.body.currentView, this.model.attributes)
				var currentView =  this.body.currentView

				currentView && this.model.set(currentView.model.toJSON())

				 var view = this.getNestedView(to)
				 view.model = this.model
console.debug("Wizard Transition (%s -> %s): %o %o %o", from, to, this.model.attributes, view, this)

				this.header.currentView.model = new Backbone.Model(_.pick(view.options,[labelAttribute, "comment", "icon"]))
				this.header.currentView.render()

                 to && this.triggerMethod(to)
                 if (view && view.render) {
					 var tx = this.transitions[to]
					 this.body && this.body.show(view)
					 this.footer && this.footer.currentView.showButtons(tx)
					 this.listenTo(view)
                 }
			},
			onCancel: function() {
    			this.destroy()
			},
			onFinish: function() {
				var self = this
				var state = this.currentState
				this.model.on("all", function() {
					console.log("Model %o %o", self.model, arguments)
				})
				this.model.once("save", function() {
					var isCloseOnFinish = core.isDefaultTrue(self.options, "closeOnFinish");
console.log("isCloseOnFinish: %o %s %s", self, state, isCloseOnFinish)
					if (isCloseOnFinish) {
						self.destroy()
					}
				})
				this.model.once("invalid", function() {
console.log("Revert: %o %s", self, state)
					self.toState(state)
				})

			},
			onShow: function() {
			    var header = new Header(this.options.views.header, this)
				var footer = new Footer(this.options.views.footer, this);
console.debug("Wizard onShow: %o %o", this, $(".ux_wizard_footer",this.$el) )

			    this.header.show(header)
			    this.footer.show(footer)
                this.trigger('initialized')
			}
		},Backbone.StateMachine)

		return Backbone.Marionette.LayoutView.extend(StatefulWizard)
	}

return ux;})
