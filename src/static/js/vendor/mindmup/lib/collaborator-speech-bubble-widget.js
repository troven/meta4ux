/*global jQuery, setTimeout, _ */
jQuery.fn.collaboratorSpeechBubbleWidget = function (collaborationModel, timeoutArg) {
	'use strict';
	var timeout = timeoutArg || 3000;
	return this.each(function () {
		var element = jQuery(this),
			currentCollaborator,
			showCollaborator = function () {
				collaborationModel.showCollaborator(currentCollaborator);
			},
			img = element.find('[data-mm-role=collaborator-photo]'),
			contentTemplate = element.find('[data-mm-role=popover-content-template]').detach(),
			titleTemplate = element.find('[data-mm-role=popover-title-template]').detach(),
			popoverContent = function (message, style) {
				var template = contentTemplate.clone();
				template.find('[data-mm-role=popover-content]').text(message);
				if (style) {
					template.find('[data-mm-role=popover-content]').addClass(style);
				}
				return template.html();
			},
			popoverTitle = function (nodeTitle) {
				titleTemplate.find('[data-mm-role=popover-title]').text(nodeTitle);
				return titleTemplate.html();
			},
			showSpeechBubble = _.throttle(function (collaborator, message, style) {
					currentCollaborator = collaborator;
					img.popover('destroy');
					img.attr('src', collaborator.photoUrl);
					img.css('border-color', collaborator.color);
					img.popover({
						title: popoverTitle(collaborator.name),
						content: popoverContent(message, style),
						placement: 'right',
						trigger: 'manual',
						animation: true,
						html: true
					});
					element.fadeIn(200, function () {
						setTimeout(function () {
							img.popover('destroy');
							element.fadeOut();
						}, timeout);
					});
					img.popover('show');
				}, timeout + 700, {trailing: false}),
			onEdit = function (collaborator, node) {
				var trimmedTitle = node && node.title && node.title.trim(),
						style = trimmedTitle ? '' : 'muted',
						nodeTitle = trimmedTitle || 'removed node content';
				showSpeechBubble(collaborator, nodeTitle, style);
			},
			onJoin = function (collaborator) {
				showSpeechBubble(collaborator, 'joined the session', 'muted');
			},
			onLeave = function (collaborator) {
				showSpeechBubble(collaborator, 'left the session', 'muted');
			};
		img.on('click tap', showCollaborator);
		collaborationModel.addEventListener('collaboratorDidEdit', onEdit);
		collaborationModel.addEventListener('collaboratorJoined', onJoin);
		collaborationModel.addEventListener('collaboratorLeft', onLeave);
	});
};

