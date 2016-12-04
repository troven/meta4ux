define(["jquery", "underscore", "backbone", "marionette", "core", "ux",
    "select2"
],
    function ($, _, Backbone, Marionette, core, ux, select2) {

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
        });

        return this;
    };

    var validateField = function(value, model) {

        model = model || this.options.formModel
        this.model.set("message", "")
        var invalid = {}
        var fieldId = this.model.get(idAttribute)
        var self = this

        var model_validators = this.model.get("validators")

        // merge validation (schema/model, editor/widget)
        var validators = []
        validators = validators.concat( model_validators );
        validators = validators.concat( this.validators )

DEBUG && console.log("validateField (%s) %o %o %o", fieldId, this.validators, model_validators, validators);

        _.each(validators, function(validator) {
            var validate = ux.view.validators[validator]

            if (_.isObject(validate)) {
                var valid = true
                var pattern = validate.pattern || validate.regexp
                if (pattern) {
                    var regexp = new RegExp(pattern)
                    valid = value.match(regexp)?true:false
//DEBUG && console.log("valid rx: %s %s -> %o", validator, pattern, valid)
                }
                if (validate.fn && _.isFunction(validate.fn) ) {
                    valid = validate.fn(value, model.attributes, self.model.attributes)
//DEBUG && console.log("valid fn: %s %s -> %o", validator, validate.fn, valid)
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

      var value = $field.val();
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

        if (!$fields || !$fields.length) {
            setModelField.call(self, $field, model)
            this.triggerMethod("commit", model, $field)
        } else {
            $fields.each(function() {
                var $this = $(this)
                setModelField.call(self, $this, model)
                self.triggerMethod("commit", model, $this)
            })
        }

// console.log("CommitField(%s): %o %o %o <- %o", self.options.id, this, model, $field, $fields.length?$fields.length+" fields": "field")
        return true;
    };

    var commitGroupFields = function(event) {
        var self = this;
        var $fields = this.$el || $(event.currentTarget);
//DEBUG &&
console.log("CommitGroupFields: %o %o %o", this, event, $fields);
        $("[name]", $fields).each(function() {
            var submodel = self.options.formModel.get(self.options.id);
             if (!submodel) {
                submodel = new Backbone.Model();
                self.options.formModel.set(self.options.id, submodel);
             }
// console.log("CommitGroupField: %o %o %o", self, submodel, this)
            commitField.call(self, $(this));
        });
        return true;
    };

	var FormField = ux.view.FormField = ux.view["meta4:ux:FormField"] = Backbone.Marionette.ItemView.extend( _.extend({
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
            ux.initialize(this,options);
        },
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

    // create a template
    var FieldTemplate = function(options) {
        options = _.extend({ label: { width: 4, label: "label", comment: "comment" }, field: { width: 8}, message: { width: 4, label: "message" } }, options)

        var t = "<label class='col-sm-"+options.label.width+" control-label' title='{{"+options.label.comment+"}}'>{{"+options.label.label+"}}</label>"
        t+="<div class='col-sm-8'>"
        t+="<select class='col-sm-6' name='{{id}}'/>"
        t+="</div><div class='message text-danger'>{{"+options.message.label+"}}</div>"
        return t
    }

    fields.ViewField = function(Field) {

	    if (!Field) throw new Error("ViewField missing")
	    var View = Backbone.Marionette.ItemView.extend({
		    className: "form-group row form-text",
		    template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='field-view col-sm-9'></div><div class='message text-danger'>{{message}}</div>",
		    initialize: function(options) {
			    var View = new Field(options)
			    this.view = new View(options)
		    },
		    onRender: function() {
			    var $el = $(".field-view", this.$el)
			    console.log("FieldView: %o %o", this, $el)
			    $el.append( this.view.render().$el )
			    this.view.triggerMethod("show")
		    }
	    })
	    return View
    }

    // Field Editors

    fields.Text  = FormField.extend({
        className: "form-group row form-text",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='20' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.ID = FormField.extend({
        className: "form-group row form-text",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='12' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>",
        onBlur: function(e) {
            var idAttribute = this.options.id || idAttribute;
            var $field = $(e.currentTarget);
            var slug  = this.model.get(idAttribute);
            if ( this.options.required && !slug) slug = core.uuid();
            if (slug) {
                slug = core.ux.uid(slug);
                this.model.set(idAttribute, slug);
                $field.val(slug);
            }
        }
    });

    fields.LongText = FormField.extend({
        className: "form-group row form-longtext",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-6'><input class='form-control' placeholder='{{comment}}' size='40' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.TextArea = FormField.extend({
        className: "form-group row form-textarea",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-6'><textarea class='form-control' placeholder='{{comment}}' cols='{{default 'cols' 60}}' rows='{{default 'rows' 5}}' name='{{id}}'></textarea></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Number = FormField.extend({
        className: "form-group row form-number",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-2'><input class='number form-control' placeholder='{{comment}}' size='4' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>",
        validators: ["number"]
    })

    fields.Currency = FormField.extend({
        className: "form-group row form-currency",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-2'><input class='form-control currency' placeholder='{{comment}}' size='4' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>",
        validators: ["currency"]
    })

    fields.Email = FormField.extend({
        className: "form-group row form-email",
        validators: ["email"],
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='16' type='email' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.URL = FormField.extend({
        className: "form-group row form-url",
        validators: ["url"],
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='16' type='url' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Date = FormField.extend({
        className: "form-group row form-date",
        validators: ["date"],
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' type='date' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Password = FormField.extend({
        className: "form-group row form-password",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4'><input class='form-control' placeholder='{{comment}}' size='12' type='password' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>"
    })

    fields.Button = FormField.extend({
        className: "form-group row form-button",
        template: "<label class='col-sm-3 control-label'></label><div class='col-sm-2'><span data-trigger='{{id}}' class='btn btn-default' title='{{comment}}'>{{label}}</span></div>"
    })

    fields.Select = Backbone.Marionette.CompositeView.extend({
        className: "form-group row form-select",
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
	        if (!this.collection) {
console.log("Select Schema", options)
		        this.collection = ux.lookup(options.collection || options.options)
	        }
	        ux.initialize(this,options)
        },
        commit: commitField,
        onRender: renderField,
        onShow: function() {
            var $select = $("select",this.$el);
            var self = this
//DEBUG && console.log("onShow Select: %o %o", this, $select)
            $select.select2(_.extend({ width: "element", minimumResultsForSearch: 6 }, this.options.select2))
            $select.on("change", function() {
                self.commit($select);
            })
        }
    })

    // Synonyms

    fields.Lookup = fields.Select;	// TODO: A Lookup has a Create View
    fields.String = fields.Text;
    fields.Integer = fields.Number;

    fields.Boolean = fields.Select.extend({
        className: "form-group row form-boolean",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-8'><select class='col-sm-2' name='{{id}}'/></div><div class='message text-danger'>{{message}}</div>",
        options: { options: { true: "Yes", false: "No" } }
    })

    fields.Tags = fields.Select.extend({
        className: "form-group row form-tags",
        onShow: function() {
DEBUG && console.log("Tag Show: %o %o", this, this.collection)
            renderField.apply(this, arguments)
            $("select",this.$el).select2({tags: true, multiple: true })
        }
    })

    fields.Checkbox = Backbone.Marionette.CompositeView.extend({
        className: "form-group row form-checkbox",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><ul class='col-sm-4 form-group-container'></ul><div class='message text-danger'>{{message}}</div>",
        events: { blur: "doCommit", "change": "doCommit" },
        childView: Backbone.Marionette.ItemView.extend({
            tagName: "span",
            template: "<li><input type='checkbox' name='{{id}}' value='true'/>&nbsp;<label for='{{name}}'>{{label}}</label></li>",
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

    fields.Actions = Backbone.Marionette.CollectionView.extend({
        className: "row", isActionable: true,
        events: {
            "click [data-trigger]": "doEventAction"
        },
        childView: Backbone.Marionette.ItemView.extend({
            tagName: "span",
            "className": "col-sm-2",
            template: "<button data-trigger='{{id}}' type='button' class='btn btn-default' aria-label='Left Align'><span class='glyphicon glyphicon-{{icon}}' aria-hidden='true'></span>{{label}}</button>"
        }),
        initialize: function(options) {
            ux.initialize(this, options)
            this.collection = this.collection || ux.lookup(options.options)
            if (!this.collection) throw "meta4:form:oops:missing-lookup#"
            DEBUG && console.log("Actions: %o %o %o", this, options, this.collection?this.collection.toJSON():"Missing Lookup")
        },
        doAction: function(action) {
console.log("Form Action: %o %o", this, arguments)
        }
    })

    fields.Selects = Backbone.Marionette.CompositeView.extend({
        className: "form-group row form-selects",
        template: "<span class='col-sm-3 control-label' title='{{comment}}'>{{label}}</span><ul class='selects list-group col-sm-9'></ul><div class='message text-danger'>{{message}}</div>",
        events: {  },
        childEvents: { "click .selection": "commit" },
        childViewContainer: ".selects",

	    childView: Backbone.Marionette.ItemView.extend({
		    tagName: "li", className: "list-group-item", isTemplating: true,
		    initialize: function(options) {
			    ux.initialize(this, options)
console.log("childViewInit: %o", options)
		    },
	    }),
	    childViewOptions: function(model) {
		    return _.extend({ template: "{{label}}" },this.options.child)
	    },
	    initialize: function(options) {
            ux.initialize(this,options)
            this.collection = this.collection || ux.lookup(options.options);
console.log("Selector %o %o %o", this, options, this.collection)
        },
        commit: function() {
            var invalid = this.validate?this.validate(value, model):{}
DEBUG && console.log("Commit Selects(%s): %o %o %o %o %o", fieldId, this, model, $field, value, invalid)
            if (!invalid||!invalid.message) {
	            model.set(this.options.id, value );
DEBUG && console.log("Valid Selects(%s): %o", fieldId, value, model);
            } else {
DEBUG && console.log("Invalid Selects(%s): %o", fieldId, value, model);
            }
            this.triggerMethod("commit");
        },
        onRender: renderField
    })

    fields.Upload  = FormField.extend({
        className: "form-group row form-upload",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-4' class='col-sm-6'><input class='form-control' placeholder='{{comment}}' size='4' type='file' name='{{id}}'/></div></div><div class='message text-danger'>{{message}}</div>",
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

            if (!model || !model.url) {
console.log("Model is missing: %o", model.toJSON() )
                return;
            }

            // copy all attributes, except ours
            _.each(model.attributes, function(v,k) {
                if (!self.model.id==k) formData.append(k,v)
console.log("formData:", k, v)
            })

            // upload API
            var url = this.options.url || model.url()+"/_upload_"

            // reset the file fields
            $inputs.replaceWith( $inputs.clone( true ) );

console.log("Upload: %s %o", self.model.id, this.options)

            // perform multi-part upload
            var then = new Date().getTime()

            var opts = {}
            if (model.collection && model.collection.options) opts = model.collection.options.upload || opts
            opts.id = model.id || model.cid
            url = url+"?"+core.toQueryString(opts)

            $.ajax({ url: url, data: formData,
                processData: false, contentType: false, type: 'POST',
                success: function(response) {
                    var elapsed = Math.ceil((new Date().getTime()-then)/1000)
                    var bitRate = response.data.size/elapsed

                    var file = _.extend({ elapsed: elapsed, bitRate: bitRate },response.data);

					// update model
                    model.set(self.model.id, file )

                    // trigger event
console.log("Uploaded: %s @ %s -> %o %o", self.model.id, url, model, file)
                    self.triggerMethod("upload", file)
                },
                error: function() {
                    self.triggerMethod("upload-failed")
                }
            });
        }
    })

        fields.Image  =  fields.Portrait = fields.Upload.extend({
        className: "form-group row form-portrait",
        template: "<label class='col-sm-3 control-label' title='{{comment}}'>{{label}}</label><div class='col-sm-6'><img class='clickable' title='{{comment}}' alt='{{comment}}'/><input style='display:none' type='file' name='{{id}}'/></div></div><div class='message text-danger'>{{message}}</div>",
        events: {
            "click img": "doUploadClick"
        },
        initialize: function(options) {
            ux.initialize(this,options)
            this.on("upload", this.render)
        },
        doUploadClick: function() {
            var $input = $('input', this.$el)
            $input.click();
        },
        onUpload: function() {
//            this.commit();
//            this.triggerMethod('render');
        },
        onRender: function() {
            var self = this
            var model = this.options._form.model
            var file = model.get(this.options.id)
            var url = file && file.get("url")
console.log("Portrait [render]: %o %o %o", file, url );
            if (!url) {
                url = "./img/icons/default_"+this.options.id+".png";
                file = new Backbone.Model( _.extend({ "id": this.options.id, "url": url}, file) );
console.log("Portrait [default]: %o %o @ %s -> %s", file, model, this.options.id, url);
            } else {
console.log("Portrait: %o %o @ %s -> %s", file, model, this.options.id, url);
                url = this.options.baseURL?this.options.baseURL+url:"./"+url
            }

            $("img", this.$el).attr("src", url)

            $("input", this.$el).change(function() {
console.log("Portrait: input changed: %o", this)
                self.commit();
            })
        }
    })

    fields.Form = function(options) {
        var subOptions = _.extend({}, options.model.attributes, options)
        Field = new ux.view.Form(subOptions)
DEBUG && console.log("Child SubView: %o %o", options, subOptions, Field);
        return Field;
    }
 	return ux;
})
