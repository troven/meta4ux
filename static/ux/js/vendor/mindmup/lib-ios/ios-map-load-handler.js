/*global MM, MAPJS, jQuery*/
MM.IOS = MM.IOS || {};
MM.IOS.MapLoadHandler = function (iosAutoSave, mapOptions, mmProxy, iosMapSource, container, activityLog, mapModel, imageInsertController, activeContentResourceManager, mapController) {
	'use strict';
	var self = this;
	self.handlesCommand = function (command) {
		if (command.type === 'loadMap') {
			return true;
		}
		return false;
	};
	self.handleCommand = function (command) {
		if (!self.handlesCommand) {
			return;
		}
		var newIdea = command.args[0],
				readonly = command.args[1],
				quickEdit = command.args[2],
				content = MAPJS.content(newIdea),
				mapId = command.args[3] || 'ios-no-autosave',
				touchEnabled = true,
				dragContainer = jQuery('#splittable');

		if (mapId === 'ios-no-autosave' || readonly) {
			iosAutoSave.off();
		} else {
			iosAutoSave.on();
		}
		mapOptions.inlineEditingDisabled = quickEdit;
		mmProxy.sendMessage({type: 'map-save-option', args: {'dialog': 'not-required'}});
		content.addEventListener('changed', function () {
			mmProxy.sendMessage({type: 'map-save-option', args: {'dialog': 'show'}});
		});
		iosMapSource.setIdea(content);
		container.domMapWidget(activityLog, mapModel, touchEnabled,  imageInsertController, dragContainer, activeContentResourceManager.getResource, true, mapOptions);
		mapController.loadMap(mapId);

		if (readonly) {
			jQuery('[data-mm-role="ios-menu"]').remove();
			mapModel.setEditingEnabled(false);
		} else {
			mapModel.setEditingEnabled(true);
		}
		if (quickEdit) {

			jQuery('body').addClass('ios-quick-edit-on');
			jQuery('body').removeClass('ios-quick-edit-off');
		} else {
			jQuery('body').removeClass('ios-quick-edit-on');
			jQuery('body').addClass('ios-quick-edit-off');
		}
	};
};
