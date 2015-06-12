define(["jquery", "underscore", "backbone", "marionette",
    "ux", "meta4beta/view/Form"],
function ($, _, Backbone, Marionette, ux, Form) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"
	var DEBUG = true && ux.DEBUG;

	ux.view.PickList = ux.view["meta4:ux:PickList"] = function(options) {
		options = ux.checkOptions(options, ["id"]);
		_.defaults(options, { child: { "className": "list-group-item" } })

		options.childViewOptions = options.child

		var ListItem = Backbone.Marionette.ItemView.extend( _.extend({
			tagName: "li", isHoverPanel: true, isActionable: true,
			template: options.child.template || "<span about='{{"+idAttribute+"}}' title='{{"+commentAttribute+"}}'><span class='pull-right action-buttons'><i data-trigger='delete' class='btn btn-sm btn-info fa fa-trash' title='Remove'></i></span><label>{{"+labelAttribute+"}}</label></span>",
			events: {
                "click [data-action]": "doAction",
                "click [data-trigger]": "doAction",

				"click [about]": "doEventSelect",
				"dblClick [about]": "doEventSelect"
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
			},
			onSelect: function(event, model) {
				this.$el.find(".active").removeClass("active");
				var $item = this.$el.find("[about='"+model[idAttribute]+"']");
//DEBUG && console.debug("onChildViewSelect():", event, model, $item);
				$item.addClass("active");
				return this;
			}
		}, ux.ux.mixin.Selectable));

		var config = {
			isSortable: true, isCommon: true,
			isPopOver: true, isSelectable: true, isHoverPanel: true,
			childView: ListItem, tagName: "ul",
			template: "<div><div class='picker'></div><ul class='clearfix picked_list'></ul></div>",
			childItemContainer: ".picked_list",
			events: {
				'sortstart': 'doEventDrag',
				'click .picker .clickable': 'doPickSelection'
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
				_.defaults(_options, { picker: false})

                var pickOptions = _.extend({
                    editable: true,
                    id: _options.id,
                    placeholder: _options.picker.label || _options.comment,
                    multiple: false,
                    tags: false,
                    formModel: this.model
                },_options.picker)
                pickOptions.template = "<div class='col-sm-6 clearfix'><span class='clickable btn btn-default'>{{label}}<i class='fa fa-plus'></i></span></i><div class='col-sm-6'><select class='form-control' name='{{id}}'/></div>{{comment}}</div>" || options.picker.template

console.log("Picker: %o", pickOptions)
			    this.picker = new ux.view.fields.Select(pickOptions)
				ux.initialize(this.picker, pickOptions)
                this.listenTo(this.picker)
                this.on("childview:delete", this.onDelete)
				return this;
			},
			onRender: function() {
			},
			onShow: function() {
			    var $picker = $(".picker", this.$el)
			    this.picker.$el = $picker
console.log("Picker Render: %o %o", this.picker, $picker)
			    this.picker.render();
			    this.picker.onShow();
			},
			onDelete: function(selectedView) {
				var id = selectedView.model.get(idAttribute)
console.log("Picker Delete: %o %o", this, id)
				this.collection.remove(id)
			},
			doPickSelection: function() {
			    var $select = $("select",this.picker.$el)
			    var selected = $select.val();
			    var model = this.picker.collection.get(selected)
			    if (model) {
console.log("Picked: %o %o -> %o", selected, model, this.collection)
			    	this.collection.add(model)
			    }
			}

		}

		return Backbone.Marionette.CompositeView.extend( config );
	}

	return ux;
})
