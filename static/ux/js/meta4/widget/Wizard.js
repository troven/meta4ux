define(["jquery", "underscore", "backbone", "marionette", "core", "ux", "backbone_statemachine"], function ($,_, Backbone, Marionette, core, ux) {

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";

    ux.view.Wizard = ux.view["meta4:ux:Wizard"] = function(options) {
        options = ux.checkOptions(options);
        var DEBUG = options.debug || ux.DEBUG;

        var Header = Backbone.Marionette.ItemView.extend({
            template: "<h2>{{label}}</h2><div>{{comment}}</div>"
        })

        var Footer = Backbone.Marionette.ItemView.extend({
            isTemplating: true, isActionable: true,
            events: {
                "click [data-action]": "doEventAction"
            },
            initialize: function(options, _wizard) {
                options.template = "<span class='btn btn-default pull-left' data-action='cancel'>Cancel</span><span class='btn btn-primary pull-left hide' data-action='previous'>Previous</span><span class='btn btn-success pull-right hide' data-action='finish'>Finish</span><span class='btn btn-primary pull-right hide' data-action='next'>Next</span>"
                ux.initialize(this, options)
                this._wizard = _wizard;
DEBUG && console.log("Footer: Init: %o", options)
            },
            onAction: function(step) {
DEBUG && console.log("Footer: Navigate (%s)", step)
                this._wizard.triggerMethod(step)
            },
            onRender: function() {
                var $el = $("[data-action]",this.$el);
DEBUG && console.log("Footer: Render %o %o", this, $el)
                this.showButtons(this.options.buttons)
            },
            x_onShow: function() {
DEBUG && console.log("Footer: onShow: %o", this)
DEBUG && console.log("-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --")
            },

            showButtons: function(buttons) {

                if (!buttons) buttons = { "cancel": true, "finish": false }
DEBUG && console.debug("Footer: Buttons: %o %o", this.$el, buttons);
                $("[data-action]", this.$el).addClass("hide")
                _.each(buttons, function(v, k) {
                    var $button = $("[data-action='"+k+"']", this.$el)
                    if (v && $button.length) {
DEBUG && console.debug("Footer: Button: %s %o -> %o", k, v, $button)
                        $button.removeClass("hide")
                    }
                })
            }
        })

        options.template =  options.template || ux.compileTemplate("<div class='ux_wizard container modal-content'><header class='ux_wizard_header modal-header'></header><div class='ux_wizard_body modal-body'></div><footer class='ux_wizard_footer modal-footer'></footer></div>");

        var StatefulWizard = _.extend({
            isNested: true,
            template: options.template,
            regions: {
                header: ".ux_wizard_header" ,
                body: ".ux_wizard_body",
                footer: ".ux_wizard_footer"
            },
            initialize: function(_options) {
                //this.options.views.header = _options.views.header || _.pick(options, ["label", "comment"])
                //this.options.views.footer = _options.views.footer || { buttons: { previous: false, cancel: true, next: true, finish: false } }

//				this.options.views.header.allowMissingEl = true
//				this.options.views.footer.allowMissingEl = true

                ux.initialize(this, _options)
                if (!this.model) {
                    this.model = new this.collection.model()
console.debug("New Model: %o -> %o", this.collection, this.model)
                }

                // initial transition to 'start'
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
                this.transitions = _options.transitions;
                this.states = _options.states || _options.views;
                this.on("transition", this.onTransition);

                this.startStateMachine();

                DEBUG && console.debug("Init Wizard: %o %o", this, options)
                return this;
            },
            onTransition: function(from, to) {
                if (!this.body) {
                    // we're probably finished - or broken
DEBUG && console.debug("No Body: %o -> %o", from, to);
                    return;
                }

                var self = this
                var currentView =  this.body.currentView;
                var tx = self.transitions[to];
                this.$el.removeClass("invalid")

                // check view is valid
                if (currentView) {
                    var attrs = currentView.model.toJSON();
                    this.model.set( attrs );

                    if (currentView.validate) {
                        var is_invalid = currentView.validate(this.model);
DEBUG && console.debug("View Valid: %o -> %o", tx, is_invalid);
                        if (is_invalid) {
                            setTimeout(function() {
                                // ensure state fully transitioned before backtrack
                                self.$el.addClass("invalid")
                                self.toState(from)
                            },100);
                            return false;
                        }
                    }
                }

                // check model is valid?
                var is_invalid = this.model.validate();

                var view = this.getNestedView(to);
                view.model = this.model;
DEBUG && console.debug("onTransition: %s -> %s == %o / %o -> %o", from, to, tx, currentView, view);

DEBUG && console.debug("To View (%s): %o %o", to, view, attrs);

                if (view && view.render) {
                    self.body && self.body.show(view);
                    self.listenTo(view);

                    if (self.header) {
                        self.header.currentView.model = new Backbone.Model(_.pick(view.options,[labelAttribute, "comment", "icon"]));
                        self.header.currentView.render();
                    }

                    if (self.footer) {
                        self.footer.currentView.render();
                        self.footer.currentView.showButtons(tx);
                    }

                } else {
                    DEBUG && console.error("Missing View: %s / %s -> %o", to, tx, view);
                }

                // trigger per-transition Event
                to && this.triggerMethod(to);

            },
            onPrevious: function() {
console.debug("onPrevious: %o %o", this, arguments)
            },
            onCancel: function() {
                this.destroy();
            },
            onFinish: function() {
                var self = this;
                var state = this.currentState;

                var is_invalid = this.model.validate();
                var isCloseOnFinish = core.isDefaultTrue(self.options, "closeOnFinish");
console.debug("onFinish: %o %o %o", is_invalid, isCloseOnFinish, state)

                this.model.save();
                if (!is_invalid && isCloseOnFinish) {
                    this.destroy()
                }
            },
            onShow: function() {
                var self = this;
                var header = new Header(this.options.views.header, this)
                this.header.show(header);

                var footer = new Footer(this.options.views.footer, this);
                this.footer.show(footer);

                setTimeout(function() {
                    self.trigger('initialized');
                }, 100)
                DEBUG && console.debug("onShow: %o %o %o", this, $(".ux_wizard_footer",this.$el), this.options.views.footer );
            }
        },Backbone.StateMachine );

        return Backbone.Marionette.LayoutView.extend(StatefulWizard);
    }

    // Widget meta-data allows runtime / editor to inspect basic capabilities

    return {
        "id": "Wizard",
        "label": "Wizard",
        "comment": "A state-based, mutli-step, wizard",
        "emits": ["action", "navigate", "commit"],
        "mixins": [ "isTemplating", "isStateful" ],
        "views": true,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": ux.view.Wizard
    }

})
