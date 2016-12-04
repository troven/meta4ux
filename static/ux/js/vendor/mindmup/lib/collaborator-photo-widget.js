/*global jQuery, MM, Image*/
MM.deferredImageLoader = function (url) {
	'use strict';
	var result = jQuery.Deferred(),
			domImg = new Image();
	domImg.onload = function loadImage() {
		result.resolve(jQuery(domImg));
	};
	domImg.src = url;
	return result.promise();
};
jQuery.fn.collaboratorPhotoWidget = function (collaborationModel, imageLoader, imgClass) {
	'use strict';
	var self = jQuery(this),
			showPictureInNode = function (nodeId, jQueryImg) {
				var node = self.nodeWithId(nodeId);
				if (node && node.length > 0) {
					jQueryImg.appendTo(node).css({
						bottom: -1 * Math.round(jQueryImg.height() / 2),
						right: -1 * Math.round(jQueryImg.width() / 2)
					});
				}
			},
			imageForCollaborator = function (sessionId) {
				return self.find('.' + imgClass + '[data-mm-collaborator-id=' + sessionId + ']');
			},
			showPictureForCollaborator = function (collaborator) {
				var cached = imageForCollaborator(collaborator.sessionId);
				if (cached && cached.length > 0) {
					showPictureInNode(collaborator.focusNodeId, cached);
				} else {
					imageLoader(collaborator.photoUrl).then(function (jQueryImg) {
						if (imageForCollaborator(collaborator.sessionId).length === 0) {
							jQueryImg
								.addClass(imgClass).attr('data-mm-collaborator-id', collaborator.sessionId)
								.css('border-color', collaborator.color)
								.tooltip({title: collaborator.name, placement:'bottom', container: 'body'});
							showPictureInNode(collaborator.focusNodeId, jQueryImg);
						}
					});
				}
			},
			removePictureForCollaborator = function (collaborator) {
				imageForCollaborator(collaborator.sessionId).remove();
			};
	collaborationModel.addEventListener('stopped', function () {
		self.find('.' + imgClass).remove();
	});
	collaborationModel.addEventListener('collaboratorFocusChanged collaboratorJoined', showPictureForCollaborator);
	collaborationModel.addEventListener('collaboratorLeft', removePictureForCollaborator);

	return self;
};
