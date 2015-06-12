/*global jQuery*/
jQuery.fn.autoSaveWidget = function (autoSave) {
	'use strict';
	var self = this,
		applyButton = self.find('[data-mm-role=apply]');
	autoSave.addEventListener('unsavedChangesAvailable', function () {
		self.modal('show');
	});
	self.on('shown', function () {
		applyButton.focus();
	});
	applyButton.click(function () {
		autoSave.applyUnsavedChanges();
		self.modal('hide');
	});
	self.find('[data-mm-role=discard]').click(function () {
		autoSave.discardUnsavedChanges();
		self.modal('hide');
	});
};
