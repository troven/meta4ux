/*global jQuery, MM, FormData, window, _*/
/**
 *
 * Utility class that implements AWS S3 POST upload interface and
 * understands AWS S3 listing responses
 *
 * @class S3Api
 * @constructor
 */
MM.S3Api = function () {
	'use strict';
	var self = this;
    /**
     * Upload a file to S3 using the AWS S3 Post mechanism
     * @method save
     * @param {String} contentToSave file content to upload
     * @param {Object} saveConfiguration a hash containing
     * @param {String} saveConfiguration.key AWS S3 bucket key to upload
     * @param {String} saveConfiguration.AWSAccessKeyId AWS S3 access key ID of the requesting user
     * @param {String} saveConfiguration.policy AWS S3 POST upload policy, base64 encoded
     * @param {String} saveConfiguration.signature AWS S3 POST signed policy
     */
	this.save = function (contentToSave, saveConfiguration, options) {
		var formData = new FormData(),
			savePolicy = options && options.isPrivate ? 'bucket-owner-read' : 'public-read',
			deferred = jQuery.Deferred(),
			saveFailed = function (evt) {
				var errorReasonMap = { 'EntityTooLarge': 'file-too-large' },
					errorDoc,
					errorReason,
					errorLabel;
				if (evt.status === 403) {
					deferred.reject('failed-authentication');
					return;
				}
				try {
					errorDoc = evt && (evt.responseXML || jQuery.parseXML(evt.responseText));
					errorReason = jQuery(errorDoc).find('Error Code').text();
				} catch (e) {
					// just ignore, the network error is set by default
				}
				if (!errorReason) {
					deferred.reject('network-error');
					return;
				}
				errorLabel = jQuery(errorDoc).find('Error Message').text();

				deferred.reject(errorReasonMap[errorReason], errorLabel);
			};

		['key', 'AWSAccessKeyId', 'policy', 'signature'].forEach(function (parameter) {
			formData.append(parameter, saveConfiguration[parameter]);
		});
		formData.append('acl', savePolicy);
		formData.append('Content-Type', saveConfiguration['Content-Type'] || 'text/plain');
		formData.append('file', contentToSave);
		jQuery.ajax({
			url: 'https://' + saveConfiguration.s3BucketName + '.s3.amazonaws.com/',
			type: 'POST',
			processData: false,
			contentType: false,
			data: formData
		}).then(deferred.resolve, saveFailed);
		return deferred.promise();
	};
	self.pollerDefaults = {sleepPeriod: 1000, timeoutPeriod: 120000};
    /**
     * Poll until a file becomes available on AWS S3
     * @method poll
     * @param {String} signedListUrl a signed AWS S3 URL for listing on a key prefix
     * @param {Object} [opts] additional options
     * @param {int} [opts.sleepPeriod] sleep period in milliseconds between each poll (default=1 sec)
     * @param {int} [opts.timeoutPeriod] maximum total time before polling operation fails (default = 12 secs)
     * @param {function} [opts.stoppedSemaphore] a predicate function that is checked to see if polling should be aborted
     */
	self.poll = function (signedListUrl, options) {
		var sleepTimeoutId,
			timeoutId,
			deferred = jQuery.Deferred(),
			shouldPoll = function () {
				return deferred && !(options.stoppedSemaphore && options.stoppedSemaphore());
			},
			execRequest = function () {
				var setSleepTimeout = function () {
					if (shouldPoll()) {
						options.sleepTimeoutId = window.setTimeout(execRequest, options.sleepPeriod);
					}
				};
				if (shouldPoll()) {
					jQuery.ajax({
						url: signedListUrl,
						timeout: options.sleepPeriod,
						method: 'GET'
					}).then(function success(result) {
						var key = jQuery(result).find('Contents Key').first().text();
						if (deferred && key) {
							window.clearTimeout(timeoutId);
							deferred.resolve(key);
						} else {
							setSleepTimeout();
						}
					}, setSleepTimeout);
				} else {
					window.clearTimeout(timeoutId);
				}
			},
			cancelRequest = function () {
				if (shouldPoll()) {
					deferred.reject('polling-timeout');
				}
				window.clearTimeout(sleepTimeoutId);
				deferred = undefined;
			};
		options = _.extend({}, self.pollerDefaults, options);

		if (shouldPoll()) {
			timeoutId = window.setTimeout(cancelRequest, options.timeoutPeriod);
			execRequest();
		}
		return deferred.promise();
	};
	self.loadUrl = function (url) {
		var deferred = jQuery.Deferred();
		jQuery.ajax(
			url, { cache: false}).then(
			deferred.resolve,
			function (err) {
				if (err.status === 404 || err.status === 403) {
					deferred.reject('map-not-found');
				} else {
					deferred.reject('network-error');
				}

			});
		return deferred.promise();
	};
};
