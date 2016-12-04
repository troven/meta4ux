/*global jQuery, MM, observable */
MM.IOSStageAPI = function (mapModel) {
	'use strict';
	var self = observable(this);
	self.togglePopoverMenu = function () {
		mapModel.dispatchEvent('nodeVisibilityRequested');
		var selected = jQuery('.mapjs-node.selected'),
				rect = selected && self.getRectForNode(selected),
				touchPoint = rect && self.getTouchPointForRect(rect);
		if (!touchPoint) {
			return;
		}

		selected[0].scrollIntoViewIfNeeded();
		self.dispatchEvent('togglePopover', touchPoint, true);
	};
	self.getRectForNode = function (node) {
		var stage = jQuery('[data-mapjs-role=stage]'),
				scale = stage && stage.data && stage.data('scale'),
				offset = node && node.offset && node.offset(),
				width = node && node.outerWidth && node.outerWidth(),
				height = node && node.outerHeight && node.outerHeight();
		if (!stage || !scale || !offset || !width || !height) {
			return false;
		}
		return {left: offset.left, top: offset.top, width: width * scale, height: height * scale};
	};
	self.getTouchPointForRect = function (rect) {
		var	body = jQuery('body'),
				bodyWidth = body && body.innerWidth(),
				bodyHeight = body && body.innerHeight(),
				top = bodyHeight && rect && Math.min(bodyHeight, Math.max(0, rect.top + rect.height / 2)),
				left = bodyWidth && rect && Math.min(bodyWidth, Math.max(0, rect.left + rect.width / 2));

		if (top && left) {
			return {x: left, y: top};
		}
		return false;
	};
	self.handlesCommand = function (command) {
		if (command.type && command.type.substr && command.type.substr(0, 9) === 'iosStage:') {
			return true;
		}
		return false;
	};
	self.handleCommand = function (command) {
		if (!self.handlesCommand(command)) {
			return;
		}
		var stageCommand = command.type.split(':')[1];
		if (stageCommand && self[stageCommand]) {
			self[stageCommand].apply(self, command.args);
		}
	};
};
