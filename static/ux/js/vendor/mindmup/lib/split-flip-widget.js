/*global jQuery, _*/
jQuery.fn.splitFlipWidget = function (splittableController, menuSelector, mapModel, keyStroke) {
	'use strict';
	var self = jQuery(this),
		onFlipRequest = function (force) {
			if (force || mapModel.isEditingEnabled()) {
				splittableController.flip();
			}
		};
	_.each(self.find(menuSelector), function (elem) {
		var element = jQuery(elem);
		element.click(function () {
			onFlipRequest(true);
		});
	});
	self.keydown(keyStroke, onFlipRequest.bind(self, false));
	return self;
};
