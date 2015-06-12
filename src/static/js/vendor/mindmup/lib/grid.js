/*global jQuery, _*/

jQuery.fn.gridDown = function () {
	'use strict';
	var element = this,
		elementPos = element.position(),
		below = _.filter(element.siblings(), function (sibling) {
			var position = jQuery(sibling).position();
			return elementPos.top < position.top && Math.abs(elementPos.left - position.left) < 3;
		}),
		nearest = _.min(below, function (item) {
			return jQuery(item).position().top;
		});
	return (nearest && jQuery(nearest)) || element;
};

jQuery.fn.gridUp = function () {
	'use strict';
	var element = this,
		elementPos = element.position(),
		above = _.filter(element.siblings(), function (sibling) {
			var position = jQuery(sibling).position();
			return elementPos.top > position.top && Math.abs(elementPos.left - position.left) < 3;
		}),
		nearest = _.max(above, function (item) {
			return jQuery(item).position().top;
		});
	return (nearest && jQuery(nearest)) || element;
};
