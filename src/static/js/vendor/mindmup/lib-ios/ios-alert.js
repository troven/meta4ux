/*global MM */
MM.IOS = MM.IOS || {};
MM.IOS.Alert = function (mmProxy) {
	'use strict';
	var self = this,
	lastId = 1;
	self.show = function (message, detail, type) {
		var currentId = lastId;
		lastId += 1;
		mmProxy.sendMessage({type: 'alert:show', args: {'message': message, 'detail': detail, 'type': type, 'currentId': currentId}});
		return currentId;
	};
	self.hide = function (messageId) {
		mmProxy.sendMessage({type: 'alert:hide', args: {'messageId': messageId}});
	};
};
