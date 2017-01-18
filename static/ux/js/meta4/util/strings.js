define(["jquery", "underscore"], function ($,_) {

    /**
     Utilities to deal with Strings (including special cases for 'id' strings)
     **/

    return {

        /**
         Generate a reasonably unique UUID
         **/
        uuid: function() {
            function _id() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
            return (_id()+"-"+_id()+"-"+_id()+"-"+_id()+"-"+_id()+"-"+_id()+"-"+_id()+"-"+_id());
        },

        /**
         Generate a scoped UUID by pre-pending a prefix
         **/
        urn: function(prefix) {
            return (prefix || core[idAttribute])+"#"+this.uuid();
        },

        url: function(path) {
            var ix = path.indexOf("://");
            if (ix<0) throw new Error("Missing URL protocol: "+path);
            var proto = path.substring(0,ix+3);
            var remain = path.substring(ix+3);
            remain = remain.replace("\\", "/").replace("//", "/");
            return proto+remain;
        },

        /**
         Turn camel-cased strings into a capitalised, space-separated string
         **/
        humanize: function(s) {
            return s.replace(/\W+|_|-/g, " ").toLowerCase().replace(/(^[a-z]| [a-z]|-[a-z])/g, function($1) { return $1.toUpperCase() });
        },

        toQueryString: function(obj, prefix) {
            serialize = function(obj, prefix) {
                var str = [];
                for(var p in obj) {
                    if (obj.hasOwnProperty(p)) {
                        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                        str.push(typeof v == "object" ?
                            serialize(v, k) :
                        encodeURIComponent(k) + "=" + encodeURIComponent(v));
                    }
                }
                return str.join("&");
            }
            return serialize(obj, prefix)
        }
    }
});