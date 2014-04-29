(function(ajd, undefined) {
    ajd.baseCalendarFormatter = function(days, daysLong) {
        var that = {};
        var defaultDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
        var defaultDaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];

        that.days = days || defaultDays;
        that.daysLong = daysLong || days || defaultDaysLong;
        
        that.formatDisplayYear = function (year, eraPlacement, always) { return year.toString(); };
        that.formatDisplayMonth = function (month, isLeapYear, long) { return month.toString(); };
        that.formatDisplayWeekday = function (weekday, long) { 
            if (long) {
                return that.daysLong[weekday];
            }
            return that.days[weekday]; 
        };
        
        that.getDisplayWeekdays = function(long) {
            var daysArray = (long) ? that.daysLong : that.days;
            var result = [];
            for (var i = 0; i< daysArray.length; i++) {
                result.push( { number: i,  day: daysArray[i] } );
            }
            return result;
        };

        that.zeroPad = function(num, places, negSymbol, posSymbol) {
            negSymbol = negSymbol || "-";
            posSymbol = posSymbol || "";
            num = num || 0;
            var neg = num < 0,
                s = "000000000" + Math.abs(num),
                result = ((neg) ? negSymbol : posSymbol) + s.substr(s.length - places);
            return result;
        };

        that.utcString = function(minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;
            var hoursPart = ajd.toInt(minutesWestUtc / 60),
                minutesPart = ajd.toInt(minutesWestUtc % 60),
                sign = (minutesWestUtc < 0) ? "+" : "-",
                tz = (minutesWestUtc === 0) ? "UTC" : "UTC" + sign + that.zeroPad(hoursPart, 2, 1) + that.zeroPad(minutesPart, 2);
            return tz;
        };

        that.toString = function (dateParts) {
            var year = that.formatDisplayYear(dateParts.year, "before", false),
                tz = that.utcString(dateParts.minutesWestUtc),
                result = that.formatDisplayWeekday(dateParts.weekday) + " " +
                         year + "-" + that.zeroPad(dateParts.month, 2) + "-" + that.zeroPad(dateParts.day, 2) + " " +
                         that.zeroPad(dateParts.hour, 2) + ":" + 
                         that.zeroPad(dateParts.minute, 2) + ":" + 
                         that.zeroPad(dateParts.second, 2);

            if (dateParts.millisecond > 0) {
                result = result + "." + that.zeroPad(dateParts.millisecond, 3);
            }

            result = result + " " + tz;
            return result;
        };

        that.toLongString = function (dateParts) {
            var year = that.formatDisplayYear(dateParts.year, "after", false),
                tz = that.utcString(dateParts.minutesWestUtc),
                result = that.formatDisplayWeekday(dateParts.weekday, true) + ", " +
                         that.formatDisplayMonth(dateParts.month, dateParts.isLeapYear, true) + " " +
                         that.zeroPad(dateParts.day, 2) + ", " + year + " " +
                         that.zeroPad(dateParts.hour, 2) + ":" + that.zeroPad(dateParts.minute, 2) + ":" +
                         that.zeroPad(dateParts.second, 2);

            if (dateParts.millisecond > 0) {
                result = result + "." + that.zeroPad(dateParts.millisecond, 3);
            }

            result = result + " " + tz;
            return result;
        };

        return that;
    };

    ajd.luniSolarCalendarFormatterBase = function(months, monthsLong, monthsLeap, monthsLeapLong, days, daysLong) {
        var defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var defaultMonthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 
                                 'October', 'November', 'December'];

        var that = ajd.baseCalendarFormatter(days, daysLong);
        
        that.months = months || defaultMonths;
        that.monthsLong = monthsLong || months || defaultMonthsLong;
        that.monthsLeap = monthsLeap || that.months;
        that.monthsLeapLong = monthsLeapLong || that.monthsLong;

        that.getDisplayMonths = function(isLeapYear, long) {
            var monthArray = [];
            if (isLeapYear) {
                monthArray = (long) ? that.monthsLong : that.months;
            } else {
                monthArray = (long) ? that.monthsLeapLong : that.monthsLeap;
            }
            var result = [];
            for (var i = 0; i < monthArray.length; i++) {
                result.push( { number: i + 1, name: monthArray[i] } );
            }
            return monthArray;
        };
            

        that.formatDisplayMonth = function (month, isLeapYear, long) {
            if (isLeapYear) {
                return (long) ? that.monthsLeapLong[month - 1] : that.monthsLeap[month - 1];
            } 
            return (long) ? that.monthsLong[month - 1] : that.months[month - 1];
        };
        
        return that;
    };
    
    ajd.gregorianFormatter = function() {
        var that = ajd.luniSolarCalendarFormatterBase();
            
        that.formatDisplayYear = function (year, eraPlacement, always) {
            var isBCE = (year < 1),
                era = (isBCE ? "BCE" : (always ? "CE" : "")),
                yearString = (isBCE) ? (-(year - 1)).toString() : year.toString();

            eraPlacement = (eraPlacement && eraPlacement.toLowerCase()) || "none";

            switch (eraPlacement) {
            case "before":
                if (era) {
                    yearString = era + " " + yearString;
                }
                break;
            case "after":
                if (era) {
                    yearString = yearString + " " + era;
                }
                break;
            }

            return yearString;
        };

        return that;
    };

    ajd.hebrewFormatter = function() {
        var months12 = ['Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul', 'Tishrei',
                        'Cheshvan', 'Kislev', 'Tevet', 'Sh\'vat', 'Adar'];
        var months13 = ['Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul', 'Tishrei',
                        'Cheshvan', 'Kislev', 'Tevet', 'Sh\'vat', 'Adar I', 'Adar II'];
        var days = ['Rishon', 'Sheni', 'Sh\'lishi', 'Revi\'i', 'Chamishi', 'Shishi', 'Shabbat'];
        var daysLong = ['Yom Rishon', 'Yom Sheni', 'Yom Sh\'lishi', 'Yom Revi\'i', 'Yom Chamishi', 'Yom Shishi', 'Yom Shabbat'];
        var that = ajd.luniSolarCalendarFormatterBase(months12, months12, months13, months13, days, daysLong);

        that.formatDisplayYear = function (year, eraPlacement, always) {
            eraPlacement = (eraPlacement && eraPlacement.toLowerCase()) || "none";
            var yearString = year.toString();

            switch (eraPlacement) {
            case "before":
                yearString = "AM " + yearString;
                break;
            case "after":
                yearString = yearString + " AM";
                break;
            }

            return yearString;
        };

        that.formatDisplayWeekday = function (weekday, long) {
            if (long) {
                return that.daysLong[weekday];
            }
            return that.days[weekday];
        };

        return that;
    };
    
    ajd.hebrewTraditionalFormatter = function() {
        var that = ajd.hebrewFormatter();
        
        that.toString = function (dateParts) {
            var year = that.formatDisplayYear(dateParts.year, "before", false),
                tz = that.utcString(dateParts.minutesWestUtc),
                result = that.formatDisplayWeekday(dateParts.weekday) + " " +
                         year + "-" + that.zeroPad(dateParts.month, 2) + "-" + that.zeroPad(dateParts.day, 2) + " " +
                         dateParts.hour + " h " + 
                         dateParts.parts + " p";
    
            result = result + " " + tz;
            return result;
        };

        that.toLongString = function (dateParts) {
            var year = that.formatDisplayYear(dateParts.year, "after", false),
                tz = that.utcString(dateParts.minutesWestUtc),
                result = that.formatDisplayWeekday(dateParts.weekday, true) + ", " +
                         that.formatDisplayMonth(dateParts.month, dateParts.isLeapYear, true) + " " +
                         that.zeroPad(dateParts.day, 2) + ", " + year + " " +
                         dateParts.hour + " h " + 
                         dateParts.parts + " p";

            result = result + " " + tz;
            return result;
        };

        
        return that;
    };
    
    ajd.islamicFormatter = function() { 
        var months = ["Muḥarram", "Ṣafar", "Rabīʿ I", "Rabīʿ II", "Jumādā I", "Jumādā II", "Rajab", "Shaʿbān",
                     "Ramaḍān", "Shawwāl", "Dhū al-Qaʿda", "Dhū al-Ḥijja"];
        var days = ["al-'ahad", "al-'ithnayn", "ath-thalatha'", "al-'arb`a'",
                        "al-khamis", "al-jum`a", "as-sabt"];
        var daysLong = ["yawm al-'ahad", "yawm al-'ithnayn", "yawm ath-thalatha'", "yawm al-'arb`a'",
                        "yawm al-khamis", "yawm al-jum`a", "yawm as-sabt"];

        var that = ajd.luniSolarCalendarFormatterBase(months, months, months, months, days, daysLong);

        that.formatDisplayYear = function (year, eraPlacement, always) {
            eraPlacement = (eraPlacement && eraPlacement.toLowerCase()) || "none";
            var yearString = year.toString();

            switch(eraPlacement) {
            case "before":
                    yearString = "AH " + yearString;
                    break;
            case "after":
                    yearString = yearString + " AH";
                    break;
            }

            return yearString;
        };

        return that;
    };


    ajd.mayanLongCountFormatter = function() {
        var that = ajd.baseCalendarFormatter();

        that.toString = function(dateParts) {
            return dateParts.baktun + "." + dateParts.katun + "." + dateParts.tun + "." + dateParts.uinal + "." + dateParts.kin;
        };

        that.toLongString = function(dateParts) {
            return dateParts.baktun + "." + dateParts.katun + "." + dateParts.tun + "." + dateParts.uinal + "." + dateParts.kin;
        };

        return that;
    };
    
})(window.ajd = window.ajd || {});