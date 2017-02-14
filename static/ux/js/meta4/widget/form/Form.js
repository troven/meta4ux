define(["jquery", "underscore", "backbone", "marionette", "core", "ux", "meta4/model/validates" ],
    function ($, _, Backbone, Marionette, core, ux, validate) {

	ux.view.Form = ux.view["meta4:ux:Form"] = function(options) {

    	var DEBUG = options.debug || ux.DEBUG;

		var FieldSet = Backbone.Marionette.CompositeView.extend( _.extend({
		    isActionable: true, isNested: true,
            template: options.template || "<fieldset/>",
            childViewContainer: "fieldset",
			className: "form-fields",
            events: {
                "blur [name]": "doBlurFieldEvent",
                "click [data-trigger]": "doAction",
                "click [data-action]": "doAction"
            },
			initialize: function(_options) {
                var self = this;
			    _.defaults(_options, { model: false, editable: true , autoCommit: true, autoValidate: true, field: { css: "row" }  } )
				ux.initialize(this, _options)

				if (!this.model) throw "meta4:ux:oops:missing-model#"+_options.id

				this.collection = new Backbone.Collection() // Collection of Fields

                console.debug("Form Editors: %o -> %o", this, _.keys(ux.view.fields) );

                var schema =   _options.schema || _options.views || {}
                var col_schema = this.model&&this.model.collection?this.model.collection.schema:false
//DEBUG&&
				this._buildSchemaCollection( schema, col_schema );
                console.debug("Form Schema: %o %o %o", this.model, this.model.collection, col_schema);

                // this.model.on("all", function() {
                // });
                this.model.on("invalid", function() {
                    alert("invalid");
                    self.triggerMethod("invalid");
                })

				return this;
			},

            validate: function() {
                var errors = [];
                _.each(this.children._views, function(field, fieldId) {
                    var error = field.validate?field.validate():false;
                    if (error) errors.push(error);
                })
                return errors;
            },

			_buildSchemaCollection: function(schema, col_schema) {
				var self = this
				col_schema = col_schema&&col_schema.toJSON()?col_schema.toJSON():[]

				var isEditable = this.options.editable===false?false:true
				var merged = {};

				// view schema
				_.each(schema, function(field,id) {
					if (_.isString(field)) field = { editor: field }
					field.id = field.id || id
					merged[field.id] = _.extend({},merged[field.id], field)
                    schema[field.id] = field
DEBUG&&console.debug("View Schema: %s %o", id, field)
				})

                // model schema
				_.each(col_schema, function(field,id) {
					field.id = field.id || id
					if (field.id && merged[field.id]) {
						merged[field.id] = _.extend({},merged[field.id], field)
DEBUG && console.debug("Merge Schema: %s %o", field.id, field)
					}
				})

                // set defaults for merged schema

				_.each(merged, function(field, id) {
//console.debug("Field Schema: %s %o", id, field, field.editable)

                    field.editor = field.editor || field.widget || field[ux.typeAttribute] || "Text";

					field.label =  schema[field.id].label || field.label || core.humanize(field.id || id)
					// assume editable 'unless'
					field.editable = (field.editable===false || !isEditable)?false:true
					field.isEditable = (isEditable && field.isEditable)?field.editable:false
					field.required = field.required?true:false
					field.validators = field.validators || []
                    if (field.required) field.validators.push("required")

//DEBUG && console.debug("Schema Field (%s): %o", id, field)
				    self.collection.add(field);
				})
				return merged
			},

            // get Form Field meta-data
			childViewOptions: function(field) {
			    var schema = field.attributes

                var options = _.extend({}, schema, this.options.field, {
                    _form: this,
                    formModel: this.model,
                })
//                options.className = options.className+" "+options.css
DEBUG && console.debug("childViewOptions %o %o -> %o", field, schema, options)
//                ux.stylize(this, options)
                return options;
			},

            // get Child View corresponding to the field's editor widget
            //      @param model : the field meta-data as a BB model

            getChildView: function(field) {
                var editorType = field.get(ux.editorAttribute) || field.get(ux.typeAttribute);
                var Field = ux.view.fields[editorType];
                if (!Field) {
                    Field = this.navigator.widgets.get(editorType);
                    console.log("globalChildWidget: %s %o -> %o", editorType, field, Field);
                    Field = Field && ux.view.fields.ViewField( Field.get("fn"), this.navigator );
                }
                if (!Field) throw "meta4:ux:form:oops:missing-editor#"+field.get(ux.idAttribute)

//DEBUG && console.log("getChildView: %s %o -> %o", editorType, field, Field);
                return Field;
            },

            onRender: function() {
                var $this = $("[name]:first", this.$el)
                setTimeout(function() { $this.select().focus() },200)
            },

            doBlurFieldEvent: function(e) {
                var autoCommit = this.options.autoCommit?true:false;
                this.triggerMethod("blur");

                if (autoCommit) {
                    this._commitField($(e.currentTarget));
                }

                var errors = this.validate();
                console.log("doBlurFieldEvent: %o -> %o", this, errors);
                return this;
            },

            onCommit: function() {
                var self = this
                var $fields = $("[name]", this.$el)
                var isValid = true
DEBUG && console.warn("onCommit: %o %o", this, self.children );
                self.children.each(function(view) {
                    isValid = view.commit && view.commit() && isValid
//                    isValid = view.validate?(view.validate() && isValid):isValid
                })

                if (!isValid) {
                    this.model.trigger("invalid")
                    this.triggerMethod("invalid")
DEBUG && console.log("Invalid Form(%s): %o", this.model.id, this.model);
                } else {
DEBUG && console.log("Saved Form(%s): %o", this.model.id, this.model);
                    this.model.save()
                }
                return isValid;
            },

            _commitField: function($this) {
                var self = this
                var fieldId = $this.attr("data-id") || $this.attr("name")
                if (!fieldId) return;
                var _options = self.collection.get(fieldId)
                if (_.isUndefined(_options)) return; // not our field
                var fieldView = self.children.findByModel(_options);
                if (fieldView && fieldView.commit) fieldView.commit();
            }

		}, ux.mixin.Common));

		return FieldSet;
	}

 	return ux;
})
