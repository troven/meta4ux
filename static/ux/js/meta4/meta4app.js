define(["jquery", "underscore", "core", "ux", "fact", "iq", "mobility",
    "bootstrap",
    "jquery_cookie",

//    "meta4/widget/Debug",
//    "meta4/widget/Accordion",
//    "meta4/widget/ActionList",
//    "meta4/widget/Breadcrumbs",
//    "meta4/widget/CRUD",
//    "meta4/widget/CRUD2",
//    "meta4/widget/Dashboard3D",
//    "meta4/widget/Form",
//    "meta4/widget/Grid",
//    "meta4/widget/Help",
//    "meta4/widget/HBF",
//    "meta4/widget/ListTree",
//    "meta4/widget/List",
//    "meta4/widget/MenuButton",
//    "meta4/widget/MenuList",
//    "meta4/widget/NavBar",
//    "meta4/widget/OrgChart",
//    "meta4/widget/Panel",
//    "meta4/widget/PickList",
//    "meta4/widget/Portal",
//    "meta4/widget/QB",
//    "meta4/widget/SplitPanel",
//    "meta4/widget/Switch",
//    "meta4/widget/Tabs",
//    "meta4/widget/Template",
//    "meta4/widget/Terminal",
//    "meta4/widget/Toolbar",
    "meta4/widget/Regions",
    "meta4/widget/Tabs",
    "meta4/widget/Template",
    "meta4/widget/Form",
    "meta4/widget/Home"
], function ($,_, core, ux, fact, iq, mobility, bootstrap, jqcookie) {

	var newApp = new Marionette.Application({});

    newApp.bootModule = function(options) {
        if (!options) throw "meta4:app:boot:oops:missing-options";
        if (!options.id) throw "meta4:app:boot:oops:missing-module-id";

    	var DEBUG = options.debug || core.DEBUG
        options.requires && require(options.requires);

        // Extend Marionette module with Scorpio4's fn() tree
        var module = _.extend(newApp.module(options.id, options), core );
        module.id=options.id

        module.on("all", function(e,x) {
            newApp.trigger.apply(newApp, arguments)
        });

        // Boot the Module's dynamic architecture
        mobility.boot(module, options)
        iq.boot(module, options)
        fact.boot(module, options)
        ux.boot(module, options)

        // define the user principal
        var ProfileModel = Backbone.Model.extend({url: "/models/me"})
        core.fact.models.set("user", new ProfileModel(options.user) );

        localStorage.debug = false;
		
		if (options.server.io && options.server.io.enabled) {
			_.defaults(options.server.io, { url: options.url })

			var socket = io.connect(options.server.io.url, {});
			socket.on("connect", function (data) {
				console.warn("[io] connect", data);
				socket.on("hello", function (data) {
					console.warn("[io] welcome", data);
				})
			})
			console.debug("Socket IO: %o", options.server.io)
		}

		// notification timer
        if (options.server.gossip && options.server.gossip.enabled) {
			_.defaults(options.server.gossip, { interval: 1 })
            var GossipCollection = Backbone.Collection.extend({url: "/models/fact/Gossip"})
            core.fact.models.set("userGossip", new GossipCollection() );
            setInterval(function() {
                var gossip = core.fact.models.get("userGossip")
console.debug("Gossip Enabled: %o", gossip)
                gossip.fetch()
            }, (1000*options.server.gossip.interval) )
        }

        this.handleErrors(module)

        // Announce Module is ready
        module.trigger("boot", options)
console.debug("booted: %s views, %s models, %s templates, %s scripts", _.keys(options.views).length, _.keys(options.models).length, _.keys(options.templates).length, _.keys(options.scripts).length);
        return module;
    }

    newApp.handleErrors = function(module) {
        module.fact.models.on("error", function(c,o,r) {
console.error("OOPS! server went away. It'll be back ASAP.")
        })
    }

    newApp.addInitializer(function(options) {
        var self = this;
        if (!options.url) throw "meta4:app:boot:oops:missing-boot-url";
    	var DEBUG = options.debug || core.DEBUG

DEBUG && console.log("Boot Loader: %o -> %s", options, options.url);

        $.ajax({url: options.url, dataType: "json", type: "GET", data: JSON.stringify(options),
        contentType: "application/json; charset=utf-8",
        success: function(resp) {

            var parse = options.parse || function(resp) { return resp?resp.data:false }
            var result = parse(resp)

            if (!result) {
                console.error("No Response: %o", resp)
                self.trigger("boot:missing")
                return;
            }

            // Boot  Module
            var m_options = result
            var module = self.bootModule(m_options)
DEBUG && console.log("Boot Module (%s) %o %o", m_options.id, m_options)
            self.trigger("boot", module)
            self.trigger("boot:"+m_options.id, module)
        }})
    })

    return newApp;
})