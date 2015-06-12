/*global jQuery, MM, observable, XMLHttpRequest*/
MM.MapController = function (initialMapSources) {
	// order of mapSources is important, the first mapSource is default
	'use strict';
	observable(this);
	var self = this,
		dispatchEvent = this.dispatchEvent,
		mapLoadingConfirmationRequired,
		mapInfo = {},
		activeMapSource,
		mapSources = [].concat(initialMapSources),
		lastProperties,
		chooseMapSource = function (identifier) {
			// order of identifiers is important, the first identifier takes precedence
			var mapSourceIndex;
			for (mapSourceIndex = 0; mapSourceIndex < mapSources.length; mapSourceIndex++) {
				if (mapSources[mapSourceIndex].recognises(identifier)) {
					return mapSources[mapSourceIndex];
				}
			}
		},
		mapLoaded = function (idea, mapId, properties) {
			lastProperties = properties;
			mapLoadingConfirmationRequired = false;
			properties = properties || {};
			if (!properties.autoSave) {
				idea.addEventListener('changed', function () {
					mapLoadingConfirmationRequired = true;
				});
			}
			mapInfo = {
				idea: idea,
				mapId: properties.editable && mapId
			};
			dispatchEvent('mapLoaded', mapId, idea, properties);
		};
	self.addMapSource = function (mapSource) {
		mapSources.push(mapSource);
	};
	self.validMapSourcePrefixesForSaving = 'abgp';
	self.setMap = mapLoaded;
	self.isMapLoadingConfirmationRequired = function () {
		return mapLoadingConfirmationRequired;
	};

	self.currentMapId = function () {
		return mapInfo && mapInfo.mapId;
	};

	self.loadMap = function (mapId, force) {
		var progressEvent = function (evt) {
				var done = (evt && evt.loaded) || 0,
					total = (evt && evt.total) || 1,
					message = ((evt && evt.loaded) ? Math.round(100 * done / total) + '%' : evt);
				dispatchEvent('mapLoading', mapId, message);
			},
			mapLoadFailed = function (reason, label) {
				var retryWithDialog = function () {
					dispatchEvent('mapLoading', mapId);
					activeMapSource.loadMap(mapId, true).then(mapLoaded, mapLoadFailed, progressEvent);
				}, mapSourceName = activeMapSource.description ? ' [' + activeMapSource.description + ']' : '';
				if (reason === 'no-access-allowed') {
					dispatchEvent('mapLoadingUnAuthorized', mapId, reason);
				} else if (reason === 'failed-authentication') {
					dispatchEvent('authorisationFailed', activeMapSource.description, retryWithDialog);
				} else if (reason === 'not-authenticated') {
					dispatchEvent('authRequired', activeMapSource.description, retryWithDialog);
				} else if (reason === 'map-load-redirect') {
					self.loadMap(label, force);
				} else if (reason === 'user-cancel') {
					dispatchEvent('mapLoadingCancelled');
				} else {
					label = label ? label + mapSourceName : mapSourceName;
					dispatchEvent('mapLoadingFailed', mapId, reason, label);
				}
			};

		if (mapId === this.currentMapId() && !force) {
			dispatchEvent('mapLoadingCancelled', mapId);
			return;
		}
		if (!force && mapLoadingConfirmationRequired) {
			dispatchEvent('mapLoadingConfirmationRequired', mapId);
			return;
		}
		activeMapSource = chooseMapSource(mapId);
		if (!activeMapSource) {
			dispatchEvent('mapIdNotRecognised', mapId);
			return;
		}
		dispatchEvent('mapLoading', mapId);
		activeMapSource.loadMap(mapId).then(
			mapLoaded,
			mapLoadFailed,
			progressEvent
		);
	};
	this.publishMap = function (mapSourceType, forceNew) {
		var mapSaved = function (savedMapId, properties) {
				var previousWasReloadOnSave = lastProperties && lastProperties.reloadOnSave;
				properties = properties || {};
				lastProperties = properties;
				mapLoadingConfirmationRequired = false;
				mapInfo.mapId = savedMapId;
				dispatchEvent('mapSaved', savedMapId, mapInfo.idea, properties);
				if (previousWasReloadOnSave || properties.reloadOnSave) {
					self.loadMap(savedMapId, true);
				}
			},
			progressEvent = function (evt) {
				var done = (evt && evt.loaded) || 0,
					total = (evt && evt.total) || 1,
					message = ((evt && evt.loaded) ? Math.round(100 * done / total) + '%' : evt);
				dispatchEvent('mapSaving', activeMapSource.description, message);
			},
			mapSaveFailed = function (reason, label) {
				var retryWithDialog = function () {
					dispatchEvent('mapSaving', activeMapSource.description);
					activeMapSource.saveMap(mapInfo.idea, mapInfo.mapId, true).then(mapSaved, mapSaveFailed, progressEvent);
				}, mapSourceName = activeMapSource.description || '';
				label = label ? label + mapSourceName : mapSourceName;
				if (reason === 'no-access-allowed') {
					dispatchEvent('mapSavingUnAuthorized', function () {
						dispatchEvent('mapSaving', activeMapSource.description, 'Creating a new file');
						activeMapSource.saveMap(mapInfo.idea, 'new', true).then(mapSaved, mapSaveFailed, progressEvent);
					});
				} else if (reason === 'failed-authentication') {
					dispatchEvent('authorisationFailed', label, retryWithDialog);
				} else if (reason === 'not-authenticated') {
					dispatchEvent('authRequired', label, retryWithDialog);
				} else if (reason === 'file-too-large') {
					dispatchEvent('mapSavingTooLarge', activeMapSource.description);
				} else if (reason === 'user-cancel') {
					dispatchEvent('mapSavingCancelled');
				} else {
					dispatchEvent('mapSavingFailed', reason, label);
				}
			},
			saveAsId = forceNew ? '' : mapInfo.mapId;
		activeMapSource = chooseMapSource(mapSourceType || mapInfo.mapId);
		dispatchEvent('mapSaving', activeMapSource.description);
		activeMapSource.saveMap(mapInfo.idea, saveAsId).then(
			mapSaved,
			mapSaveFailed,
			progressEvent
		);
	};
};
MM.MapController.activityTracking = function (mapController, activityLog) {
	'use strict';
	var startedFromNew = function (idea) {
			return idea.id === 1;
		},
		isNodeRelevant = function (ideaNode) {
			return ideaNode.title && ideaNode.title.search(/MindMup|Lancelot|cunning|brilliant|Press Space|famous|Luke|daddy/) === -1;
		},
		isNodeIrrelevant = function (ideaNode) {
			return !isNodeRelevant(ideaNode);
		},
		isMapRelevant = function (idea) {
			return startedFromNew(idea) && idea.find(isNodeRelevant).length > 5 && idea.find(isNodeIrrelevant).length < 3;
		},
		wasRelevantOnLoad,
		changed = false,
		oldIdea;
	mapController.addEventListener('mapLoaded', function (mapId, idea) {
		activityLog.log('Map', 'View', mapId);
		wasRelevantOnLoad = isMapRelevant(idea);
		if (oldIdea !== idea) {
			oldIdea = idea;
			idea.addEventListener('changed', function (command, args) {
				if (!changed) {
					changed = true;
					activityLog.log('Map', 'Edit');
				}
				activityLog.log(['Map', command].concat(args));
			});
		}
	});
	mapController.addEventListener('mapLoadingFailed', function (mapUrl, reason, label) {
		var message = 'Error loading map document [' + mapUrl + '] ' + JSON.stringify(reason);
		if (label) {
			message = message + ' label [' + label + ']';
		}
		activityLog.error(message);
	});
	mapController.addEventListener('mapSaving', activityLog.log.bind(activityLog, 'Map', 'Save Attempted'));
	mapController.addEventListener('mapSaved', function (id, idea) {
		changed = false;
		if (isMapRelevant(idea) && !wasRelevantOnLoad) {
			activityLog.log('Map', 'Created Relevant', id);
		} else if (wasRelevantOnLoad) {
			activityLog.log('Map', 'Saved Relevant', id);
		} else {
			activityLog.log('Map', 'Saved Irrelevant', id);
		}
	});
	mapController.addEventListener('mapSavingFailed', function (reason, repositoryName) {
		activityLog.error('Map save failed (' + repositoryName + ')' + JSON.stringify(reason));
	});
	mapController.addEventListener('networkError', function (reason) {
		activityLog.log('Map', 'networkError', JSON.stringify(reason));
	});
};
MM.MapController.alerts = function (mapController, alert, modalConfirmation) {
	'use strict';
	var alertId,
		showAlertWithCallBack = function (message, prompt, callback, cancel) {
			alert.hide(alertId);
			modalConfirmation.showModalToConfirm('Please confirm', message, prompt).then(callback, cancel);
		},
		showErrorAlert = function (title, message) {
			alert.hide(alertId);
			alertId = alert.show(title, message, 'error');
		};

	mapController.addEventListener('mapLoadingConfirmationRequired', function (newMapId) {
		var isNew = /^new/.test(newMapId);
		showAlertWithCallBack(
			'There are unsaved changes in the current map. Please confirm that you would like to ' + (isNew ? 'create a new map' : 'load a different map.'),
			(isNew ? 'Create New' : 'Load anyway'),
			function () {
				mapController.loadMap(newMapId, true);
			}
		);
	});
	mapController.addEventListener('mapLoading', function (mapUrl, progressMessage) {
		alert.hide(alertId);
		alertId = alert.show('<i class="icon-spinner icon-spin"></i>&nbsp;Please wait, loading the map...', (progressMessage || ''));
	});
	mapController.addEventListener('mapSaving', function (repositoryName, progressMessage) {
		alert.hide(alertId);
		alertId = alert.show('<i class="icon-spinner icon-spin"></i>&nbsp;Please wait, saving the map...', (progressMessage || ''));
	});
	mapController.addEventListener('authRequired', function (providerName, authCallback) {
		showAlertWithCallBack(
			'This operation requires authentication through ' + providerName + ', an external storage provider. ' +
				'Please click on Authenticate below to go to the external provider and allow MindMup to access your account. ' +
				'You can learn more about authentication requirements on our <a href="http://blog.mindmup.com/p/storage-options.html" target="_blank">Storage Options</a> page.',
			'Authenticate',
			authCallback
		);
	});
	mapController.addEventListener('mapSaved mapLoaded', function () {
		alert.hide(alertId);
	});
	mapController.addEventListener('authorisationFailed', function (providerName, authCallback) {
		showAlertWithCallBack(
			'The operation was rejected by ' + providerName + ' storage. Click on Reauthenticate to try using different credentials or license.',
			'Reauthenticate',
			authCallback
		);
	});
	mapController.addEventListener('mapLoadingUnAuthorized', function () {
		showErrorAlert('The map could not be loaded.', 'You do not have the right to view this map. <a target="_blank" href="http://blog.mindmup.com/p/how-to-resolve-common-networking.html">Click here for some common solutions</a>');
	});
	mapController.addEventListener('mapSavingUnAuthorized', function (callback) {
		showAlertWithCallBack(
			'You do not have the right to edit this map',
			'Save a copy',
			callback
		);
	});
	mapController.addEventListener('mapLoadingFailed', function (mapId, reason, label) {
		showErrorAlert('Unfortunately, there was a problem loading the map.' + label, 'If you are not experiencing network problems, <a href="http://blog.mindmup.com/p/how-to-resolve-common-networking.html" target="blank">click here for some common ways to fix this</a>');
	});
	mapController.addEventListener('mapSavingCancelled mapLoadingCancelled', function () {
		alert.hide(alertId);
	});
	mapController.addEventListener('mapSavingTooLarge', function (mapSourceDescription) {
		if (mapSourceDescription === 'S3_CORS') {
			showAlertWithCallBack('The map is too large for anonymous MindMup storage. Maps larger than 100 KB can only be stored to MindMup Gold, or a third-party cloud storage. (<a href="http://blog.mindmup.com/p/storage-options.html" target="_blank">more info on storage options</a>)', 'Save to MindMup Gold', function () {
				mapController.publishMap('b');
			}, function () {
				mapController.dispatchEvent('mapSavingCancelled');
			});
		} else {
			showErrorAlert('Unfortunately, the file is too large for the selected storage.', 'Please select a different storage provider from File -&gt; Save As menu');
		}
	});
	mapController.addEventListener('mapSavingFailed', function (reason, label, callback) {
		var messages = {
			'network-error': ['There was a network problem communicating with the server.', 'If you are not experiencing network problems, <a href="http://blog.mindmup.com/p/how-to-resolve-common-networking.html" target="blank">click here for some common ways to fix this</a>. Don\'t worry, you have an auto-saved version in this browser profile that will be loaded the next time you open the map']
		},
			message = messages[reason] || ['Unfortunately, there was a problem saving the map.', 'Please try again later. We have sent an error report and we will look into this as soon as possible'];
		if (callback) {
			showAlertWithCallBack(message[0], message[1], callback);
		} else {
			showErrorAlert(message[0], message[1]);
		}
	});


};
(function () {
	'use strict';
	var oldXHR = jQuery.ajaxSettings.xhr.bind(jQuery.ajaxSettings);
	jQuery.ajaxSettings.xhr = function () {
		var xhr = oldXHR();
		if (xhr instanceof XMLHttpRequest) {
			xhr.addEventListener('progress', this.progress, false);
		}
		if (xhr.upload) {
			xhr.upload.addEventListener('progress', this.progress, false);
		}
		return xhr;
	};
}());
