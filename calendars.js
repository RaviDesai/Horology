(function(ajd, undefined) {
    ajd.calendars = {};

    function makeDelegateFunction(delegate, functionName, obj) {
        return function() {
            return delegate[functionName](obj);
        };
    }

    function clearToFunctionsCreatedByFormatter(formatter, date) {
        for (var prop in formatter) {
            if (formatter.hasOwnProperty(prop) && prop.slice(0, 2) == "to") {
                if (typeof date[prop] == "function") {
                    delete date[prop];
                }
            }
        }
    }
    
    function copyToFunctionsFromFormatter(formatter, date) {
        date.clearToFunctionsCreatedByFormatter = function () { 
            clearToFunctionsCreatedByFormatter(formatter, date);
        };
        for (var prop in formatter) {
            if (formatter.hasOwnProperty(prop) && prop.slice(0, 2) == "to") {
                if (typeof formatter[prop] == "function") {
                    date[prop] = makeDelegateFunction(formatter, prop, date);
                }
            }
        }
    }

    function calculateTimeOfDay(time, result) {
        var subms = (1 / 172800000);

        time = time * 24;
        subms = subms * 24;
        result.hour = ajd.toInt(time + subms);
        time -= result.hour;
        if (ajd.toInt(time) !== ajd.toInt((time + subms))) {
            subms = 0;
        }

        time = time * 60;
        subms = subms * 60;
        result.minute = ajd.toInt(time + subms);
        time -= result.minute;
        if (ajd.toInt(time) !== ajd.toInt(time + subms)) {
            subms = 0;
        }

        time = time * 60;
        subms = subms * 60;
        result.second = ajd.toInt(time + subms);
        time -= result.second;
        if (ajd.toInt(time) !== ajd.toInt(time + subms)) {
            subms = 0;
        }

        time = time * 1000;
        subms = subms * 1000;
        result.millisecond = ajd.toInt(time + subms);
    }
    ajd.calculateTimeOfDay = calculateTimeOfDay;

    function calculateHebrewTimeOfDay(time, result) {
        "use strict";
        
        var subms = (0.5 / 86400000);

        time = time * 24;
        subms = subms * 24;
        result.hour = ajd.toInt(time + subms);
        if (ajd.toInt(time) !== ajd.toInt((time + subms))) {
            time -= ajd.toInt(time + subms);
            subms = 0;
        } else {
            time -= ajd.toInt(time + subms);
        }
        
        time = time * 1080;
        subms = subms * 1080;
        result.parts = ajd.toInt(time + subms);
    }
    ajd.calculateHebrewTimeOfDay = calculateHebrewTimeOfDay;
    
    function addCalendarWeeks(month) {
        var result = [];
        var lastDay = month.numberDays + month.startingWeekday;
        var neededFullWeeks = Math.floor(lastDay / 7);
        var neededPartialWeeks = (lastDay % 7 > 0) ? 1 : 0;
        var neededWeeks = neededFullWeeks + neededPartialWeeks;
        var currentMoment = month.startingMoment;
        var currentDay = 1;
        for (var weekNo = 0; weekNo < neededWeeks; weekNo += 1) {
            var currentWeek = { days: [] };
            for (var dayNo = 0; dayNo < 7; dayNo += 1) {
                if ((weekNo === 0 && dayNo < month.startingWeekday) || (currentDay > month.numberDays)) {
                    currentWeek.days.push({ dayNumber: null, moment: null });
                } else {
                    currentWeek.days.push({ dayNumber: currentDay, moment: currentMoment });
                    currentDay += 1;
                    currentMoment += 1;
                }
            }
            result.push(currentWeek);
        }
        return result;
    }

    ajd.calendarDate = function(formatter, dateParts, timeOfDayCalculator) {
        "use strict";

        timeOfDayCalculator = timeOfDayCalculator || calculateTimeOfDay;
        
        var that = dateParts;

        timeOfDayCalculator(dateParts.fraction || 0, that);
        copyToFunctionsFromFormatter(formatter, that);
        
        that.replaceFormatter = function(formatter) {
            this.clearToFunctionsCreatedByFormatter();
            copyToFunctionsFromFormatter(formatter, this);
        };
    
        return that;
    };
    
    ajd.baseCalendar = function(calendarName, formatter) {
        "use strict";

        var that = {};
        that.calendarName = calendarName;
        that.formatter = formatter;

        that.timeOfDayFromDateParts = function(dateParts, startOfDay) {
            var timeOfDay = ((dateParts.hour || 0) / 24) +
                ((dateParts.minute || 0) / (24 * 60)) +
                ((dateParts.second || 0) / (24 * 60 * 60)) +
                ((dateParts.millisecond || 0) / (24 * 60 * 60 * 1000)) +
                ((dateParts.minutesWestUtc || 0) / 1440);

            if ((!startOfDay) || timeOfDay < startOfDay) {
                return timeOfDay;
            }
            return timeOfDay - 1;
        };

        return that;
    };
    
    // Julian/Gregorian Base class
    // Possible since both calendars use same days and months, vary only on calculation of leap year.
    ajd.julianGregorianBase = function(calendarName, formatter) {
        "use strict";
        
        var that = ajd.baseCalendar(calendarName, formatter);

        that.calendarMonth = function(year, month, minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;
            var isLeapYear = that.isLeapYear(year);
            var date = { calendar: that.calendarName, year: year, month: month, day: 1, minutesWestUtc: minutesWestUtc };
            var result = { calendar: that.calendarName, year: year, month: month, minutesWestUtc: minutesWestUtc };
            result.formattedYear = that.formatter.formatDisplayYear(year, "after", false);
            result.startingMoment = that.toMoment(date);
            var numberDays = 31;
            if (month === 2)
            {
                numberDays = (isLeapYear) ? 29 : 28;
            } else if (month == 9 || month == 4 || month == 6 || month == 11) {
                numberDays = 30;
            }
            result.numberDays = numberDays;
            result.startingWeekday = (ajd.toInt(result.startingMoment + 0.5) + 1) % 7;
            result.name = that.formatter.formatDisplayMonth(result.month, isLeapYear, false);
            result.longName = that.formatter.formatDisplayMonth(result.month, isLeapYear, true);
            result.weeks = addCalendarWeeks(result);
            return result;
        };
        
        that.calendarYear = function(year, minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;
            var date = { calendar: that.calendarName, year: year, month: 1, day: 1, minutesWestUtc: minutesWestUtc };
            var result = { calendar: that.calendarName, year: year, isLeapYear: that.isLeapYear(year), minutesWestUtc: minutesWestUtc };
            result.formattedYear = that.formatter.formatDisplayYear(year, "after", false);
            result.startingMoment = that.toMoment(date);
            result.numberDays = (result.isLeapYear) ? 366 : 365;
            result.startingWeekday = (ajd.toInt(result.startingMoment + 0.5) + 1) % 7;
            result.months = [];
            for (var index = 0; index < 12; index +=1 ) {
                var month = that.calendarMonth(year, index + 1, minutesWestUtc);
                result.months.push( month );
            }
            result.weekdays = that.formatter.days;
            result.weekdaysLong = that.formatter.daysLong;
            return result;
        };
        
        return that;
    };
    
    // Gregorian Calendar
    var gregorian = function(formatter) {
        "use strict";

        var that = ajd.julianGregorianBase("gregorian", formatter),
            GREGORIAN_EPOCH = 1721425.5,
            y = 4716,
            v = 3,
            j = 1401,
            u = 5,
            m = 2,
            s = 153,
            n = 12,
            w = 2,
            r = 4,
            B = 274277,
            p = 1461,
            C = -38;

        function isLeapYear(year) {
            return (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0));
        }
        that.isLeapYear = isLeapYear;

        that.toMoment = function(dateParts) {
            var result = (GREGORIAN_EPOCH - 1) +
                (365 * (dateParts.year - 1)) +
                Math.floor((dateParts.year - 1) / 4) +
                (-Math.floor((dateParts.year - 1) / 100)) +
                Math.floor((dateParts.year - 1) / 400) +
                Math.floor((((367 * dateParts.month) - 362) / 12) +
                           ((dateParts.month <= 2) ? 0 : (isLeapYear(dateParts.year) ? -1 : -2)) + dateParts.day);

            result += that.timeOfDayFromDateParts(dateParts, 0);
            return result;
        };

        that.fromMoment = function(moment, minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;

            var result = {},
                time,
                adjJulian = moment - (minutesWestUtc / 1440),
                J = ajd.toInt(adjJulian + 0.5),
                f = (J + j) + (ajd.toInt((ajd.toInt((4 * J + B) / 146097) * 3) / 4)) + C,
                e = r * f + v,
                g = ajd.toInt((e % p) / r),
                h = u * g + w;

            time = adjJulian + 0.5;

            result.day = (ajd.toInt((h % s) / u)) + 1;
            result.month = ((ajd.toInt(h / s) + m) % n) + 1;
            result.year = ajd.toInt(e / p) - y + ajd.toInt(((n + m - result.month) / n));
            result.weekday = (J + 1) % 7;
            result.fraction = time - ajd.toInt(time);
            result.minutesWestUtc = minutesWestUtc;
            result.isLeapYear = isLeapYear(result.year);
            result.calendar = that.calendarName;

            return ajd.calendarDate(formatter, result);
        };
        
        // computus - corrected Gauss
        that.easter = function(year) {
            var Y = year;
            var C = Math.floor(Y/100);
            var N = Y - 19*Math.floor(Y/19);
            var K = Math.floor((C - 17)/25);
            var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
            I = I - 30*Math.floor((I/30));
            I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
            var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
            J = J - 7*Math.floor(J/7);
            var L = I - J;
            var M = 3 + Math.floor((L + 40)/44);
            var D = L + 28 - 31*Math.floor(M/4);

            var result = { calendar: "gregorian", year: Y, month: M, day: D, isLeapYear: isLeapYear(Y), weekday: 0 };
            return ajd.calendarDate(formatter, result);
        };
        

        return that;
    };
    ajd.calendars.gregorian = gregorian(ajd.gregorianFormatter());

    // Julian calendar
    var julian = function(formatter) {
        "use strict";

        var that = ajd.julianGregorianBase("julian", formatter),
            JULIAN_EPOCH = 1721423.5;

        function isLeapYear(year) {
            return ajd.mod(year, 4) === ((year > 0) ? 0 : 3);
        }
        that.isLeapYear = isLeapYear;

        that.toMoment = function(dateParts) {
            var year = dateParts.year,
                month = dateParts.month,
                day = dateParts.day;

            /* Algorithm as given in Meeus, Astronomical Algorithms, Chapter 7, page 61 */
            if (month <= 2) {
                year -= 1;
                month += 12;
            }

            return ((Math.floor((365.25 * (year + 4716))) +
                    Math.floor((30.6001 * (month + 1))) +
                    day) - 1524.5) + that.timeOfDayFromDateParts(dateParts, 0);
        };

        that.fromMoment = function(moment, minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;

            var a, alpha, b, c, d, e,
                result = {},
                adjJulian = moment - (minutesWestUtc / 1440),
                z = ajd.toInt(adjJulian + 0.5),
                time = adjJulian + 0.5;

            a = z;
            b = a + 1524;
            c = ajd.toInt((b - 122.1) / 365.25);
            d = ajd.toInt(365.25 * c);
            e = ajd.toInt((b - d) / 30.6001);

            result.month = ajd.toInt((e < 14) ? (e - 1) : (e - 13));
            result.year = ajd.toInt((result.month > 2) ? (c - 4716) : (c - 4715));
            result.day = b - d - ajd.toInt(30.6001 * e);
            result.minutesWestUtc = minutesWestUtc;
            result.weekday = (z + 1) % 7;
            result.fraction = time - ajd.toInt(time);
            result.isLeapYear = isLeapYear(result.year);
            result.calendar = that.calendarName;

            return ajd.calendarDate(formatter, result);
        };
        
        // eastern orthodox easter
        // http://www.tondering.dk/claus/cal/easter.php
        that.easter = function(year) {
            var G = ajd.mod(year, 19);
            var I = ajd.mod((19 * G ) +  15, 30);
            var J = ajd.mod(year +  Math.floor(year / 4) +  I, 7);
            var L = I - J;
            var EasterMonth = 3 + Math.floor((L + 40) / 44);
            var EasterDay = L + 28 - 31 * Math.floor(EasterMonth / 4);
            
            var result = { calendar: that.calendarName, year: year, month: EasterMonth, day: EasterDay, weekday: 0 };
            return ajd.calendarDate(formatter, result);
        };

        return that;
    };
    ajd.calendars.julian = julian(ajd.gregorianFormatter());

    // Hebrew Calendar
    var hebrew = function(formatter) {
        "use strict";

        var that = ajd.baseCalendar("hebrew", formatter);
        that.HEBREW_EPOCH = 347995.5;
        that.startingHour = 18;

        // https://www.fourmilab.ch/documents/calendar/
        function isLeapYear(year) {
            return ajd.mod(((year * 7) + 1), 19) < 7;
        }
        that.isLeapYear = isLeapYear;

        function hebrewYearMonths(year) {
            return isLeapYear(year) ? 13 : 12;
        }

        // Test for delay of start of new year and to avoid
        // Sunday, Wednesday, and Friday as start of the new year.
        // https://www.fourmilab.ch/documents/calendar/
        function hebrewDelay1(year) {
            var months, day, parts;

            months = Math.floor(((235 * year) - 234) / 19);
            parts = 12084 + (13753 * months);
            day = (months * 29) + Math.floor(parts / 25920);

            if (ajd.mod((3 * (day + 1)), 7) < 3) {
                day += 1;
            }
            return day;
        }

        // Check for delay in start of new year due to length of adjacent years
        // https://www.fourmilab.ch/documents/calendar/
        function hebrewDelay2(year) {
            var last, present, next;

            last = hebrewDelay1(year - 1);
            present = hebrewDelay1(year);
            next = hebrewDelay1(year + 1);

            return ((next - present) === 356) ? 2 :
                                             (((present - last) === 382) ? 1 : 0);
        }

        // https://www.fourmilab.ch/documents/calendar/
        function toJulianDayNumber(year, month, day) {
            var jdn, mon, months;

            months = hebrewYearMonths(year);
            jdn = that.HEBREW_EPOCH + hebrewDelay1(year) +
                 hebrewDelay2(year) + day + 1;

            if (month < 7) {
                for (mon = 7; mon <= months; mon += 1) {
                    jdn += hebrewMonthDays(year, mon);
                }
                for (mon = 1; mon < month; mon += 1) {
                    jdn += hebrewMonthDays(year, mon);
                }
            } else {
                for (mon = 7; mon < month; mon += 1) {
                    jdn += hebrewMonthDays(year, mon);
                }
            }

            return jdn;
        }
        that.toJulianDayNumber = toJulianDayNumber;

        // https://www.fourmilab.ch/documents/calendar/
        function hebrewYearDays(year) {
            return toJulianDayNumber(year + 1, 7, 1) - toJulianDayNumber(year, 7, 1);
        }

        // https://www.fourmilab.ch/documents/calendar/
        function hebrewMonthDays(year, month) {
            //  First of all, dispose of fixed-length 29 day months
            if (month === 2 || month === 4 || month === 6 || month === 10 || month === 13) {
                return 29;
            }

            //  If it's not a leap year, Adar has 29 days
            if (month === 12 && !isLeapYear(year)) {
                return 29;
            }

            //  If it's Heshvan, days depend on length of year
            if (month === 8 && ajd.mod(hebrewYearDays(year), 10) !== 5) {
                return 29;
            }

            //  Similarly, Kislev varies with the length of year
            if (month === 9 && (ajd.mod(hebrewYearDays(year), 10) === 3)) {
                return 29;
            }

            //  Nope, it's a 30 day month
            return 30;
        }
        that.hebrewMonthDays = hebrewMonthDays;

        that.toMoment = function(dateParts) {
            var result = toJulianDayNumber(dateParts.year, dateParts.month, dateParts.day) +
                that.timeOfDayFromDateParts(dateParts, that.startingHour / 24);
            return result;
        };

        that.fromMoment = function(moment, minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;

            var year, month, day, i, count, first, time, result,
                adjJulian = moment - (minutesWestUtc / 1440),
                J = ajd.toInt(adjJulian - 0.25),
                jd = J + 0.5;

            count = Math.floor(((jd - that.HEBREW_EPOCH) * 98496.0) / 35975351.0);
            year = count - 1;
            for (i = count; jd >= toJulianDayNumber(i, 7, 1); i += 1) {
                year += 1;
            }
            first = (jd < toJulianDayNumber(year, 1, 1)) ? 7 : 1;
            month = first;
            for (i = first; jd > toJulianDayNumber(year, i, hebrewMonthDays(year, i)); i += 1) {
                month += 1;
            }
            day = (jd - toJulianDayNumber(year, month, 1)) + 1;

            time = adjJulian + 0.5;
            result = {
                year : year,
                month: month,
                day : day,
                minutesWestUtc : minutesWestUtc,
                fraction : time - ajd.toInt(time),
                isLeapYear : isLeapYear(year),
                weekday : (J + 2) % 7,
                calendar : that.calendarName
            };

            return ajd.calendarDate(formatter, result);
        };
        
        that.calendarMonth = function(year, month, minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;
            var date = { calendar: that.calendarName, year: year, month: month, day: 1, 
                        hour: that.startingHour, minutesWestUtc: minutesWestUtc };
            var result = { calendar: that.calendarName, year: year, month: month, minutesWestUtc: minutesWestUtc };
            result.formattedYear = that.formatter.formatDisplayYear(year, "after", false);
            result.startingMoment = that.toMoment(date);
            result.numberDays = hebrewMonthDays(year, month);
            result.startingWeekday = (ajd.toInt(result.startingMoment - 0.25) + 2) % 7;
            result.name = that.formatter.formatDisplayMonth(result.month, isLeapYear, false);
            result.longName = that.formatter.formatDisplayMonth(result.month, isLeapYear, true);
            result.weeks = addCalendarWeeks(result);
            return result;
        };
        
        that.calendarYear = function(year, minutesWestUtc) { 
            minutesWestUtc = minutesWestUtc || 0;
            var date = { calendar: that.calendarName, year: year, month: 1, day: 1, 
                        hour: that.startingHour, minutesWestUtc: minutesWestUtc };
            var result = { calendar: that.calendarName, year: year, isLeapYear: isLeapYear(year), minutesWestUtc: minutesWestUtc };
            result.formattedYear = that.formatter.formatDisplayYear(year, "after", false);
            var momentInYear = that.toMoment(date);
            var monthsInThisYear = (isLeapYear(year)) ? 13 : 12;
            var index, month;
            result.startingMoment = momentInYear;
            result.startingWeekday = (ajd.toInt(result.startingMoment - 0.25) + 2) % 7;
            result.numberDays = hebrewYearDays(year);
            result.months = [];
            
            for (index = 6; index < monthsInThisYear; index += 1) {
                month = that.calendarMonth(year, index + 1, minutesWestUtc);
                result.months.push(month);
            }
            
            for (index = 0; index < 6; index += 1) {
                month = that.calendarMonth(year, index + 1, minutesWestUtc);
                result.months.push(month);
            }
            
            result.weekdays = that.formatter.days;
            result.weekdaysLong = that.formatter.daysLong;
            return result;
        };

        return that;
    };
    ajd.calendars.hebrew = hebrew(ajd.hebrewFormatter());

    // Hebrew Traditional (use hours, parts past sundown instead of HH:MM:SS)
    var hebrewTraditional = function(formatter) {
        "use strict";
        
        var that = hebrew(formatter);
        that.calendarName = "hebrewTraditional";
        that.startingHour = 0;
        
        that.timeOfDayFromDateParts = function(dateParts, startOfDay) {
            var timeOfDay = ((dateParts.hour || 0) / 24) +
                ((dateParts.parts || 0) / (25920)) - 0.25 + 
                ((dateParts.minutesWestUtc || 0) / 1440);

            return timeOfDay;
        };
        
        that.toMoment = function(dateParts) {
            var result = that.toJulianDayNumber(dateParts.year, dateParts.month, dateParts.day) +
                that.timeOfDayFromDateParts(dateParts, 0);
            return result;
        };

        that.fromMoment = function(moment, minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;

            var year, month, day, i, count, first, time, result,
                adjJulian = moment - (minutesWestUtc / 1440),
                J = ajd.toInt(adjJulian - 0.25),
                jd = J + 0.5;

            count = Math.floor(((jd - that.HEBREW_EPOCH) * 98496.0) / 35975351.0);
            year = count - 1;
            for (i = count; jd >= that.toJulianDayNumber(i, 7, 1); i += 1) {
                year += 1;
            }
            first = (jd < that.toJulianDayNumber(year, 1, 1)) ? 7 : 1;
            month = first;
            for (i = first; jd > that.toJulianDayNumber(year, i, that.hebrewMonthDays(year, i)); i += 1) {
                month += 1;
            }
            day = (jd - that.toJulianDayNumber(year, month, 1)) + 1;

            time = adjJulian - 0.25;
            result = {
                year : year,
                month: month,
                day : day,
                minutesWestUtc : minutesWestUtc,
                fraction : time - ajd.toInt(time),
                isLeapYear : that.isLeapYear(year),
                weekday : (J + 2) % 7,
                calendar : that.calendarName
            };

            return ajd.calendarDate(formatter, result, calculateHebrewTimeOfDay);
        };
        
        return that;
    };
    ajd.calendars.hebrewTraditional = hebrewTraditional(ajd.hebrewTraditionalFormatter());
    
    // Islamic calendar
    var islamic = function(formatter) {
        "use strict";

        var that = ajd.baseCalendar("islamic", formatter),
            ISLAMIC_EPOCH = 1948439.5;
        that.startingHour = 18;

         // https://www.fourmilab.ch/documents/calendar/
        function isLeapYear(year)
        {
            return (((year * 11) + 14) % 30) < 11;
        }
        that.isLeapYear = isLeapYear;

        // https://www.fourmilab.ch/documents/calendar/
        function toJulianDayNumber(year, month, day) {
            return (day +
                Math.ceil(29.5 * (month - 1)) +
                (year - 1) * 354 +
                Math.floor((3 + (11 * year)) / 30) +
                ISLAMIC_EPOCH) - 1;
        }

        that.toMoment = function(dateParts)
        {
            var result = toJulianDayNumber(dateParts.year, dateParts.month, dateParts.day);

            result += that.timeOfDayFromDateParts(dateParts, that.startingHour / 24);

            return result;
        };

        that.fromMoment = function(moment, minutesWestUtc)
        {
            var year, month, day, result, time, jd,
                J = ajd.toInt(moment - 0.25),
                adjJulian = moment - (minutesWestUtc / 1440);

            jd = J + 0.5;
            year = Math.floor(((30 * (jd - ISLAMIC_EPOCH)) + 10646) / 10631);
            month = Math.min(12,
                        Math.ceil((jd - (29 + toJulianDayNumber(year, 1, 1))) / 29.5) + 1);
            day = (jd - toJulianDayNumber(year, month, 1)) + 1;

            time = adjJulian + 0.5;
            result = {
                year: year,
                month: month, 
                day : day,
                isLeapYear: isLeapYear(year),
                fraction: time - ajd.toInt(time),
                weekday: (J + 2) % 7,
                minutesWestUtc: minutesWestUtc,
                calendar: that.calendarName
            };

            return ajd.calendarDate(formatter, result);
        };
        
        that.calendarMonth = function(year, month, minutesWestUtc) { 
            minutesWestUtc = minutesWestUtc || 0;
            var isLeapYear = that.isLeapYear(year);
            var date = { calendar: that.calendarName, year: year, month: month, day: 1, 
                        hour: that.startingHour, minutesWestUtc: minutesWestUtc };
            var result = { calendar: that.calendarName, year: year, month: month, minutesWestUtc: minutesWestUtc };
            result.formattedYear = that.formatter.formatDisplayYear(year, "after", false);
            result.startingMoment = that.toMoment(date);
            var numberDays = (month % 2 === 0) ? 29 : 30;
            if (month === 12 && isLeapYear)
            {
                numberDays += 1;
            } 
            result.numberDays = numberDays;
            result.startingWeekday = (ajd.toInt(result.startingMoment - 0.25) + 2) % 7;
            result.name = that.formatter.formatDisplayMonth(result.month, isLeapYear, false);
            result.longName = that.formatter.formatDisplayMonth(result.month, isLeapYear, true);
            result.weeks = addCalendarWeeks(result);
            return result;
        };
        
        that.calendarYear = function(year, minutesWestUtc) {
            minutesWestUtc = minutesWestUtc || 0;
            var date = { calendar: that.calendarName, year: year, month: 1, day: 1, 
                        hour: that.startingHour, minutesWestUtc: minutesWestUtc };
            var result = { calendar: that.calendarName, year: year, isLeapYear: that.isLeapYear(year), minutesWestUtc: minutesWestUtc };
            result.formattedYear = that.formatter.formatDisplayYear(year, "after", false);
            result.startingMoment = that.toMoment(date);
            result.numberDays = (result.isLeapYear) ? 355 : 354;
            result.startingWeekday = (ajd.toInt(result.startingMoment - 0.25) + 2) % 7;
            result.months = [];
            for (var index = 0; index < 12; index +=1 ) {
                var month = that.calendarMonth(year, index + 1, minutesWestUtc);
                result.months.push( month );
            }
            result.weekdays = that.formatter.days;
            result.weekdaysLong = that.formatter.daysLong;
            return result;
        };
        
        return that;
    };
    ajd.calendars.islamic = islamic(ajd.islamicFormatter());

    // Mayan Long Count (only from baktun)
    var mayanLongCount = function(formatter) {
        "use strict";

        var that = ajd.baseCalendar("mayanLongCount", formatter),
            MAYAN_COUNT_EPOCH = 584282.5;

        // https://www.fourmilab.ch/documents/calendar/
        function toJulianDayNumber(baktun, katun, tun, uinal, kin)
        {
            return MAYAN_COUNT_EPOCH +
                   (baktun * 144000) +
                   (katun  *   7200) +
                   (tun    *    360) +
                   (uinal  *     20) +
                   kin;
        }

        // https://www.fourmilab.ch/documents/calendar/
        that.toMoment = function(dateParts) {
            var result = toJulianDayNumber(dateParts.baktun, dateParts.katun, dateParts.tun, dateParts.uinal, dateParts.kin);
            result += that.timeOfDayFromDateParts(dateParts, 0);
            return result;
        };

        // https://www.fourmilab.ch/documents/calendar/
        that.fromMoment = function(moment, minutesWestUtc)
        {
            minutesWestUtc = minutesWestUtc || 0;

            var d, baktun, katun, tun, uinal, kin, time, jd, result,
                adjJulian = moment - (minutesWestUtc / 1440),
                J = ajd.toInt(moment);

            jd = J + 0.5;
            d = jd - MAYAN_COUNT_EPOCH;
            baktun = Math.floor(d / 144000);
            d = ajd.mod(d, 144000);
            katun = Math.floor(d / 7200);
            d = ajd.mod(d, 7200);
            tun = Math.floor(d / 360);
            d = ajd.mod(d, 360);
            uinal = Math.floor(d / 20);
            kin = ajd.mod(d, 20);

            time = adjJulian + 0.5;

            result = {
                baktun: baktun,
                katun: katun,
                tun: tun, 
                uinal: uinal,
                kin: kin,
                fraction: time - ajd.toInt(time),
                calendar: that.calendarName
            };

            return ajd.calendarDate(formatter, result);
        };

        return that;
    };
    ajd.calendars.mayanLongCount = mayanLongCount(ajd.mayanLongCountFormatter());

})(window.ajd = window.ajd || {});
