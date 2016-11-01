define(["jquery", "underscore", "core", "ux", "fact", "iq", "mobility",
    "bootstrap",
    "jquery_cookie",

//    "meta4beta/widget/Debug",
//    "meta4beta/widget/Accordion",
//    "meta4beta/widget/ActionList",
//    "meta4beta/widget/Breadcrumbs",
//    "meta4beta/widget/CRUD",
//    "meta4beta/widget/CRUD2",
//    "meta4beta/widget/Dashboard3D",
//    "meta4beta/widget/Form",
//    "meta4beta/widget/Grid",
//    "meta4beta/widget/Help",
//    "meta4beta/widget/HBF",
//    "meta4beta/widget/ListTree",
//    "meta4beta/widget/List",
//    "meta4beta/widget/MenuButton",
//    "meta4beta/widget/MenuList",
//    "meta4beta/widget/NavBar",
//    "meta4beta/widget/OrgChart",
//    "meta4beta/widget/Panel",
//    "meta4beta/widget/PickList",
//    "meta4beta/widget/Portal",
//    "meta4beta/widget/QB",
//    "meta4beta/widget/SplitPanel",
//    "meta4beta/widget/Switch",
//    "meta4beta/widget/Tabs",
//    "meta4beta/widget/Template",
//    "meta4beta/widget/Terminal",
//    "meta4beta/widget/Toolbar",
    "meta4beta/widget/Regions",
    "meta4beta/widget/Tabs",
    "meta4beta/widget/Template",
    "meta4beta/widget/Form",
    "meta4beta/widget/Home"
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
console.debug("boot: %o", options)
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