/* global MM, jQuery, _*/

MM.GoldStorage = function (goldApi, s3Api, modalConfirmation, options) {
	'use strict';
	var self = this,
		fileProperties = {editable: true},
		privatePrefix,
		isRelatedPrefix = function (mapPrefix) {
			return mapPrefix && options && options[mapPrefix];
		},
		goldMapIdComponents = function (mapId) {
			var mapIdComponents = mapId && mapId.split('/');
			if (!mapIdComponents || mapIdComponents.length < 3) {
				return false;
			}
			if (!isRelatedPrefix(mapIdComponents[0])) {
				return false;
			}
			return {
				prefix: mapIdComponents[0],
				account: mapIdComponents[1],
				fileNameKey: decodeURIComponent(mapIdComponents[2])
			};
		},
		buildMapId = function (prefix, account, fileNameKey) {
			return prefix + '/' + account + '/' + encodeURIComponent(fileNameKey);
		};
	options = _.extend({'p': {isPrivate: true}, 'b': {isPrivate: false}, listPrefix: 'b'}, options);
	_.each(options, function (val, key) {
		if (val.isPrivate) {
			privatePrefix = key;
		}
	});
	self.fileSystemFor = function (prefix, description) {
		return {
			recognises: function (mapId) {
				return mapId && mapId[0] === prefix;
			},
			description: description || 'MindMup Gold',
			saveMap: function (contentToSave, mapId, fileName, showAuthenticationDialog) {
				return self.saveMap(prefix, contentToSave, mapId, fileName, showAuthenticationDialog);
			},
			loadMap: self.loadMap
		};
	};
	self.deleteMap = goldApi.deleteFile;
	self.list = function (showLicenseDialog) {
		var deferred = jQuery.Deferred(),
			onFileListReturned = function (fileList, account) {
				var prepend = options.listPrefix + '/' + account + '/',
					adaptItem = function (item) {
					return _.extend({id: prepend  + encodeURIComponent(item.title)}, item);
				};
				deferred.resolve(_.map(fileList, adaptItem));
			};
		goldApi.listFiles(showLicenseDialog).then(onFileListReturned, deferred.reject);
		return deferred.promise();
	};
	self.saveMap = function (prefix, contentToSave, mapId, fileName, showAuthenticationDialog) {
		var deferred = jQuery.Deferred(),
			s3FileName = function (goldMapInfo, account) {
				if (goldMapInfo && goldMapInfo.fileNameKey &&  goldMapInfo.account === account) {
					return goldMapInfo.fileNameKey;
				}
				return fileName;

			},
			onSaveConfig = function (saveConfig, account) {
				var goldMapInfo = goldMapIdComponents(mapId),
					s3FileNameKey = s3FileName(goldMapInfo, account),
					config = _.extend({}, saveConfig, {key: account + '/' + s3FileNameKey}),
					shouldCheckForDuplicate = function () {
						if (!goldMapInfo || account !== goldMapInfo.account) {
							return true;
						}
						return false;
					},
					onSaveComplete = function () {
						deferred.resolve(buildMapId(prefix, account, s3FileNameKey), fileProperties);
					},
					doSave = function () {
						s3Api.save(contentToSave, config, options[prefix]).then(onSaveComplete, deferred.reject);
					},
					doConfirm = function () {
						modalConfirmation.showModalToConfirm(
							'Confirm saving',
							'There is already a file with that name in your gold storage. Please confirm that you want to overwrite it, or cancel and rename the map before saving',
							'Overwrite'
						).then(
							doSave,
							deferred.reject.bind(deferred, 'user-cancel')
						);
					},
					checkForDuplicate = function () {
						goldApi.exists(s3FileNameKey).then(
							function (exists) {
								if (exists) {
									doConfirm();
								} else {
									doSave();
								}
							},
							deferred.reject
						);
					};
				if (shouldCheckForDuplicate()) {
					checkForDuplicate();
				} else {
					doSave();
				}

			};

		goldApi.generateSaveConfig(showAuthenticationDialog).then(onSaveConfig, deferred.reject);

		return deferred.promise();
	};
	self.loadMap = function (mapId, showAuthenticationDialog) {
		var deferred = jQuery.Deferred(),
			goldMapInfo = goldMapIdComponents(mapId),
			loadMapInternal = function (mapPrefix, account, fileNameKey) {
				var privateMap = options[mapPrefix].isPrivate;
				goldApi.fileUrl(showAuthenticationDialog, account, fileNameKey, privateMap).then(
					function (url) {
						s3Api.loadUrl(url).then(function (content) {
							deferred.resolve(content, buildMapId(mapPrefix, account, fileNameKey), 'application/json', fileProperties);
						},
						function (reason) {
							if (reason === 'map-not-found' && !privateMap && privatePrefix) {
								loadMapInternal(privatePrefix, account, fileNameKey);
							} else {
								deferred.reject(reason);
							}
						});
					},
					deferred.reject
				);
			};

		if (goldMapInfo) {
			loadMapInternal(goldMapInfo.prefix, goldMapInfo.account, goldMapInfo.fileNameKey);
		} else {
			deferred.reject('invalid-args');
		}
		return deferred.promise();
	};
};

