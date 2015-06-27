define(["jquery", "underscore", "backbone", "marionette", "ux"
], function ($, _, Backbone, Marionette, ux) {

// require("jquery-bridget/jquery.bridget")
//    $.bridget( 'masonry', masonry );

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";
    var commentAttribute = ux.commentAttribute || "comment"
    var DEBUG = true //&& ux.DEBUG;


	ux.view.Tree = ux.view["meta4:ux:Tree"] = function(options) {
console.log("Tree: %o", options)

		var treeCommon = { isCommon: true, isHoverPanel: true, isPopOver: true, isTemplating: true, isSortable: true,
			events: {
			  'click [data-id]': 'doEventSelect'
			},
			initialize: function(_options) {
				_.extend(_options, { child: {} } )
				ux.checkOptions(_options, [ "child"] );
				ux.initialize(this, _options);
			},
			x_getChildView: function(_model) {
				var options = this.options.child || {}
				var branch = options.branch && _model.get(options.branch)
				var widget = this.options.child.widget
				var Widget = (widget && ux.view[widget])
DEBUG && console.debug("getBranch (%s): %o %o %o %o",  _model.id, _model, this.options, widget, Widget)
				if (!Widget) return this.childView?this.childView:null
				var View = Widget(options)
				return View
			},
			childViewOptions: function(_model) {
				var options = this.options.child || {}
				var branch = _model.get(options.branch)
			    var childOptions = _.extend({ model: _model, collection: branch, child: options }, options );
DEBUG && console.debug("getBranch options: %o %o", this, childOptions)
			    return childOptions
			}
		}

		var TreeBranch = false
		var treeBranch = _.extend({}, treeCommon, {
			childViewContainer: "ul",
			tagName: "li", className: "tree-branch", childView: TreeBranch,
		})
		TreeBranch = Backbone.Marionette.CompositeView.extend( treeBranch )

		var treeRoot = _.extend({}, treeCommon, {
			tagName: "ul", className: "tree-root", childView: TreeBranch,
		})


		return Backbone.Marionette.CollectionView.extend( treeRoot )
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
        "id": "Tree",
        "label": "Tree",
        "comment": "A hierarchical widget",
        "emits": ["action"],
        "mixins": [ "isTemplating", "isSortable", "isHoverPanel" ],
        "views": false,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": ux.view.Tree
    }

 })
