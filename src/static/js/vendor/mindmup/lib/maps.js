/*global MM, jQuery, MAPJS, _*/
MM.Maps = {};
MM.Maps['default'] = MM.Maps['new'] = {'title': 'Press Space or double-click to edit', 'id': 1};

MM.EmbeddedMapSource = function (newMapProperties) {
	'use strict';
	var properties = newMapProperties ||  {editable: true};
	this.recognises = function (mapId) {
		if ((/^new-/).test(mapId)) {
			mapId = 'new';
		}
		return MM.Maps[mapId];
	};
	this.loadMap = function (mapId) {
		return jQuery.Deferred().resolve(MAPJS.content(_.clone(this.recognises(mapId))), mapId, properties).promise();
	};
};
