/*global jQuery*/
jQuery.fn.iosModalWidget = function () {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this);
		element.hide();
		element.find('[data-mm-role~="dismiss-modal"]').click(function () {
			element.hideModal();
		});
	});
};

jQuery.fn.showModal = function () {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this),
				wasHidden = !element.is(':visible');
		if (wasHidden) {
			element.trigger(jQuery.Event('show'));
		}
		element.show();
		if (wasHidden) {
			element.trigger(jQuery.Event('shown'));
		}
	});
};

jQuery.fn.hideModal = function () {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this),
				wasVisible = element.is(':visible');
		if (wasVisible) {
			element.trigger(jQuery.Event('hide'));
		}
		element.hide();
		if (wasVisible) {
			element.trigger(jQuery.Event('hidden'));
		}
	});
};

