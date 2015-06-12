/*global MM, observable, _ */
MM.StoryboardController = function (storyboardModel) {
	/* workflows, event processing */
	'use strict';
	var self = observable(this),
		buildStoryboardScene = function (storyboardName, index, sceneType) {
			var attr = {}, result;
			attr[storyboardName] = index;
			result = {
				'storyboards': attr
			};
			if (sceneType) {
				result.type = sceneType;
			}
			return result;
		},
		appendScene = function (storyboardName, nodeId, index, sceneType) {
			var scenes = storyboardModel.getScenesForNodeId(nodeId),
				result = buildStoryboardScene(storyboardName, index, sceneType);
			scenes.push(result);
			storyboardModel.setScenesForNodeId(nodeId, scenes);
		};
	self.addScene = function (nodeId, beforeScene, sceneType) {
		var storyboardName = storyboardModel.getActiveStoryboardName(),
			index = 1;
		if (!storyboardName) {
			storyboardName = storyboardModel.createStoryboard();
		}
		if (beforeScene) {
			index = storyboardModel.insertionIndexBefore(beforeScene);
		} else {
			index = storyboardModel.nextSceneIndex();
		}
		if (!index) {
			storyboardModel.rebalanceAndApply([beforeScene], function (newScenes) {
				appendScene(storyboardName, nodeId, storyboardModel.insertionIndexBefore(newScenes[0]), sceneType);
			});
		} else {
			appendScene(storyboardName, nodeId, index, sceneType);
		}
	};
	self.moveSceneAfter = function (sceneToMove, afterScene) {
		if (!sceneToMove) {
			return false;
		}
		var storyboardName = storyboardModel.getActiveStoryboardName(),
			scenes,
			newIndex,
			currentIndex,
			afterSceneIndex;
		if (afterScene && afterScene.ideaId === sceneToMove.ideaId && afterScene.index === sceneToMove.index) {
			return false;
		}
		scenes = storyboardModel.getScenes();
		if (!scenes || !scenes.length) {
			return false;
		}
		currentIndex = _.indexOf(scenes, _.find(scenes, function (scene) {
			return scene.ideaId === sceneToMove.ideaId && scene.index === sceneToMove.index;
		}));
		if (currentIndex === -1) {
			return false;
		}
		if (afterScene) {
			if (currentIndex > 0) {
				afterSceneIndex = _.indexOf(scenes, _.find(scenes, function (scene) {
					return scene.ideaId === afterScene.ideaId && scene.index === afterScene.index;
				}));
				if (currentIndex === (afterSceneIndex + 1)) {
					return false;
				}
			}
			newIndex = storyboardModel.insertionIndexAfter(afterScene);
		} else {
			if (currentIndex === 0) {
				return false;
			}
			newIndex = storyboardModel.insertionIndexAfter();
		}
		if (!newIndex) {
			storyboardModel.rebalanceAndApply([sceneToMove, afterScene],
				function (rebalancedScenes) {
					storyboardModel.updateSceneIndex(rebalancedScenes[0], storyboardModel.insertionIndexAfter(rebalancedScenes[1]), storyboardName);
				}
			);
		} else {
			storyboardModel.updateSceneIndex(sceneToMove, newIndex, storyboardName);
		}
		return true;
	};

	self.removeScenesForIdeaId = function (ideaId) {
		var storyboardName = storyboardModel.getActiveStoryboardName(),
			scenes = storyboardName && storyboardModel.getScenesForNodeId(ideaId),
			didRemoveScene;

		if (!storyboardName) {
			return false;
		}
		_.each(scenes, function (scene) {
			if (scene.storyboards && scene.storyboards[storyboardName]) {
				delete scene.storyboards[storyboardName];
				didRemoveScene = true;
			}
		});
		if (!didRemoveScene) {
			return false;
		}
		scenes = _.reject(scenes, function (scene) {
			return _.size(scene.storyboards) === 0;
		});
		storyboardModel.setScenesForNodeId(ideaId, scenes);
		return true;
	};
	self.removeScene = function (sceneToRemove) {
		if (!sceneToRemove || !sceneToRemove.ideaId || !sceneToRemove.index) {
			return false;
		}
		var storyboardName = storyboardModel.getActiveStoryboardName(),
			scenes = storyboardName && storyboardModel.getScenesForNodeId(sceneToRemove.ideaId);

		if (!storyboardName) {
			return false;
		}
		_.each(scenes, function (scene) {
			if (scene.storyboards && scene.storyboards[storyboardName] && scene.storyboards[storyboardName] === sceneToRemove.index) {
				delete scene.storyboards[storyboardName];
			}
		});
		scenes = _.reject(scenes, function (scene) {
			return _.size(scene.storyboards) === 0;
		});
		storyboardModel.setScenesForNodeId(sceneToRemove.ideaId, scenes);
	};
};
