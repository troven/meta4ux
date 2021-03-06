define(["underscore", "core", "meta4/model/validators"], function ( _, core, validators ) {


    if (!validators) throw "meta4:oops:validators:missing";

    var self = {

        model: function(attributes, options) {
            var errors = [];
            options = options || { debug: true };
            var model = this;
            var schema = options.schema || (this.collection&&this.collection.options&&this.collection.options.schema?this.collection.options.schema:{});
            var _DEBUG = options.debug?true:false;
            if (!schema || _.isEmpty(schema)) {
                console.log("No Validate Schema: %o ", this);
                return false;
            }
//_DEBUG&&
            console.log("Validate Model: %o %o\n%o using %o", this, schema, attributes, validators);

            attributes = attributes || this.attributes;
            options = options || this.options;
            var _validators = validators;

            _.each(schema, function(meta,k) {
                var v = attributes[k];
                var error = false;

                if (meta) {
                    // ubiquitous, so add some syntax sugar
                    if (meta.required) {
                        error = self.attribute(k, v, attributes, [_validators.required] );
                    }

                    // field-specific validation
                    if (!error) {
                        error = self.attribute(k, v, attributes, meta.validators);
                    }

                    // generic field-type validation
                    if (!error) {
                        var type = meta[core.fact.typeAttribute];
                        if (type) {
                            var validate = _validators[type.toLowerCase()];
                            error = self.attribute(k, v, attributes, [ validate ] );
                        }
                    }
                    console.log("Validate? %s == %s: %o -> %o --->", k, v, meta, _validators, !error);
                    error && errors.push(error);
                }
            })

            var hasErrors = (errors && errors.length);
            if (hasErrors) {
                console.error("Invalid Model: %o %o", model, errors);
                model.trigger && model.trigger("invalid", errors);
                return errors;
            }
            return false;
        },

        attribute: function(fieldId, value, attributes, validators) {
            if (!validators) return false;
            var error = false;
            value = value || "";
// DEBUG && console.debug("validateAttribute(%s:=%s) %o", fieldId, value, validators)
            _.each(validators, function(validate) {

                if (_.isObject(validate)) {
                    var valid = true;
                    var pattern = validate.pattern || validate.regexp;
                    if (pattern) {
                        var regex = new RegExp(pattern);
                        valid = value.match(regex)?true:false;
                    }
                    if (valid && validate.fn && _.isFunction(validate.fn) ) {
                        console.debug("validateFn (%s:=%s) %o", fieldId, value, validate.fn)
                        valid = validate.fn(value, attributes);
                    }
                    if (!valid) {
//DEBUG &&
                        console.warn("invalid (%s) -> %o %o", fieldId, valid, validate);
                        error = { id: fieldId, message: validate.message };
                    }
                }
            })
            return error;
        }
    }

    return self;
});
