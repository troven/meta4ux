/*global jQuery, window,  _ */

jQuery.fn.iosPopoverMenuWidget = function (mapModel, stageApi) {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this),
				toolbar = element.find('[data-mm-role~="popover-toolbar"]'),
				topPointer = element.find('[data-mm-role="popover-pointer-top"]'),
				bottomPointer = element.find('[data-mm-role="popover-pointer-bottom"]'),
				hidePopover = function () {
					if (element.is(':visible')) {
						element.unbind('click');
						element.hide();
					}
				},
				backgroundClick = function () {
					hidePopover();
				},
				setupBackgroundClick = function (ignoreVisibility) {
					if (ignoreVisibility ||  element.is(':visible')) {
						element.click(backgroundClick);
					}
				},
				calcTopBottomHeight = function () {
					return (element.height() -  toolbar.outerHeight() + 20);
				},
				showPopover = function (evt) {
					var x = evt.x,
							y = evt.y,
							topBottomHeight = calcTopBottomHeight(),
							showAbove = (y > topBottomHeight),
							maxLeft = element.width() - toolbar.outerWidth() - 10,
							minLeft = 10,
							left = Math.max(minLeft, Math.min(maxLeft, x - (toolbar.outerWidth() / 2))),
							top = showAbove ? (y - toolbar.outerHeight() - 10) : y + 10,
							pointerMinLeft = 20,
							pointerMaxLeft = toolbar.outerWidth() - 20,
							pointerLeft = Math.max(pointerMinLeft, Math.min(pointerMaxLeft, (x - left - 10))),
							selectedNodeId = mapModel && mapModel.getCurrentlySelectedIdeaId();
					if (selectedNodeId) {
						setMenuItemsForNodeId(selectedNodeId);
					}
					if (showAbove) {
						bottomPointer.css('left', pointerLeft + 'px');
						topPointer.hide();
						bottomPointer.show();
					} else {
						topPointer.show();
						bottomPointer.hide();
						topPointer.css('left', pointerLeft + 'px');
					}
					toolbar.css({'top': Math.max(-20, top) + 'px', 'left': left + 'px'});
					//stop the click handler being added to soon or it fires immediately
					// if (!ignoreBackGroundClick) {
					if (evt.noDelay) {
						setupBackgroundClick(true);
					} else {
						window.setTimeout(setupBackgroundClick, 1000);
					}

					element.show();
				},
				setMenuItemsForNodeId = function (nodeId) {
					var context = mapModel.contextForNode(nodeId);
					_.each(context, function (val, key) {
						var selection = element.find('[data-mm-menu-role~=ios-node-context-' + key + ']');
						if (val) {
							selection.removeClass('iosDisabled');
						} else {
							selection.addClass('iosDisabled');
						}
					});
				};
		toolbar.click(function (e) {
			e.preventDefault();
			e.stopPropagation();
		});
		element.find('[data-mm-role~="popover-close"]').click(hidePopover);
		element.on('hidePopover', function () {
			hidePopover();
		});
		element.on('showPopover', showPopover);
		if (stageApi) {
			stageApi.topBottomHeight = calcTopBottomHeight();
			stageApi.addEventListener('togglePopover', function (evt) {
				if (element.is(':visible')) {
					hidePopover();
				} else {
					showPopover(_.extend({}, evt, {noDelay: true}));
				}
			});
		}
	});
};
