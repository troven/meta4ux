/*global MM, observable*/
MM.AutoSave = function (mapController, storage, alertDispatcher, mapModel, clipboardKey) {
	'use strict';
	var prefix = 'auto-save-',
		self = this,
		currentMapId,
		currentIdea,
		changeListener,
		resourceListener,
		events = [],
		warningId,
		checkForLocalChanges = function (mapId) {
			var value = storage.getItem(prefix + mapId);
			if (value) {
				self.dispatchEvent('unsavedChangesAvailable', mapId);
			}
		},
		pushEvent = function (eventObject, mapId) {
			var autoSaveKey = prefix + mapId,
					saveEvents = function () {
						try {
							storage.setItem(autoSaveKey, events);
							return true;
						} catch (e) {
							return false;
						}
					},
					showWarning = function () {
						if (warningId) {
							return;
						}
						warningId = alertDispatcher.show('Unable to back up unsaved changes!', 'Please save this map as soon as possible to avoid losing unsaved information.', 'warning');
					};
			events.push(eventObject);
			if (!saveEvents()) {

				if (storage.removeKeysWithPrefix(prefix) + storage.removeKeysWithPrefix(clipboardKey) === 0) {
					showWarning();
				} else if (!saveEvents()) {
					showWarning();
				}
			}
		},
		trackChanges = function (idea, mapId) {
			events = [];
			changeListener = function (command, params) {
				pushEvent({cmd: command, args: params}, mapId);
			};
			resourceListener = function (resourceBody, resourceId) {
				pushEvent({cmd: 'storeResource', args: [resourceBody, resourceId]}, mapId);
			};
			idea.addEventListener('changed', changeListener);
			idea.addEventListener('resourceStored', resourceListener);
		},
		clearWarning = function () {
			if (warningId) {
				alertDispatcher.hide(warningId);
			}
			warningId = undefined;
		},
		onTrackingChange = function (mapId, idea, properties) {
			if (changeListener && currentIdea) {
				currentIdea.removeEventListener('changed', changeListener);
				currentIdea.removeEventListener('resourceStored', resourceListener);
			}

			if (mapId && (!properties || !properties.autoSave)) {
				currentMapId = mapId;
				currentIdea = idea;
				clearWarning();
				checkForLocalChanges(mapId);
				trackChanges(idea, mapId);
			}
		};
	observable(this);
	clipboardKey = clipboardKey || 'clipboard';
	self.applyUnsavedChanges = function () {
		var events = storage.getItem(prefix + currentMapId);
		if (events) {
			mapModel.pause();
			events.forEach(function (event) {
				currentIdea.execCommand(event.cmd, event.args);
			});
			mapModel.resume();
		}
	};
	self.discardUnsavedChanges = function () {
		events = [];
		storage.remove(prefix + currentMapId);
	};
	mapController.addEventListener('mapSaved', function (mapId, idea) {
		clearWarning();
		if (mapId === currentMapId || idea === currentIdea) {
			self.discardUnsavedChanges();
		}
		if (mapId !== currentMapId) {
			onTrackingChange(mapId, idea);
		}
	});
	mapController.addEventListener('mapLoaded', onTrackingChange);
};


