/*global MM, window*/
MM.navigationDelimiters = ',;#';

MM.navigationEscape = function (toEscape, escapeChar) {
	'use strict';
	if (!toEscape) {
		return toEscape;
	}
	var regExString = '[' + MM.navigationDelimiters + ']+',
		regEx = new RegExp(regExString, 'g');
	escapeChar = escapeChar || '_';
	return toEscape.replace(regEx, escapeChar);
};

MM.navigation = function (storage, mapController) {
	'use strict';
	var self = this,
		unknownMapId = 'nil',
		mapIdRegExString = '[Mm]:([^' + MM.navigationDelimiters + ']*)',
		mapIdRegEx = new RegExp(mapIdRegExString),
		getMapIdFromHash = function () {
			var windowHash = window && window.location && window.location.hash,
				found = windowHash && mapIdRegEx.exec(windowHash);
			return found && found[1];
		},
		setMapIdInHash = function (mapId) {
			if (mapIdRegEx.test(window.location.hash)) {
				window.location.hash = window.location.hash.replace(mapIdRegEx, 'm:' + mapId);
			} else if (window.location.hash && window.location.hash !== '#') {
				window.location.hash = window.location.hash + ',m:' + mapId;
			} else {
				window.location.hash = 'm:' + mapId;
			}
		},
		changeMapId = function (newMapId) {
			if (newMapId) {
				storage.setItem('mostRecentMapLoaded', newMapId);
			}
			newMapId = newMapId || unknownMapId;
			setMapIdInHash(newMapId);
			return true;
		};
	self.initialMapId = function () {
		var initialMapId = getMapIdFromHash();
		if (!initialMapId || initialMapId === unknownMapId) {
			initialMapId = (storage && storage.getItem && storage.getItem('mostRecentMapLoaded'));
		}
		return initialMapId;
	};
	self.loadInitial = function () {
		var mapId = self.initialMapId();
		mapController.loadMap(mapId || 'new');
		return mapId;
	};
	mapController.addEventListener('mapSaved mapLoaded mapLoadingCancelled', function (newMapId) {
		changeMapId(newMapId);
	});
	self.hashChange = function () {
		var newMapId = getMapIdFromHash();
		if (newMapId === unknownMapId) {
			return;
		}
		if (!newMapId) {
			changeMapId(mapController.currentMapId());
			return false;
		}
		mapController.loadMap(newMapId);
		return true;
	};
	self.off = function () {
		window.removeEventListener('hashchange', self.hashChange);
	};
	self.on = function () {
		window.addEventListener('hashchange', self.hashChange);
	};
	self.on();
	return self;
};
