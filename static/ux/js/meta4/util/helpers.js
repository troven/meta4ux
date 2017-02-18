define(["underscore"], function (_) {

    Date.prototype.getToday = function() {
        var today = new Date(this.valueOf());
        today.setHours(0, 0, 0, 0);
        return today;
    }

    Date.prototype.addDays = function(days) {
        var dat = new Date(this.valueOf());
        dat.setDate(dat.getDate() + days);
        return dat;
    };

    Date.prototype.isToday = function(when) {
        when = when || new Date();
        var today = new Date(when.valueOf());
        return today.toDateString() == this.toDateString();
    }

    Date.prototype.isBefore = Date.prototype.isPast = function(when) {
        when = when || new Date();
        var today = new Date(when.valueOf());
        today.setHours(0,0,0,0);
        var is_past = this.getTime()<today.getTime();
        return is_past;
    }

    Date.prototype.isAfter = Date.prototype.isFuture = function(when) {
        when = when || new Date();
        var today = new Date(when.valueOf());
        today.setHours(23,59,59,999);
        return ( this.getTime()>today.getTime() );
    }

});
