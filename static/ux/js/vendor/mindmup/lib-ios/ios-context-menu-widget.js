/*global jQuery */
jQuery.fn.iosContextMenuWidget = function (mapModel, tools) {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this),
				toolbar = element.find('[data-mm-role~="context-menu-toolbar"]'),
				toolContainer = element.find('[data-mm-role~="context-menu-tool-container"]');
		toolbar.click(function (e) {
			e.preventDefault();
			e.stopPropagation();
		});
		if (tools) {
			tools.each(function () {
				jQuery(this).clone(true).css('display', '').appendTo(toolContainer).click(function () {
					element.trigger(jQuery.Event('hidePopover'));
				});
			});
		}
		mapModel.addEventListener('contextMenuRequested', function (nodeId, x, y) {
			if (!mapModel.getEditingEnabled || mapModel.getEditingEnabled()) {
				element.trigger(jQuery.Event('showPopover', {'x': x, 'y': y}));
			}
		});
	});
};
