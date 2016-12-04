define(["jquery", "underscore", "backbone", "core"], function ($,_,Backbone,core) {

	var idAttribute = core.idAttribute
	var typeAttribute = core.typeAttribute
    var DEBUG = false && core.DEBUG

	/* *****************************************************************************************************************
		IQ - orchestrates all interactivity
	**************************************************************************************************************** */

	core.iq = _.extend({}, Backbone.Events, {
        fn: {},
        _apis: {},
        boot: function(module, options) {
            var self = this
			self._module = module;
            _.each(options.scripts, function(script,id) {
                self.fn[id] = self.compileScript(script)
                module.on(id, self.fn[id]);
            })

            _.each(options.controllers, function(then, when) {
                if(!self.fn[then]) self.fn[then]=function(){console.warn('missing fn() '+then, this); this.triggerMethod(then, this, arguments) }
                module.on(when, function() {
DEBUG && console.log("IQ When: ", when, then, arguments)
                    self.fn[then].apply(arguments[0], [arguments[1]]);
                })
            })

            options.timers && self.timers(module, options.timers)

DEBUG && console.log("IQ Booted: ", self, module, options)
        },

        get: function(thisFN) {
            var _fn = null;
            var self = this;

            if (_.isString(thisFN)) {
                _fn = self.fn[thisFN] || self.compileScript(thisFN)
                if (_fn) return _fn;
            } else if (_.isObject(thisFN) && thisFN[core.idAttribute]) {
				var wrapped_fn = self.fn[conf[core.idAttribute]]
	            if (!wrapped_fn) throw "meta4:iq:oops:missing-identity-fn";
                _fn = function(conf) {
                	return new wrapped_fn(conf);
                }
            } else if (_.isFunction(thisFN)) {
                _fn = thisFN;
            }
            if (!_fn) throw "meta4:iq:oops:missing-function#"+thisFN;
            return _fn;
        },

        compileScript: function(script) {
            return new Function("it", script);
        },

		compileScriptEmbed: function(script_src) {
			var script = document.createElement('script');
			script.src = 'data:text/javascript,' + "function(source){"+encodeURIComponent(script_src)+"}"
			document.body.appendChild(script);
DEBUG && console.log("newFunction:", script, script_src)
			return script;
		},

		upload: function(files, onSuccess, onError) {
console.debug("Uploading Files:", this, this._module.options, files)
		},

        remote: function(url, data) {
            if (!url) throw "meta4:iq:remote:oops:missing-url";
            data = data || {}
            return $.ajax({ url: url, data: data})
        },

		// ensure IQ behaviour is Event-driven and aware of it's environment
		aware: function(vents, iqFn) {
            if (!vents) throw "meta4:iq:oops:missing-event-source"
            if (!_.isObject(vents)) throw "meta4:iq:oops:invalid-event-source"
            if (!vents.on) throw "meta4:iq:oops:not-event-source"
			if (!iqFn) return

			// bind local 'iq' events events to fn()
            _.each(iqFn, function(fnId,key) {
                if (_.isString(fnId)) {
                    var fn = core.iq.get(fnId);
//DEBUG &&
console.log("when [%s] %o -> %s %o", key, vents, fnId, fn)
                    if (fn) {
                        vents.on(key, function() { console.log("IQ when: %s", key); fn.apply(vents,arguments) })
                    }
                }
            })
			return vents
		},

		timers: function(module, timers) {
			var self = this;
			// setup timers (in seconds)
			if (_.isArray(timers)) {
				_.each(timers, function(seconds) {
					setInterval(function() {
					    var event = "meta4:timer:"+seconds;
						module.trigger(event);
					}, seconds*1000);
				});
			}
		}
	});

    return core.iq;
});
