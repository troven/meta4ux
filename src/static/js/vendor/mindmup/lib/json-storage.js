/*global MM, _*/
/**
 * A simple wrapper that allows objects to be stored as JSON strings in a HTML5 storage. It
 * automatically applies JSON.stringify and JSON.parse when storing and retrieving objects
 *
 * @class JsonStorage
 * @constructor
 * @param {Object} storage object implementing the following API (for example a HTML5 localStorage)
 * @param {function} storage.setItem function(String key, String value)
 * @param {function} storage.getItem function(String key)
 * @param {function} storage.removeItem function(String key)
 */
MM.JsonStorage = function (storage) {
	'use strict';
	var self = this;
	/**
	 * Store an object under a key
	 * @method setItem
	 * @param {String} key the storage key
	 * @param {Object} value an object to be stored, has to be JSON serializable
	 */
	self.setItem = function (key, value) {
		return storage.setItem(key, JSON.stringify(value));
	};
	/**
	 * Get an item from storage
	 * @method getItem
	 * @param {String} key the storage key used to save the object
	 * @return {Object} a JSON-parsed object from storage
	 */
	self.getItem = function (key) {
		var item = storage.getItem(key);
		try {
			return JSON.parse(item);
		} catch (e) {
		}
	};
	/**
	 * Remove an object from storage
	 * @method remove
	 * @param {String} key the storage key used to save the object
	 */
	self.remove = function (key) {
		storage.removeItem(key);
	};

	self.removeKeysWithPrefix = function (prefixToMatch) {
		if (_.isEmpty(prefixToMatch)) {
			return 0;
		}
		var keysToMatch = Object.keys(storage),
			keysToRemove = _.filter(keysToMatch, function (key) {
				return key.indexOf(prefixToMatch) === 0;
			});
		_.each(keysToRemove, function (key) {
			storage.removeItem(key);
		});
		return keysToRemove.length;
	};
};
