/* global jQuery, MM*/
MM.CustomStyleController = function (activeContentListener, mapModel) {
	'use strict';
	var self = this,
		customStyleElement = jQuery('<style id="customStyleCSS" type="text/css"></style>').appendTo('body'),
		currentStyleText,
		publishData = function (activeContent) {
			var newText = activeContent.getAttr('customCSS');
			if (newText !== currentStyleText) {
				currentStyleText = newText;
				customStyleElement.text(currentStyleText || '');
				jQuery('.mapjs-node').data('nodeCacheMark', '');
				mapModel.rebuildRequired();
			}
		};
	self.getStyle = function () {
		return currentStyleText || '';
	};
	self.setStyle = function (styleText) {
		var activeContent = activeContentListener.getActiveContent();
		activeContent.updateAttr(activeContent.id, 'customCSS', styleText);
	};
	activeContentListener.addListener(publishData);
};
jQuery.fn.customStyleWidget = function (controller) {
	'use strict';
	var modal = this,
		textField = modal.find('[data-mm-role=style-input]'),
		confirmButton = modal.find('[data-mm-role=save]');
	modal.on('show', function () {
		textField.val(controller.getStyle());
	});
	confirmButton.click(function () {
		controller.setStyle(textField.val());
	});
};

