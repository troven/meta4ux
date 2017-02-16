define(["underscore", "Handlebars", "core", "md5"

], function (_, Handlebars, core, md5) {


    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    /*
     Handlebars template helper.
     */

    return function(navigator, options) {
if (!navigator) throw "meta4:oops:ux:templates:missing-navigator";

        return {
            _: function (that) {
//console.error("_: %o %o %o", this, that, this[that])
                return that ? core.ux.uid(that) : core.uuid();
            },
            raw: function (field) {
                console.log("RAW: %o %o %o", this, field, this[field])
                return _.isUndefined(this[field]) ? field : this[field]
            },
            uid: function (that) {
                return that ? core.ux.uid(that) : core.uuid();
            },
            url: function (field) {
                return encodeURIComponent(this[field] || field)
            },
            md5: function (that) {
                return md5(that)
            },
            hash: function (that) {
                return md5(that)
            },
            i18n: function (that) {
                throw "i18n not implemented: " + that
            },
            today: function () {
                return new Date();
            },
            now: function () {
                return new Date().getTime();
            },
            gravatar: function (that) {
                return "http://www.gravatar.com/avatar/" + md5(that.trim().toLowerCase())
            },
            img: function (that, className) {
                if (_.isObject(that)) {
//console.log("icon: %o %o", this,that)
                    return this.img;
                }
                className = _.isString(className) ? className : "pull-right"
                return "<img height='48' class='" + className + "' src='/www/assets/images/" + that + ".png'/>"
            },
            toString: function (x) {
                if (x === void 0) return 'undefined';
                if (_.isArray(x)) return "[]" + x;
                if (_.isObject(x)) return "{}" + x;
                return x.toString();
            },
            lookup: function (args) {
                var hash = args.hash;
                var lookup = navigator.models.get(hash.collection);
                if (!lookup) return "no models @ " + hash.collection;
                var value = this[hash.field];
                var model = lookup.get(value);
//                console.log("lookup: %s = %s -> %o", hash.field, value, lookup);
                if (!model) return value;
                return model.get(hash.label||"label");
            },
            default: function (field, _default) {
                return _.isUndefined(this[field]) ? _default : this[field]
            }
        }
    }
});