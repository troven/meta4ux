/*global jQuery*/
jQuery.fn.modalConfirmWidget = function () {
	'use strict';
	var self = this,
		titleElement = self.find('[data-mm-role=title]'),
		explanationElement = self.find('[data-mm-role=explanation]'),
		confirmElement = self.find('[data-mm-role=confirm]'),
		currentDeferred,
		doConfirm = function () {
			if (currentDeferred) {
				currentDeferred.resolve();
				currentDeferred = undefined;
			}
		};
	self.modal({keyboard: true, show: false});
	confirmElement.click(function () {
		doConfirm();
	});
	confirmElement.keydown('space', function () {
		doConfirm();
		self.hide();
	});
	this.showModalToConfirm = function (title, explanation, confirmButtonCaption) {
		currentDeferred = jQuery.Deferred();
		titleElement.text(title);
		explanationElement.html(explanation);
		confirmElement.text(confirmButtonCaption);
		self.modal('show');
		return currentDeferred.promise();
	};
	this.on('shown', function () {
		confirmElement.focus();
	});
	this.on('hidden', function () {
		if (currentDeferred) {
			currentDeferred.reject();
			currentDeferred = undefined;
		}
	});
	return this;
};

