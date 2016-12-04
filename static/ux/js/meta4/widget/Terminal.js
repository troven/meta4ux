define(["jquery", "underscore", "backbone", "marionette", "core", "ux",
    "jquery_terminal"
], function ($,_, Backbone, Marionette, core, ux) {

	ux.view.Terminal = ux.view["meta4:ux:Terminal"] = function(options) {
		var DEBUG = true;

		var config = {
			isTemplating: true,
			className: "hide",
			template: options.template || "<div/>",
			events: {
			},
			className: "ux_template",
			initialize: function(options) {
				ux.initialize(this, options)
			},

			onRender: function() {
			    var self = this
			    this.$el.hide()
			    if (this._isRendered) return;
			    var keycode = this.options.keycode || 96
                var appName = ux._module.options.label || "Scorpio4";
			    var that = core

			    var _options = _.extend({
			        name: this.options.id || appName,
			        greetings: "Welcome to Scorpio4 @ "+appName,
                    keypress: function(e) { if (e.which == keycode) return false; },
                    completion: function(term, txt, callback) {
                    	var cmds = txt.split(".")
                    	var find = function(last, ctx, cmds) {
                    		var cmd = cmds.shift()
console.log("find?: %o %o %o %o", last, ctx, cmds, cmd)
                    		if (_.isObject(ctx[cmd]) && cmds) return find(last+cmd+".",ctx[cmd], cmds)
                    		return ctx[cmd]?ctx[cmd]:ctx
                    	}
                    	var found = find("",that,cmds)
                    	if (found) {
                    		callback(_.keys(found))
console.log("complete?: %o %o %o %o", txt, cmds, found, _.keys(found))
						}
                    }
			    }, this.options.options)

			    this.$el.terminal(function(txt, term) {
			        if (!txt.trim()) return
			        var this_terminal = this
			        var args = txt.split(" ")
			        var cmd = args[0] || txt

			        if( cmd.indexOf("/")==0) {
			            cmd = cmd.substring(1)
			            var now = new Date().getTime()
			            args.shift()
			            var data = false
			            if (args.length) {
							if (args[0].indexOf("{")>0) data = JSON.toJson(args)
							else data = { cmd: args.join(" ") }
			            }
			            var $future = ux.iq.remote("/api/shell/"+cmd, data)
			            $future.done(function(resp) {
			            	var elapsed = (new Date().getTime()-now)/1000
			            	if (cmd.indexOf("/")<0) {
				                self.triggerMethod("response", resp, "response from '/api/shell/"+cmd+"' in "+elapsed+" seconds")
			            	} else {
					            cmd = cmd.substring(1)
				                this_terminal[cmd]= resp.result
			            	}
			            })
			            $future.error(function(resp) {
			            	console.log("Error: %o ",resp, arguments)
                        	term.echo("Error: "+resp)
			            })
			            // remote database
			        } else if( cmd.indexOf("?")==0) {
			            cmd = cmd.substring(1)
			            cmd = cmd || "help"
			            // trigger method
                        args[0] = term
                        args.unshift(cmd)
                        var answer = self.triggerMethod.apply(self, args)
                        if (answer) term.echo("$ "+answer)
			        } else {
			        	try {
			        		with(that) {
								var answer = eval(txt)
			        			console.log("answer: %o => %o", txt, answer)
								if (_.isString(answer) || _.isNumber(answer)) {
									term.echo(answer)
								} else if (_.isObject(answer) || _.isArray(answer)) {
									self.onResponse({ result: answer })
								} else {
									term.echo("??? "+answer)
								}
			        		}
			        	} catch(e) {
							term.echo("!! "+e)
			        	}
			        }
			    },_options)

                self.$el.keypress(function(e) {
                        e.preventDefault()
                        e.stopPropagation()
                })
                var toggled = false;
                $(document.documentElement).keypress(function(e) {
                    if (e.which == keycode) {
                        self.$el.toggle();
                        toggled = !toggled
                        self.$el.terminal().focus()
                        if (toggled) self.triggerMethod("opened")
                        else self.triggerMethod("closed")
                        return false
                    }
                })
			},

			onHello: function() {
			    var user = ux.fact.models.get("principal")
			    return "Hi "+(user.get("firstname") || user.get("label"))+"!"
			},
			onHelp: function() {
				return  "\n/<cmd> [*] display results of shell API command, passing [*] arguments"+
						"\n//<cmd> [*] store results of shell command in context"+
						"\nthis - show API result variables"+
						"\nclear - clear terminal"+
						"\n?help - this message"+
						"\n?hello - greetings"+
						"\n?widget [view id] - view a modal widget"
			},

			onWidget: function(term, arg1) {
			    var opt = ux.views.get(arg1)
			    opt = _.extend({}, opt, {modal: true})
                var view = ux.views.view(opt)
                view.render()
                view.triggerMethod("show")
                this.once("opened", function() {
                    view.destroy()
                })
			},
			onResponse: function(response, title) {
				var self = this
				var json = response.result || "Nothing Happened"
				console.debug("-->"+title+": %o", json)

			    var $pre = $("<pre/>")
				$pre.append(this.syntaxHighlight(json)).wrap("<code/>")

			    var $dialog = $pre.dialog({ title: title||"", width: 600, height: 600,
			    	close: function() {
                        self.$el.terminal().focus()
			    	}
			    })
			    $dialog.parent().css({"z-index": 20000}).addClass("terminal")
			    $pre.css({background: "#0"})
//                var $modal = ux.modal()
//                var $wrapper = $(".overlay_wrapper", $modal)
//                $wrapper.height('80%').width('80%')
//				ux.position.modal($wrapper)
//                $wrapper.append( $pre )
//                $wrapper.css({background: "white", "display": "block"})
			},
            syntaxHighlight: function(json) {
                json = !_.isString(json)?JSON.stringify(json):json
                json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
                function (match) {
                    var cls = 'number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'key';
                        } else {
                            cls = 'string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean';
                    } else if (/null/.test(match)) {
                        cls = 'null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                });
            }
		}

		return Backbone.Marionette.ItemView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
        "id": "Terminal",
        "label": "Terminal",
        "comment": "A console",
        "emits": ["action"],
        "mixins": [ "isTemplating" ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.Terminal
    }

})
