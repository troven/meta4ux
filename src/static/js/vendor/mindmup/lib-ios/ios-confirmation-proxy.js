/*global MM, _, jQuery*/

MM.IOS = MM.IOS || {};
MM.IOS.ConfirmationProxy = function (mmProxy) {
	'use strict';
	var self = this,
			currentId = 1,
			currentDeferred,
			confirmationId,
			validButtons = ['default', 'cancel', 'destructive'];

	self.requestConfirmation = function (title, buttons, message) {
		var deferred = jQuery.Deferred(),
				args = {'title': title, 'confirmationId': currentId},
				buttonArgs = {};

		if (!title || !title.trim()) {
			return deferred.reject('invalid-args').promise();
		}
		_.each(validButtons, function (button) {
			var title = buttons[button];
			if (title) {
				buttonArgs[button] = title;
			}
		});
		if (_.isEmpty(buttonArgs)) {
			return deferred.reject('invalid-args').promise();
		}
		if (message && message.trim()) {
			args.message = message;
		}
		_.extend(args, buttonArgs);
		mmProxy.sendMessage({'type': 'confirmation:show', 'args': args});
		currentId++;
		currentDeferred = deferred;
		confirmationId = args.confirmationId;
		return deferred.promise();
	};

	self.handlesCommand = function (command) {
		if (!command || command.type !== 'confirmation:choice' || confirmationId !== command.args[0] || !_.contains(validButtons, command.args[1])) {
			return false;
		}
		return true;
	};
	self.handleCommand = function (command) {
		if (!self.handlesCommand(command)) {
			return false;
		}
		currentDeferred.resolve(command.args[1]);
		return true;
	};
};
