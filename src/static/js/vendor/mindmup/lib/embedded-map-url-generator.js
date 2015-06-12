/* global MM, jQuery*/
MM.EmbeddedMapUrlGenerator = function (config) {
	'use strict';
	var self = this;
	self.buildMapUrl = function (mapId) {
		var prefix = mapId && mapId[0],
			prefixConfig = prefix && config[prefix],
			deferred = jQuery.Deferred();
		if (prefixConfig) {
			deferred.resolve((prefixConfig.prefix || '') +  mapId.slice(prefixConfig.remove) + (prefixConfig.postfix || ''));
		} else {
			deferred.reject();
		}
		return deferred.promise();
	};
};
