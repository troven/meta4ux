/*global jQuery */
jQuery.fn.keyActionsWidget = function () {
	'use strict';
	var element = this;
	this.find('[data-mm-role~=dismiss-modal]').click(function () {
		element.modal('hide');
	});
	element.on('show', function () {
		element.find('.active').removeClass('active');
		element.find('.carousel-inner').children('.item').first().addClass('active');
	});
};
