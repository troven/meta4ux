define(["jquery", "underscore", "backbone", "marionette", "ux"
], function ($, _, Backbone, Marionette, ux) {

// require("jquery-bridget/jquery.bridget")
//    $.bridget( 'masonry', masonry );

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";
    var commentAttribute = ux.commentAttribute || "comment"
    var DEBUG = false //&& ux.DEBUG;


	ux.view.ListTree = ux.view["meta4:ux:ListTree"] = function(options) {
		options = ux.checkOptions(options);

		/** TreeBranch **/
		var branchConfig = {
			tagName: "li", isSortable: true, isSelectable: true, isHideable: false, isHoverPanel: true,
			isActionMenu: true,
			events: {
				"click [about]": "doEventSelect"
			},
			template: "<span about='{{id}}' title='{{comment}}'>Branch: {{label}}</span>",
			initialize: function(_options) {
DEBUG && console.debug("Init Branch", this, _options)
				ux.initialize(this, _options);
			},
			getChildView: function(_model) {
				var ChildView = ux.ux.view[this.options.type||"Template"](this.options.branch)
DEBUG && console.debug("getChildBranch: %o %o %o %o", this.options, this, _model, ChildView)
				return ChildView;
			},
			childViewOptions: function(_model) {
			    var childOptions = _.extend({ model: _model}, this.options.branch);
DEBUG && console.debug("getChildBranch options: %o %o %o", this, _model.id, childOptions)
			    return childOptions
			}
		}

		var TreeBranch = Backbone.Marionette.CompositeView.extend( branchConfig )
		var TreeItem = Backbone.Marionette.ItemView.extend( branchConfig )

		var rootConfig = {
		    isCommon: true, isHoverPanel: true, isPopOver: true,
			childView: TreeBranch, tagName: "ul",
			className: "tree-list", childViewContainer: "ul",
			events: {
			  'click [about]': 'doEventSelect'
			},
			initialize: function(_options) {
				ux.initialize(this, _options);
			},
			childViewOptions: function(_model) {
			    var childOptions = _.extend({ model: _model, branch: this.options.branch}, this.options.child );
DEBUG && console.debug("getBranch options: %o %o", this, childOptions)
			    return childOptions
			}
		}

		return Backbone.Marionette.CollectionView.extend( rootConfig )
	}
    return ux;
 })
