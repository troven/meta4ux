if (top != self) { top.location.replace(self.location.href); }

// setup the require.js configuration
// define the paths for common 3rd party libraries
// meta4 specific

require.config({
    baseUrl: "/ux/js/",
    waitSeconds: 10,
    paths: {
        jquery: "vendor/jquery/jquery-1.11.2.min",
        underscore: "vendor/underscore/underscore",
        jquery_ui: "vendor/jquery/jquery-ui-1.11.4.custom/jquery-ui.min",
        jquery_cookie: "vendor/jquery-cookie/jquery.cookie",
        Handlebars: "vendor/handlebars/handlebars.min",
        bootstrap: "vendor/bootstrap/bootstrap",
        x_marionette: "vendor/marionette/backbone.marionette.min",
        marionette: "vendor/marionette/marionette230",

        backbone: "vendor/backbone/backbone",
//        deep_model: "vendor/deep-model",
//        backbone_forms: "vendor/backbone-forms/backbone-forms",
        backbone_documentmodel: "vendor/backbone-documentmodel/backbone-documentmodel",
        backbone_statemachine: "vendor/backbone-statemachine/backbone.statemachine",
        backbone_filtered: "vendor/backbone-filtered/backbone-filtered-collection",
        visualsearch: "vendor/visualsearch/visualsearch",

        localStorage: "vendor/backbone.localStorage",
        backgrid: "vendor/backgrid/backgrid",
        select2: "vendor/select2/select2.full",
        cordova: "vendor/cordova",
        "backgrid-select-all": "vendor/backgrid-select-all",
        "backgrid-select2-cell": "vendor/backgrid-select2-cell",

        full_calendar: "vendor/fullcalendar/fullcalendar.min",
        jmpress: "vendor/jmpress/jmpress.custom",
        html_editor: "vendor/summernote/summernote",
        jquery_orgchart: "vendor/jquery-orgchart/jquery.orgchart",
        md5: "vendor/md5/md5",
        bootstrap_tour: "vendor/bootstrap-tour/bootstrap-tour",
        jquery_terminal: "vendor/jquery.terminal/js/jquery.terminal-min",

// Meta4
        core: "meta4/core/index",
        fact: "meta4/core/fact",
        ux: "meta4/ux/index",
        iq: "meta4/core/iq",

        ux_mixin: "meta4/ux.mixin",
        ux_dialog: "meta4/ux.dialog",
        asq: "meta4/model/asq",
        meta4app: "meta4/spa",
        splash: "meta4/util/splash",
        mobility: "meta4/util/mobility",
        ctrl: "meta4/ctrl/index",
        oops: "meta4/core/oops",

// QB
        colorbrewer: "vendor/dc/colorbrewer",
        crossfilter: "vendor/dc/crossfilter",
        moment: "vendor/moment/moment",

        dc: "vendor/dc/dc",
        d3: "vendor/dc/d3",

        qb: "meta4qb/qb",
        qbd: "meta4qb/qbd",
        qbs: "meta4qb/qbs"

    },
    wrapShim: true,
    shim : {
        underscore : {
            exports : '_'
        },
        "select2": {
            deps : ['jquery'],
        },
        "crossfilter": {
            deps : ['bootstrap'],
            exports : 'crossfilter'
        },
        "colorbrewer": {
            deps : ['bootstrap'],
            exports : 'colorbrewer'
        },
        "d3": {
            deps : ['underscore'],
            exports : 'd3'
        },
        "dc": {
            deps : [ 'd3', 'colorbrewer', 'crossfilter'],
            exports : 'dc'
        },
        QueryEngine : {
            deps : ['backbone'],
            exports : 'QueryEngine'
        },
        Handlebars : {
            exports : 'Handlebars'
        },
        visualsearch: {
            deps : ['jquery', 'backbone'],
            exports : 'visualsearch'
        },
        bootstrap: {
            deps : ['jquery', 'underscore'],
            exports : 'bootstrap'
        },
        marionette : {
            deps : ['jquery', 'underscore', 'backbone'],
            exports : 'Marionette'
        },
        backbone_forms: {
            deps : ['jquery', 'underscore', 'backbone'], exports : 'BackboneForms'
        },
        bootstrap_tour: {
            deps : ['jquery', 'bootstrap'], exports : 'bootstrap_tour'
        },
        full_calendar: {
            deps : ['jquery'], exports : 'full_calendar'
        },
        jmpress: {
            deps : ['jquery'], exports : 'jmpress'
        },
        jquery_cookie: {
            deps : ['jquery'], exports : 'jquery_cookie'
        },
        html_editor: {
            deps : ['jquery'], exports : 'html_editor'
        },
        jquery_orgchart: {
            deps: ['jquery'], exports: "jquery_orgchart"
        },
        backgrid: {
            deps: ['jquery', 'underscore', 'backbone'], exports: 'backgrid'
        },
        backbone_filtered: {
            deps: ['jquery', 'underscore', 'backbone'], exports: 'backbone_filtered'
        },
        "backgrid-select-all": {
            deps: ['backgrid'], exports: "backgrid-select-all"
        },
        "backgrid-select2-cell": {
            deps: ['backgrid'], exports: "backgrid-select2-cell"
        },
        "jquery_terminal": {
            deps: ['jquery'], exports: "jquery_terminal"
        }

    }
});
// load splash first ..

require(['splash'], function(splash) {

    // reload the SPA boot page
    var Reload = function() { (window.location = window.location.href) };

    // Configuration for Meta4 web API
    var options = {
        boot: { autoBoot: true, debug: true,
            id: "meta4",
            url: "/ux/view/home",
            el: "#home"
        },
        parse: function(r) { return r; },
        splash: { url: "splash.html", waitForClick: true, disabled: false }
    };

    // show a loading screen
    (!options.splash.disabled) && splash.open( options.splash );

    // handle global/fatal errors
    try {
        require(['meta4app'], function (SinglePageApp) {

            if (!options.boot.url) throw new oops.Error("meta4:app:oops:missing-boot-url");
            console.log("booting %s @ %s", options.boot.id, options.boot.url);

            // load application payload

            $.ajax({url: options.boot.url, dataType: "json", type: "GET", contentType: "application/json; charset=utf-8",
                success: function(resp) {
                    var result = options.parse(resp);
                    if (!result) {
                        throw oops.Error("meta4:app:oops:invalid-payload")
                        newApp.trigger("boot:missing");
                        return;
                    }
                    try {

                        var meta4 = new SinglePageApp();

                        meta4.on("started", function() {
                            // hide splash screen (if displayed)
                            (!options.splash.disabled) && splash.close();
                        });

                        meta4.start(result);

                    } catch(e) {
                        console.log("BOOT ERROR: %o", e);
                        throw e;
                        // var yorn = confirm(e+"\n\nApplication failed to boot. Try again?");
                        // yorn && Reload();
                    }
                }
            });
        });
    } catch(e) {
        console.log("DOWNLOAD ERROR: %o", e);
        var yorn = confirm(e+"\n\nApplication failed to download . Try again?");
        yorn && Reload();
    }
})
