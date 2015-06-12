/*global window, console, MM*/
MM.IOS = MM.IOS || {};
MM.IOS.defaultMap = function () {
	'use strict';
	return {
		'title': 'double-tap this node to edit',
		'id': 1,
		'formatVersion': 2
	};
};

MM.IOS.Proxy = function (listenerName) {
	'use strict';
	var self = this,
			wkMessageHandler = (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[listenerName]);
	if (wkMessageHandler) {
		self.sendMessage = function () {
			try {
				var args = Array.prototype.slice.call(arguments, 0);
				if (!args || args.length === 0) {
					return;
				}
				if (args.length > 1) {
					wkMessageHandler.postMessage(JSON.parse(JSON.stringify(args)));
				} else {
					wkMessageHandler.postMessage(JSON.parse(JSON.stringify(args[0])));
				}

			} catch (err) {
				//unable to send message
			}
		};
	} else {
		self.sendMessage = function () {
			console.log.apply(console, arguments);
		};
	}
	if (wkMessageHandler) {
		window.console.log = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			self.sendMessage({'type': 'log', 'args': args});
		};
		window.onerror = function errorHandler() {
			try {
				var args = Array.prototype.slice.call(arguments, 0);
				self.sendMessage({'type': 'error', 'args': args});
			} catch (err) {
				//unable to send error
			}
			return false;
		};
	}
};


