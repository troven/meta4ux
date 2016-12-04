/*global jQuery, window*/
jQuery.fn.scalableModalWidget = function () {
	'use strict';
	return jQuery.each(this, function () {
		var modal = jQuery(this),
			resize = function () {
				modal.find('.modal-body').css('max-height', 'none').height(modal.height() - modal.find('.modal-header').outerHeight(true) - modal.find('.modal-footer').outerHeight(true));
			};
		modal.on('shown', resize);
		jQuery(window).on('resize', function () {
			if (modal.is(':visible')) {
				resize();
			}
		});
	});
};
