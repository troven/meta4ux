/*global jQuery, _ */

jQuery.fn.goldStorageOpenWidget = function (goldMapStorageAdapter, mapController) {
	'use strict';
	var modal = this,
		template = this.find('[data-mm-role=template]'),
		parent = template.parent(),
		statusDiv = this.find('[data-mm-role=status]'),
		showAlert = function (message, type, prompt, callback) {
			type = type || 'block';
			var html = '<div class="alert fade-in alert-' + type + '">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'<strong>' + message + '</strong>';
			if (callback && prompt) {
				html = html + '&nbsp;<a href="#" data-mm-role="auth">' + prompt + '</a>';
			}
			html = html + '</div>';
			statusDiv.html(html);
			jQuery('[data-mm-role=auth]').click(function () {
				statusDiv.empty();
				callback();
			});
		},
		showSection = function (sectionName) {
			modal.find('[data-mm-section]').hide();
			modal.find('[data-mm-section~="' + sectionName + '"]').show();

		},
		loaded = function (files) {
			statusDiv.empty();
			var sorted = [];
			sorted = _.sortBy(files, function (file) {
				return file && file.modifiedDate;
			}).reverse();
			if (sorted && sorted.length > 0) {
				_.each(sorted, function (file) {
					var added;
					if (file) {
						added = template.clone().appendTo(parent);
						added.find('[rel=tooltip]').tooltip();
						added.find('a[data-mm-role=file-link]')
							.text(file.title)
							.click(function () {
								modal.modal('hide');
								mapController.loadMap(file.id);
							});

						added.find('[data-mm-role~=map-delete]').click(function () {
							modal.find('[data-mm-section~="delete-map"] [data-mm-role~="map-name"]').text(file.title);
							showSection('delete-map');
						});
						added.find('[data-mm-role=modification-status]').text(new Date(file.modifiedDate).toLocaleString());
					}
				});
			} else {
				jQuery('<tr><td colspan="3">No maps found</td></tr>').appendTo(parent);
			}
		},
		fileRetrieval = function () {
			var networkError = function () {
				showAlert('Unable to retrieve files from Mindmup Gold due to a network error. Please try again later. If the problem persists, please <a href="mailto:contact@mindmup.com">contact us</a>.', 'error');
			};
			parent.empty();
			statusDiv.html('<i class="icon-spinner icon-spin"/> Retrieving files...');
			goldMapStorageAdapter.list(false).then(loaded,
				function (reason) {
					if (reason === 'not-authenticated') {
						goldMapStorageAdapter.list(true).then(loaded,
							function (reason) {
								if (reason === 'user-cancel') {
									modal.modal('hide');
								} else if (reason === 'not-authenticated') {
									showAlert('The license key is invalid. To obtain or renew a MindMup Gold License, please send us an e-mail at <a href="mailto:contact@mindmup.com">contact@mindmup.com</a>', 'error');
								} else {
									networkError();

								}
							});
					} else if (reason === 'user-cancel') {
						modal.modal('hide');
					} else {
						networkError();
					}
				});
		};
	template.detach();
	modal.find('[data-mm-target-section]').click(function () {
		var elem = jQuery(this),
				sectionName = elem.data('mm-target-section');
		showSection(sectionName);
	});
	modal.find('[data-mm-role~="delete-map-confirmed"]').click(function () {
		var mapName = modal.find('[data-mm-section~="delete-map"] [data-mm-role~="map-name"]').text();
		showSection('delete-map-in-progress');
		goldMapStorageAdapter.deleteMap(mapName).then(
			function () {
				showSection('delete-map-successful');
			},
			function (reason) {
				modal.find('[data-mm-section="delete-map-failed"] [data-mm-role="reason"]').text(reason);
				showSection('delete-map-failed');
			});
	});
	modal.on('show', function (evt) {
		if (this === evt.target) {
			showSection('file-list');
			fileRetrieval();
		}
	});
	modal.modal({keyboard: true, show: false, backdrop: 'static'});
	return modal;
};
