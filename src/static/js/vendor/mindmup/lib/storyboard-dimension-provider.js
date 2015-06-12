/*global MM, _, jQuery*/
/* todo:
 *  - center image in its half
 */
MM.StoryboardDimensionProvider = function (resourceManager) {
	'use strict';
	var self = this,
		fakeDIV = jQuery('<div>').attr('data-mm-role', 'storyboard-sizer').addClass('storyboard-scene-title')
		.css({'z-index': '-99', 'visibility': 'hidden'}),
		findFontSize = function (title, width, height) {
			fakeDIV.css({'max-width': width}).appendTo('body').text(title);
			var result = {fontSize: height * 0.5 },
				multiplier = 0.9;
			do {
				result.fontSize = Math.floor(result.fontSize * multiplier);
				result.lineHeight = Math.floor(result.fontSize * 1.3);
				fakeDIV.css('font-size', result.fontSize + 'px');
				fakeDIV.css('line-height', result.lineHeight + 'px');
			} while ((fakeDIV.height() > height || fakeDIV[0].scrollWidth > width) && result.fontSize > height / 30);
			result.textWidth = fakeDIV.width();
			fakeDIV.detach();
			return result;
		},
		hasBullets = function (text) {
			var result = /\n-/.test(text);
			return result;
		};
	self.getDimensionsForScene = function (scene, width, height) {
		var padding = width / 16,
			result = {
				text:  {
					'height': height - 2 * padding,
					'width': width - 2 * padding,
					'padding-top': padding,
					'padding-bottom': padding,
					'padding-left': padding,
					'padding-right': padding,
					toCss: function () {
						return _.extend({
							'font-size': result.text.fontSize + 'px',
							'line-height': result.text.lineHeight +  'px'
						}, _.omit(result.text, 'fontSize', 'lineHeight'));
					}
				},
				image: {
					toCss: function () {
						return {
							'background-image': '',
							'background-repeat': '',
							'background-size': '',
							'background-position': ''
						};
					}
				}
			},
			imageScale = 1, maxImageHeight = height, maxImageWidth = width, textDims, additionalPadding;

		if (scene.image) {
			if (scene.image.position === 'top' || scene.image.position === 'bottom') {
				maxImageHeight = height / 2 - padding;
				result.text['padding-' + scene.image.position] = height / 2;
				result.text.height = height / 2 - padding;
			} else if (scene.image.position === 'left' || scene.image.position  === 'right') {
				maxImageWidth = width / 2 - padding;
				result.text['padding-' + scene.image.position] = width / 2;
				result.text.width = width / 2 -  padding;
			}
			imageScale = maxImageWidth / scene.image.width;
			if (imageScale > maxImageHeight / scene.image.height) {
				imageScale = maxImageHeight / scene.image.height;
			}
			result.image = {
				'url': scene.image.url,
				'height': (imageScale * scene.image.height),
				'width': (imageScale * scene.image.width)
			};
			if (scene.image.position === 'top') {
				result.image.top =  0.25 * height - result.image.height * 0.5;
				result.image.left = (width - result.image.width) / 2;
			} else if (scene.image.position === 'bottom') {
				result.image.top =  0.75 * height - result.image.height * 0.5;
				result.image.left = (width - result.image.width) / 2;
			} else if (scene.image.position === 'left') {
				result.image.top = (height - result.image.height) / 2;
				result.image.left = (width / 2 - result.image.width) / 2;
			} else if (scene.image.position === 'right') {
				result.image.top = (height - result.image.height) / 2;
				result.image.left = 0.75 * width - result.image.width * 0.5;
			} else {
				result.image.top = (height - result.image.height) / 2;
				result.image.left = (width - result.image.width) / 2;
			}
			result.image.toCss = function () {
				return {
					'background-image': 'url("' + resourceManager.getResource(scene.image.url) + '")',
					'background-repeat': 'no-repeat',
					'background-size': (imageScale * scene.image.width) + 'px ' + (imageScale * scene.image.height) + 'px',
					'background-position':  result.image.left + 'px ' + result.image.top + 'px'
				};
			};
		}
		if (hasBullets(scene.title)) {
			result.text['text-align'] = 'left';
		}
		textDims = findFontSize(scene.title, result.text.width, result.text.height);
		result.text.fontSize = textDims.fontSize;
		result.text.lineHeight = textDims.lineHeight;
		additionalPadding = (result.text.width - textDims.textWidth) / 2;
		if (additionalPadding > 0) {
			result.text.width = textDims.textWidth;
			result.text['padding-left'] += additionalPadding;
			result.text['padding-right'] += additionalPadding;
		}
		return result;
	};

};

MM.buildStoryboardExporter = function (storyboardModel, dimensionProvider, resourceTranslator) {
	'use strict';
	return function () {
		var scenes = storyboardModel.getScenes();
		if (_.isEmpty(scenes)) {
			return {};
		}
		return {storyboard:
			_.map(scenes, function (scene) {
				var result = _.extend({title: scene.title}, dimensionProvider.getDimensionsForScene(scene, 800, 600));
				if (result.image && result.image.url) {
					result.image.url = resourceTranslator(result.image.url);
				}
				return result;
			})
		};
	};
};
