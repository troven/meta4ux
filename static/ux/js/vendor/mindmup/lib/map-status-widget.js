/*global jQuery, window, _*/
jQuery.fn.mapStatusWidget = function (mapController, activeContentListener) {
	'use strict';
	var element = this,
		autoSave;
	mapController.addEventListener('mapSaved mapLoaded', function (mapId, idea, properties) {
		if (!properties.editable) { /* imported, no repository ID */
			jQuery('body').removeClass('map-unchanged').addClass('map-changed');
		} else {
			element.removeClass('map-changed').addClass('map-unchanged');
		}
		autoSave = properties.autoSave;
		element.removeClass(_.filter(element.attr('class').split(' '), function (css) {
			return (/^map-source-/).test(css);
		}).join(' '));
		if (mapId) {
			element.addClass('map-source-' + mapId[0]);
		}
	});
	jQuery(window).bind('beforeunload', function () {
		if (mapController.isMapLoadingConfirmationRequired()) {
			return 'There are unsaved changes.';
		}
	});
	activeContentListener.addListener(function (content, isNew) {
		if (!autoSave && !isNew) {
			if (element.hasClass('map-unchanged')) {
				element.removeClass('map-unchanged').addClass('map-changed');
			}
		}
	});
};
