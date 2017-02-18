define(["underscore"], function (_) {

    isPrimitive = function(arg) {
        var type = typeof arg;
        return arg == null || (type != "object" && type != "function");
    }

    isString = function(arg) {
        return ("string" == typeof arg);
    }


    return {

        compile: function(query) {
            if (_.isFunction(query)) return;

            var self = this
            return function(data) {
                return self.match(data, query)
            }
        },

        match: function(data, query) {
            var self = this;
            var matched = true;
            var DEBUG = false;
            var _query = query.attributes?query.attributes:query;
            _.each(_query, function(v,k,o) {
                if (k == "*") {
                    // any key
                    var m = false;
                    _.each(data, function(v1,k1,o1) {
                        if (isPrimitive(v1)) {;
                            var r = self.evaluate(v, k1, data);
                            console.log("*= %o %o %o", v, k1, data, r, m);
                            m = m || r;
                        }
                    })
                    matched = matched && m;
                } else {
                    matched = matched && self.evaluate(v,k,data);
                }
            });

            DEBUG && console.log("matched: %o & %o -> %s", data, query, matched);
            return matched;
        },

        evaluate: function(v,k,data) {
            var self = this;
            var matched = true;
            var DEBUG = false;

            if (_.isFunction(v)) {
                DEBUG && console.log("filter:fn: %s -> %s", k, v);
                matched = matched && v(data[k], k, data);
            } else if (_.isArray(v)) {
                // or
                var m = false;
                DEBUG && console.log("filter:[]: %s -> %s", k, v);
                _.each(v, function(vv) {
                    m = m || self.test(k, data[k], vv);
                })
                matched = ml
            } else if (_.isObject(v)) {
                DEBUG && console.log("filter:{}: %s -> %s", k, v);
                // and
                _.each(v, function(vv,kk) {
                    matched = matched && self.test(kk, data[k], vv);
                });
            } else {
                DEBUG && console.log("filter:=: %s -> %s", k, v);
                matched = matched && self.test(k, data[k], v);
            }
            return matched;
        },

        test: function(test, v, data) {
            if (_.isString(this.fn[test])) { return this.fn[this.fn[test]](v,data) }
            if (_.isFunction(this.fn[test])) { return this.fn[test](v,data) }
            return v == data;
        },

        fn: {
            $regex: function(a,b) {
                if (!isString(a) || !isString(b)) return false;
                return a.match(b)?true:false
            },
            $contains: function(a,b) {
                if (!isString(a) || !isString(b)) return false;
                var r = a.toUpperCase().indexOf(b.toUpperCase())>=0
//console.log("$contains: %o %o -> %s", a,b, r)
                return r;
            },
            "=": function(a,b) { return a == b },
            "==": function(a,b) { return a === b },
            $eq: function(a,b) { return a == b },
            $ne: function(a,b) { return a != b },
            "!=": function(a,b) { return a != b },
            $le: function(a,b) { return a <= b },
            "<=": function(a,b) { return a <= b },
            $lt: function(a,b) { return a < b },
            "<": function(a,b) { return a < b },
            $ge: function(a,b) { return a >= b },
            ">=": function(a,b) { return a >= b },
            ">": function(a,b) { return a > b },
            $gt: function(a,b) { return a > b }
        },

    }

})