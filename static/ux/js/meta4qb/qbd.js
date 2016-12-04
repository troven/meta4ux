define(["jquery", "underscore", "backbone", "marionette", "colorbrewer", "dc", "d3", "qb"],
	function ($,_,Backbone, Marionette, colorbrewer, dc, d3, qb) {

var qbd = {}
_.extend(qbd, {
	options: { el: "body", responseType: "json",
		css: { 	root: "qb-main ", qbd: "qbd ",
				header: "qb-header", chart: "qb-chart", empty: "qb-empty" }
	}, _qbd: {},

	init: function(options) {
		_.extend(qbd.options,options);

		qbd.$el = qbd.options.el = qbd._createContainerElement(qbd.options)
		qbd.$el.addClass(qbd.options.css.root);
console.log("Loaded qbd(): %o %o %o", qbd, qbd.$el, qbd.options)

		this.options.qbd && qbd.loadAll(this.options.qbd)
		return this;
	},
	qb: function(qb_id) {
 		if (!qb_id) throw "qbd:qb:missing-id"
		var qbd_qb = qbd._qbd[qb_id]
 		if (!qbd_qb) throw "qbd:qb:missing#"+qb_id
 		return qbd_qb
 	},
	loadAll: function(dashes) {
		_.each(dashes, function(conf, qbd_id) {
			conf.id = conf.id || "qbd_"+qbd_id
			qbd.show(conf)
		});
	},
 	register: {
		qb: function(qb_id, qbd_conf) {
			if (!qb_id) throw "qbd:register:qb:missing:id"
			if (!qbd_conf) throw "qbd:register:qb:missing:config"
			qbd._qbd[qb_id] = qb(qbd_conf)

			// safely get our new qb()
			var _qb = qbd.qb(qb_id)
console.log("registered qb(): ", qb_id, _qb, qbd_conf)

			// global labels
			_.each(qbd.options.labels, function(labels, label_id) {
				_qb.register.labels(label_id, labels)
			})
			return _qb
		},
	},

	show: function(conf, params) {
		qbd._drawHeader(conf);

console.log("Dashboard: ", conf.id, conf)
		var responseAccessor = conf.responseAccessor || qbd.options.responseAccessor
		var responseType = conf.responseType || qbd.options.responseType || "json"

		if (_.isString(responseAccessor)) responseAccessor = qbd.responseFormat[responseAccessor]

		var url = conf.url+"?"

		_.each(params, function(v,k) {
			url+=k+"="+encodeURIComponent(v)+"&"
		})
		url = url.substring(0,url.length-1)

		// ask the data source
		if (conf.url && d3[responseType]) {
			// TODO: optimise re-use of data sources
console.log("Loading QB %s data: %s", responseType, url)
			d3[responseType](url, function(response) {
console.log("Loaded QB data: %s %o %o", conf.id, conf, response)
				var data = responseAccessor?responseAccessor(response):response
				// register() and load() data into qb(), finally .. render()
				qbd.register.qb(conf.id, conf)
				var _qb = qbd.qb(conf.id);
				if ( (!data || !data.length) && conf.empty) {
					qbd.drawEmpty(conf);
				} else {
					_qb.load(data)
					qbd.draw(conf, data);
					_qb.render()
				}
			})
		}

	},

	draw: function(conf) {
		conf.el = $(conf.el || qbd.options.el )
		// draw all configured charts, including container elements
		// attach them to the conf.el
		var self = this
		var _qb = qbd.qb(conf.id)
		_.each(conf.charts, function(chart_conf, chart_id) {
//			self.drawChart(chart_conf, conf.el)

			var chart = _qb.draw(chart_conf.type, chart_conf)
			if (conf.filters) {
				chart.filter(null)
				var filters = conf.filters[chart_conf.dimension]
				_.each(filters, function(filter) {
					filter && chart.filter(filter)
				})
console.log("preset-filter: ", chart_conf.id, filters)
			}
//			chart.$el.addClass(qbd.options.css.qbd);
//		$el && $el.append( conf.el )
		})
		return qbd;
	},

	drawEmpty: function(conf) {
		conf.el = $(conf.el || qbd.options.el )
		conf.el.addClass(qbd.options.css.empty);
console.log("drawEmpty: %o", conf)

		var $panel = $("<div/>").html(conf.empty.template)
		conf.el.append( $panel )
	},
	drawChart: function(conf) {
		conf.el = qbd._createContainerElement(conf)
		conf.el.addClass(qbd.options.css.chart)
		conf.height && conf.el.height(conf.height+64)
		conf.width && conf.el.width(conf.width+16)
		return qbd;
	},

	chart : function(qb_id, type, slice, lazy) {
		var _qb = qbd.qb(qb_id)
		var chart = _qb.draw(type, slice, lazy)
console.log("qbd chart()", chart, qb_id, _qb, type, slice, lazy)
		return chart;
	},

	render: function() {
		_.each(qbd._qbd, function(_qb) {
			_qb.reset();
		});
	},

	_drawHeader: function(conf) {
		conf.el = qbd._createContainerElement(conf)
		qbd.$el.append( conf.el );
		conf.el.addClass(qbd.options.css.qbd);
		if (conf.header) {
			var $panel = $("<div/>").addClass(qbd.options.css.header || "header").html(conf.header)
			conf.el.append( $panel )
		}
		return qbd;
	},

	_renderQBs: function(el) {
		$("[data-qb]",$(el)).each(function() {
			var slice = $(this).data();
			var qb_id = slice.qb;
			var qbd_qb = qbd.qb(qb_id)
			if (qbd_qb&&slice.type&&slice.measure&&slice.dimension) {
				slice.el = $(this)
				qbd_qb.draw(slice.type, slice);
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
	},

	responseFormat: {
		"scorpio4": function(r) { return r.result },
		"data.gov.au": function(r) { return r.result.records }
	}
});
return function(options) { console.log("New qbd:", dc, qbd, options); return qbd.init(options) }

});
