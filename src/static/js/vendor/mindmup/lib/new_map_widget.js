/*global jQuery */
jQuery.fn.newMapWidget = function (mapController) {
	'use strict';
	this.click(function () {
		var mapSource = jQuery(this).attr('data-mm-map-source') || '';
		mapController.loadMap('new-' + mapSource + '-' + Date.now());
	});
	return this;
};
