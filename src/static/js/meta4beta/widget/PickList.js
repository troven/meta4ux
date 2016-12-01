define(["jquery", "underscore", "backbone", "marionette",
    "ux", "meta4beta/widget/Form"],
function ($, _, Backbone, Marionette, ux, Form) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"
	var DEBUG = true && ux.DEBUG;

	ux.view.PickList = ux.view["meta4:ux:PickList"] = function(options) {
		options = _.defaults(options, { child: { "className": "list-group-item" } })

		var ListItem = Backbone.Marionette.ItemView.extend( _.extend({
			tagName: "li", isHoverPanel: true, isActionable: true, isTemplating: true,
			template: options.child.template || "<span data-id='{{"+idAttribute+"}}' title='{{"+commentAttribute+"}}'><span class='pull-right action-buttons'><i data-trigger='delete' class='btn btn-sm btn-info fa fa-trash' title='Remove'></i></span><label>{{"+labelAttribute+"}}</label></span>",
			events: {
                "click [data-action]": "doAction",
                "click [data-trigger]": "doAction",

				"click [data-id]": "doEventSelect",
				"dblClick [data-id]": "doEventSelect"
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
			},
			onSelect: function(event, model) {
				this.$el.find(".active").removeClass("active");
				var $item = this.$el.find("[data-id='"+model[idAttribute]+"']");
//DEBUG && console.debug("onChildViewSelect():", event, model, $item);
				$item.addClass("active");
				return this;
			}
		}));

		var config = {
			isSortable: true, isCommon: true,
			isPopOver: true, isSelectable: true, isHoverPanel: true,
			childView: ListItem, tagName: "div",
			template: "<div class='picker'></div><ul class='clearfix picked_list'></ul>",
			childItemContainer: ".picked_list",
			events: {
				'sortstart': 'doEventDrag',
				'click .picker .clickable': 'doPickSelection'
			},
			initialize: function(_options) {
				_options = _.defaults(_options, { picker: false})
				ux.initialize(this, _options)

                var pickerOptions = _.extend({
                    editable: true,
                    id: _options.id,
                    multiple: false,
                    tags: false,
                    _form: this,
	                formModel: this.model
                }, _options.picker)

				pickerOptions.placeholder = pickerOptions.label || _options.comment;
                pickerOptions.template = pickerOptions.template || "<div class='col-sm-6 clearfix'><span class='clickable btn btn-default'>{{label}}<i class='fa fa-plus'></i></span></i><div class='col-sm-6'><select class='form-control' name='{{id}}'/></div>{{comment}}</div>"

console.log("Picker: %o %o", this, pickerOptions)
			    this.picker = new ux.view.fields.Select(pickerOptions);
				ux.initialize(this.picker, pickerOptions);
                this.listenTo(this.picker);
                this.on("childview:delete", this.onDelete);
				return this;
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

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "PickList",
        "label": "Pick List",
        "comment": "A search-based list builder",
        "emits": ["action"],
        "mixins": [ "isHoverPanel", "isSelectable", "isSortable" ],
        "views": false,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": ux.view.PickList
    }
})
