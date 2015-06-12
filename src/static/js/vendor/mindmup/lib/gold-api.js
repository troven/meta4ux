/* global MM, jQuery, FormData, _ */
/**
 * MM Gold API wrapper. This class is a JavaScript interface to the remote HTTP Gold server API,
 * and provides low-level methods for authentication and generating security tokens.
 * It implements the _configurationGenerator_ interface required by the {{#crossLink "LayoutExportController"}}{{/crossLink}}
 * so it can be used directly to construct an export workflow class.
 *
 * ## Access licenses
 *
 * MindMup Gold requires a valid license for most file operations. The license is effectively a secret key
 * identifying the user, and granting access to the server resources for storage and export. The license
 * is used for billing purposes to associate the resource usage with an active Gold subscription.
 *
 * There are two ways to allow users to access the service:
 *
 * 1. Allow your users to log in with their individual Gold accounts, effectively using their subscriptions
 * 2. Use a single license for all the users
 *
 * For the first scenario, each user session should go through the Authentication Workflow described below. For
 * the second scenario, it is better to execute the authentication once manually, and store the license
 * key securely on a server. The license key never expires and should be kept secret.
 *
 * To make this class more useful, the actual storage and management of the license is abstracted into a separate
 * interface, so third party implementers can provide their own storage mechanism. See
 * the {{#crossLink "GoldLicenseManager"}}{{/crossLink}} for more information.
 *
 * ## Authentication workflow
 *
 * MindMup Gold does not use passwords - instead, the authentication workflow
 * is similar to the typical password reset scenario - a one-time
 * authentication token can be requested from the server, and the token is sent
 * to the e-mail associated with the account. This token can then be used to
 * retrieve the Gold license key (in effect, logging in). See
 * {{#crossLink "GoldApi/requestCode:method"}}{{/crossLink}} and
 * {{#crossLink "GoldApi/restoreLicenseWithCode:method"}}{{/crossLink}}
 * for more information.
 *
 * For extra security, the internal HTTP API requires the sender to provide a
 * token known only to the requester while asking for a code, and supply the
 * same token again when retrieving the license. This effectively protects
 * against the e-mail being intercepted. A third party reading e-mails with
 * access codes will not be able to use them, because they don't know the
 * client token. The JavaScript API hides this complexity and automatically
 * generates a random string to send. This limits the execution of the two
 * calls to a single instance of GoldApi, as the current string is stored in
 * memory.
 *
 * The one-time codes sent by mail have to be used within a 10 minute time span
 * to retrieve a license, and only one such code can be active at any given
 * time. Requesting a new code effectively cancels the previous one.  (The
 * license string itself never expires automatically, and can be cached
 * locally).
 *
 * @class GoldApi
 * @constructor
 * @param {GoldLicenseManager} goldLicenseManager an object implementing the GoldLicenseManager API
 * @param {String} goldApiUrl the end-point for the HTTP API
 * @param {ActivityLog} activityLog activity log instance for logging purposes
 * @param {String} goldBucketName the S3 bucket name for public and anonymous files
 */
MM.GoldApi = function (goldLicenseManager, goldApiUrl, activityLog, goldBucketName) {
	'use strict';
	var self = this,
		currentOnetimePassword,
		currentIdentifier,
		LOG_CATEGORY = 'GoldApi',
		apiError = function (serverResult) {
			var recognisedErrors = ['not-authenticated', 'invalid-args', 'server-error', 'user-exists', 'email-exists'];
			if (_.contains(recognisedErrors, serverResult)) {
				return serverResult;
			}
			return 'network-error';
		},
		licenseExec = function (apiProc, showLicenseDialog, args, expectedAccount) {
			var deferred = jQuery.Deferred(),
				onLicenceRetrieved = function (license) {
					var execArgs = _.extend({}, args, {'license': JSON.stringify(license)});
					if (expectedAccount && expectedAccount !== license.account) {
						deferred.reject('not-authenticated');
					} else {
						self.exec(apiProc, execArgs).then(
							function (httpResult) {
								deferred.resolve(httpResult, license.account);
							},
							deferred.reject);
					}
				};
			goldLicenseManager.retrieveLicense(showLicenseDialog).then(onLicenceRetrieved, deferred.reject);
			return deferred.promise();
		};
	self.exec = function (apiProc, args) {
		var deferred = jQuery.Deferred(),
			rejectWithError = function (jxhr) {
				var result = jxhr.responseText;
				activityLog.log(LOG_CATEGORY, 'error', apiProc + ':' + result);
				deferred.reject(apiError(result));
			},
			timer  = activityLog.timer(LOG_CATEGORY, apiProc),
			formData = new FormData(),
			dataTypes = { 'license/register': 'json', 'file/export_config': 'json', 'file/upload_config': 'json', 'file/echo_config': 'json', 'license/subscription': 'json', 'license/request_license_using_code': 'json'};
		formData.append('api_version', '3');
		if (args) {
			_.each(args, function (value, key) {
				formData.append(key, value);
			});
		}
		jQuery.ajax({
			url: goldApiUrl + '/' + apiProc,
			dataType: dataTypes[apiProc],
			data: formData,
			processData: false,
			contentType: false,
			type: 'POST'
		}).then(deferred.resolve, rejectWithError).always(timer.end);
		return deferred.promise();
	};
	self.register = function (accountName, email) {
		var result = jQuery.Deferred();
		self.exec('license/register', {'to_email': email, 'account_name' : accountName})
			.then(function (jsonResponse) {
				if (jsonResponse.license) {
					goldLicenseManager.storeLicense(jsonResponse.license);
				}
				result.resolve(jsonResponse);
			},
			result.reject,
			result.notify);
		return result.promise();
	};
	self.getSubscription = function () {
		var license = goldLicenseManager.getLicense();
		return self.exec('license/subscription', {'license': JSON.stringify(license)});
	};
	self.cancelSubscription = function () {
		var license = goldLicenseManager.getLicense();
		return self.exec('license/cancel_subscription', {'license': JSON.stringify(license)});
	};
    /**
     * Creates an export configuration for server-side exports. See
     * {{#crossLink "LayoutExportController/startExport:method"}}{{/crossLink}}
     * for an example of how to use it.
     *
     * @method generateExportConfiguration
     * @param {String} format one of supported formats
     * @return {jQuery.Deferred} asynchronous promise that will be resolved with the export configuration
     */
	self.generateExportConfiguration = function (format) {
		var license = goldLicenseManager.getLicense();
		return self.exec('file/export_config', {'license': JSON.stringify(license), 'format': format});
	};
	self.generateEchoConfiguration = function (format, contentType) {
		var license = goldLicenseManager.getLicense();
		return self.exec('file/echo_config', {'license': JSON.stringify(license), 'format': format, 'contenttype': contentType});
	};
    /**
     * Request a one-time password from the Gold server. This method starts the remote authentication
     * workflow, and will result in a one-time password being sent to the e-mail address associated with the account.
     *
     * @method requestCode
     * @param {String} identifier email or account name
     * @param {String} [clientToken]
     * @return {jQuery.Deferred} an asynchronous promise that will resolve if the e-mail was sent from the server and reject in case of an error
     */
	self.requestCode = function (identifier) {
		currentOnetimePassword = MM.onetimePassword();
		currentIdentifier = identifier;
		return self.exec('license/request_code', {'identifier': identifier, 'one_time_pw': currentOnetimePassword});
	};
    /**
     * Load the license manager with the license, using a one time password sent by the Gold server. This
     * method completes the remote authentication worksflow.
     *
     * @method restoreLicenseWithCode
     * @param {String} code the one-time password received after requesting the code
     * @return {jQuery.Deferred} an asynchronous promise that will resolve or reject depending on the outcome. if successful, the GoldLicenseManager will have its license set.
     */
	self.restoreLicenseWithCode = function (code) {
		var deferred = jQuery.Deferred();
		if (currentOnetimePassword && currentIdentifier) {
			self.exec('license/request_license_using_code', {'identifier': currentIdentifier, 'one_time_pw': currentOnetimePassword, 'code': code}).then(
				function (license) {
					goldLicenseManager.storeLicense(license);
					deferred.resolve();
				},
				deferred.reject);
		} else {
			deferred.reject('no-code-requested');
		}
		return deferred.promise();
	};
	self.listFiles = function (showLicenseDialog) {
		var deferred = jQuery.Deferred(),
			onListReturned = function (httpResult, account) {
				var parsed = jQuery(httpResult),
					list = [];
				parsed.find('Contents').each(function () {
					var element = jQuery(this),
						key = element.children('Key').text(),
						remove = key.indexOf('/') + 1;
					list.push({
						modifiedDate: element.children('LastModified').text(),
						title:  key.slice(remove)
					});
				});
				deferred.resolve(list, account);
			};
		licenseExec('file/list', showLicenseDialog).then(onListReturned, deferred.reject);
		return deferred.promise();
	};
	self.generateSaveConfig = function (showLicenseDialog) {
		return licenseExec('file/upload_config', showLicenseDialog);
	};
	self.fileUrl = function (showAuthenticationDialog, account, fileNameKey, signedUrl) {
		if (signedUrl) {
			return licenseExec('file/url', showAuthenticationDialog, {'file_key': encodeURIComponent(fileNameKey)}, account);
		} else {
			return jQuery.Deferred().resolve('https://' + goldBucketName + '.s3.amazonaws.com/' + account + '/' + encodeURIComponent(fileNameKey)).promise();
		}

	};
	self.exists = function (fileNameKey) {
		var deferred = jQuery.Deferred(),
			license = goldLicenseManager.getLicense();
		if (license) {
			self.exec('file/exists', {'license': JSON.stringify(license), 'file_key': encodeURIComponent(fileNameKey)}).then(
				function (httpResult) {
					var parsed = jQuery(httpResult);
					deferred.resolve(parsed.find('Contents').length > 0);
				},
				deferred.reject
				);
		} else {
			deferred.reject('not-authenticated');
		}
		return deferred.promise();
	};
	self.deleteFile = function (fileNameKey) {
		var deferred = jQuery.Deferred(),
			license = goldLicenseManager.getLicense();
		if (license) {
			self.exec('file/delete', {'license': JSON.stringify(license), 'file_key': fileNameKey}).then(
				deferred.resolve,
				deferred.reject
				);
		} else {
			deferred.reject('not-authenticated');
		}
		return deferred.promise();
	};
};
MM.onetimePassword = function () {
	'use strict';
	var s4 = function () {
		var rand = (1 + Math.random());
		return ((rand * 0x10000) || 0).toString(16).substring(1);
	};

	return s4() + '-' + s4();
};
