/*global jQuery */
jQuery.fn.iosLinkEditWidget = function (mapModel) {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this);
		//this.updateLinkStyle = function (source, ideaIdFrom, ideaIdTo, prop, value) {
		mapModel.addEventListener('linkSelected', function (link, selectionPoint, linkStyle) {
			element.find('[data-mm-role~="link-removal"]').data('mm-model-args', [link.ideaIdFrom, link.ideaIdTo]);
			element.find('[data-mm-role~="link-color"]').data('mm-model-args', [link.ideaIdFrom, link.ideaIdTo, 'color']);

			if (linkStyle && linkStyle.arrow) {
				element.find('[data-mm-role~="link-no-arrow"]').show().data('mm-model-args', [link.ideaIdFrom, link.ideaIdTo, 'arrow', false]);
				element.find('[data-mm-role~="link-arrow"]').hide();
			} else {
				element.find('[data-mm-role~="link-no-arrow"]').hide();
				element.find('[data-mm-role~="link-arrow"]').show().data('mm-model-args', [link.ideaIdFrom, link.ideaIdTo, 'arrow', true]);
			}
			if (linkStyle && linkStyle.lineStyle && linkStyle.lineStyle === 'dashed') {
				element.find('[data-mm-role~="link-solid"]').show().data('mm-model-args', [link.ideaIdFrom, link.ideaIdTo, 'lineStyle', 'solid']);
				element.find('[data-mm-role~="link-dashed"]').hide();
			} else {
				element.find('[data-mm-role~="link-dashed"]').show().data('mm-model-args', [link.ideaIdFrom, link.ideaIdTo, 'lineStyle', 'dashed']);
				element.find('[data-mm-role~="link-solid"]').hide();
			}
			element.trigger(jQuery.Event('showPopover', selectionPoint));
		});
	});
};
