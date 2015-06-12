/*global jQuery */
jQuery.fn.collaboratorListWidget = function (collaborationModel, markerClass) {
	'use strict';
	return jQuery(this).each(function () {
		var element = jQuery(this),
				list = element.find('[data-mm-role~=collab-list]'),
				template = list.find('[data-mm-role~=template]').detach(),
				itemForSession = function (sessionId) {
					return list.find('[mm-session-id=' + sessionId + ']');
				},
				addCollaborator = function (collaborator) {
					if (itemForSession(collaborator.sessionId).size() > 0) {
						return;
					}
					var newItem = template.clone().appendTo(list).attr('mm-session-id', collaborator.sessionId);
					newItem.find('[data-mm-role~=collaborator-name]').text(collaborator.name);
					newItem.find('[data-mm-role~=collaborator-photo]').attr('src', collaborator.photoUrl).css('border-color', collaborator.color);
					newItem.find('[data-mm-role~="collaborator-selector"]').on('click tap', function () {
						collaborationModel.showCollaborator(collaborator);
					});
					element.addClass(markerClass);
				},
				removeCollaborator = function (collaborator) {
					itemForSession(collaborator.sessionId).remove();
					if (list.children().size() === 0) {
						element.removeClass(markerClass);
					}
				};
		element.removeClass(markerClass);
		collaborationModel.addEventListener('collaboratorFocusChanged collaboratorJoined', addCollaborator);
		collaborationModel.addEventListener('collaboratorLeft', removeCollaborator);
		collaborationModel.addEventListener('stopped', function () {
			element.removeClass(markerClass);
			list.empty();
		});
	});
};
