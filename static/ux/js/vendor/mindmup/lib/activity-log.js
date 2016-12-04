/*global jQuery, MM, observable*/
/**
 * Utility logging class that can dispatch events. Used by other classes
 * as a central tracking and analytics mechanism. Caches a list of most
 * recent events in memory for troubleshooting purposes.
 *
 * @class ActivityLog
 * @constructor
 * @param {int} maxNumberOfElements the maximum number of elements to keep in memory
 */
MM.ActivityLog = function (maxNumberOfElements) {
	'use strict';
	var activityLog = [], nextId = 1, self = this;
	observable(this);
    /**
     * Tracks an event and dispatches a **log** event to all observers.
     *
     * @method log
     * @param {String} ...args a list of arguments to log. By convention, the first argument is a category, the second is an action, the others are arbitrary strings
     */
	this.log = function () {
		var analyticArgs = ['log'];
		if (activityLog.length === maxNumberOfElements) {
			activityLog.shift();
		}
		activityLog.push({
			id: nextId,
			ts: new Date(),
			event: Array.prototype.join.call(arguments, ',')
		});
		nextId += 1;
		Array.prototype.slice.call(arguments).forEach(function (element) {
			if (jQuery.isArray(element)) {
				analyticArgs = analyticArgs.concat(element);
			} else {
				analyticArgs.push(element);
			}
		});
		self.dispatchEvent.apply(self, analyticArgs);
	};
    /**
     * Shorthand error logging method, it will call log with an Error category and dispatch a separate **error** event
     * @method error
     */
	this.error = function (message) {
		self.log('Error', message);
		self.dispatchEvent('error', message, activityLog);
	};
    /**
     * Utility method to look at the list of most recent events
     *
     * @method getLog
     * @return the list of most recent events
     */
	this.getLog = activityLog.slice.bind(activityLog);
    /**
     * Starts an asynchronous timer - can be stopped at a later point.
     * @method timer
     * @param {String} category the category to log
     * @param {String} action the action to log
     * @return javascript object with an **end** method, which will stop the timer and log the total number of milliseconds taken since start
     */
	this.timer = function (category, action) {
		var start = Date.now();
		return {
			end: function () {
				self.dispatchEvent('timer', category, action, Date.now() - start);
			}
		};
	};
};
jQuery.fn.trackingWidget = function (activityLog) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			category = element.data('category'),
			eventType = element.data('event-type') || '',
			label = element.data('label') || '';
		element.click(function () {
			activityLog.log(category, eventType, label);
		});
	});
};
