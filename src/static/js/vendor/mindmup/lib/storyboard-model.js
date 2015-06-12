/*global MM, observable, _ */
MM.Storyboard = {};

MM.Storyboard.scene = function (sceneMap) {
	'use strict';
	if (!sceneMap) {
		return undefined;
	}
	sceneMap.matchesScene = function (anotherScene) {
		if (!sceneMap || !anotherScene) {
			return false;
		}
		/*jslint eqeq:true */
		if (sceneMap.ideaId != anotherScene.ideaId) {
			return false;
		}
		if (sceneMap.index !== anotherScene.index) {
			return false;
		}
		return true;
	};
	sceneMap.clone = function () {
		return MM.Storyboard.scene(_.extend({}, sceneMap));
	};
	return sceneMap;
};

MM.Storyboard.sceneList = function (listOfScenes) {
	'use strict';
	if (!listOfScenes) {
		return undefined;
	}
	listOfScenes.findScene = function (sceneToFind) {
		if (!sceneToFind) {
			return undefined;
		}
		MM.Storyboard.scene(sceneToFind);
		return _.find(listOfScenes, function (sceneInList) {
			return sceneToFind.matchesScene(sceneInList);
		});
	};
	listOfScenes.indexOfScene = function (sceneToIndex) {
		if (!sceneToIndex) {
			return -1;
		}
		var found = listOfScenes.findScene(sceneToIndex);
		if (found) {
			return _.indexOf(listOfScenes, found);
		}
		return -1;
	};
	listOfScenes.nextSceneIndex = function () {
		var maxScene = _.max(listOfScenes, function (scene) {
			return scene && scene.index;
		});
		if (!maxScene || !maxScene.index) {
			return 1;
		}
		return maxScene.index + 1;
	};

	return listOfScenes;
};

MM.StoryboardModel = function (activeContentListener, storyboardAttrName, sceneAttrName) {
	'use strict';
	var self = observable(this),
		isInputEnabled,
		scenesForActiveStoryboard,
		rebuildScenesForActiveStoryboard = function () {
			var storyboardName = self.getActiveStoryboardName(),
				result = [],
				getTitle = function (idea, sceneType) {
					var result = idea.title;
					if (sceneType === 'with-children') {
						_.each(idea.sortedSubIdeas(), function (subIdea) {
							result = result + '\n- ' + subIdea.title;
						});
					}
					return result;
				};
			if (!storyboardName) {
				scenesForActiveStoryboard = MM.Storyboard.sceneList(result);
				return;
			}
			activeContentListener.getActiveContent().traverse(function (idea) {
				var scenes = idea.getAttr(sceneAttrName);
				if (scenes) {
					_.each(scenes, function (scene) {
						var sceneIndex = parseFloat(scene.storyboards[storyboardName]), converted, icon;
						if (sceneIndex) {
							converted = {ideaId: idea.id, title: getTitle(idea, scene.type), index: sceneIndex};
							icon = idea.getAttr('icon');
							if (icon) {
								converted.image = icon;
							}
							result.push(converted);
						}
					});
				}
			});
			scenesForActiveStoryboard = MM.Storyboard.sceneList(_.sortBy(result, 'index'));
		},
		indexMatches = function (idx1, idx2) {
			return Math.abs(idx1 - idx2) < 0.0001;
		},
		findMaxIndex = function (arr) {
			if (!arr) {
				return 0;
			}
			var maxIndex = arr.length;
			_.each(arr, function (boardName) {
				var match = boardName.match(/^Storyboard ([1-9]+)/),
					idx = (match && match.length > 1 && parseFloat(match[1])) || 0;
				if (idx > maxIndex) {
					maxIndex = idx;
				}
			});
			return maxIndex;
		},
		onActiveContentChanged = function () {
			var oldScenes = scenesForActiveStoryboard,
				getSceneDelta = function (oldScenes, newScenes) {
					var result = {removed: [], added: [], contentUpdated: []};
					MM.Storyboard.sceneList(oldScenes);
					MM.Storyboard.sceneList(newScenes);
					_.each(oldScenes, function (oldScene) {
						var newScene = newScenes && newScenes.findScene(oldScene);
						if (!newScene) {
							result.removed.push(oldScene);
						} else if (newScene.title !== oldScene.title || !_.isEqual(newScene.image, oldScene.image)) {
							result.contentUpdated.push(newScene);
						}
					});
					_.each(newScenes, function (newScene) {
						var oldScene  = oldScenes && oldScenes.findScene(newScene);
						if (!oldScene) {
							result.added.push(newScene);
						}

					});
					if (result.added.length === 1 && result.removed.length === 1 && result.contentUpdated.length === 0 &&
							result.added[0].ideaId === result.removed[0].ideaId) {
						return { moved: {from: result.removed[0], to: result.added[0]} };
					}
					return result;
				},
				delta;
			rebuildScenesForActiveStoryboard();
			delta = getSceneDelta(oldScenes, scenesForActiveStoryboard);

			_.each(delta.removed, function (scene) {
				self.dispatchEvent('storyboardSceneRemoved', scene);
			});
			_.each(delta.added, function (scene) {
				self.dispatchEvent('storyboardSceneAdded', scene);
			});
			_.each(delta.contentUpdated, function (scene) {
				self.dispatchEvent('storyboardSceneContentUpdated', scene);
			});
			if (delta.moved) {
				self.dispatchEvent('storyboardSceneMoved', delta.moved);
			}
		};
	self.setInputEnabled = function (isEnabled) {
		isInputEnabled = isEnabled;
		self.dispatchEvent('inputEnabled', isEnabled);
	};
	self.getInputEnabled = function () {
		return isInputEnabled;
	};
	self.getActiveStoryboardName = function () {
		var content = activeContentListener && activeContentListener.getActiveContent(),
			list = content && content.getAttr(storyboardAttrName);
		if (list && list.length > 0) {
			return list[0];
		}
	};
	self.createStoryboard = function () {
		var content = activeContentListener && activeContentListener.getActiveContent(),
			boards = (content && content.getAttr(storyboardAttrName)) || [],
			maxIndex = findMaxIndex(boards),
			name = 'Storyboard ' + (maxIndex + 1);
		if (!content) {
			return;
		}
		boards.push(name);
		content.updateAttr(content.id, storyboardAttrName, boards);
		return name;
	};
	self.nextSceneIndex = function () {
		return scenesForActiveStoryboard && scenesForActiveStoryboard.nextSceneIndex();
	};
	self.updateSceneIndex = function (sceneToMove, newIndex, storyboardName) {
		var scenesForIdea = self.getScenesForNodeId(sceneToMove.ideaId);
		_.each(scenesForIdea, function (scene) {
			if (scene.storyboards && scene.storyboards[storyboardName] && scene.storyboards[storyboardName] === sceneToMove.index) {
				scene.storyboards[storyboardName] = newIndex;
			}
		});
		self.setScenesForNodeId(sceneToMove.ideaId, scenesForIdea);
		return _.extend({}, sceneToMove, {index: newIndex});
	};
	self.getScenesForNodeId = function (nodeId) {
		var scenes = activeContentListener.getActiveContent().getAttrById(nodeId, sceneAttrName) || [];
		return JSON.parse(JSON.stringify(scenes));
	};
	self.setScenesForNodeId = function (nodeId, scenes) {
		activeContentListener.getActiveContent().updateAttr(nodeId, sceneAttrName, scenes);
	};
	self.scenesMatch = function (scene1, scene2) {
		if (!scene1 || !scene2) {
			return false;
		}
		if (scene1.ideaId !== scene2.ideaId) {
			return false;
		}
		if (scene1.index !== scene2.index) {
			return false;
		}
		return true;
	};
	self.rebalance = function (scenesOfInterest) {
		var scenesToReturn = [],
				nextIndex = 1,
				storyboard = self.getActiveStoryboardName();
		_.each(scenesForActiveStoryboard, function (scene) {
			var sceneOfInterest = _.find(scenesOfInterest, function (sceneOfInterest) {
					return self.scenesMatch(scene, sceneOfInterest);
				}),
				indexOfInterest = sceneOfInterest !== undefined ? _.indexOf(scenesOfInterest, sceneOfInterest) : -1,
				reIndexedScene = self.updateSceneIndex(scene, nextIndex, storyboard);
			nextIndex++;
			if (indexOfInterest >= 0) {
				scenesToReturn[indexOfInterest] = reIndexedScene;
			}
		});
		return scenesToReturn;
	};
	self.rebalanceAndApply = function (scenesOfInterest, applyFunc) {
		var activeContent = activeContentListener.getActiveContent(),
				scenesOfInterestAfter;
		activeContent.startBatch();
		scenesOfInterestAfter = self.rebalance(scenesOfInterest);
		onActiveContentChanged();
		applyFunc(scenesOfInterestAfter);
		activeContent.endBatch();
	};
	self.insertionIndexAfter = function (sceneToInsertAfter) {
		var sceneToInsertAfterPosition,
			nextIndex,
			result,
			indexToInsertAtStart = function () {
				var result;
				if (scenesForActiveStoryboard.length === 0) {
					return false;
				} else {
					result = scenesForActiveStoryboard[0].index / 2;
					if (indexMatches(result, scenesForActiveStoryboard[0].index)) {
						return false; /* rebalance required */
					} else {
						return result;
					}
				}
			};
		if (!sceneToInsertAfter) {
			return indexToInsertAtStart();
		}
		sceneToInsertAfterPosition = _.indexOf(scenesForActiveStoryboard, _.find(scenesForActiveStoryboard, function (scene) {
			return scene.ideaId === sceneToInsertAfter.ideaId && scene.index === sceneToInsertAfter.index;
		}));
		if (sceneToInsertAfterPosition < 0) {
			return false;
		}
		if (sceneToInsertAfterPosition === scenesForActiveStoryboard.length - 1) {
			return sceneToInsertAfter.index + 1;
		}
		nextIndex = scenesForActiveStoryboard[sceneToInsertAfterPosition + 1].index;
		result = (sceneToInsertAfter.index + nextIndex) / 2;
		if (indexMatches(result, nextIndex) || indexMatches(result, sceneToInsertAfter.index)) {
			return false;
		}
		return result;
	};
	self.insertionIndexBefore = function (sceneToInsertBefore) {
		var sceneToInsertBeforePosition,
			previousIndex = 0,
			result;
		if (!sceneToInsertBefore) {
			return false;
		}
		sceneToInsertBeforePosition = scenesForActiveStoryboard.indexOfScene(sceneToInsertBefore);
		if (sceneToInsertBeforePosition < 0) {
			return false;
		}
		if (sceneToInsertBeforePosition !== 0) {
			previousIndex = scenesForActiveStoryboard[sceneToInsertBeforePosition - 1].index;
		}
		result = (sceneToInsertBefore.index + previousIndex) / 2;
		if (indexMatches(result, previousIndex) || indexMatches(result, sceneToInsertBefore.index)) {
			return false;
		}
		return result;

	};
	self.getScenes = function () {
		return scenesForActiveStoryboard;
	};
	activeContentListener.addListener(onActiveContentChanged);
};


