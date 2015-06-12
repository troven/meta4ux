/*global jQuery, _*/
jQuery.fn.updateScene = function (scene, dimensionProvider) {
	'use strict';
	var dimensions = dimensionProvider.getDimensionsForScene(scene, this.innerWidth(), this.innerHeight());
	this.find('[data-mm-role=scene-title]').text(scene.title).css(dimensions.text.toCss());
	this.css(dimensions.image.toCss());
	return this;
};
jQuery.fn.scrollSceneIntoFocus = function () {
	'use strict';
	this.siblings('.activated-scene').removeClass('activated-scene');
	this[0].scrollIntoView();
	this.addClass('activated-scene');
	return this;
};
jQuery.fn.storyboardWidget = function (storyboardController, storyboardModel, dimensionProvider, mapModel) {
	'use strict';
	return jQuery.each(this, function () {
		var element = jQuery(this),
			template = element.find('[data-mm-role=scene-template]'),
			noScenes = element.find('[data-mm-role=no-scenes]').detach(),
			templateParent = template.parent(),
			removeSelectedScenes = function () {
				_.each(templateParent.find('.activated-scene'), function (domScene) {
					var scene = jQuery(domScene).data('scene');
					if (scene) {
						storyboardController.removeScene(scene);
					}
				});
			},
			moveSceneLeft = function (scene) {
				var thisScene = scene && scene.data('scene'),
					prev = thisScene && scene.prev() && scene.prev().prev(),
					prevScene = prev && prev.data('scene');
				if (thisScene) {
					storyboardController.moveSceneAfter(thisScene, prevScene);
				}
			},
			moveSceneRight = function (scene) {
				var thisScene = scene && scene.data('scene'),
					next = thisScene && scene.next(),
					nextScene = next && next.data('scene');
				if (thisScene && nextScene) {
					storyboardController.moveSceneAfter(thisScene, nextScene);
				}
			},
			moveFocusSceneLeft = function () {
				moveSceneLeft(templateParent.find('.activated-scene'));
			},
			moveFocusSceneRight = function () {
				moveSceneRight(templateParent.find('.activated-scene'));
			},
			insideWidget = function (e) {
				if (!e.gesture || !e.gesture.center) {
					return false;
				}
				var offset = element.offset(),
					left = e.gesture.center.pageX - offset.left,
					top =  e.gesture.center.pageY - offset.top;
				return left > 0 && left < element.width() && top > 0 && top < element.height();
			},
			potentialDropTargets = function (dropPosition, includeActivated) {
				var scenes = includeActivated ? templateParent.find('[data-mm-role=scene]').not('.drag-shadow') : templateParent.find('[data-mm-role=scene]').not('.activated-scene').not('.drag-shadow'),
					row = _.filter(scenes, function (sceneDOM) {
						var scene = jQuery(sceneDOM),
							ypos = dropPosition.top - scene.offset().top,
							sceneHeight =  scene.outerHeight(true),
							withinRow = (ypos > 0 && ypos < sceneHeight);
						return withinRow;
					}),
					potentialRight = _.filter(row, function (sceneDOM) {
						var scene = jQuery(sceneDOM),
							xpos = dropPosition.left - scene.offset().left,
							sceneWidth = scene.outerWidth(true),
							leftMatch = (xpos > -40 && xpos < sceneWidth / 3);
						return leftMatch;
					}),
					potentialLeft = _.filter(row, function (sceneDOM) {
						var scene = jQuery(sceneDOM),
							xpos = dropPosition.left - scene.offset().left,
							sceneWidth = scene.outerWidth(true),
							rightMatch = (xpos > sceneWidth * 2 / 3 && xpos < sceneWidth + 40);
						return rightMatch;
					}),
					lastInRow = jQuery(_.last(row)),
					lastScene = scenes.last();
				if (potentialLeft.length === 0 && potentialRight.length === 0) {
					if (lastInRow.length > 0 && dropPosition.left > lastInRow.offset().left + lastInRow.width()) {
						potentialLeft = lastInRow;
					} else if (lastScene.length > 0 && dropPosition.top > lastScene.offset().top) {
						potentialLeft = lastScene;
					}
				}
				return {left: _.first(potentialLeft), right: _.first(potentialRight)};
			},
			rebuildStoryboard = function () {
				var scenes = storyboardModel.getScenes();
				templateParent.empty();
				if (scenes && scenes.length) {
					_.each(scenes, function (scene) {
						addScene(scene, true);
					});
				} else {
					noScenes.appendTo(templateParent).show();
				}
			},
			lastSceneBefore = function (sceneIndex) {
				var scenesBefore =  _.reject(templateParent.children(), function (sceneDOM) {
						return !jQuery(sceneDOM).data('scene') || sceneIndex < jQuery(sceneDOM).data('scene').index;
					});
				return _.last(scenesBefore);
			},
			addScene = function (scene, appendToEnd, hasFocus) {
				var newScene = template.clone()
					.data('scene', scene)
					.attr({
						'data-mm-role': 'scene',
						'data-mm-idea-id': scene.ideaId,
						'data-mm-index': scene.index,
						'tabindex': 1
					})
					.on('focus', function () {
						templateParent.find('[data-mm-role=scene]').removeClass('activated-scene');
						newScene.addClass('activated-scene');

					})
					.on('tap', function () {
						mapModel.focusAndSelect(scene.ideaId);
					})
					.keydown('del backspace', function (event) {
						storyboardController.removeScene(scene);
						event.preventDefault();
						event.stopPropagation();
					})
					.keydown('meta+right ctrl+right', function () {
						moveSceneRight(jQuery(this));
					})
					.keydown('meta+left ctrl+left', function () {
						moveSceneLeft(jQuery(this));
					})
					.keydown('right', function () {
						jQuery(this).next().focus();
					})
					.keydown('left', function () {
						jQuery(this).prev().focus();
					})
					.keydown('up', function () {
						jQuery(this).gridUp().focus();
					})
					.on('doubletap', function () {
						mapModel.focusAndSelect(scene.ideaId);
						mapModel.editNode(scene.ideaId);
					})
					.keydown('down', function () {
						jQuery(this).gridDown().focus();
					}).shadowDraggable().on('mm:cancel-dragging', function () {
						jQuery(this).siblings().removeClass('potential-drop-left potential-drop-right');
					}).on('mm:stop-dragging', function () {
						var dropTarget = jQuery(this),
							potentialLeft = dropTarget.parent().find('.potential-drop-left'),
							potentialRight = dropTarget.parent().find('.potential-drop-right');
						if (potentialLeft && potentialLeft[0]) {
							storyboardController.moveSceneAfter(dropTarget.data('scene'), potentialLeft.data('scene'));
						} else if (potentialRight && potentialRight[0]) {
							potentialLeft = potentialRight.prev();
							if (potentialLeft && potentialLeft[0]) {
								storyboardController.moveSceneAfter(dropTarget.data('scene'), potentialLeft.data('scene'));
							} else {
								storyboardController.moveSceneAfter(dropTarget.data('scene'));
							}
						}
						jQuery(this).siblings().removeClass('potential-drop-left potential-drop-right');
					}).on('mm:drag', function (e) {
						if (e && e.gesture && e.gesture.center) {
							var potentialDrops = potentialDropTargets({left: e.gesture.center.pageX, top: e.gesture.center.pageY}),
								active = jQuery(this),
								actualLeft,
								actualRight;

							if (potentialDrops.left) {
								actualLeft = jQuery(potentialDrops.left).not(active).not(active.prev());
								actualRight = actualLeft.next();
							} else if (potentialDrops.right) {
								actualRight = jQuery(potentialDrops.right).not(active).not(active.next());
								actualLeft = actualRight.prev();
							}
							active.siblings().not(actualLeft).removeClass('potential-drop-left');
							active.siblings().not(actualRight).removeClass('potential-drop-right');
							if (actualRight) {
								actualRight.addClass('potential-drop-right');
							}
							if (actualLeft) {
								actualLeft.addClass('potential-drop-left');
							}
						}
					}),
					target = !appendToEnd && lastSceneBefore(scene.index);
				noScenes.detach();
				newScene.hide();
				if (target) {
					newScene.insertAfter(target);
				} else if (appendToEnd) {
					newScene.appendTo(templateParent);
				} else {
					newScene.prependTo(templateParent);
				}
				newScene.updateScene(scene, dimensionProvider);
				if (!appendToEnd) {
					newScene.finish();
					newScene.fadeIn({duration: 100, complete: function () {
						if (hasFocus) {
							newScene.focus();
						} else {
							newScene.scrollSceneIntoFocus();
						}
					}});
				} else {
					newScene.show();
				}
			},
			findScene = function (scene) {
				return templateParent.find('[data-mm-role=scene][data-mm-index="' + scene.index + '"][data-mm-idea-id="' + scene.ideaId + '"]');
			},
			removeScene = function (scene) {
				var sceneJQ = findScene(scene),
					hasFocus = sceneJQ.is(':focus'),
					isActive = sceneJQ.hasClass('activated-scene'),
					sibling;
				if (hasFocus || isActive) {
					sibling = sceneJQ.prev();
					if (sibling.length === 0) {
						sibling = sceneJQ.next();
					}
					if (hasFocus) {
						sibling.focus();
					} else if (isActive && jQuery(':focus').length === 0) {
						sibling.focus();
					}
				}
				sceneJQ.finish();
				sceneJQ.fadeOut({duration: 100, complete: function () {
					sceneJQ.remove();
				}});
			},
			updateScene = function (scene) {
				findScene(scene).updateScene(scene, dimensionProvider);
			},
			moveScene = function (moved) {
				var oldScene = findScene(moved.from),
					hasFocus = oldScene.is(':focus');
				oldScene.finish();
				oldScene.fadeOut({duration: 100, complete: function () {
					oldScene.remove();
					addScene(moved.to, false, hasFocus);
				}});
			},
			showStoryboard = function () {
				storyboardModel.setInputEnabled(true);
				rebuildStoryboard();
				storyboardModel.addEventListener('storyboardSceneAdded', addScene);
				storyboardModel.addEventListener('storyboardSceneMoved', moveScene);
				storyboardModel.addEventListener('storyboardSceneRemoved', removeScene);
				storyboardModel.addEventListener('storyboardSceneContentUpdated', updateScene);
			},
			hideStoryboard = function () {
				storyboardModel.setInputEnabled(false);
				storyboardModel.removeEventListener('storyboardSceneAdded', addScene);
				storyboardModel.removeEventListener('storyboardSceneMoved', moveScene);
				storyboardModel.removeEventListener('storyboardSceneRemoved', removeScene);
				storyboardModel.removeEventListener('storyboardSceneContentUpdated', updateScene);

			};
		template.detach();
		element.find('[data-mm-role=storyboard-remove-scene]').click(removeSelectedScenes);
		element.find('[data-mm-role=storyboard-move-scene-left]').click(moveFocusSceneLeft);
		element.find('[data-mm-role=storyboard-move-scene-right]').click(moveFocusSceneRight);
		/*jshint newcap:false*/
		element.on('show', showStoryboard).on('hide', hideStoryboard);

		element.parents('[data-drag-role=container]').on('mm:drag', function (e) {
			if (!insideWidget(e)) {
				templateParent.find('[data-mm-role=scene]').removeClass('potential-drop-left potential-drop-right');
				return;
			}
			if (jQuery(e.target).attr('data-mapjs-role') === 'node') {
				var potentialDrops = potentialDropTargets({left: e.gesture.center.pageX, top: e.gesture.center.pageY}, true),
					actualLeft,
					actualRight,
					scenes = templateParent.find('[data-mm-role=scene]');

				if (potentialDrops.left) {
					actualLeft = jQuery(potentialDrops.left);
					actualRight = actualLeft.next();
				} else if (potentialDrops.right) {
					actualRight = jQuery(potentialDrops.right);
					actualLeft = actualRight.prev();
				}
				scenes.not(actualLeft).removeClass('potential-drop-left');
				scenes.not(actualRight).removeClass('potential-drop-right');
				if (actualRight) {
					actualRight.addClass('potential-drop-right');
				}
				if (actualLeft) {
					actualLeft.addClass('potential-drop-left');
				}
			}
		}).on('mm:stop-dragging', function (e) {
			var target = jQuery(e.target), potentialRight;
			if (target.attr('data-mapjs-role') === 'node') {
				if (insideWidget(e)) {
					potentialRight = templateParent.find('.potential-drop-right');
					storyboardController.addScene(target.data('nodeId'), potentialRight && potentialRight.data('scene'));
				}
			}
			templateParent.children().removeClass('potential-drop-left potential-drop-right');
		}).on('mm:cancel-dragging', function () {
			templateParent.children().removeClass('potential-drop-left potential-drop-right');
		});

	});
};

jQuery.fn.storyboardKeyHandlerWidget = function (storyboardController, storyboardModel, mapModel, addSceneHotkey) {
	'use strict';
	var element = this,
		addSceneHandler = function (evt) {
		var unicode = evt.charCode || evt.keyCode,
			actualkey = String.fromCharCode(unicode);
		if (actualkey === addSceneHotkey && mapModel.getInputEnabled()) {
			mapModel.applyToActivated(function (nodeId) {
				storyboardController.addScene(nodeId);
			});
		}
	};
	storyboardModel.addEventListener('inputEnabled', function (isEnabled) {
		if (isEnabled) {
			element.on('keypress', addSceneHandler);
		} else {
			element.off('keypress', addSceneHandler);
		}
	});
	return element;
};

jQuery.fn.storyboardMenuWidget = function (storyboardController, storyboardModel, mapModel) {
	'use strict';
	var elements = this,
		setVisibility  = function (isEnabled) {
			if (isEnabled) {
				elements.show();
			} else {
				elements.hide();
			}
		};
	elements.find('[data-mm-role=storyboard-add-scene]').click(function () {
		mapModel.applyToActivated(function (nodeId) {
			storyboardController.addScene(nodeId);
		});
	});
	elements.find('[data-mm-role=storyboard-add-scene-children]').click(function () {
		mapModel.applyToActivated(function (nodeId) {
			storyboardController.addScene(nodeId, false, 'with-children');
		});
	});
	elements.find('[data-mm-role=storyboard-remove-scenes-for-idea-id]').click(function () {
		storyboardController.removeScenesForIdeaId(mapModel.getSelectedNodeId());
	});

	storyboardModel.addEventListener('inputEnabled', setVisibility);
	setVisibility(storyboardModel.getInputEnabled());
	return elements;
};
/*


 storyboard widget on shown -> notify controller that storyboard is active
 storyboard widget on hide -> notify controller that storyboard is no longer active

 controller -> model -> active storyboard -> event published

 model event -> addSceneWidget
	- attach/detach keyboard addSceneHandler
	- hide/show menu items
*/
