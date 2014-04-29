(function(ajd, undefined) {
    "use strict";

    var JAVASCRIPT_EPOCH = 2440587.5;
    ajd.calendars = ajd.calendars || {};

    ajd.addOrReplaceCalendar = function(calendarName, calendarFunction) {
        ajd.calendars[calendarName] = calendarFunction;
    };
    
    ajd.date = function(dt) {
        var that = {};
        
        // construction of ajd - produce the julian value for the passed in data
        // - null or undefined means to produce a "now" value
        // - any number is assumed to be an astronimical julian date
        // - a JS date object produces the moment for that date
        // - any object is assumed to be a structure of the type produced by the
        //   to function (e.g. to("gregorian", 0)), and that it has a calendar
        //   property which is the name of the calendar that can convert the
        //   date to a moment
        // - if nothing works out leave moment undefined
        if (dt === null || typeof dt === "undefined") {
            that.moment = (Date.now() / 8.64e+07) + JAVASCRIPT_EPOCH;
        } else if (Object.prototype.toString.call(dt) === '[object Date]') {
            that.moment = (dt.getTime() / 8.64e+07) + JAVASCRIPT_EPOCH;
        } else if (typeof dt === "number") {
            that.moment = dt;
        } else if (typeof dt === "object") {
            if (dt.calendar === "ajd") {
                that.moment = dt.moment;
            } else {
                var calendar = ajd.calendars[dt.calendar];
                if (calendar !== null) {
                    that.moment = calendar.toMoment(dt);
                }
            }
        }
        
        that.calendarName = "ajd";
        that.to = function(calendarName, minutesWestUtc) {
            calendarName = (calendarName || "");
            if (calendarName == "js") {
                var offset = new Date().getTimezoneOffset();
                minutesWestUtc = minutesWestUtc || offset;
                minutesWestUtc -= offset;
                var jsTime = this.moment - JAVASCRIPT_EPOCH + 
                    (minutesWestUtc / 1440);
                jsTime = Math.floor(jsTime * 8.64e+07 + 0.5);
                return new Date(jsTime);
            } else if (calendarName === "ajd") {
                minutesWestUtc = minutesWestUtc || 0;
                return {
                    calendarName: "ajd",
                    moment: this.moment + (minutesWestUtc / 1440),
                    to: this.to
                };
            }
            minutesWestUtc = minutesWestUtc || 0;
            return ajd.calendars[calendarName].fromMoment(this.moment,
                                                          minutesWestUtc);
        };
        return that;
    };

})(window.ajd = window.ajd || {});
