/*global jQuery, document*/
jQuery.fn.modalLauncherWidget = function (mapModel) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
				keyCode = element.data('mm-launch-key-code'),
				wasFocussed;
		element.on('show',  function (evt) {
			if (this === evt.target) {
				wasFocussed = jQuery(':focus');
				if (wasFocussed.length === 0) {
					wasFocussed = jQuery(document.activeElement);
				}
				wasFocussed.blur();
				mapModel.setInputEnabled(false, false);
			}
		}).on('hide',  function (evt) {
			if (this === evt.target) {
				mapModel.setInputEnabled(true, false);
				if (wasFocussed && wasFocussed.length > 0) {
					wasFocussed.focus();
				} else {
					jQuery(document).focus();
				}
				wasFocussed = undefined;
			}
		}).on('shown', function (evt) {
			if (this === evt.target) {
				element.find('[data-mm-modal-shown-focus]').focus();
			}
		});
		if (keyCode) {
			jQuery(document).keydown(function (event) {
				if (element.parent().length === 0) {
					return;
				}
				if (String(event.which) !== String(keyCode) || !(event.metaKey || event.ctrlKey) || event.altKey) {
					return;
				}
				event.preventDefault();
				event.stopImmediatePropagation();
				if (jQuery('.modal:visible').length > 0) {
					return;
				}
				element.modal('show');
			});
		}
	});
};


