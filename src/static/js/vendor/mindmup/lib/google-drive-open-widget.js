/*global $ */
$.fn.googleDriveOpenWidget = function (googleDriveRepository, mapController, modalConfirmation, activityLog) {
	'use strict';
	var element = this,
		defaultTitle = 'Open a MindMup or Freemind file from Google Drive';
	element.click(function () {
		var link = $(this),
			contentTypes = link.data('mm-content-types'),
			title = link.data('mm-title') || defaultTitle,
			showFailure = function (reason) {
				activityLog.error(reason);
			},
			showAlert = function (reason) {
				activityLog.log(reason);
			},
			loadMap = function (mapId) {
				mapController.loadMap(mapId);
			},
			showAuthentication = function (reason) {
				if (reason !== 'not-authenticated') {
					return;
				}
				modalConfirmation.showModalToConfirm('Please confirm external access',
					'This operation requires authentication through Google Drive, an external storage provider. ' +
						'Please click on Authenticate below to go to the external provider and allow MindMup to access your account. ' +
						'You can learn more about authentication requirements on our <a href="http://blog.mindmup.com/p/storage-options.html" target="_blank">Storage Options</a> page.',
					'Authenticate')
					.then(
						function () {
							googleDriveRepository.showPicker(contentTypes, title, true).then(
								loadMap,
								showFailure,
								showAlert
							);
						}
					);
			};
		googleDriveRepository.showPicker(contentTypes, title, false).then(
			loadMap,
			showAuthentication,
			showAlert
		);
	});
};
