/*global jQuery*/

jQuery.fn.iosMenuWidget = function (mapModel, messageSender) {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this),
				defaultMenuName = element.data('mm-default-menu'),
				toolbar = element.find('[data-mm-role="ios-toolbar"]'),
				menuTitle = element.find('[data-mm-role="ios-menu-title"]'),
				source = element.data('mm-source') || 'ios',
				defaultToggleText = menuTitle.text(),
				altToggleText = menuTitle.data('mm-toggled-text'),
				menuStack = [],
				showMenu = function (menuName, pushToStack) {
					element.find('[data-mm-menu][data-mm-menu!="' + menuName + '"]').hide();
					element.find('[data-mm-menu="' + menuName + '"]').show();
					if (pushToStack) {
						menuStack.push(menuName);
					}
					if (menuStack.length === 0) {
						menuTitle.text(altToggleText);
					} else {
						menuTitle.text('Back');
					}
				},
				goBackToMenuInStack = function () {
					menuStack.pop();
					if (menuStack.length > 0) {
						showMenu(menuStack[menuStack.length - 1]);
					} else {
						showMenu(defaultMenuName);
					}
				};

		element.find('[data-mm-menu][data-mm-menu!="' + defaultMenuName + '"]').hide();
		element.find('[data-mm-role="ios-menu-toggle"]').click(function () {
			if (!toolbar.is(':visible')) {
				menuTitle.text(altToggleText);
				toolbar.show();
			} else {
				if (menuStack.length > 0) {
					goBackToMenuInStack();
				} else {
					toolbar.hide();
					menuTitle.text(defaultToggleText);
				}
			}
		});
		element.find('[data-mm-menu-role~="showMenu"]').click(function () {
			var clickElement = jQuery(this),
					menu = clickElement.data('mm-action');
			if (menu) {
				showMenu(menu, true);
			}
		});
		element.find('[data-mm-menu-role~="modelAction"]').click(function () {
			var clickElement = jQuery(this),
					action = clickElement.data('mm-action'),
					additionalArgs = clickElement.data('mm-model-args') || [],
					args = [source].concat(additionalArgs);
			if (action && mapModel && mapModel[action]) {
				mapModel[action].apply(mapModel, args);
			}
		});
		element.find('[data-mm-menu-role~="showWidget"]').click(function () {
			var clickElement = jQuery(this),
					widgetRole = clickElement.data('mm-widget-role'),
					widget = jQuery('[data-mm-role~="' + widgetRole + '"]');
			widget.data('mm-model-args', clickElement.data('mm-model-args'));
			widget.show();
		});
		element.find('[data-mm-menu-role~="sendMessage"]').click(function () {
			var clickElement = jQuery(this),
					msg = {'type': clickElement.data('mm-message-type')},
					argsText = clickElement.data('mm-message-args');
			if (argsText) {
				msg.args = argsText.split(',');
			}
			messageSender.sendMessage(msg);
		});

	});
};
