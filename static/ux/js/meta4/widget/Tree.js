define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($, _, Backbone, Marionette, ux) {

// require("jquery-bridget/jquery.bridget")
//    $.bridget( 'masonry', masonry );

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";
    var commentAttribute = ux.commentAttribute || "comment"
    var DEBUG = true //&& ux.DEBUG;


	ux.view.Tree = ux.view["meta4:ux:Tree"] = function(options) {
console.log("Tree: %o", options)

		var treeCommon = { isCommon: true, isHoverPanel: true, isPopOver: false, isTemplating: true, isSortable: true, isSelectable: true,
			events: {
			  'click [data-id]': 'doEventSelect'
			},
            childViewEvents: {
                "select": function(x,y) {
console.log("TreeChild: select: %o %o", this, arguments);
                }
            },
			initialize: function(_options) {
				_.extend(_options, { child: { branch: "children" } } );
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
				var options = this.options.child || {};
				var branch = _model.get(options.branch);
			    var childOptions = _.extend({ model: _model, collection: branch, child: options }, options );
DEBUG && console.debug("getBranch %s options: %o %o", options.branch, this, childOptions);
			    return childOptions;
			}
		}

		var TreeBranch = false
		var treeBranch = _.extend({}, treeCommon, {
			childViewContainer: "ul",
            template: "<div data-id='{{id}}'>{{label}}</div><ul/>",
			tagName: "li", className: "tree-branch list-group-item", childView: TreeBranch,
		})
		TreeBranch = Backbone.Marionette.CompositeView.extend( treeBranch )

		var treeRoot = _.extend({}, treeCommon, {
			tagName: "ul", className: "tree-root list-group", childView: TreeBranch,
		})


		return Backbone.Marionette.CollectionView.extend( treeRoot )
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
        "id": "Tree",
        "label": "Tree",
        "comment": "A hierarchical widget",
        "emits": ["action"],
        "mixins": [ "isTemplating", "isSortable", "isHoverPanel", "isPopOver" ],
        "views": false,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": ux.view.Tree
    }
});
