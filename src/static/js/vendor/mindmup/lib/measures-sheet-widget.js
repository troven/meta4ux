/*global jQuery, _*/
jQuery.fn.addToRowAtIndex = function (container, index) {
	'use strict';
	var element = jQuery(this),
		current = container.children('[data-mm-role=' + element.data('mm-role') + ']').eq(index);
	if (current.length) {
		element.insertBefore(current);
	} else {
		element.appendTo(container);
	}
	return element;
};

jQuery.fn.numericTotaliser = function () {
	'use strict';
	var element = jQuery(this),
		footer = element.find('tfoot tr'),
		recalculateColumn = function (column) {
			var total = 0;
			if (column === 0) {
				return;
			}
			element.find('tbody tr').each(function () {
				var row = jQuery(this),
					val = parseFloat(row.children().eq(column).text());
				if (!isNaN(val)) {
					total += val;
				}
			});
			footer.children().eq(column).text(total);
		},
		initialTotal = function () {
			var column;
			for (column = 1; column < footer.children().size(); column++) {
				recalculateColumn(column);
			}
		};
	element.on('change', function (evt /*, newValue*/) {
		var target = jQuery(evt.target);
		if (evt.column !== undefined) {
			recalculateColumn(evt.column);
		} else if (target.is('td')) {
			recalculateColumn(target.index());
		} else {
			initialTotal();
		}
	});
	return this;
};

jQuery.fn.measuresDisplayControlWidget = function (measuresModel, mapModel) {
	'use strict';
	return jQuery.each(this, function () {
		var element = jQuery(this),
			measurementActivationTemplate = element.find('[data-mm-role=measurement-activation-template]'),
			measurementActivationContainer = measurementActivationTemplate.parent(),
			hideLabels = element.find('[data-mm-role=hide-measure]'),
			onMeasureAdded = function (measureName /*, index */) {
				var measurementActivation = measurementActivationTemplate.clone().appendTo(measurementActivationContainer);
				measurementActivation.attr('data-mm-measure', measureName).find('[data-mm-role=show-measure]').click(function () {
					measuresModel.dispatchEvent('measureLabelShown', measureName);
					mapModel.setLabelGenerator(function () {
						return measuresModel.addUpMeasurementForAllNodes(measureName);
					});
				}).find('[data-mm-role=measure-name]').text(measureName);
				element.show();
			},
			onMeasureRemoved = function (measureName) {
				measurementActivationContainer.children('[data-mm-measure="' + measureName.replace('"', '\\"') + '"]').remove();
				if (_.isEmpty(measuresModel.getMeasures())) {
					element.hide();
				}
			},
			clean = function () {
				measurementActivationContainer.children('[data-mm-role=measurement-activation-template]').remove();
				var measures = measuresModel.getMeasures();
				if (measures && measures.length > 0) {
					_.each(measures, onMeasureAdded);
				} else {
					element.hide();
				}
			},
			onMeasureLabelShown = function (measureName) {
				measurementActivationContainer.children().removeClass('mm-active').filter('[data-mm-measure="' + measureName.replace('"', '\\"') + '"]').addClass('mm-active');
				if (measureName) {
					hideLabels.show();
				} else {
					hideLabels.hide();
				}
			};
		clean();

		measuresModel.addEventListener('startFromScratch', clean);
		measuresModel.addEventListener('measureAdded', onMeasureAdded);
		measuresModel.addEventListener('measureRemoved', onMeasureRemoved);
		measuresModel.addEventListener('measureLabelShown', onMeasureLabelShown);
		hideLabels.hide().click(function () {
			mapModel.setLabelGenerator(false);
			measuresModel.dispatchEvent('measureLabelShown', '');
		});
	});
};
jQuery.fn.measuresSheetWidget = function (measuresModel) {
	'use strict';
	return jQuery.each(this, function () {
		var element = jQuery(this),
			measurementsTable = element.find('[data-mm-role=measurements-table]'),
			noMeasuresDiv = element.find('[data-mm-role=no-measures]'),
			measurementTemplate = element.find('[data-mm-role=measurement-template]'),
			measurementContainer = measurementTemplate.parent(),
			ideaTemplate = element.find('[data-mm-role=idea-template]'),
			valueTemplate = ideaTemplate.find('[data-mm-role=value-template]').detach(),
			ideaContainer = ideaTemplate.parent(),
			addMeasureInput = element.find('[data-mm-role=measure-to-add]'),
			summaryTemplate = element.find('[data-mm-role=summary-template]'),
			summaryContainer = summaryTemplate.parent(),
			getRowForNodeId = function (nodeId) {
				return element.find('[data-mm-nodeid="' + nodeId + '"]');
			},
			getColumnIndexForMeasure = function (measureName) {
				return _.map(measurementContainer.children(), function (column) {
					return jQuery(column).find('[data-mm-role=measurement-name]').text();
				}).indexOf(measureName);
			},
			appendMeasure = function (measureName, index) {
				var measurement = measurementTemplate.clone().addToRowAtIndex(measurementContainer, index);
				measurement.find('[data-mm-role=measurement-name]').text(measureName);
				measurement.find('[data-mm-role=remove-measure]').click(function () {
					measuresModel.removeMeasure(measureName);
				});
				summaryTemplate.clone().addToRowAtIndex(summaryContainer, index).text('0');
				measurementsTable.show();
				noMeasuresDiv.hide();
			},
			onFocused = function (nowFocused, nodeId) {
				if (nowFocused !== focused) {
					focused = nowFocused;
					measuresModel.editingMeasure(nowFocused, nodeId);
				}
			},
			appendMeasureValue = function (container, value, nodeId, measureName, index) {
				var current = container.children('[data-mm-role=value-template]').eq(index),
					valueCell = valueTemplate.clone();
				valueCell.text(value || '0')
				.on('change', function (evt, newValue) {
					return measuresModel.setValue(nodeId, measureName, newValue);
				}).on('focus', function () {
					onFocused(true, nodeId);
				}).on('blur', function () {
					onFocused(false, nodeId);
				}).keydown('Esc', function (e) {
					valueCell.blur();
					e.preventDefault();
					e.stopPropagation();
				});

				if (current.length) {
					valueCell.insertBefore(current);
				} else {
					valueCell.appendTo(container);
				}
				return valueCell;
			},
			onMeasureValueChanged = function (nodeId, measureChanged, newValue) {
				var row = getRowForNodeId(nodeId),
					col = getColumnIndexForMeasure(measureChanged);
				if (col >= 0) {
					row.children().eq(col).text(newValue);
					measurementsTable.trigger(jQuery.Event('change', {'column': col}));
				}
			},
			onMeasureAdded = function (measureName, index) {
				appendMeasure(measureName, index);
				_.each(ideaContainer.children(), function (idea) {
					appendMeasureValue(jQuery(idea), '0', jQuery(idea).data('mm-nodeid'), measureName, index);
				});
			},
			onMeasureLabelShown = function (measureName) {
				measurementContainer.children().removeClass('mm-active');
				var col = getColumnIndexForMeasure(measureName);
				if (col >= 0) {
					measurementContainer.children().eq(col).addClass('mm-active');
				}
			},
			onMeasureRemoved = function (measureName) {
				var col = getColumnIndexForMeasure(measureName);
				if (col < 0) {
					return;
				}
				measurementContainer.children().eq(col).remove();
				summaryContainer.children().eq(col).remove();
				_.each(ideaContainer.children(), function (idea) {
					jQuery(idea).children().eq(col).remove();
				});
			},
			buildMeasureTable = function () {
				measurementContainer.children('[data-mm-role=measurement-template]').remove();
				summaryContainer.children('[data-mm-role=summary-template]').remove();
				var measures = measuresModel.getMeasures();
				if (measures && measures.length > 0) {
					measurementsTable.show();
					noMeasuresDiv.hide();
				} else {
					measurementsTable.hide();
					noMeasuresDiv.show();
				}
				_.each(measures, function (m) {
					appendMeasure(m);
				});
				buildMeasureRows(measures);
			},
			focused = false,
			buildMeasureRows = function (measures) {
				ideaContainer.children('[data-mm-role=idea-template]').remove();
				_.each(measuresModel.getMeasurementValues(), function (mv) {
					var newIdea = ideaTemplate.clone().appendTo(ideaContainer).attr('data-mm-nodeid', mv.id);
					newIdea.find('[data-mm-role=idea-title]').text(function () {
						var truncLength = jQuery(this).data('mm-truncate');
						if (truncLength && mv.title.length > truncLength) {
							return mv.title.substring(0, truncLength) + '...';
						}
						return mv.title;
					});
					_.each(measures, function (measure) {
						appendMeasureValue(newIdea, mv.values[measure], mv.id, measure);
					});
				});
				element.find('[data-mm-role=measurements-table]').trigger('change');
			},
			onMeasureRowsChanged = function () {
				buildMeasureRows(measuresModel.getMeasures());
			};


		measurementTemplate.detach();
		summaryTemplate.detach();
		ideaTemplate.detach();
		measurementsTable.editableTableWidget({
			editor: element.find('[data-mm-role=measures-editor]'),
			cloneProperties: jQuery.fn.editableTableWidget.defaultOptions.cloneProperties.concat(['outline', 'box-shadow', '-webkit-box-shadow', '-moz-box-shadow'])
		}).on('validate', function (evt, value) {
			measuresModel.editingMeasure(true);
			return measuresModel.validate(value);
		}).numericTotaliser();
		element.find('[data-mm-role=measures-editor]').on('focus', onFocused.bind(element, true, false)).on('blur', onFocused.bind(element, false, false));
		element.on('show', function () {
			buildMeasureTable();
			measuresModel.addEventListener('startFromScratch', buildMeasureTable);
			measuresModel.addEventListener('measureRowsChanged', onMeasureRowsChanged);
			measuresModel.addEventListener('measureValueChanged', onMeasureValueChanged);
			measuresModel.addEventListener('measureAdded', onMeasureAdded);
			measuresModel.addEventListener('measureRemoved', onMeasureRemoved);
		});
		element.on('hide', function () {
			measuresModel.removeEventListener('startFromScratch', buildMeasureTable);
			measuresModel.removeEventListener('measureRowsChanged', onMeasureRowsChanged);
			measuresModel.removeEventListener('measureValueChanged', onMeasureValueChanged);
			measuresModel.removeEventListener('measureAdded', onMeasureAdded);
			measuresModel.removeEventListener('measureRemoved', onMeasureRemoved);
			element.parent().siblings('[tabindex]').focus();
		});
		element.find('[data-mm-role=measure-to-add]').parent('form').on('submit', function () {
			measuresModel.addMeasure(addMeasureInput.val());
			addMeasureInput.val('');
			return false;
		});
		measuresModel.addEventListener('measureLabelShown', onMeasureLabelShown);
	});

};
