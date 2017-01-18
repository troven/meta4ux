define(["underscore"], function (_) {

    return function(options) {
        options = options || {};
        var i18n = _.extend({}, options.i18n);

        return {

            Error: function(msg, meta) {
                this.constructor.prototype.__proto__ = Error.prototype;
//                Error.captureStackTrace(this, this.constructor);
                this.name = this.constructor.name;
                this.label = i18n[msg] || msg;
                this.message = msg;
                this.meta = meta;
                console.log("ERROR: %s --> %o", this.label, this.meta);
                return this;
            },

            Arguments: function(msg, meta) {
                this.constructor.prototype.__proto__ = Error.prototype;
//               Error.captureStackTrace(this, this.constructor);
                this.name = this.constructor.name;
                this.message = msg;
                this.meta = meta;
                return this;
            }
        }

    }
});