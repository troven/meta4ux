/*global jQuery*/


jQuery.fn.iosModeIndicatorWidget = function (mapModel) {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this);
		mapModel.addEventListener('addLinkModeToggled', function (isOn) {
			element.find('[data-mm-role="modeIndicator"]').hide();
			if (isOn) {
				element.show();
				element.find('[data-mm-mode="addLinkMode"]').show();
			} else {
				element.hide();
			}
		});
	});
};
