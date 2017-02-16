define(["jquery", "underscore", "backbone", "marionette", "core", "ux", "meta4/model/validates" ], function ($, _, Backbone, Marionette, core, ux, validate) {

    ux.view.FieldSet = ux.view["meta4:ux:FieldSet"] = function(options, navigator) {

        var DEBUG = true; // options.debug || ux.DEBUG;

        var FieldSet = Backbone.Marionette.CompositeView.extend( _.extend({
            isActionable: true, isNested: true,
            template: options.template || "<fieldset/>",
            childViewContainer: "fieldset",className: "form-fields",
            events: {
                "blur [name]": "doBlurFieldEvent",
                "click [data-trigger]": "doAction",
                "click [data-action]": "doAction"
            },
            initialize: function(_options) {
                var self = this;
                _.defaults(_options, { model: false, editable: true , autoCommit: true, autoValidate: true, field: { css: "row" }  } )
                this.can = _.extend({ edit: true  }, _options.can);

                ux.initialize(this, _options, navigator);

                if (!this.model) throw "meta4:ux:oops:missing-model#"+this.options.id

                this.collection = new Backbone.Collection() // Collection of Fields

                var schema =   _options.schema || _options.fields || {}
                var model_schema = this.model&&this.model.collection?this.model.collection.schema:false
                this._fields = this._buildFields( schema, col_schema );
                console.debug("FieldSet: %o %o %o", this._fields );

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

            _buildFields: function(schema, col_schema) {
                var self = this;

                var isEditable = this.can.edit===false?false:true;
                var fieldset = new Backbone.Collection();

                _.each(arguments, function(fields) {
                    if (fields.toJSON) fields = fields.toJSON();
                    _.each(fields, function(field,id) {
                        if (_.isString(field)) field = { editor: field };
                        field.id = field.id || id;
                        var merge = fields.get(field.id);
                        field _.extend({
                            label: core.humanize(field.id || id),
                            editable: isEditable, hidden: false,
                            validators: [], required: false,
                            editor: Text
                        }, (merge.toJSON?merge.toJSON():{}) , field);

                        field.widget = field.widget || field.editor;
                        if (field.required) {
                            field.validators.push("required");
                        }
                        DEBUG && console.debug("FieldSet field: %s %o", id, field);
                        field.add(field);
                    });
                })

                return fieldset;
            },

            // get Form Field meta-data
            childViewOptions: function(field) {
                var schema = field.attributes
                var options = _.extend({}, schema, { _form: this, formModel: this.model })
                DEBUG && console.debug("childViewOptions %o %o -> %o", field, schema, options)
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

            refocus: function() {
                // focus on first field
                var $this = $("[name]:first", this.$el);
                setTimeout(function() { $this.select().focus() },200)
            },

            onRender: function() {
                this.refocus();
            },

            doBlurFieldEvent: function(e) {
                var autoCommit = this.options.autoCommit?true:false;

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
                    this.model.trigger("invalid");
                    this.triggerMethod("invalid");
                    DEBUG && console.log("Invalid Form(%s): %o", this.model.id, this.model);
                } else {
                    DEBUG && console.log("Saved Form(%s): %o", this.model.id, this.model);
                    this.model.save();
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

    return {
        "id": "FieldSet",
        "label": "FieldSet",
        "comment": "Manage data capture &amp; validation using a collection of fields",
        "mixins": false,
        "views": true,
        "collection": true,
        "options": true,
        "schema": true,
        "fn": ux.view.Form
    };

    return ux;
})
