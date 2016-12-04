/*global MM, _, observable */
MM.CollaborationModel = function (mapModel) {
	'use strict';
	var self = observable(this),
			running = false,
			onSelectionChanged = function (id, isSelected) {
				if (running && isSelected) {
					self.dispatchEvent('myFocusChanged', id);
				}
			},
			onNodeChanged = function (updatedNode, contentSessionId) {
				if (!contentSessionId || !running) {
					return;
				}
				var collaboratorDidEdit = function (collaborator) {
					if (collaborator) {
						self.dispatchEvent('collaboratorDidEdit', collaborator, updatedNode);
					}
				};
				self.dispatchEvent('collaboratorRequestedForContentSession', contentSessionId, collaboratorDidEdit);
			};
	self.collaboratorFocusChanged = function (collaborator) {
		if (running) {
			self.dispatchEvent('collaboratorFocusChanged', collaborator);
		}
	};
	self.collaboratorPresenceChanged = function (collaborator, isOnline) {
		if (running) {
			var eventName = isOnline ? 'collaboratorJoined' : 'collaboratorLeft';
			self.dispatchEvent(eventName, collaborator, isOnline);
		}
	};
	self.start = function (collaborators) {
		running = true;
		if (_.size(collaborators) > 0) {
			_.each(collaborators, self.collaboratorFocusChanged);
		}
	};
	self.showCollaborator = function (collaborator) {
		self.dispatchEvent('sessionFocusRequested', collaborator.sessionId, mapModel.centerOnNode);
	};
	self.stop = function () {
		self.dispatchEvent('stopped');
		running = false;
	};
	mapModel.addEventListener('nodeSelectionChanged', onSelectionChanged);
	mapModel.addEventListener('nodeTitleChanged', onNodeChanged);
};
