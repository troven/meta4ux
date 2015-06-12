var self = module.exports = module.exports || {};

// =============================================================================
// framework packages

var _          = require('underscore');     // underscore
// =============================================================================

self.at = function(mixins, meta) {
    if (!mixins || !_.isObject(mixins)) return this
    var _self = this
    _.each(_self, function(option, key) {
         if (key && _.isString(key) && key[0]=="@") {
            if (_.isObject(option)) {
                // recurse
                self.at.call(option, mixins, meta)
            } else {
                 var fn = _.isString(option)?mixins[option]:_.isFunction(option)?option:null
                 key = key.substring(1)
                 if (!_self[key] && fn) _self[key] = fn
            }
         }
    })
    return this
}

