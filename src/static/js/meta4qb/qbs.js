define(["backbone", "vendor/bootstrap", "colorbrewer", "dc", "d3", "qb"], function (Backbone, bootstrap, colorbrewer, dc, d3, qb) {

var dash = {}
_.extend(dash, {
	options: { el: "body",
		css: { root: "qb-root container", dash: "qb-dash container", header: "qb-header", chart: "qb-chart" }
	}, _qbs: {},

	init: function(options) {
		_.extend(dash.options,options);

		var $el = dash.options.el = dash._createContainerElement(dash.options)
		$el.addClass(dash.options.css.root);
		console.log("Loaded dash(): ", dash, dash.options)

		_.each(this.options.qbs, function(conf, dash_id) {
			conf.id = conf.id || "qbd_"+dash_id
			conf.el = dash._createContainerElement(conf)
			$el.append( conf.el );
			conf.el.addClass(dash.options.css.dash);
			if (conf.header) {
				conf.el.append( $("<div/>").addClass(dash.options.css.header).html(conf.header) )
			}

			console.log("Dashboard: ", dash_id, conf.id, conf.url, conf)
			var responseAccessor = conf.responseAccessor || dash.options.responseAccessor
			var responseType = conf.responseType || "json"

			// ask the data source
			if (conf.url && d3[responseType]) {
				// TODO: optimise re-use of data sources
				d3[responseType](conf.url, function(response) {
					var data = responseAccessor?responseAccessor(response):response
					console.log("Loaded data: ", conf.id, data)

					// register() and load() data into qb(), finally .. render()
					var _qb = dash.register.qb(conf.id, conf)
					_qb.load(data)

					// draw all configured charts
					_.each(conf.charts, function(chart_conf, chart_id) {
						chart_conf.id = chart_conf.id || "qbd-"+dash_id+"_"+chart_id
						chart_conf.el = dash._createContainerElement(chart_conf);
						chart_conf.el.addClass(dash.options.css.chart);
						conf.el.append( chart_conf.el )
						var chart = _qb.draw(chart_conf.type, chart_conf)
						if (conf.filters && _.isString(chart_conf.dimension)) {
							var filters = conf.filters[chart_conf.dimension];
							_.each(filters, function(filter) {
								chart.filter(filter)
							})
							console.log("preset-filter: ", chart_conf.id, filters)
						}
					})
					_qb.render()
				})
			}

		});
		return this;
	},
	qb: function(qb_id) {
 		if (!qb_id) throw "dash:qb:anonymous"
		var dash_qb = dash._qbs[qb_id]
 		if (!dash_qb) throw "dash:qb:missing#"+qb_id
 		return dash_qb
 	},
 	register: {
		qb: function(qb_id, dash_conf) {
			if (!qb_id) throw "dash:register:qb:missing:id"
			if (!dash_conf) throw "dash:register:qb:missing:config"
			dash._qbs[qb_id] = qb(dash_conf)

			// safely get our new qb()
			var _qb = dash.qb(qb_id)
			console.log("registered qb(): ", qb_id, _qb)

			// global labels
			_.each(dash.options.labels, function(labels, label_id) {
				_qb.register.labels(label_id, labels)
			})
			return _qb
		},
	},

	chart : function(qb_id, type, slice, lazy) {
		var _qb = dash.qb(qb_id)
		var chart = _qb.draw(type, slice, lazy)
console.log("dash chart()", chart, qb_id, _qb, type, slice, lazy)
		return chart;
	},

	render: function() {
		_.each(dash._qbs, function(_qb) {
			_qb.reset();
		});
	},

	_renderQBs: function(el) {
		$("[data-qb]",$(el)).each(function() {
			var slice = $(this).data();
			var qb_id = slice.qb;
			var dash_qb = dash.qb(qb_id)
			if (dash_qb&&slice.type&&slice.measure&&slice.dimension) {
				slice.el = $(this)
				dash_qb.draw(slice.type, slice);
			}
		});
		return this;
	},

	_createContainerElement: function(conf) {
		var $el = conf.el && $(conf.el);
		if (!$el || !$el.length) {
			$el = $("<div/>");
			conf.id && $el.attr("id", conf.id)
		}

		return $el;
	}
});
return function(options) { console.log("New dash:", dc, dash, options); return dash.init(options) }

});
