define(["jquery", "underscore", "core", "ux", "full_calendar"], function ($,_, meta4, ux, full_calendar) {

        var idAttribute = ux.idAttribute || "id";
        var labelAttribute = ux.labelAttribute || "label";

        ux.view.Calendar = ux.view["meta4:ux:Calendar"] = function(options) {
		options = ux.checkOptions(options)
		var DEBUG = true;
		options = _.extend({selectable: true, ignoreTimezone: false, editable: true }, options)

		var Calendar = Backbone.Marionette.ItemView.extend({
			template: "<label data-id='{{id}}'>{{label}}</label>",
			className: "ux_widget",
			initialize: function(options) {
				ux.initialize(this, options)

                this.options.options  = _.extend({
                    header: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'month,basicWeek,basicDay'
                    },
                    selectable: options.selectable,
                    selectHelper: true,
                    editable: options.editable===false?false:true,
                    ignoreTimezone: options.ignoreTimezone,
                    select: meta4.dispatch(this, 'onSelectDateRange'),
                    dayClick: meta4.dispatch(this, 'onDayClickEvent'),
                    eventClick: meta4.dispatch(this, 'onSelectEvent'),
                    eventDrop: meta4.dispatch(this, 'onDropEvent'),
                    eventResize: meta4.dispatch(this, 'onResizeEvent'),
                },  this.options.options)

                this.options.remap = _.extend({
                    	"id": "id",
                    	"label": "title",
                    	"_event_start": "start",
                    	"_event_end": "end",
                    	"dueDate": function(v,k,l) {
							l.start = l.start || v || new Date()
                    	}
				},this.options.remap)

				this.collection.bind('reset', this.render)
				this.collection.bind('add', this.onAddModel)
//				this.collection.bind('change', this.onChange)
				this.collection.bind('destroy', this.onDestroy)
			},
			render: function() {
				this.options.options.events = this.toEvents()
				this.$el.fullCalendar(this.options.options)
			},
			onShow: function() {
				this.$el.fullCalendar('today')
			},
			toEvents: function() {
			    var remap = this.options.remap
				var events = []
			    this.collection.each(function(v,k,l) {
					events.push( meta4.remap(v.attributes,remap) )
			    })
				return events
			},
			onAddModel: function(model) {
			    if (!this.$el || !model) return
			    var remap = this.options.remap
			    var event = meta4.remap(model.attributes,remap)
				this.$el.fullCalendar('renderEvent', event)
			},
			onSelectDateRange: function(startDate, endDate) {
console.log("onSelectDateRange: %o %o", startDate, endDate)
				var Event = Backbone.Model.extend()
				var model = new Event({start: startDate, end: endDate})
				Marionette.triggerMethod.call(this, "range:select", model)
			},
			onSelectEvent: function(fcEvent) {
console.log("onSelectEvent: %o", fcEvent)
				var model = this.collection.get(fcEvent.id)
				Marionette.triggerMethod.call(this, "select", model)
			},
			onDayClickEvent: function(now) {
console.log("onDayClickEvent: %o", now)
				Marionette.triggerMethod.call(this, "day:select", now)
			},
			onChange: function(event) {
console.log("onChange: %o", event)
			    if (!this.$el) return
			    var options = this.options.options
				// Look up the underlying event in the calendar and update its details from the model
				var fcEvent = this.$el.fullCalendar('clientEvents', event.get(idAttribute))[0];
				fcEvent.title = event.get(options.labelAttribute)
				fcEvent.color = event.get(options.colorAttribute)
				this.$el.fullCalendar('updateEvent', fcEvent)
			},
			onDropEvent: function(fcEvent) {
console.log("onDropEvent: %o", fcEvent)
				var model = this.collection.get(fcEvent.id)
				model.save( { _event_start: fcEvent.start, _event_end: fcEvent.end} )
				Marionette.triggerMethod.call(this, "drop", model)
			},
			onResizeEvent: function(fcEvent) {
console.log("onResizeEvent: %o", fcEvent)
				var model = this.collection.get(fcEvent.id)
				model.save( { _event_start: fcEvent.start, _event_end: fcEvent.end} )
				Marionette.triggerMethod.call(this, "resize", model)
			},
			onDestroy: function() {
			    if (!this.$el) return
				this.$el.fullCalendar('removeEvents')
			}

		})
		return Calendar;
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Calendar",
        "label": "Calendar",
        "comment": "A widget that shows a collection of events grouped by date (day, week, month or year)",

        "triggers": [ "action", "select" ],
        "mixins": [ "isSelectable", "isActionable" ],
        "collection": true,
        "options": true,

        "fn": ux.view.Calendar
    }
})

