/*jslint forin: true*/
/*global jQuery, MM, _*/
MM.S3ConfigGenerator = function (s3Url, publishingConfigUrl, folder) {
	'use strict';
	this.generate = function () {
		var deferred = jQuery.Deferred(),
			options = {
				url: publishingConfigUrl,
				dataType: 'json',
				type: 'POST',
				processData: false,
				contentType: false
			};
		jQuery.ajax(options).then(
			function (jsonConfig) {
				jsonConfig.s3Url = s3Url;
				jsonConfig.mapId = jsonConfig.s3UploadIdentifier;
				deferred.resolve(jsonConfig);
			},
			deferred.reject.bind(deferred, 'network-error')
		);
		return deferred.promise();
	};
	this.buildMapUrl = function (mapId) {
		return jQuery.Deferred().resolve(s3Url + folder + mapId + '.json').promise();
	};
};

MM.S3FileSystem = function (publishingConfigGenerator, prefix, description) {
	'use strict';

	var properties = {editable: true},
		s3Api = new MM.S3Api(),
		lastSavePublishingConfig;
	this.description = description;
	this.prefix = prefix;
	this.recognises = function (mapId) {
		return mapId && mapId[0] === prefix;
	};
	this.loadMap = function (mapId, showAuthentication) {
		var deferred = jQuery.Deferred(),
			onMapLoaded = function (result) {
				deferred.resolve(result, mapId, 'application/json', properties);
			};
		publishingConfigGenerator.buildMapUrl(mapId, prefix, showAuthentication).then(
			function (mapUrl) {
				s3Api.loadUrl(mapUrl).then(onMapLoaded, deferred.reject);
			},
			deferred.reject
		);
		return deferred.promise();
	};
	this.saveMap = function (contentToSave, mapId, fileName, showAuthenticationDialog) {
		var deferred = jQuery.Deferred(),
			submitS3Form = function (publishingConfig) {
				lastSavePublishingConfig = publishingConfig;
				s3Api.save(contentToSave, publishingConfig, {'isPrivate': false}).then(
					function () {
						deferred.resolve(publishingConfig.mapId, _.extend(publishingConfig, properties));
					},
					deferred.reject
				);
			};
		publishingConfigGenerator.generate(mapId, fileName, prefix, showAuthenticationDialog).then(
			submitS3Form,
			deferred.reject
		);
		return deferred.promise();
	};
	this.destroyLastSave = function () {
		return s3Api.save('{"title": "This map was removed by its author"}', lastSavePublishingConfig, {'isPrivate': false});
	};
};

