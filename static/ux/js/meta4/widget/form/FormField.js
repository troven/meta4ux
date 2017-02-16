define(["jquery", "underscore", "backbone", "marionette", "core", "ux"], function ($, _, Backbone, Marionette, core, ux) {

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";
    var DEBUG = false

    var FormField = Backbone.Marionette.ItemView.extend({
        tagName: "button", className: "btn btn-default", template: "{{label}}",

        tagName: "div", className: "form-group row form-field",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label>",
        events: {
            "focus [name]": "onFocus",
            "blur [name]": "onBlur"
        },
        onRender: renderField,
        validate: validateField,
        commit: commitField,

        initialize: function(options) {
            ux.initialize(this, options);
        },

        getDefault: function(value) {
            if (!_.isUndefined(value)) return value;
            console.log("getDefault: %o --> %o or %o", this, value, this.options.default);
            return this.options.default || "";
        },
        onInvalid: function(invalid) {
            this.model.set("message", invalid.message);
            this.render();
            $(".message", this.$el).show();
        },
        onValid: function() {
            $(".message", this.$el).hide();
        }
    }

    renderField: function () {
            if (this.options.hidden) {
                this.$el.hide();
                return this;
            }
            var $fields = $("[name]", this.$el);
            var self = this;
//DEBUG && console.log("renderField: %o", self)
            $fields.each(function () {

                var $field = $(this)
                var fieldId = $field.attr("name")
                var value = self.options.formModel.get(fieldId)
                if (typeof value == "undefined") value = self.options.default || "";
                DEBUG && console.log("renderField: %s %o %o", fieldId, value, $field)
                $field.val("" + value)

                // enabled/disabled
                if (self.options.editable === false) {
                    $field.attr("disabled", true)
                    $field.removeClass("editable");
                } else {
                    $field.attr("disabled", null)
                    $field.addClass("editable");
                }
                self.options.hidden && $field.addClass("hide");
            });

            return this;
        },

        validateField: function (value, model) {

            model = model || this.options.formModel
            this.model.set("message", "")
            var invalid = {}
            var fieldId = this.model.get(idAttribute)
            var self = this

            var model_validators = this.model.get("validators")

            // merge validation (schema/model, editor/widget)
            var validators = [];
            validators = validators.concat(model_validators);
            validators = validators.concat(this.validators);

            DEBUG && console.log("validateField (%s) %o %o %o", fieldId, this.validators, model_validators, validators);

            _.each(validators, function (validator) {
                var validate = ux.view.validators[validator];

                if (value && _.isObject(validate)) {
                    var valid = true
                    var pattern = validate.pattern || validate.regexp
                    if (pattern) {
                        var regexp = new RegExp(pattern);
                        //DEBUG &&
                        console.log("is %o valid?: %s --> %s %s -> %o", fieldId, value, validator, pattern, valid)
                        valid = value.match(regexp) ? true : false
                    }
                    if (validate.fn && _.isFunction(validate.fn)) {
                        valid = validate.fn(value, model.attributes, self.model.attributes)
                        //DEBUG && console.log("valid fn: %s %s -> %o", validator, validate.fn, valid)
                    }
                    if (!valid) {
                        invalid = validate
                    }
                }
            })

            DEBUG && console.warn("validateField (%s): %o %o %o", fieldId, validators, invalid)

            if (invalid && invalid.message) this.triggerMethod("invalid", {message: invalid.message, model: model})
            else this.triggerMethod("valid")
            return invalid;
        },

        setModelField: function ($field, model) {
            $field = $field || this.$el;
            model = model || this.model;
            var fieldId = $field.attr("data-id") || $field.attr("name");
            if (!fieldId) {
                // console.warn("anonModelField: %o", $field)
                return
            }

            var value = $field.val();
            value = this.getDefault && this.getDefault(value);
            var invalid = this.validate ? this.validate(value, model) : {};
            console.warn("$et %o field = %o ==> %o / %o <-%s", fieldId, value, this, invalid, this.getDefault ? "getDefault" : "noDefault");

            if (!invalid || !invalid.message) {
                model.set(fieldId, value);
                DEBUG && console.log("updatedField(%s): %o %o", fieldId, value, model)
            }
        },

        commitField: function () {
            var self = this
            var model = self.options.formModel;
            var $field = this.$el;
            var $fields = $("[name]", $field);

            if (!$fields || !$fields.length) {
                setModelField.call(self, $field, model);
                this.triggerMethod("commit", model, $field);
            } else {
                $fields.each(function () {
                    var $this = $(this)
                    setModelField.call(self, $this, model)
                    self.triggerMethod("commit", model, $this)
                })
            }
            return true;
        },
        commitGroupFields: function(event) {
            var self = this;
            var $fields = this.$el || $(event.currentTarget);
//DEBUG &&
            console.log("CommitGroupFields: %o %o %o", this, event, $fields);
            $("[name]", $fields).each(function() {
                var submodel = self.options.formModel.get(self.options.id);
                console.log("CommitGroupField: %o %o %o", self, submodel, this);
                if (!submodel) {
                    submodel = new Backbone.Model();
                    self.options.formModel.set(self.options.id, submodel);
                }
// console.log("CommitGroupField: %o %o %o", self, submodel, this)
                commitField.call(self, $(this));
            });
            return true;
        }
    }, ux.mixin.Common);

//    var FormField = ux.view.FormField = ux.view["meta4:ux:FormField"] = Backbone.Marionette.ItemView.extend( _.extend({{}));

    return {
        "id": "FormField",
        "label": "FormField",
        "comment": "A mapping of a data entry widget to a model attribute",
        "mixins": false,
        "views": true,
        "collection": true,
        "options": true,
        "schema": true,
        "fn": ux.view.Form
    };
}
