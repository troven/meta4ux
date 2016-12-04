/*global MM, jQuery, _, MAPJS*/
MM.LocalStorageClipboard = function (storage, key, alertController, resourceManager) {
	'use strict';
	var self = this,
			deepClone = function (o) {
				return JSON.parse(JSON.stringify(o));
			},
			processResources = function (object, predicate) {
				var result;
				if (!object) {
					return object;
				}
				if (_.isArray(object)) {
					return _.map(object, function (item) {
						return processResources(item, predicate);
					});
				}
				result = deepClone(object);
				if (object.attr && object.attr.icon && object.attr.icon.url) {
					result.attr.icon.url = predicate(object.attr.icon.url);
				}
				if (object.ideas) {
					result.ideas = {};
					_.each(object.ideas, function (v, k) {
						result.ideas[k] = processResources(v, predicate);
					});
				}
				return result;
			};
	self.get = function (skipResourceTranslation) {
		if (skipResourceTranslation) {
			return storage.getItem(key);
		}
		return processResources(storage.getItem(key), resourceManager.storeResource);
	};
	self.put = function (c) {
		try {
			storage.setItem(key, processResources(c, resourceManager.getResource));
		} catch (e) {
			alertController.show('Clipboard error', 'Insufficient space to copy object - saving the map might help up free up space', 'error');
		}
	};
};
jQuery.fn.newFromClipboardWidget = function (clipboard, mapController, resourceCompressor) {
	'use strict';
	var elements = jQuery(this);
	elements.click(function () {
		var map = clipboard.get(true),
			content;
		if (!map) {
			return;
		}
		if (_.isArray(map) && map.length > 1) {
			content = MAPJS.content(JSON.parse(JSON.stringify(MM.Maps.default)));
			content.pasteMultiple(1, map);
		} else {
			if (_.isArray(map)) {
				map = map[0];
			}
			if (map.attr && map.attr.style) {
				map.attr.style = undefined;
			}
			content = MAPJS.content(map);
		}
		resourceCompressor.compress(content);
		mapController.setMap(content);
	});
	return elements;
};
