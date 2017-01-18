define(["underscore", "Handlebars", "core", "md5"

], function (_, Handlebars, core, md5) {


    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    /*
     Moustache template helper.
     */

    return {
        now: function () {
            return new Date();
        },
        _: function (that) {
//console.error("_: %o %o %o", this, that, this[that])
            return that ? core.ux.uid(that) : core.uuid();
        },
        "raw": function (field) {
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
        lookup: function (field, collection) {
            var models = core.fact.models.get(collection)
            if (!models) return "no models @ " + collection
            var model = models.get(this)
            if (!model) return "no " + this + " in " + collection;
            return model.get(field);
        },
        default: function (field, _default) {
            return _.isUndefined(this[field]) ? _default : this[field]
        }
    }
});