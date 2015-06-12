/* global jQuery, MM */
jQuery.fn.atlasPrepopulationWidget = function (activeContentListener, titleLengthLimit, descriptionLengthLimit, truncFunction, sanitizeFunction) {
	'use strict';
	truncFunction = truncFunction || MM.AtlasUtil.truncate;
	sanitizeFunction = sanitizeFunction || MM.AtlasUtil.sanitize;
	var self = this,
			fillInValues = function () {
				var form = self.find('form[data-mm-role~=atlas-metadata]'),
						idea = activeContentListener.getActiveContent(),
						title = idea && idea.title,
						saneTitle = truncFunction(title, titleLengthLimit),
						saneDescription = truncFunction('MindMup mind map: ' + title, descriptionLengthLimit),
						saneSlug = sanitizeFunction(truncFunction(title, titleLengthLimit));

				form.find('[name=title]').attr('placeholder', saneTitle).val(saneTitle);
				form.find('[name=description]').attr('placeholder', saneDescription).val(saneDescription);
				form.find('[name=slug]').attr('placeholder', saneSlug).val(saneSlug);
			};
	self.on('show', function (evt) {
		if (this === evt.target) {
			fillInValues();
		}
	});
	return self;
};
MM.AtlasUtil = {
	truncate: function (str, length) {
		'use strict';
		return str.substring(0, length);
	},
	sanitize: function (s) {
		'use strict';
		var slug = s.substr(0, 100).toLowerCase().replace(/[^a-z0-9]+/g, '_');
		return slug === '_' ? 'map' : slug;
	}
};
