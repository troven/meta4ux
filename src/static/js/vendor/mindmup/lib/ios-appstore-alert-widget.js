/*global jQuery*/

jQuery.fn.iosAppStoreAlertWidget = function (propertyStorage, propertyName, tagElement, alertController) {
	'use strict';
	return jQuery.each(this, function () {
		var element = jQuery(this),
			alertId;
		element.detach();
		if (propertyStorage.getItem(propertyName)) {
			return;
		}
		if (!tagElement.hasClass('ios')) {
			return;
		}

		element.find('[data-mm-role="ios-appstore-alert-hide"]').click(function () {
			propertyStorage.setItem(propertyName, true);
			if (alertId) {
				alertController.hide(alertId);
			}
		});
		alertId = alertController.show(element, 'info');
	});
};
