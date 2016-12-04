define(["jquery", "jquery_ui", "underscore", "backbone", "marionette", "ux",
    "jquery_orgchart"
], function ($, jquery_ui, _, Backbone, Marionette, ux) {

// require("jquery-bridget/jquery.bridget")
//    $.bridget( 'masonry', masonry );

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";
    var commentAttribute = ux.commentAttribute || "comment"
    var DEBUG = true //&& ux.DEBUG;


	ux.view.OrgChart = ux.view["meta4:ux:OrgChart"] = function(options) {
		options = ux.checkOptions(options);

		/** OrgBranch **/
		var OrgBranch = Backbone.Marionette.CompositeView.extend({
            childView: OrgBranch,  tagName: "li", childViewContainer: "ul",
            isSortable: true, isSelectable: true, isHideable: false, isHoverPanel: true,
			events: {
				"click [data-id]": "doEventSelect"
			},
			template: "<div data-id='{{id}}' title='{{comment}}'>{{label}}</div><ul></ul>",
			initialize: function(_options) {
//DEBUG && console.debug("Init OrgBranch", this, _options)
				ux.initialize(this, _options);
			},
			childViewOptions: function(_model) {
			    var childOptions = _.extend({ model: _model }, this.options.child );
//DEBUG && console.debug("getBranchOptions: %o %o", this, childOptions)
			    return childOptions
			},
			getChildView: function(_model) {
//console.debug("getBranchChild: %o %o -> %o %o",this, arguments, this.childView, OrgChart)
                return OrgBranch
			}
		})

		var OrgChart = Backbone.Marionette.CompositeView.extend({
		    isCommon: true, isHoverPanel: true,
			childView: OrgBranch,
			tagName: "div",
			template: "<div class='orgchart_container'></div><ul class='hide org_root'><li title='{{comment}}'>{{label}}<ul></ul></li></ul>",
			className: "ux-org-chart", childViewContainer: ".org_root li ul",
			events: {
			  'click [data-id]': 'doEventSelect'
			},
			initialize: function(_options) {
				ux.initialize(this, _options);
			},
			childViewOptions: function(_model) {
			    var childOptions = _.extend({ model: _model }, this.options.child );
//DEBUG && console.debug("getRootOptions: %o %o", this, childOptions)
			    return childOptions
			},
			onShow: function() {
			    var $container = $(".orgchart_container", this.$el)
			    var $root = $(".org_root",this.$el)
console.debug("OrgChart: %o", $root)
				var options = _.extend({
				   stack: true, interactive: true, depth: 2, showLevels: 2,
				   copyClasses: true,
				   copyData: true, copyStyles: true, copyTitle: true,
				container: $container
				}, this.options.options)

			    $root.orgChart(options)
			}
		})

		return OrgChart
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "OrgChart",
        "label": "Org Chart",
        "comment": "A simple hierarchical organisation chart",
        "emits": ["action"],
        "mixins": [ "isHoverPanel" ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.OrgChart
    }

 })
