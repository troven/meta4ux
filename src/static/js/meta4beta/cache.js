if (top != self) { top.location.replace(self.location.href); }
require.config({
    baseUrl: "/www/",
    waitSeconds: 10,
    paths: {
        jquery: "vendor/jquery/jquery-1.11.2.min",
        underscore: "vendor/underscore/underscore",
        jquery_ui: "vendor/jquery/jquery-ui-1.11.4.custom/jquery-ui.min",
        jquery_cookie: "vendor/jquery-cookie/jquery.cookie",
        handlebars: "vendor/handlebars/handlebars",
        bootstrap: "vendor/bootstrap/bootstrap",

        backbone: "vendor/backbone/backbone",
        marionette: "vendor/marionette/backbone.marionette",
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
        avgrund: "vendor/avgrund/avgrund",
        jmpress: "vendor/jmpress/jmpress.custom",
        html_editor: "vendor/summernote/dist/summernote",
        wookmark: "vendor/wookmark/jquery.wookmark",
        jquery_orgchart: "vendor/jquery-orgchart/jquery.orgchart",
        md5: "vendor/md5/md5",
        bootstrap_tour: "vendor/bootstrap-tour/bootstrap-tour",
        jquery_terminal: "vendor/jquery.terminal/js/jquery.terminal-min",

        core: "meta4beta/core",
        fact: "meta4beta/fact",
        ux: "meta4beta/ux",
        ux_mixin: "meta4beta/ux.mixin",
        iq: "meta4beta/iq",
        meta4app: "meta4beta/meta4app",
        mobility: "meta4beta/mobility",

        qb: "meta4qb/qb",
        qbd: "meta4qb/qbd",
        qbs: "meta4qb/qbs",

        colorbrewer: "vendor/dc/colorbrewer",
        crossfilter: "vendor/dc/crossfilter",
        moment: "vendor/moment/moment",
        dc: "vendor/dc/dc",
        d3: "vendor/dc/d3"

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
      handlebars : {
        exports : 'Handlebars'
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
      avgrund: {
        deps : ['jquery'], exports : 'avgrund'
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

require(['meta4app'], function (meta4beta) {
    console.log("meta4beta: %o", meta4beta)
});
