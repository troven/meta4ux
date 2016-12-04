/*global jQuery, MM*/
MM.IOSMapSource = function (content) {
	'use strict';
	var properties = {editable: true},
			mapContent = content;
	this.recognises = function () {
		return true;
	};
	this.setIdea = function (content) {
		mapContent = content;
	};
	this.loadMap = function (mapId) {
		return jQuery.Deferred().resolve(mapContent, mapId, properties).promise();
	};
};
