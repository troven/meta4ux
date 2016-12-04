/*global MM, _ */
MM.ResourceCompressor = function (prefixTemplate) {
	'use strict';
	var self = this,
		prefix = prefixTemplate + ':',
		prefixMatcher = new RegExp('^' + prefix),
		cleanUpResources = function (contentAggregate) {
			if (!contentAggregate.resources) {
				return;
			}
			var unused = {};
			_.map(contentAggregate.resources, function (value, key) {
				unused[key] = true;
			});
			contentAggregate.traverse(function (idea) {
				var url = idea && idea.attr && idea.attr.icon && idea.attr.icon.url;
				if (url) {
					delete unused[url.substring(prefix.length)];
				}
			});
			_.each(unused, function (value, key) {
				delete contentAggregate.resources[key];
			});
		},
		replaceInlineWithResources = function (contentAggregate) {
			contentAggregate.traverse(function (idea) {
				var url = idea && idea.attr && idea.attr.icon && idea.attr.icon.url;
				if (url && !prefixMatcher.test(url)) {
					idea.attr.icon.url = prefix + contentAggregate.storeResource(url);
				}
			});
		};
	self.compress = function (contentAggregate) {
		replaceInlineWithResources(contentAggregate);
		cleanUpResources(contentAggregate);
	};
};
