/*global MM, jQuery, window*/

MM.IOS = MM.IOS || {};
MM.IOS.WindowProxy = function (mapModel, mmProxy, resourceCompressor) {
	'use strict';
	var self = this,
		viewTimeoutDelayMillis = 100,
		centerMapModel = function () {
			if (mapModel && mapModel.centerOnNode && mapModel.getSelectedNodeId()) {
				mapModel.centerOnNode(mapModel.getSelectedNodeId());
			}
		},
		setViewport  = function (command) {
			if (command.type !== 'setViewport') {
				return false;
			}
			var currentViewPort = jQuery('meta[name=viewport]').attr('content');
			if (currentViewPort !== command.args) {
				jQuery('meta[name=viewport]').attr('content', command.args);
				jQuery('[data-mm-role="ios-context-menu"]').add(jQuery('[data-mm-role="ios-link-editor"]')).trigger(jQuery.Event('hidePopover'));
				window.setTimeout(centerMapModel, viewTimeoutDelayMillis);
			}
			return true;
		},
		prepareForSave = function (command) {
			if (command.type !== 'prepareForSave') {
				return false;
			}

			mapModel.resetView();
			/* deprecated: old versions of the editor used this */
			jQuery('[data-mm-role="ios-menu"]').hide();
			jQuery('[data-mm-role="ios-toolbar"]').hide();
			/* end of deprecated */

			jQuery('[data-mm-role="ios-context-menu"]').trigger(jQuery.Event('hidePopover'));
			jQuery('[data-mm-role="ios-link-editor"]').trigger(jQuery.Event('hidePopover'));

			window.setTimeout(function () {
				mapModel.scaleDown();
				window.setTimeout(function () {
					var idea = mapModel.getIdea(),
							title = idea.title || 'Mindmup map',
							saveScreenOnly = command.args && command.args[0] && command.args[0] === 'save-screen-only';
					if (saveScreenOnly) {
						mmProxy.sendMessage({type: 'save-screen'});
					} else {
						resourceCompressor.compress(idea);
						mmProxy.sendMessage({type: 'save-content', args: {'title': title, 'idea': JSON.stringify(idea)}});
					}
				}, viewTimeoutDelayMillis);
			}, viewTimeoutDelayMillis);

			return true;
		};
	self.handlesCommand = function (command) {
		if (command.type === 'setViewport' || command.type === 'prepareForSave') {
			return true;
		}
		return false;
	};

	self.handleCommand = function (command) {
		if (!self.handlesCommand(command)) {
			return false;
		}
		if (setViewport(command)) {
			return;
		}
		prepareForSave(command);
	};
};
