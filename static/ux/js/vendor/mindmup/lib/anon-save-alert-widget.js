/*global jQuery*/
jQuery.fn.anonSaveAlertWidget = function (alertController, mapController, mapSource, propertyStorage, propertyName) {
	'use strict';
	var saveTemplate = this.find('[data-mm-role=anon-save]').detach(),
		destroyedTemplate = this.find('[data-mm-role=destroyed]').detach(),
		destroyedProblemTemplate = this.find('[data-mm-role=destroyed-problem]').detach(),
		currentAlertId,
		enabled = function () {
			return !propertyStorage.getItem(propertyName);
		},
		hideAlert = function () {
			if (currentAlertId) {
				alertController.hide(currentAlertId);
				currentAlertId = undefined;
			}
		};
	mapController.addEventListener('mapSaving mapLoaded', hideAlert);
	mapController.addEventListener('mapSaved', function (mapId) {
		var hideAndDisable = function () {
				hideAlert();
				propertyStorage.setItem(propertyName, true);
			},
			show = function (messageTemplate, type) {
				if (currentAlertId) {
					alertController.hide(currentAlertId);
				}
				var clone = messageTemplate.clone();
				clone.find('[data-mm-role=donotshow]').click(hideAndDisable);
				clone.find('[data-mm-role=destroy]').click(hideAndDestroy);
				currentAlertId = alertController.show(clone, '', type);
			},
			hideAndDestroy = function () {
				mapSource.destroyLastSave().then(function () {
					show(destroyedTemplate, 'info');
				}, function () {
					show(destroyedProblemTemplate, 'error');
				});
			};
		if (enabled() && mapSource.recognises(mapId)) {
			show(saveTemplate, 'success');
		}
	});
};
