/*global jQuery */
jQuery.fn.googleShareWidget = function (mapController, googleDriveAdapter) {
	'use strict';
	return this.click(function () {
		googleDriveAdapter.showSharingSettings(mapController.currentMapId());
	});
};
