/*global MM*/

MM.IOS = MM.IOS || {};
MM.IOS.AutoSave = function (autoSave, confimationProxy) {
	'use strict';
	var self = this,
			discardUnsavedChanges = false;

	autoSave.addEventListener('unsavedChangesAvailable', function () {
		if (discardUnsavedChanges) {
			autoSave.discardUnsavedChanges();
			return;
		}
		confimationProxy.requestConfirmation('You have unsaved changes', {'default': 'Apply unsaved changes', 'destructive': 'Discard unsaved changes'}, 'You have made changes to this map that were not saved. Please choose if you would like to apply them or discard them and continue with the saved version').then(function (choice) {
			if (choice === 'default') {
				autoSave.applyUnsavedChanges();
			} else {
				autoSave.discardUnsavedChanges();
			}
		});
	});
	self.on = function () {
		discardUnsavedChanges = false;
	};

	self.off = function () {
		discardUnsavedChanges = true;
	};
};
