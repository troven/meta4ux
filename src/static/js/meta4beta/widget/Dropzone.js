define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view["meta4:ux:Dropzone"] = function(options) {
		options = ux.checkOptions(options);
		var DEBUG = true;

		var Dropzone = Backbone.Marionette.ItemView.extend({
			template: "<div>Drop Zone</div>",
			className: "ux_dropzone",
			initialize: function() {
				ux.model(options, this);
			},
			onShow: function() {
				var self = this;
				setTimeout(function() {
					console.log("Dropzone:", self, self.$el);
					self.$el.droppable({
					    x_accept: "li",
					    greedy: true, // don't bubble to parent
						activeClass: "ui-state-hover",
						hoverClass: "ui-state-hover",
						drop: function( event, ui ) {
							var model = $(ui.helper).data("meta4:ux:model:drag");
							console.log("DropZone:", ui, $(ui.helper), model)
							if (model) {
								$( this ).html( "Dropped:"+model.get("label") );
								self.triggerMethod("drop", model);
								Marionette.triggerMethod.call(model, "drop", model);
							}
						}
					})
				},10)
				return this;
			}
		});
		return Dropzone;
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {

	    "id": "Dropzone",
        "label": "Dropzone",
        "comment": "A widget to that responds to Drop events",
        "triggers": [],
        "can": [ "drop" ],
        "mixins": [ "isDroppable" ],
        "views": false,
        "collection": false,
        "options": false,

        "fn": ux.view.Dropzone
    }

})

