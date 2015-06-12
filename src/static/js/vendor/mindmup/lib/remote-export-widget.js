/*global $, jQuery, MM, document, MAPJS, window, atob, ArrayBuffer, Uint8Array*/
jQuery.fn.remoteExportWidget = function (mapController, alert, measureModel, configurationGenerator, storageApi, modalConfirmation) {
	'use strict';
	var alertId,
		loadedIdea,
		downloadLink = ('download' in document.createElement('a')) ? $('<a>').addClass('hide').appendTo('body') : undefined,
		dataUriToBlob = function (dataURI) {
			var byteString = atob(dataURI.split(',')[1]),
				mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0],
				ab = new ArrayBuffer(byteString.length),
				ia = new Uint8Array(ab),
				i;
			for (i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}
			return new window.Blob([ab], {type: mimeString});
		},
		toObjectURL = function (contents, mimeType) {
			var browserUrl = window.URL || window.webkitURL;
			if (/^data:[a-z]*\/[a-z]*/.test(contents)) {
				return browserUrl.createObjectURL(dataUriToBlob(contents));
			}
			return browserUrl.createObjectURL(new window.Blob([contents], {type: mimeType}));
		};
	mapController.addEventListener('mapLoaded', function (mapId, idea) {
		loadedIdea = idea;
	});
	return this.click(function () {
		var toPromise = function (fn, mimeType) {
				return function () {
					return jQuery.Deferred().resolve(fn.apply(undefined, arguments), mimeType).promise();
				};
			},
			exportFunctions = {
				'mup' : toPromise(function (contentObject) {
					return JSON.stringify(contentObject, null, 2);
				}, 'application/json'),
				'mm' : toPromise(MM.freemindExport, 'text/xml'),
				'html': MM.exportToHtmlDocument,
				'png': MAPJS.pngExport,
				'txt': toPromise(MM.exportIdeas.bind({}, loadedIdea, new MM.TabSeparatedTextExporter()), 'text/plain'),
				'measures-all': toPromise(function () {
						return MM.exportTableToText(measureModel.getRawData(true));
					}, 'text/tab-separated-values'),
				'measures': toPromise(function () {
						return MM.exportTableToText(measureModel.getRawData());
					}, 'text/tab-separated-values')

			},
			format = $(this).data('mm-format'),
			extension = $(this).data('mm-extension') || format,
			title,
			elem,
			hideAlert = function () {
				if (alert && alertId) {
					alert.hide(alertId);
					alertId = undefined;
				}
			},
			showErrorAlert = function (title, message) {
				hideAlert();
				alertId = alert.show(title, message, 'error');
			};
		title = loadedIdea.title + '.' + extension;
		if (alert) {
			hideAlert();
			alertId = alert.show('<i class="icon-spinner icon-spin"></i>&nbsp;Exporting map', 'This may take a few seconds for larger maps', 'info');
		}
		elem = $(this);
		if (exportFunctions[format]) {
			exportFunctions[format](loadedIdea).then(
				function (contents, mimeType) {
					var toSend = contents;
					if (!toSend) {
						return false;
					}

					if (downloadLink && (!$('body').hasClass('force-remote'))) {
						hideAlert();
						downloadLink.attr('download', title).attr('href', toObjectURL(toSend, mimeType));
						downloadLink[0].click();
					} else {
						if (/^data:[a-z]*\/[a-z]*/.test(toSend)) {
							toSend = dataUriToBlob(toSend);
							mimeType = toSend.type;
						} else {
							mimeType = 'application/octet-stream';
						}
						configurationGenerator.generateEchoConfiguration(extension, mimeType).then(
							function (exportConfig) {
								storageApi.save(toSend, exportConfig, {isPrivate: true}).then(
									function () {
										hideAlert();
										alertId = alert.show('Your map was exported.',
											' <a href="' + exportConfig.signedOutputUrl + '" target="_blank">Click here to open the file, or right-click and choose "save link as"</a>',
											'success');
									},
									function (reason) {
										if (reason === 'file-too-large') {
											hideAlert();
											modalConfirmation.showModalToConfirm(
												'Remote export',
												'Your browser requires a remote export and this map exceeds your upload limit. To export the map, please use a browser which supports in-browser downloads (such as Chrome or Firefox) or enter a MindMup Gold license to increase your limit.<br/><br/>If you are a Gold user and you see this message, please contact us at <a href="mailto:contact@mindmup.com">contact@mindmup.com</a> to arrange an offline export.',
												'Subscribe to Mindmup Gold'
											).then(
												function () {
													jQuery('#modalGoldLicense').modal('show');
												}
											);

										} else {
											showErrorAlert('Unfortunately, there was a problem exporting the map.', 'Please try again later. We have sent an error report and we will look into this as soon as possible');
										}
									}
								);
							},
							function () {
								showErrorAlert('Unfortunately, there was a problem exporting the map.', 'Please try again later. We have sent an error report and we will look into this as soon as possible');
							}
						);
					}
				}
			);
		}
	});
};
