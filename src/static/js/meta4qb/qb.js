define(["moment", "colorbrewer", "crossfilter", "dc", "d3"], function (moment, colorbrewer, crossfilter, dc, d3) {

if (!colorbrewer) throw "missing colorbrewer"
if (!crossfilter) throw "missing crossfilter"

return function(options, data) {

var qb = { accessor: {}, register: {} };
_.extend(qb, {

	init: function(options) {
		_.extend(this.options,options);
		this.id = this.id || this.options.id || "qb_"+new Date().getMilliseconds();
console.log("new qb(): ", this.id)
		return this;
	},
	options: { decimalPlaces: 2 , el: "body", data: {}, colors: d3.scale.category20b() },
	_labels: { daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], monthsOfYear: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], weekOrWeekend: ["Weekday", "Weekend"] },

	load: function(data) {
		if (!data) {
			return this;
		}
		this.data = crossfilter(data);
		this.all = this.data.groupAll();
		this.options.data.parse && _.map(data, this.options.data.parse);
console.log("Loaded QB(): ", qb)
		return this;
	},

 	register: {
		labels: function(name, labels) {
			qb._labels[name] = labels
			return qb.register;
		},

		dimension: function(name, slice) {
			var _d = _.isObject(slice)?_.extend({},slice):{}
			_d = _.pick(_d, "dimension", "keyAccessor", "label", "filterPrinter", "dimensionFormat", "byType", "byKey")
console.warn("register dimension():", name, _d, _.extend({},slice) );

//if (slice.byType) throw "x";
			_d.dimension = _.isObject(slice)?qb.dimension(name):qb.dimension(name, slice)
			_d.keyAccessor = _d.keyAccessor || function(r) { return qb.as[_d.byType||"value"](r, _d.byKey||"key") }
			// auto-lookup labels
			var _labels = qb._labels[name];
			if (_labels) {
				_d.label = _d.label || function(r) { var v=r.key; return _labels[v]||v; }

				// and the filter printer ...
				if (!_d.filterPrinter) {
					_d.filterPrinter = function(r) {
						var filter = ""
						for(var i=0;i<r.length;i++) { filter+=(filter?", ":"")+(_labels[r[i]]||r[i]) }
						return filter;
					}
				}
			}
			_d.label = _d.label || _d.keyAccessor

			qb._dimensions[name] = qb._dimensions[name] || _d
			return qb.register;
		}, d: qb.register.dimension,

		measure: function(name, slice ) {
			var _m = _.pick(slice, "valueAccessor", "reducer")

			qb._measure(name, slice);
console.log("register-measure()", name, _m)
			qb._measures[name] = qb._measures[name] || _m;
			return qb.register;
		}
	},

	// var bornIn = qb.dimension("dob", "year")
	dimension: function(meta, type) {
		// assume object is already a dimension
		if (_.isObject(meta)) return meta;
		// regular function dimension
		if (_.isFunction(meta)) return qb.data.dimension( meta );

		// named dimension
		if (_.isString(meta)) {
			// a simple name function
			type = type || "value"
console.log("dimension(): ", meta, type)
			if (_.isFunction(type)) {
				return qb.data.dimension( type(meta) );
			}
			// simple type-based accessor
			if (_.isString(type)) {
				var fn = qb.as[type]
	console.log("Dimension As: ", meta, type, fn)
				if (!fn) throw "qb:dimension:unknown:accessor#"+type;

				// dynamic dimension by value Functor()
				return qb.data.dimension( function(model) { return fn(model, meta) } );
			}
			throw "qb:chart:create:invalid:dimension#"+meta
		}
		throw "qb:chart:create:lost:dimension"
	},

	group: function(dim, type) {
		if (!type) return dim?dim.group().reduceCount():null;
		var reducer = null;
		if (_.isFunction(type) || _.isObject(type)) {
			reducer = type;
		} else if (_.isString(type)) {
			var fn = qb.reduce[type]
			if (!fn) throw "qb:group:type:unknown#"+type
			reducer = fn.apply(this, this._skipArgs(arguments, 2));
		} else throw "qb:group:type:invalid#"+type

		if (_.isObject(reducer)) return dim.group().reduce( reducer.add, reducer.remove, reducer.initial )
		if (_.isFunction(reducer)) return dim.group().reduceSum( reducer );
		throw "qb:group:reducer#"+reducer
	},

	_getMeasureFQ: function(name, slice) {
		return _.isString(slice.reducer)?slice.reducer+"_"+(_.isString(slice.valueAccessor)?slice.valueAccessor+"_":"")+name:name;
	},
	_measure: function(name, slice) {
		slice.reducer = slice.reducer || "summarize"
		slice.valueAccessor = slice.valueAccessor || "count"

		// string or fn reduce - defaults to count / summarize()
		slice.reducer = _.isString(slice.reducer)?qb.reduce[slice.reducer](name, slice):slice.reducer;

		// string or fn accessor - defaults to value accessor
		slice.valueAccessor = (_.isString(slice.valueAccessor)?qb.accessor[slice.valueAccessor]:slice.valueAccessor)
	},

	_slice: function(slice) {
		if (!_.isObject(slice)) throw "qb:invalid:slice"
		slice = _.extend( {}, qb.defaults.all, qb.defaults[slice.type], slice);
		if (slice.type=="count") return slice;

		slice.dimension = slice.dimension || slice.by
		// merge dimensions and measures
		// if either is a string, then lookup them up in their respective registries
		if (_.isString(slice.dimension)) {
			slice.by = slice.dimension
			if (!qb._dimensions[slice.dimension]) {
				qb.register.dimension(slice.dimension, slice);
			}
			_.extend(slice, qb._dimensions[slice.dimension]);
		}

		if (_.isString(slice.measure)) {
			if (qb._measures[slice.measure]) {
				_.extend(slice, qb._measures[slice.measure]);
			} else {
				qb._measure(slice.measure, slice);
			}
		}
//		if (_.isObject(slice.measure)) _.extend(slice, slice.measure);

		// make sure nothing went horribly wrong .. we assume sensible defaults from here
		_.each(slice.requires, function(prop) {
			if (!slice[prop]) throw "qb:slice:missing:"+prop
		})
		qb.chart._sanityCheck(slice)

		// the measure's value accessor
		slice.valueAccessor = _.isString(slice.valueAccessor)?qb.reduce[slice.valueAccessor]:slice.valueAccessor
		slice.valueAccessor = slice.valueAccessor || qb.accessor.value

		// aggregate the measure by dimension
		// qb.group consumes dimension and group, the 3rd/4th parameters are passed as arguments to the reducer()
		if (!slice.group && _.isString(slice.measure)) {
			slice.group = qb.group(slice.dimension, slice.reducer, slice.measure, slice)
		} else {
			slice.group = slice.group || qb.group(slice.dimension, slice.reducer, slice)
		}

		// labels and tooltips - always on
		slice.label = slice.label || slice.keyAccessor || qb.accessor.key;
		slice.title = slice.title || function(r) {  return slice.label(r)+" = "+slice.valueAccessor(r) }

console.log("_slice():", qb, slice)
		return slice;
	},

	sliceBy: function(mName, dName) {
		if (!qb._dimensions) throw "qb:slice:dimensions:not-registered"
		if (!qb._measures) throw "qb:slice:measures:not-registered"

		if (!dName) throw "qb:slice:missing:dimension#"
		if (!mName) throw "qb:slice:missing:measure#"

		// quick and dirty default slicer - using looks
		return qb._slice({ dimension: dName, measure: mName, by: [mName, dName] });
	},

	// draw(type$, measure$, byDimension$)
	// draw(type$, measure{})
	draw: function(type, _slice, _slice_by) {
		if (!_slice) throw "qb:draw:missing:slice"
		if (_slice&&_slice_by) _slice = qb.sliceBy(_slice,_slice_by); // quick draw
		if (!_.isObject(_slice)) throw "qb:draw:missing:slice"

		// new slice, force type
		slice = qb._slice( _.extend({},_slice, {type: type}) )
		// identify, not explicit
		slice.id = qb.id+(slice.id || "_qb_"+type+"_"+(++qb._sliceCount))

		// root element
		var $chart = $(slice.el || "#"+slice.id)
console.log("Draw Chart: ", slice.id, type, _slice, _slice_by?"Quick Draw":"", $chart, $chart.length)
		if (!$chart.length) {
			slice.el = $chart = $("<div/>").addClass("qb_chart");
			var $el = $(qb.options.el);
			$chart.appendTo($el);
		}
		$chart.attr("id", slice.id)

		// header & controls
		if ($chart.length) {
			if (slice.header) { $("<div/>").appendTo($chart).addClass("qb-chart-header").html(slice.header) }
			if ( slice.showControls) {
				var $controls = $("<div class='qb-controls'/>").appendTo($chart);
				$("<span class='reset clickable' style='display: none;'><i class='fa fa-close'></i> </span>").appendTo($controls);
				$("<span class='filter clickable'/>").appendTo($controls);
			}
		}
console.warn("draw slice():", type, slice, _slice, slice.showControls?"controls":"no controls");

		// call chart factory
		var chart = qb.chart._create("#"+slice.id, slice);
console.warn("draw():", slice.id, $chart, chart);

		$chart.addClass("qb-chart").addClass("qb-chart-"+type)

		// bind reset/firr handlers
		if ($chart.length && slice.showControls) {
			$(".reset", $chart).hide().click(function() { chart.filterAll(); qb.render() })
			$(".filter", $chart).hide().click(function() { chart.filterAll(); qb.render() })
		}
		chart.$el = $chart;

		return chart;
	},

	render: function() {
		$("[data-measure]").each(function() {
			var slice = $(this).data();
			slice.el = $(this)
			if (slice.type&&slice.measure&&slice.dimension) qb.draw(slice.type, slice);
		});
		dc.renderAll(qb.id);
		return this;
	},
	reset: function() {
		dc.filterAll(qb.id);
		dc.renderAll(qb.id);
		return this;
	},

	filters: function(_newFilters) {
		var charts = dc.chartRegistry.list(qb.id);
		if (!_newFilters) {
			var filters = {}
			for (var i = 0; i < charts.length; ++i) {
				filters[i] = charts[i].filters();
			}
console.log("get filters: ", filters)
		} else {
			for (var i = 0; i < charts.length; ++i) {
				if (_newFilters[i]) {
					charts[i].filter(null);
					_.each(_newFilters[i], function(_filter) {
						if (_filter) {
							charts[i].filter(_filter);
				console.log("set filter: ", i, _filter)
						}
					})
					charts[i].redrawGroup();
				}
			}
		}
		return filters;
	},


	// key and value closures
	accessor: {
		key:  function(r) { return r.key },
		keyDate:  function(r) { return qb.as.date(r, "key") },
		value:  function(r) { return r.value },
		number:  function(r) { return parseFloat(r.value).toFixed(qb.options.decimalPlaces)  },
		total:  function(r) { return parseFloat(r.value?r.value.total:0).toFixed(qb.options.decimalPlaces) },
		count:  function(r) { return r.value?r.value.count:0 },
		average:  function(r) { return parseFloat(r.value?r.value.average:0).toFixed(qb.options.decimalPlaces) },
		min:  function(r) { return r.value?r.value.min:0 },
		max:  function(r) { return r.value?r.value.max:0 },
	},

	// data type transformation
	as: {
		value: 	function(model, meta) { return model[meta] },
		lookup: function(model, meta) { return qb._labels[meta][model[meta]] },
		number: function(model, meta) { return ( model[meta]?parseFloat(model[meta]):0 ).toFixed(qb.options.decimalPlaces) },
		date: 	function(model, meta) { return Date.parse(model[meta]) },
		day:	function(model, meta) { return Date.parse(model[meta]).getDay() },
		month: 	function(model, meta) { return qb._labels.monthsOfYear[qb.as.date(model, meta).getMonth()] },
		year: 	function(model, meta) { var y = new Date(model[meta]); return 1900+y.getYear() },
		week: 	function(model, meta) { return qb.as.date(model, meta).getWeek() },
		dayOfWeek:	function(model, meta) { return qb._labels.daysOfWeek[qb.as.day(model, meta)] },
		weekOrWeekend:	function(model, meta) { var d = qb.as.day(model, meta); return qb._labels.weekOrWeekend[d>0&&d<6?0:1] },
	},

	extent: {
		// dimension-based extent extensions
	},

	// aggregation - {add,remove,initial} or fn() reduce operations
	reduce: {
		summarize: function(meta) {
			return {
				add: function(answer, model) {
					answer.count++;
					var v = parseFloat(qb.as.number(model,meta));
					answer.total+=v;
					answer.average= answer.total / answer.count
					answer.average = qb.as.number(answer, "average");
					answer.min = v<answer.min?v:answer.min;
					answer.max = v>answer.max?v:answer.max;
					return answer;
				},
				remove: function(answer, model) {
					answer.count--;
					var v = parseFloat(qb.as.number(model,meta));
					answer.total-=v;
					answer.average = (answer.total / answer.count)
					answer.average = qb.as.number(answer, "average");
					answer.min = v<answer.min?v:answer.min;
					answer.max = v>answer.max?v:answer.max;
					return answer;
				},
				initial: function() {
					return { count: 0, total: 0, average: 0, min: 0, max: 0 } ;
				},
			}
		},

		ratio: function(antecedent, consequent) {
			return {
				add: function(answer, model) {
					answer.count++;
					var a = qb.as.number(model,antecedent);
					var c = qb.as.number(model,consequent);

					var ta = answer[antecedent]+=a;
					var tc = answer[consequent]+=c;
					answer.ratio = ((ta/answer.count) / (tc/answer.count))
					answer.ratio = qb.as.number(answer, "ratio");
					return answer;
				},
				remove: function(answer, model) {
					answer.count--;
					var a = qb.as.number(model,antecedent);
					var c = qb.as.number(model,consequent);

					var ta = answer[antecedent]-=a;
					var tc = answer[consequent]-=c;
					answer.ratio= ((ta/answer.count) / (tc/answer.count))
					answer.ratio = qb.as.number(answer, "ratio");
					return answer;
				},
				initial: function() {
					var answer = { count: 0, ratio: 0.0 } ;
					answer[antecedent] = 0;
					answer[consequent] = 0;
					return answer;
				},
			}
		},
	},
	chart: {
		_configure: function(chart, type, _slice) {
			var slice = _.extend( { type: type, scale: {} }, qb.defaults.all, qb.defaults[type], _slice);
			qb.chart._sanityCheck(slice);
console.log("_configured: ", slice.header?slice.header:"untitled", slice, qb.defaults.all, qb.defaults[type] )

			if (slice.x && slice.x.label) chart.xAxisLabel(slice.x.label)
			if (slice.y && slice.y.label) chart.yAxisLabel(slice.y.label)

			chart
			.width(slice.width)
			.height(slice.height)
			.renderLabel(slice.renderLabel)
			.renderTitle(slice.renderTitle)
			.transitionDuration(slice.transitionDuration)

			if (slice.dimension) chart.dimension(slice.dimension)
			slice.group && chart.group(slice.group)

			if (chart.colors) chart.colors( slice.colors || qb.options.colors )

			if (slice.showControls===false) chart.turnOffControls()
			else {
				chart.turnOnControls()
				qb.chart._controls(chart);
			}

			if (_.isFunction(slice.filterPrinter)) chart.filterPrinter(slice.filterPrinter)
			if (slice.renderlet) chart.renderlet(slice.renderlet)

			var label = slice.label || slice.keyAccessor || slice.valueAccessor || function() { return "No Label" }
			slice.renderLabel && chart.label( label );

			var title = slice.title || function(d) { return label(d)+" = "+(slice.valueAccessor?slice.valueAccessor(d):d.value) }
			slice.renderTitle && chart.title( title );

console.log("Label & Title", label, title)

			if (slice.valueAccessor) chart.valueAccessor(slice.valueAccessor)
			if (slice.keyAccessor) chart.keyAccessor(slice.keyAccessor)

			// optionally handle 'top-n' filtering
			if (slice.top) {
				if (_.isFunction(slice.top)) chart.data(slice.top)
				else chart.data(function(group) { return group.top(slice.top) })
			}
			return slice;
		},
		_sanityCheck: function(slice) {
			if (!slice) throw "qb:slice:missing";
			if (!_.isObject(slice)) throw "qb:slice:invalid";
		},

		_controls: function(chart) {
			var $c = (chart.root())
console.log("_controls()", $c, chart)
//			chart.select(".reset").on("click", function() {
//					chart.filterAll();
//			})
		},

		scale: {
			time: function(chart, slice, axis) {
				if (axis&&axis!="x") throw "qb:scale:time:invalid-axis";
				slice.scale = slice.scale || {}
				var scale = slice.scale.time || {}
				axis = axis || "x"

				scale.from = scale.from || new Date(2013,1,1)
				scale.to = scale.to || new Date()

				var timescale = d3.time.scale().domain([scale.from,scale.to])

				chart.x( timescale )
				// see https://github.com/mbostock/d3/wiki/Time-Intervals
				chart.xUnits(scale.units || d3.time.month)

console.log("Timescale: ", chart, scale, timescale)
				return chart;
			},

			linear: function(chart, slice, axis) {
				slice.scale = slice.scale || {}
				var scale = slice.scale.linear || {}
				axis = axis || "y"
				chart[axis](d3.scale.linear())
			},

			log: function(chart, slice, axis) {
				slice.scale = slice.scale || {}
				axis = axis || "y"
				chart[axis](d3.scale.log())
			}
		},
		_create: function(el, slice) {
			if (!el) throw "qb:chart:create:missing:dom-selector";
			if (!slice.type) throw "qb:chart:create:missing:type";
			return qb.chart[slice.type](el,slice);
		},

		pie: function(el, slice) {
			var chart = dc.pieChart(el, qb.id);
			slice = qb.chart._configure(chart, "pie", slice);
console.log("Pie/Donut: ", chart, slice);

			chart.radius(slice.radius)
			.innerRadius(slice.innerRadius)
			.slicesCap(slice.slicesCap)

			if (chart.renderLegend) chart.legend(chart.legend || dc.legend())

			return chart;
		},
		donut: function(el, slice) {
			return qb.chart.pie(el,slice);
		},

		bar: function(el, slice) {
			var chart = dc.barChart(el, qb.id);
			slice = qb.chart._configure(chart, "bar", slice);
console.log("Bar: ", chart, slice);

			chart.
			x(d3.scale.linear())
			.y(d3.scale.linear())

			chart
			.gap(slice.gap || 5)

			chart.brushOn(slice.brushOn)
//			xUnits(dc.units.ordinal)
			.renderHorizontalGridLines(true)
//			.renderVerticalGridLines(false)
//			.elasticX(slice.elasticX)
			.elasticY(slice.elasticY)
			.centerBar(slice.centerBar)

			chart.xAxis().tickFormat();
			if(slice.label) chart.label(slice.label)

			return chart;
		},

		column: function(el, slice) {
			var chart = dc.barChart(el, qb.id);
			slice = qb.chart._configure(chart, "bar", slice);
console.log("Column: ", chart, slice);

			chart.
			x(d3.scale.ordinal())
			.xUnits(dc.units.ordinal)
			.y(d3.scale.linear())

			chart
			.gap(slice.gap || 2)

			chart.brushOn(slice.brushOn)
			.renderHorizontalGridLines(true)
//			.renderVerticalGridLines(false)
//			.elasticX(slice.elasticX)
			.elasticY(slice.elasticY)
			.centerBar(slice.centerBar)

			chart.xAxis().tickFormat();
			if(slice.label) chart.label(slice.label)

			return chart;
		},

		line: function(el, slice) {
			var chart = dc.lineChart(el, qb.id);
//			slice = qb.chart._configure(chart, "line", slice);
console.log("Line: ", chart, slice);

			chart.width(slice.width)
			.height(slice.height)
			.renderLabel(slice.renderLabel)
			.renderTitle(slice.renderTitle)
			.transitionDuration(slice.transitionDuration)

			if (slice.dimension) chart.dimension(slice.dimension)
			if (slice.group) chart.group(slice.group)
			if (slice.valueAccessor) chart.valueAccessor(slice.valueAccessor)
			if (slice.keyAccessor) chart.keyAccessor(slice.keyAccessor)

			chart
			.x(d3.scale.ordinal())
			.xUnits(dc.units.ordinal)
			.y(d3.scale.linear())
			.elasticX(slice.elasticX)
			.elasticY(slice.elasticY)

//			chart.brushOn(slice.brushOn)
//			.renderDataPoints(slice.renderDataPoints)
//			.dotRadius(slice.dotRadius)
//			.clipPadding(slice.clipPadding)
//			.interpolate('step-before')
//			.renderArea(slice.renderArea)

			chart.xAxis().tickFormat()

			return chart;
		},

		time: function(el, slice) {
			var chart = dc.lineChart(el,qb.id);
			slice = qb.chart._configure(chart, "time", slice);
console.log("Time: ", chart, slice, d3);

			qb.chart.scale.time(chart, slice, "x")

			slice.scale.log && qb.chart.scale.log(chart, slice, "y")
			slice.scale.linear && qb.chart.scale.linear(chart, slice, "y")

		    chart
//		    .interpolate('cardinal')
			.brushOn(slice.brushOn)
			.renderArea(slice.renderArea)
			.renderDataPoints(slice.renderDataPoints)
			.dotRadius(slice.dotRadius)
			.elasticY(slice.elasticY)
			.elasticX(true)
			.clipPadding(slice.clipPadding)

			chart.xAxis()

			return chart;
		},

		series: function(el, slice) {
			var chart = dc.seriesChart(el,qb.id);
			slice = qb.chart._configure(chart, "series", slice);
console.log("Series: ", chart, slice);

			chart.brushOn(slice.brushOn)
			.clipPadding(slice.clipPadding)
			.elasticX(slice.elasticX)
			.elasticY(slice.elasticY)
			return chart;
		},

		scatter: function(el, slice) {
			var chart = dc.scatterChart(el,qb.id);
			slice = qb.chart._configure(chart, "scatter", slice);

console.log("Scatter: ", chart, slice);
			return chart;
		},

		bubble: function(el, slice) {
			var chart = dc.bubbleChart(el,qb.id);
			slice = qb.chart._configure(chart, "bubble", slice);
console.log("Bubble: ", chart, slice);

			chart.brushOn(slice.brushOn)
			.renderDataPoints(slice.renderDataPoints)
			.clipPadding(slice.clipPadding)
			.elasticX(slice.elasticX)
			.elasticY(slice.elasticY)
			return chart;
		},

		row: function(el, slice) {
			var chart = dc.rowChart(el,qb.id);
			slice = qb.chart._configure(chart, "row", slice);
console.log("Row: ", chart, slice);

			chart
			.gap(slice.gap || 1)

//			chart.renderVerticalGridLines(slice.renderVerticalGridLines)
//			chart.renderHorizontalGridLines(slice.renderHorizontalGridLines)
			slice.elasticX && chart.elasticX(slice.elasticX)

			return chart;
		},

		table: function(el, slice) {
			var chart = dc.dataTable(el,qb.id);
			slice = qb.chart._configure(chart, "table", slice);
console.log("Table: ", chart, slice);

			chart.group(function(g) {
	console.log("Tabulate: ", g);
				return "x";
			})

			slice.columns && chart.columns(slice.columns);
//			chart.size(10)
			return chart;
		},

		count: function(el, slice) {
			slice = slice || {}
			slice.dimension = slice.dimension || qb.data;
			slice.group = slice.group || qb.data.groupAll();

			var chart = dc.dataCount(el, qb.id);
			slice = qb.chart._configure(chart, "count", slice);
console.log("Count: ", chart, slice);
			var $el = $(el);

			chart.html({
				some: slice.some || '<div class="qb-filter-stats">showing <strong>%filter-count</strong> of <strong>%total-count</strong> - <button data-action="reset">reset</button></div>',
				all: slice.all || '<div class="qb-filter-stats"><strong>%total-count</strong> records. Click to filter.</div>'
			});

			chart.on("postRedraw", function() {
				$("[data-action='reset']", $el).click(function() {
		console.log("Filter Reset: ", qb, qb.filters() );
					qb.reset();
				})
			})


			return chart;
		},

		geo: function(el, slice) {
			var chart = dc.geoChoroplethChart(el,qb.id);
			slice = qb.chart._configure(chart, "geo", slice);
console.log("Geo: ", chart, slice);

			//https://github.com/mbostock/d3/wiki/Geo-Projections
			chart.projection(d3.geo.azimuthalEqualArea()) //.scale(26778).translate([8227, 3207])
			slice.features && chart.overlayGeoJson(slice.features, 'geo', slice.featureKey )
			return chart;
		},
	},

//http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
	_centerOnGeo: function(json, width, height, scale) {
		var center = d3.geo.centroid(json)
		scale  = scale || 150;
		var offset = [width/2, height/2];
		var projection = d3.geo.mercator().scale(scale).center(center).translate(offset);

		// create the path
		var path = d3.geo.path().projection(projection);

		// using the path determine the bounds of the current map and use
		// these to determine better values for the scale and translation
		var bounds  = path.bounds(json);
		var hscale  = scale*width  / (bounds[1][0] - bounds[0][0]);
		var vscale  = scale*height / (bounds[1][1] - bounds[0][1]);
		var scale   = (hscale < vscale) ? hscale : vscale;
		var offset  = [width - (bounds[0][0] + bounds[1][0])/2, height - (bounds[0][1] + bounds[1][1])/2];

		// new projection
		projection = d3.geo.mercator().center(center).scale(scale).translate(offset);
		return path.projection(projection);
	},

	_skipArgs: function(args, skip) {
		var newArgs = []
		for (var i = skip; i < args.length; i++) newArgs.push(args[i]);
		return newArgs;
	},

	_setter: function(dst, src) {
		if (!_.isObject(dst)&&_.isObject(src)) throw "qb:chart:setter:args:invalid"
		_.each(src, function(v,k) {
			var method = dst[k]
			(method && _.isFunction(method) ) && dst[method].apply(dst, [ src[k] ] );
console.log("set: ", dst, src, k, v, method)
		})
		return dst;
	},

	_dimensions: {}, _measures: {}, _sliceCount:0,
});

qb.defaults = {
	all: {
		width: 192, height: 192,
		renderArea: true, renderLabel: true, renderTitle: true,
		elasticY: true, elasticX: true, margins: {top: 10, right: 10, bottom: 10, left: 40},
		brushOn: true, transitionDuration: 500,
		required: [ "dimension", "measure", "reducer"],
		x_colors: ['#ccc', '#E2F2FF','#C4E4FF','#9ED2FF','#81C5FF','#6BBAFF','#51AEFF','#36A2FF','#1E96FF','#0089FF', '#0061B5'],
	},
	donut: { width: 250, height: 200, radius: 90, innerRadius: 20, slicesCap: 10, renderTitle: true, showControls: true, renderLabel: true, renderLegend: false },
	pie: { width: 250, height: 200, radius: 90, innerRadius: 0, slicesCap: 10, renderTitle: true, showControls: true, renderLabel: true, renderLegend: true },
	bar: { width: 600, height: 300, centerBar: false, showControls: true },
	column: { width: 400, height: 250, centerBar: false, showControls: true, renderTitle: true },
	line: { width: 800, height: 400, renderDataPoints: true, mouseZoomable: true, dotRadius: 4 },
	series: { width: 800, height: 400 },
	scatter: { width: 800, height: 400 },
	bubble: { width: 800, height: 400 },
	row: { width: 200, height: 200, renderTitle: true, renderHorizontalGridLines: false, renderVerticalGridLines: false, showControls: true },
	time: { width: 800, height: 200,renderArea: true, renderDataPoints: true, clipPadding: 8, mouseZoomable: true, dotRadius: 4, elasticY: true, elasticX: false,  },
	table: { width: 800, height: 400 },
	count: { width: 192, height: 32, required: [] },
	geo: { width: 1024, height: 600, featureKey: function (d) { return d.properties.name } },
}
return qb.init(options).load(data)

}

});
