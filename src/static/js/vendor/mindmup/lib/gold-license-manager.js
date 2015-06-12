/* global MM, observable, jQuery, _ */
/**
 * Utility method to manage the active Gold license in memory. Uses a browser storage to cache the license
 * and expects a visual widget to listen to observable events to handle possible authentication requests.
 *
 * The class is split out
 * from the {{#crossLink "GoldApi"}}{{/crossLink}} class so third-party users can provide an alternative
 * implementation that reads a license from disk or something similar.
 *
 * @class GoldLicenseManager
 * @constructor
 * @param {JsonStorage} storage an object store for license persistence
 * @param {String} storageKey the hash-key used to store the license in the storage
 */
MM.GoldLicenseManager = function (storage, storageKey) {
	'use strict';
	var self = this,
		currentDeferred,
		validFormat = function (license) {
			return license && license.accountType === 'mindmup-gold';
		};
	observable(this);
    /**
     * Get the current license from memory, without trying to asynchronously retrieve it from network
     *
     * @method getLicense
     * @return {Object} the current license from storage
     */
	this.getLicense = function () {
		return storage.getItem(storageKey);
	};
    /**
     * Asynchronous method which will try to get a local license, and if not available notify any observers to
     * show the UI for logging in or retrieving the license over network in some other way
     * @method retrieveLicense
     * @param {Boolean} forceAuthentication if true, force authentication even if logged in (eg to force a login or replacing an expired license)
     * @return {jQuery.Deferred} a promise that will be resolved when a license is finally set or rejected
     */
	this.retrieveLicense = function (forceAuthentication) {
		currentDeferred = undefined;
		if (!forceAuthentication && this.getLicense()) {
			return jQuery.Deferred().resolve(this.getLicense()).promise();
		}
		currentDeferred = jQuery.Deferred();
		self.dispatchEvent('license-entry-required');
		return currentDeferred.promise();
	};
    /**
     * Set the in-memory cached license
     *
     * @method storeLicense
     * @param {String or JSON} licenseArg gold license
     * @return true if the license is in correct format and storage accepted it, false otherwise
     */
	this.storeLicense = function (licenseArg) {
		var license = licenseArg;
		if (_.isString(licenseArg)) {
			try {
				license = JSON.parse(licenseArg);
			} catch (e) {
				return false;
			}
		}
		if (!validFormat(license)) {
			return false;
		}
		storage.setItem(storageKey, license);
		return true;
	};
	this.removeLicense = function () {
		storage.setItem(storageKey, undefined);
	};
    /**
     * Stop the current asynchronous license entry process, notifying all observers about failure.
     *
     * _This is an optional method, and you only need to re-implement it if you want to re-use the MindMup Gold License entry widget._
     *
     *
     * @method cancelLicenseEntry
     */
	this.cancelLicenseEntry = function () {
		var deferred = currentDeferred;
		if (currentDeferred) {
			currentDeferred = undefined;
			deferred.reject('user-cancel');
		}
	};
    /**
     * Complete the current asynchronous license entry, notifying all observers about successful completion. this implementation
     * expects that storeLicense was already called.
     *
     * _This is an optional method, and you only need to re-implement it if you want to re-use the MindMup Gold License entry widget._
     *
     * @method completeLicenseEntry
     */
	this.completeLicenseEntry = function () {
		var deferred = currentDeferred;
		if (currentDeferred) {
			currentDeferred = undefined;
			deferred.resolve(self.getLicense());
		}
	};
};
