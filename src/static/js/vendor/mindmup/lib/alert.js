/*global jQuery, MM, observable, setTimeout, _ */
MM.Alert = function () {
	'use strict';
	var self = this, lastId = 1;
	observable(this);
	this.show = function (message, detail, type) {
		var currentId = lastId;
		lastId += 1;
		self.dispatchEvent('shown', currentId, message, detail, type === 'flash' ? 'info' : type);
		if (type === 'flash') {
			setTimeout(function () {
				self.hide(currentId);
			}, 3000);
		}
		return currentId;
	};
	this.hide = this.dispatchEvent.bind(this, 'hidden');
};
jQuery.fn.alertWidget = function (alert) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this);
		alert.addEventListener('shown', function (id, message, detail, type) {
			type = type || 'info';
			detail = detail || '';
			if (_.isString(message)) {
				message = jQuery('<span><strong>' + message + '</strong>&nbsp;' + detail + '</span>');
			}
			jQuery('<div class="alert fade in">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'</div>')
				.addClass('alert-' + type + ' alert-no-' + id)
				.append(message).appendTo(element);
		});
		alert.addEventListener('hidden', function (id) {
			element.find('.alert-no-' + id).remove();
		});
	});
};
