/*global MM*/
MM.setImageAlertWidget = function (imageInsertController, alertController) {
	'use strict';
	var alertControllerId;
	imageInsertController.addEventListener('imageInserted', function () {
		alertController.hide(alertControllerId);
	});
	imageInsertController.addEventListener('imageInsertError', function () {
		alertController.hide(alertControllerId);
		alertControllerId = alertController.show('Cannot insert image from this website:', 'Please save the image locally and drag the saved file to add it to the map', 'error');
	});
	imageInsertController.addEventListener('imageLoadStarted', function () {
		alertController.hide(alertControllerId);
		alertControllerId = alertController.show('<i class="icon-spinner icon-spin"/> Loading image');
	});
};
