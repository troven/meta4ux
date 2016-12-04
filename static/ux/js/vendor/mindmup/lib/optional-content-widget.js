/*global jQuery, document*/
jQuery.fn.optionalContentWidget = function (mapModel, splittableController) {
	'use strict';
	var	toggleMeasures = function (force, splitContentId) {
			if (force || mapModel.getInputEnabled()) {
				splittableController.toggle(splitContentId);
			}
		};

	return jQuery.each(this, function () {
		var element = jQuery(this),
			id = element.attr('id');
		jQuery(document).keydown(element.attr('data-mm-activation-key'), toggleMeasures.bind(element, false, id));
		jQuery('[data-mm-role=' + element.attr('data-mm-activation-role') + ']').click(toggleMeasures.bind(element, true, id));
		if (element.is(':visible')) {
			element.trigger('show');
		}
	});
};
