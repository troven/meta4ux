/*global $, FileReader, _, window, console */
$.fn.file_reader_upload = function (start, complete, fail, formats) {
	'use strict';
	var element = this,
		oFReader = window.FileReader && new FileReader(),
		fileName,
		fileType;
	formats = formats || ['mup', 'mm'];
	if (!oFReader) {
		return element;
	}
	start = start || function (name) {
		console.log('Reading', name);
	};
	complete = complete || function (content) {
		console.log('Read', content);
	};
	fail = fail || function (error) {
		console.log('Read error', error);
	};
	oFReader.onload = function (oFREvent) {
		complete(oFREvent.target.result, fileType);
	};
	oFReader.onerror = function (oFREvent) {
		fail('Error reading file', oFREvent);
	};
	oFReader.onloadstart = function () {
		start(fileName);
	};
	element.change(function () {
		var fileInfo = this.files[0];
		fileName = fileInfo.name;
		fileType = fileName.split('.').pop();
		if (!_.contains(formats, fileType)) {
			fail('unsupported format ' + fileType);
			return;
		}
		oFReader.readAsText(fileInfo, 'UTF-8');
		element.val('');
	});
	return element;
};
