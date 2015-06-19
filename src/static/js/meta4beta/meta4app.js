define(["jquery", "underscore", "core", "ux", "fact", "iq", "mobility",
    "bootstrap",
    "jquery_cookie",
    "meta4beta/model/Default",
    "meta4beta/model/Local",
    "meta4beta/model/File",

//    "meta4beta/view/Debug",
//    "meta4beta/view/Accordion",
//    "meta4beta/view/ActionList",
//    "meta4beta/view/Breadcrumbs",
//    "meta4beta/view/CRUD",
//    "meta4beta/view/CRUD2",
//    "meta4beta/view/Dashboard3D",
//    "meta4beta/view/Form",
//    "meta4beta/view/Grid",
//    "meta4beta/view/Help",
//    "meta4beta/view/HBF",
//    "meta4beta/view/ListTree",
//    "meta4beta/view/List",
//    "meta4beta/view/MenuButton",
//    "meta4beta/view/MenuList",
//    "meta4beta/view/NavBar",
//    "meta4beta/view/OrgChart",
//    "meta4beta/view/Panel",
//    "meta4beta/view/PickList",
//    "meta4beta/view/Portal",
//    "meta4beta/view/QB",
//    "meta4beta/view/SplitPanel",
//    "meta4beta/view/Switch",
//    "meta4beta/view/Tabs",
//    "meta4beta/view/Template",
//    "meta4beta/view/Terminal",
//    "meta4beta/view/Toolbar",
    "meta4beta/view/Regions",
    "meta4beta/view/Tabs",
    "meta4beta/view/Template",
    "meta4beta/view/Form",
    "meta4beta/view/Home"
], function ($,_, core, ux, fact, iq, mobility, bootstrap) {

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
})
        // Boot the Module's dynamic architecture
        module.mobility.boot(module, options)
        module.iq.boot(module, options)
        module.fact.boot(module, options)
        module.ux.boot(module, options)

        var ProfileModel = Backbone.Model.extend({url: "/api/auth/Principal"})
        core.fact.models.set("principal", new ProfileModel(options.user) );

        // notification timer
        if (options.notifications) {
            var GossipCollection = Backbone.Collection.extend({url: "/api/fact/Gossip"})
            core.fact.models.set("userGossip", new GossipCollection() );
            setInterval(function() {
                var gossip = core.fact.models.get("userGossip")
console.debug("Gossip: %o", gossip)
                gossip.fetch()
            }, (1000*options.notifications) )
        }

        this.handleErrors(module)

        // Announce Module is ready
        module.trigger("boot", options)
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