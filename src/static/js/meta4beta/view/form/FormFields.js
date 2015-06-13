define(["jquery", "underscore", "backbone", "marionette", "core", "ux",
    "select2"
],
    function ($, _, Backbone, Marionette, scorpio4, ux, select2) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var DEBUG = false

    var fields = ux.view.fields = ux.view.fields || {}

    var renderField = function() {
        var self = this
//DEBUG && console.log("renderField: %o", self)
        $("[name]", this.$el).each(function() {
            var $field = $(this)
            var fieldId = $field.attr("name")
            var value = self.options.formModel.get(fieldId)
            if (typeof value == "undefined") value = self.options.default || "";
DEBUG && console.log("renderField: %s %o %o", fieldId, value, $field)
            $field.val( ""+value )
            if (self.options.editable===false) {
                $field.attr("disabled", true)
                $field.removeClass("editable");
            } else {
                $field.attr("disabled", null)
                $field.addClass("editable");
            }
            self.options.hidden && $field.addClass("hide");
        })
        return this;
    }

    var validateField = function(value, model) {
        var validators = this.model.get("validators");
        model = model || this.options.formModel
        this.model.set("message", "")
        var invalid = {}
        var fieldId = this.model.get(idAttribute)
        var self = this
//        return true; // TESTING
// DEBUG && console.debug("validateField (%s:=%s) %o %o %o %o", fieldId, value, field, _options, validators, invalid)

        _.each(validators, function(validator) {
            var validate = ux.view.validators[validator]

            if (_.isObject(validate)) {
                var valid = true
                if (validate.regexp) {
                    var regexp = new RegExp(validate.regexp)
                    valid = value.match(regexp)?true:false
DEBUG && console.log("valid rx: %s %s -> %o", validator, validate.regexp, valid)
                }
                if (validate.fn && _.isFunction(validate.fn) ) {
                    valid = validate.fn(value, model.attributes, self.model.attributes)
DEBUG && console.log("valid fn: %s %s -> %o", validator, validate.fn, valid)
                }
                if (!valid) {
                    invalid = validate
                }
            }
        })

DEBUG && console.warn("validateField (%s): %o %o %o", fieldId, validators, invalid)

        if (invalid && invalid.message) this.triggerMethod("invalid", { message: invalid.message, model: model } )
        else this.triggerMethod("valid")
        return invalid;
    }

    var setModelField = function($field, model) {
      $field = $field || this.$el
      model = model || this.model
// console.warn("$field: %o", $field)
      var fieldId = $field.attr("data-id") || $field.attr("name")
      if (!fieldId) {
// console.warn("anonModelField: %o", $field)
        return
      }

      var value = $field.val()
      var invalid = this.validate?this.validate(value, model):{}
      if (!invalid || !invalid.message) {
          model.set(fieldId, value )
DEBUG && console.log("updatedField(%s): %o %o", fieldId, value, model)
      }
  }

    var commitField = function() {
        var self = this
        var model = self.options.formModel;
        var $field = this.$el
        var $fields = $("[name]", $field)

        if (!$fields || !$fields.length) setModelField.call(self, $field, model)
        else {
            $fields.each(function() {
                setModelField.call(self, $(this), model)
            })
        }

// console.log("CommitField(%s): %o %o %o <- %o", self.options.id, this, model, $field, $fields.length?$fields.length+" fields": "field")
        return true;
    }

    var commitGroupFields = function(event) {
        var self = this
        var $fields = this.$el || $(event.currentTarget)
//DEBUG &&
console.log("CommitGroupFields: %o %o %o", this, event, $fields)
        $("[name]", $fields).each(function() {
            var submodel = self.options.formModel.get(self.options.id)
             if (!submodel) {
                submodel = new Backbone.Model();
                self.options.formModel.set(self.options.id, submodel)
             }
// console.log("CommitGroupField: %o %o %o", self, submodel, this)
            commitField.call(self, $(this))
        })
        return true;
    }

	var FormField = ux.view.FormField = ux.view["meta4:ux:FormField"] = Backbone.Marionette.ItemView.extend( _.extend({
	    tagName: "div", className: "form-group",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label>",
        onRender: renderField,
        validate: validateField,
        commit: commitField,
        onInvalid: function(invalid) {
            this.model.set("message", invalid.message)
// console.log("onInvalid: %o %o", this, arguments);
            this.render()
            $(".message", this.$el).show();
        },
        onValid: function() {
// console.log("onValid: %o %o", this, arguments);
            $(".message", this.$el).hide();
        }
    }, ux.mixin.Common));

    // Field Editors

    fields.Text  = FormField.extend({
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='20' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.LongText = FormField.extend({
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-6'><input class='form-control' placeholder='{{comment}}' size='40' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.TextArea = FormField.extend({
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-6'><textarea class='form-control' placeholder='{{comment}}' cols='{{default 'cols' 60}}' rows='{{default 'rows' 5}}' name='{{id}}'></textarea></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Number = FormField.extend({
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-2'><input class='number form-control' placeholder='{{comment}}' size='4' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>",
        validators: ["number"]
    })

    fields.Currency = FormField.extend({
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-2'><input class='form-control currency' placeholder='{{comment}}' size='4' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>",
        validators: ["currency"]
    })

    fields.Email = FormField.extend({
        validators: ["email"],
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='16' type='email' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.URL = FormField.extend({
        validators: ["url"],
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='16' type='url' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Date = FormField.extend({
        validators: ["date"],
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-6'><input class='form-control' placeholder='{{comment}}' size='16' type='date' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Password = FormField.extend({
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='12' type='password' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Button = FormField.extend({
        template: "<label class='col-sm-3 control-label'></label><div class='col-sm-2'><span data-trigger='{{id}}' class='btn btn-default' title='{{comment}}'>{{label}}</span></div>"
    })

    fields.Boolean = FormField.extend({
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' type='checkbox' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Select = Backbone.Marionette.CompositeView.extend({
        className: "form-group",
        childViewContainer: "select",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-8'><select class='col-sm-6' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>",
        events: {
            "blur select": "commit",
            "change": "doSelection"
        },
        childView: Backbone.View.extend({
            tagName: "option",
            initialize: function(_options) {
                this.options = _.extend({}, this.options, _options)
                this.template = ux.compileTemplate(_options.template)
            },
            render: function() {
                var label = this.template(this.model.toJSON())
                this.$el.prop("value", this.model.get(idAttribute)).text(label)
                return this;
            }
        }),
        childViewOptions: function() {
            return _.extend({ template: "{{label}}" }, this.options.child || this.options.values )
        },
        initialize: function(options) {
            options = _.extend({}, this.options, options)
            this.collection = ux.lookup(options.collection || options.options)
        },
        commit: commitField,
        onRender: renderField,
        onShow: function() {
            var $select = $("select",this.$el);
            var self = this
//DEBUG && console.log("onShow Select: %o %o", this, $select)
            $select.select2(_.extend({ width: "element" }, this.options.select2))
            $select.on("change", function() {
                self.commit($select);
            })
        }
    })

    fields.Boolean = fields.Select.extend({
        options: { options: { true: "Yes", false: "No" } }
    })

    fields.Tags = fields.Select.extend({
        onShow: function() {
DEBUG && console.log("Tag Show: %o %o", this, this.collection)
            renderField.apply(this, arguments)
            $("select",this.$el).select2({tags: true, multiple: true })
        }
    })

    fields.Checkbox = Backbone.Marionette.CompositeView.extend({
        className: "form-group",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><ul class='col-sm-4 form-group-container'></ul><div class='message text-danger'>{{message}}</div>",
        events: { blur: "doCommit", "change": "doCommit" },
        childView: Backbone.Marionette.ItemView.extend({
            tagName: "span",
            template: "<li><input type='checkbox' id='{{id}}' name='{{id}}' value='true'/>&nbsp;<label for='{{name}}'>{{label}}</label></li>",
            onRender: renderField
        }),
        childViewContainer: ".form-group-container",
        childViewOptions: function(model) {
            return _.extend({ formModel: this.model }, model.attributes)
        },
        initialize: function(options) {
//                options.childView = ux.view.fields.SelectOption
            var values = options.options
            this.collection = ux.lookup(values)
            if (!this.collection) throw "meta4:form:oops:missing-lookup#"+values
//                options.values = values
DEBUG && console.log("Checkbox: %o %o %o", this, options, this.collection?this.collection.toJSON():"Missing Lookup")
        },
        doCommit: function() {
            commitGroupFields.apply(this, arguments)
        },
        commit: function() {
DEBUG && console.log("CommitCheckbox: %o", this)
        },
        onRender: renderField
    })

    fields.Selector = Backbone.Marionette.CompositeView.extend({
        className: "form-group",
        template: "<span class='col-sm-4 control-label' title='{{comment}}'>{{label}}</span><div class='selector col-sm-8'></div><div class='message text-danger'>{{message}}</div>",
        events: {  },
        childEvents: { "click .selection": "commit" },
        childViewContainer: ".selector",
        childView: Backbone.Marionette.ItemView.extend({
            template: "<span data-icon='{{id}}'>{{label}}</span>", className: "selection btn btn-info",
        }),
        initialize: function(options) {
            var values = options.options
            this.collection = ux.lookup(values)
console.log("Selector %o %o %o", this, options, this.collection)
        },
        commit: function() {
            var invalid = this.validate?this.validate(value, model):{}
DEBUG && console.log("CommitField(%s): %o %o %o %o %o", fieldId, this, model, $field, value, invalid)
            if (!invalid||!invalid.message) {
            model.set(this.options.id, value )
DEBUG && console.log("ValidFormField(%s): %o", fieldId, value, model)
            } else {
DEBUG && console.log("InvalidFormField(%s): %o", fieldId, value, model)
            }
            this.triggerMethod("commit")
        },
        x_commit: commitField,
        onRender: renderField
    })

    fields.Upload  = FormField.extend({
        className: "form-group",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4' class='col-sm-6'><input class='form-control' placeholder='{{comment}}' size='4' type='file' name='{{id}}'/></div></div><div class='message text-danger'>{{message}}</div>",
        onRender: function() {
        },
        commit:  function(model, $field) {
            var self = this

            model = model || this.options._form.model
            var formData = new FormData();

            var $inputs = $("input[type=file]", this.$el)
            var uploadCount = 0
            $inputs.each(function() {
                _.each(this.files, function(file) {
                    formData.append(self.model.id, file, file.name)
                    uploadCount++
                })
            })
            if (!uploadCount) return;

            // copy all attributes, except ours
            _.each(model.attributes, function(v,k) {
                if (!self.model.id==k) formData.append(k,v)
            })

            // upload API
            var url = this.options.url || model.url()
            // reset the file fields
            $inputs.replaceWith( $inputs.clone( true ) );

            // perform multi-part upload
            var then = new Date().getTime()
            $.ajax({ url: url, data: formData,
                processData: false, contentType: false, type: 'POST',
                success: function(response) {
                    var elapsed = Math.ceil((new Date().getTime()-then)/1000)
                    var bitRate = response.data.size/elapsed
                    var data = _.extend({ elapsed: elapsed, bitRate: bitRate },response.data)
                    model.set(self.model.id, data )
                    console.log("Uploaded: %s %o %o", self.model.id, model, data, response)
                }
            });
        }
    })

    fields.Form = function(options) {
        var subOptions = _.extend({}, options.model.attributes, options)
        Field = new ux.view.Form(subOptions)
DEBUG && console.log("Child SubView: %o %o", options, subOptions, Field);
        return Field;
    }

    // synonyms

    fields.String = fields.Text
    fields.Integer = fields.Number
 	return ux;
})
