define(["underscore", "core"], function (_, core) {

    var fact = core.fact;

    return {

        model: function(attributes, options) {
            var self = this
            var errors = []
            options = options || { debug: true }
            var schema = options.schema || (self.collection&&self.collection.options&&self.collection.options.schema?self.collection.options.schema:{})
            var _DEBUG = options.debug || fact.DEBUG
//_DEBUG&&
            console.log("Validate Model: %o %o / %o %o", this, schema, attributes, options)

            var validate = fact.validate
            attributes = attributes || this.attributes
            options = options || this.options

            _.each(schema, function(meta,k) {
//console.log("Validate Attr: %o %o", k, meta)
                var v = attributes[k]
                if (meta) {
                    // ubiquitous, so add some syntax sugar
                    if (meta.required) {
                        var error = validate.attribute(k, v, attributes, fact.validators.required )
                        error && errors.push(error)
                    }

                    // field-specific validation
                    var error = validate.attribute(k, v, attributes, meta.validators)
                    error && errors.push(error)

                    // generic field-type validation
                    var type = meta[fact.typeAttribute]
                    if (type) {
                        var validators = fact.validators[type.toLowerCase()]
//console.log("Validate Type: %o %o %o / %o %o", k, v, type, validators, meta.validators)
                        var error = validate.attribute(k, v, attributes, [ validators ] )
                        error && errors.push(error)
                    }
                }
            })

            var hasErrors = (errors && errors.length)
            if (hasErrors) {
                console.warn("Model Invalid: %o %o", self, errors)
                self.trigger && self.trigger("invalid", errors)
                return errors;
            }
        },

        attribute: function(fieldId, value, attributes, validators) {
            if (!validators) return false
            var error = false
// DEBUG && console.debug("validateField (%s:=%s) %o", fieldId, value, validators)
            _.each(validators, function(validator) {
                var validate = fact.validators[validator]

                if (_.isObject(validate)) {
                    var valid = true
                    var pattern = validate.pattern || validate.regexp
                    if (pattern) {
                        var regex = new RegExp(pattern)
                        valid = value.match(regex)?true:false
                    }
                    if (valid && validate.fn && _.isFunction(validate.fn) ) {
                        valid = validate.fn(value, attributes)
                    }
                    if (!valid) {
//DEBUG &&
                        console.warn("invalid (%s) ", fieldId, valid, validator, validate)
                        error = { id: fieldId, message: validate.message }
                    }
                }
            })
            return error;
        }
    }
});
