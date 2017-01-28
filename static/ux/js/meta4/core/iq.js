define(["jquery", "underscore", "backbone", "marionette", "core"], function ($,_,Backbone, M, core) {

	var idAttribute = core.idAttribute
	var typeAttribute = core.typeAttribute
    var DEBUG = false && core.DEBUG

	/* *****************************************************************************************************************
		IQ - orchestrates all interactivity
	**************************************************************************************************************** */

	core.iq = _.extend({}, Backbone.Events, {
        fn: {},
        _apis: {},

        boot: function(navigator, options) {
            var self = this;

            // console.log("IQ BOOT: %o -> %o", navigator, options);

            _.each(options.scripts, function(script,id) {
                self.fn[id] = self.compileScript(script, navigator);
                navigator.on(id, self.fn[id]);

            });

            _.each(options.controllers, function(then, when) {
                if(!self.fn[then]) self.fn[then]=function(){console.warn('missing fn() '+then, this); this.triggerMethod(then, this, arguments) }
                navigator.on(when, function() {
//DEBUG && console.log("IQ When: ", when, then, arguments);
                    self.fn[then].apply(arguments[0], [arguments[1]]);
                })
            })

            options.timers && self.timers(navigator, options.timers);

            // DEBUG && console.log("Module IQ: %s -> %j", navigator.id, options);

            return self;
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

        compileScript: function(script, meta4) {
            return new Function("meta4", script);
        },

		compileScriptEmbed: function(script_src) {
			var script = document.createElement('script');
			script.src = 'data:text/javascript,' + "function(source){"+encodeURIComponent(script_src)+"}"
			document.body.appendChild(script);
DEBUG && console.log("newFunction:", script, script_src)
			return script;
		},

		upload: function(files, onSuccess, onError) {
console.debug("Uploading Files:", this, this._navigator.options, files)
		},

        remote: function(url, data) {
            if (!url) throw "meta4:iq:remote:oops:missing-url";
            data = data || {}
            return $.ajax({ url: url, data: data})
        },

		// ensure IQ behaviour is Event-driven and aware of it's environment
		aware: function(vents, iqFn) {
            if (!vents) throw new Error("meta4:iq:oops:missing-event-source");
            if (!_.isObject(vents)) throw new Error("meta4:iq:oops:invalid-event-source");
            if (!vents.on) throw new Error("meta4:iq:oops:not-event-source");
			if (!iqFn) {
//                console.log("not IQ aware: %s -> %o", vents.id, vents);
			    return;
            }

			// bind local 'iq' events events to fn()
            _.each(iqFn, function(fnId,key) {
                if (_.isString(fnId)) {
                    var fn = core.iq.get(fnId);
                    if (fn) {
//console.log("WHEN [%s] on %o THEN %s %o", key, vents, fnId, fn)
                        vents.on(key, function() {
//console.log("WHEN %s on %o\nDO: %s -=> %s -> %o", key, this, fnId, fn);
                            fn.apply(vents,arguments);
                        })
                    } else {
                        throw new Error("meta4:iq:oops:missing-fn#"+fnId);
                    }
                }
            });
console.log("IQ aware: %o %o", vents, iqFn);
			return vents;
		},

        bubble: function(event, when, then) {
            when.on(event, function() {
                var args = [];
                args.push(event);
                args.concat(arguments);
                console.log("BUBBLE [%s]: %o %o", event, when, then);
//                then.trigger.apply(when, args);
            });
        },

		timers: function(navigator, timers) {
			var self = this;
			// setup timers (in seconds)
			if (_.isArray(timers)) {
				_.each(timers, function(seconds) {
					setInterval(function() {
					    var event = "timer:"+seconds;
						navigator.trigger(event);
					}, seconds*1000);
				});
			}
		},

        Controller: function(type, options, done) {
            if (!type) throw new Error("meta4:ctrl:oops:missing-type");
            if (!options) throw new Error("meta4:ctrl:oops:invalid-options#"+type);
            if (!done) throw new Error("meta4:ctrl:oops:invalid-callback#"+type);

            var DEBUG = options.debug?true:false;

            console.log("Requires %o controller", type);

            define(["meta4/iq/"+type], function(controller) {
                console.log("New Controller: %s -> %o", type, options);
                var ctrl = new controller(options);
                done(controller);
            });
        }

    });

    return core.iq;
});
