define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.HTML = ux.view["meta4:ux:HTML"] = function(options) {
		options = ux.checkOptions(options);
		options = _.extend({editable: true, editing: false, edited: { rows: 20, cols: 120, toolbar: {} }, attached: {}, metaKey: "template", autoHide: true }, options);
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
		} );

		editor_options.toolbar = _.extend({
			"reference": function(locale, _options) {
				var label = (locale.reference && locale.reference.edit) || "Reference";
				return "<li><div class=''><a class='btn' data-scorpio4-event='reference' title='" + label + "'><i class='cog'></i>&nbsp;Reference</a></div></li>";
			},
			"viewer": function(locale, _options) {
				var label = (locale.reference && locale.reference.edit) || "Viewer";
				return "<li><div class=''><a class='btn' data-scorpio4-event='viewer' title='" + label + "'>Viewer</a></div></li>";
			},
/*
			"galleryx": function(locale, _options) {
				var label = (locale.reference && locale.reference.edit) || "Gallery";
				return "<li><div class='btn-group'><a class='btn' data-scorpio4-event='gallery' title='" + label + "'>Gallery</a></div></li>";
			},
*/
			"gallery": function(locale, _options) {
				var label = (locale.reference && locale.reference.edit) || "Dummy";
console.debug("Toolbar: Extra: %o %o", locale, _options);
				var html =
				"<li class='dropdown'>" +
					 "<a class='btn dropdown-toggle' data-scorpio4-event='dummy' data-toggle='dropdown' href='#' title='"+label+"'>" +
					 "<i class='icon-briefcase'></i>&nbsp;<b class='caret'></b></a>" +
					 "<ul class='dropdown-menu'>" +
					   "<li><a data-wysihtml5-action='insertProperty' data-wysihtml5-action-value='{{test_1}}'>Test 1</a></li>" +
					   "<li><a data-wysihtml5-action='insertProperty' data-wysihtml5-action-value='{{test_2}}'>Test 2</a></li>" +
					"</ul>" +
				"</li>";
				return html;
			},

			"thing": function(locale, _options) {
				var label = (locale.reference && locale.reference.edit) || "Thing";
				return "<li><div class='btn-group'><a class='btn' data-scorpio4-event='thing' title='" + label + "'>"+label+"</a></div></li>";
			},
		}, options.edited.toolbar);

		var HTML = Backbone.Marionette.ItemView.extend(_.extend({
			editTemplate: options.template || "<div><textarea data-id='{{id}}' cols='"+options.edited.cols+"' rows='"+options.edited.rows+"' placeholder='{{comment}}'>{{"+options.metaKey+"}}</textarea></div>",
			className: "ux_html",
			initialize: function() {
				ux.model(options, this);
				this.decideTemplate();
			},
			events: {
				"click .ux_html_view": "doActivate"
			},
			doActivate: function(event) {
                event.preventDefault();
				if (!options.editing && options.editable) {
DEBUG && console.debug("HTML doActivate", options.editing?true:false, event );
				    this.triggerMethod("activate");
				}
			},
			doDeactivate: function(event) {
                event.stopImmediatePropagation();
DEBUG && console.debug("HTML doDeactivate", options.editing?true:false, event );
	            this.triggerMethod("deactivate");
			},
			doDeactivateBody: function(event) {
                event.stopImmediatePropagation();
DEBUG && console.debug("HTML doDeactivate Body", options.editing?true:false, event );
	            this.triggerMethod("deactivate");
			},

			onDrop: function(model,view,ui,event) {
DEBUG && console.debug("HTML onDrop", this, model, view, ui, event);
				var $html = $(model.get('template'));
				$html.addClass("ux_imported");
				$html.attr("rel", model.id);
				self.editor.composer.commands.exec("insertHTML", "<div class='ux_fact' data-id='"+model.id+"'>"+$html.html()+"</div>");
			},
			onSelect: function(that) {
DEBUG && console.debug("HTML onSelect", this, that);
			},
			onShow: function() {
DEBUG && console.debug("HTML onShow", this, editor_options);
				ux.factualize(this, options.factualizer);
				this.initializeAttachable(options.attached);
				this.initializeDroppable({ droppable: { selector: ".ux_html" }});
			},

			onActivate: function() {
    			var self = this;
DEBUG && console.debug("HTML onActivate", this, this.options.editing);
                this.options.editing = true;
				this.decideTemplate();
                this.render();
			},
			onDeactivate: function() {
DEBUG && console.debug("HTML onDeactivate", this, this.options.editing);
                this.syncModel();
                this.options.editing = false;
				this.decideTemplate();
                this.render();
			},
			onRender: function() {
    			var self = this;
			    this.activateEditor();
                self.$el.hover(null, function(event, ui) {
                    var contained = $.contains( self.$el, $(event.target) );
DEBUG && console.debug("HTML Hover Off", contained, event, $(event.target), self.$el);
                    if (options.autoHide) self.doDeactivateBody(event, ui);
                });
			},

			decideTemplate: function () {
    			var isEditing = this.options.editing?true:false;
    			if (isEditing) {
    			    this.template = this.editTemplate;
    			    return;
    			}
    			var viewTemplate = this.model.get(options.metaKey);

                var reOpen = new RegExp('{{', 'g');
                var reClose = new RegExp('}}', 'g');
    			viewTemplate = viewTemplate.replace( reOpen,  "<span class='ux_html_block'>");
    			viewTemplate = viewTemplate.replace( reClose, "</span>");
    			viewTemplate = "<div data-id='{{id}}' class='ux_html_view'>"+viewTemplate+"</div>";
				this.template = viewTemplate;
DEBUG && console.debug("HTML View Template: ", isEditing, viewTemplate);
			},

			syncModel: function() {
                var $textarea = $("textarea", this.$el);
                if (!$textarea || !$textarea.length) return;
                var html = $textarea.val() || "<hr/>";
                this.model.set(options.metaKey, html )
                return html;
			},

			activateEditor: function() {
				var self = this;
				var isEditing = this.options.editing?true:false;
DEBUG && console.debug("HTML is editing:", isEditing, this.options);
				if (!isEditing) return;

                var $textarea = $("textarea", this.$el);
DEBUG && console.debug("HTML TextArea:", this, self.options, $textarea);
                if (!$textarea.length) throw "meta4:ux:oops:missing-textarea";

                var _options = _.extend({
                    "events": {
                        "load": function(that) {
DEBUG && console.debug("HTML Loaded", this, that);
                            self.triggerMethod("load", this, that);
                        },
                        "focus": function(that) {
DEBUG && console.debug("HTML Focused", this, that);
                            self.triggerMethod("focus", this, that);
                        },
                        "blur": function(that) {
DEBUG && console.debug("HTML Blurred", this, that);
//                            self.triggerMethod("deactivate");
                            self.triggerMethod("blur", this, that);
                        },
                        "paste": function(that) {
DEBUG && console.debug("HTML Paste", this, that);
                            var pasted = $textarea.val() || "<hr/>"
                            self.model.set(options.metaKey, pasted )
                            self.triggerMethod("paste", this, that, pasted);
                        },
                        "change": function(that) {
DEBUG && console.debug("HTML Changed", this, that);
                            self.triggerMethod("change", this, that);
                        },
                        "newword:composer": function(that) {
                            var html = $textarea.val() || "<hr/>";
DEBUG && console.debug("HTML new word", this, html);
                            self.model.set(options.metaKey, html )
                            self.triggerMethod("compose", this, that, html);
                        }
                    }
                }, editor_options);

                $textarea.wysihtml5('deepExtend', _options);
                this.wysihtml5 = $textarea.data("wysihtml5");
                this.editor = $textarea.data("wysihtml5").editor;
DEBUG && console.debug("HTML wysihtml5", _options, this.wysihtml5, this.editor );
                this.editor.focus();
                $(".btn", this.wysihtml5.toolbar).click(function(event) {
                    var $this = $(this);
                    var method = $this.attr("data-scorpio4-event") || $this.attr("data-wysihtml5-command");
DEBUG && console.debug("HTML toolbar", method, self.editor, event);
                    if (method) {
                        self.triggerMethod("toolbar:"+method, self, $this, event);
                        self.triggerMethod("toolbar", method, self, $this, event);
                    }
                })
                $("[data-wysihtml5-action]", this.wysihtml5.toolbar).click(function(event) {
                    event.preventDefault();
                    var $this = $(this);
                    var action = $this.attr("data-wysihtml5-action");
                    self.triggerMethod("toolbar:"+action, self, $this, event);
                    self.triggerMethod("toolbar", action, self, $this, event);
DEBUG && console.debug("HTML toolbar action: ", action, self.editor, event);
                });

                this.wysihtml5.toolbar.Toolbar

DEBUG && console.debug("HTML Editor Activated", self);
			},
			getItemView: function(that) {
				var View = Backbone.Marionette.ItemView.extend({ template: that.get(options.metaKey) });
DEBUG && console.debug("HTML getItemView", that, View);
				return View;
			},
			selectItem: function(selection) {
DEBUG && console.debug("HTML SelectItem", this, selection);
				this.model = selection;
				this.render();
			},

			// CUSTOM TOOL BAR ACTIONS

			onToolbarInsertProperty: function(view, $this, event) {
                var value = $this.attr("data-wysihtml5-action-value");
DEBUG && console.debug("HTML onToolbarInsertProperty", value, view, $this, event);
                if (!value) return;
                this.editor.focus();
                this.editor.composer.commands.exec("insertHTML", "<span class='ux_html_block'>"+value+"</div>");
                this.editor.focus();
			}
		}, ux.mixin.Common, ux.mixin.Attachable, ux.mixin.Droppable), {
			sample: options.template || "<label class='ux_sample' data-id='{{id}}'>Example: {{label}}</label>",
			className: "ux_html"
		});

		return HTML;
	}

    $.fn.wysihtml5.locale = {
        en: {
            font_styles: {
                normal: "Normal",
                h1: "H 1",
                h2: "H 2",
                h3: "H 3",
                p:  "Para"
            },
            emphasis: {
                bold: "B",
                italic: "I",
                underline: "U"
            },
            lists: {
                unordered: "Unordered list",
                ordered: "Ordered list",
                outdent: "Outdent",
                indent: "Indent"
            },
            link: {
                insert: "Insert link",
                cancel: "Cancel"
            },
            image: {
                insert: "Insert image",
                cancel: "Cancel"
            },
            html: {
                edit: "Edit HTML"
            },
            colours: {
                black: "Black",
                silver: "Silver",
                gray: "Grey",
                maroon: "Maroon",
                red: "Red",
                purple: "Purple",
                green: "Green",
                olive: "Olive",
                navy: "Navy",
                blue: "Blue",
                orange: "Orange"
            }
        }
    };

    $.fn.wysihtml5.locale = {
        en: {
            font_styles: {
                normal: "Normal",
                h1: "H 1",
                h2: "H 2",
                h3: "H 3",
                p:  "Para"
            },
            emphasis: {
                bold: "B",
                italic: "I",
                underline: "U"
            },
            lists: {
                unordered: "Unordered list",
                ordered: "Ordered list",
                outdent: "Outdent",
                indent: "Indent"
            },
            link: {
                insert: "Insert link",
                cancel: "Cancel"
            },
            image: {
                insert: "Insert image",
                cancel: "Cancel"
            },
            html: {
                edit: "Edit HTML"
            },
            colours: {
                black: "Black",
                silver: "Silver",
                gray: "Grey",
                maroon: "Maroon",
                red: "Red",
                purple: "Purple",
                green: "Green",
                olive: "Olive",
                navy: "Navy",
                blue: "Blue",
                orange: "Orange"
            }
        }
    };

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "HTML",
        "label": "HTML",
        "comment": "A rich HTML editor based on wysihtml5",
        "mixins": [ ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.HTML
    }

})
