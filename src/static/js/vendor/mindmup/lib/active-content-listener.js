/*global MM, observable*/

MM.ActiveContentListener = function (mapController) {
	'use strict';
	var self = observable(this),
		activeContent,
		onChanged = function (method, attrs) {
			self.dispatchEvent('mm-active-content-changed', activeContent, false, method, attrs);
		},
		onMapLoaded = function (newMapId, content) {
			if (activeContent) {
				activeContent.removeEventListener('changed', onChanged);
			}
			activeContent = content;
			self.dispatchEvent('mm-active-content-changed', activeContent, true);
			activeContent.addEventListener('changed', onChanged);
		};
	mapController.addEventListener('mapLoaded', onMapLoaded, 999);
	self.getActiveContent = function () {
		return activeContent;
	};
	self.addListener = function (onActiveContentChanged) {
		if (activeContent) {
			onActiveContentChanged(activeContent, false);
		}
		self.addEventListener('mm-active-content-changed', onActiveContentChanged);

	};
};
