/*global jQuery*/
jQuery.fn.selectableReadOnlyInputWidget = function () {
	'use strict';
	return this.css('cursor', 'pointer').on('input change', function () {
		var element = jQuery(this);
		element.val(element.attr('data-mm-val'));
	}).click(function () {
		if (this.setSelectionRange) {
			this.setSelectionRange(0, this.value.length);
		} else if (this.select) {
			this.select();
		}
	});
};
