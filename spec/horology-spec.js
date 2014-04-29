describe("Test AJD", function () {
    "use strict";
    
    it("test ajd.date(0) short form", function () {
        var now = ajd.date(0).to("julian", 0);
        expect(now.toString()).toEqual("Mon BCE 4713-01-01 12:00:00 UTC");
    });
    
    it("test ajd.date(0) long form", function () {
        var now = ajd.date(0).to("julian", 0);
        expect(now.toLongString()).toEqual("Monday, January 01, 4713 BCE 12:00:00 UTC");
    });
    
    it("test construct with gregorian date", function () {
        var date1 = ajd.date({calendar: "gregorian", year: 2000, month: 7, day: 12,
                         hour: 15, minute: 30, second: 10, millisecond: 421, minutesWestUtc: 300}),
            date2 = ajd.date(date1.moment);
        
        expect(date1.to("gregorian", 300).toLongString()).toEqual("Wednesday, July 12, 2000 15:30:10.421 UTC-0500");
        expect(date1.to("gregorian", 300).toString()).toEqual(date2.to("gregorian", 300).toString());
    });
    
    it("test specific date conversion to hebrew and check weekday.", function () {
        var myDate = ajd.date(2456722.5);
        var heb = myDate.to("hebrew", 0);
        var greg = myDate.to("gregorian", 0);
        
        expect(greg.weekday).toEqual(4);
        expect(greg.toString()).toEqual("Thu 2014-03-06 00:00:00 UTC");
        expect(heb.toString()).toEqual("Chamishi AM 5774-13-04 00:00:00 UTC");
        
        myDate = ajd.date(2454349.222222222);
        heb = myDate.to("hebrew", 0);
        greg = myDate.to("gregorian", 0);
        
        expect(heb.weekday).toEqual(3);
        expect(heb.toString()).toEqual("Revi'i AM 5767-06-22 17:20:00 UTC");
        expect(greg.weekday).toEqual(3);
        expect(greg.toString()).toEqual("Wed 2007-09-05 17:20:00 UTC");
        
        myDate.moment += (1 / 24);
        heb = myDate.to("hebrew", 0);
        greg = myDate.to("gregorian", 0);
        
        expect(heb.weekday).toEqual(4);
        expect(heb.toString()).toEqual("Chamishi AM 5767-06-23 18:20:00 UTC");
        expect(greg.weekday).toEqual(3);
        expect(greg.toString()).toEqual("Wed 2007-09-05 18:20:00 UTC");
    });
    
    it("test hebrew day starts at 6:00pm ", function() {
        var myDate, heb, testDate;
        
        myDate = ajd.date(2454349.222222222);
        heb = myDate.to("hebrew", 0);
        expect(heb.toString()).toEqual("Revi'i AM 5767-06-22 17:20:00 UTC");
        
        myDate.moment += (1 / 24);
        
        heb = myDate.to("hebrew", 0);
        expect(heb.toString()).toEqual("Chamishi AM 5767-06-23 18:20:00 UTC");
        testDate = ajd.date(heb);
        expect(testDate.to("hebrew", 0).toString()).toEqual("Chamishi AM 5767-06-23 18:20:00 UTC");
        expect(testDate.moment).toBeCloseTo(myDate.moment, 8);
    });


    it("test add milliseconds for an hour", function () {
        var myDate,
            ms,
            maxloop,
            est,
            julian1_after_maxloops,
            julian2_after_maxloops,
            millisecondValue = (1 / 86400000),
            dateParts = {calendar: "gregorian", year: 2000, month: 7, day: 12,
                         hour: 15, minute: 30, second: 10, millisecond: 0, minutesWestUtc: 300};
        
        for (var i = 0; i < 1000; i += 1) {
            myDate = ajd.date(dateParts);
            expect(myDate.to("gregorian", 300).millisecond).toEqual(i);
            dateParts.millisecond += 1;
        }
        
        myDate = ajd.date(dateParts);
        // change this to 87 to see some interesting failures.
        maxloop = 86;
        for (var j = 0; j < maxloop; j += 1) {
            ms = myDate.to("gregorian", 300).millisecond;
            expect(ms).toEqual(j);
            myDate.moment += millisecondValue;
        }

        julian1_after_maxloops = myDate.moment;
        ms = myDate.to("gregorian", 300).millisecond;
        expect(ms).toEqual(maxloop);
        
        myDate = ajd.date(dateParts);
        for (var k = 0; k < 1000; k += 1) {
            if (k === maxloop) {
                julian2_after_maxloops = myDate.moment;
            }
            est = myDate.to("gregorian", 300);
            ms = est.millisecond;
            expect(ms).toEqual(k);
            myDate = ajd.date(est);
            myDate.moment += millisecondValue;
        }
                
        expect(1 / 864000000).toBeCloseTo(0, 8);
        
        expect(Math.abs(julian2_after_maxloops - julian1_after_maxloops)).toBeLessThan(millisecondValue/2);
     });
    
    // This test fails in Safari.  Sweet!!!!!!
    it("test javascript date on DST start", function() {
        var test2013 = new Date(2013, 2, 10, 1, 30, 0);
        expect(test2013.toString()).toEqual("Sun Mar 10 2013 01:30:00 GMT-0500 (EST)");
        test2013 = new Date(test2013.getTime() + (60 * 60000));
        expect(test2013.toString()).toEqual("Sun Mar 10 2013 03:30:00 GMT-0400 (EDT)");
        test2013 = new Date(2013, 2, 10, 3, 30, 0);
        expect(test2013.toString()).toEqual("Sun Mar 10 2013 03:30:00 GMT-0400 (EDT)");
        
        var test2014 = new Date(2014, 2, 9, 4, 0, 0);
        expect(test2014.toString()).toEqual("Sun Mar 09 2014 04:00:00 GMT-0400 (EDT)");
    });
    
    it("test islamic date", function() {
        var myDate = ajd.date(2456722.5),
            isl = myDate.to("islamic", 0),
            greg = myDate.to("gregorian", 0);
        
        expect(greg.weekday).toEqual(4);
        expect(isl.toString()).toEqual("al-khamis AH 1435-05-04 00:00:00 UTC");
        expect(isl.toLongString()).toEqual("yawm al-khamis, Jumādā I 04, 1435 AH 00:00:00 UTC");
        
        var testDate = ajd.date(isl);
        expect(testDate.moment).toBeCloseTo(2456722.5, 8);
        
        testDate = ajd.date({calendar: "islamic", year: 1, month: 1, day: 1, hour: 18, minutesWestUtc: 0});
        expect(testDate.moment).toBeCloseTo(1948439.25, 8);
        isl = testDate.to("islamic", 0);
        expect(isl.year).toEqual(1);
        expect(isl.month).toEqual(1);
        expect(isl.day).toEqual(1);
        expect(isl.hour).toEqual(18);
        expect(isl.weekday).toEqual(5);

        testDate = ajd.date({calendar: "islamic", year: 1, month: 1, day: 1, hour: 18, minutesWestUtc: 240});
        expect(testDate.moment).toBeCloseTo(1948439.4166666667, 8);
        isl = testDate.to("islamic", 240);
        expect(isl.year).toEqual(1);
        expect(isl.month).toEqual(1);
        expect(isl.day).toEqual(1);
        expect(isl.hour).toEqual(18);
        expect(isl.weekday).toEqual(5);
        
        var month = ajd.calendars.islamic.calendarMonth(1, 1, 240);
        expect(month.startingWeekday).toEqual(5);
    });
    
    it("test specific islam dates", function() {
        var islamEpoch = {calendar: "islamic", year: 1, month: 1, day: 1, hour: 0};
        var ajdIslamEpoch = ajd.date(islamEpoch);
        
        islamEpoch = ajdIslamEpoch.to("islamic", 0);
        expect(islamEpoch.year).toEqual(1);
        expect(islamEpoch.month).toEqual(1);
        expect(islamEpoch.day).toEqual(1);
        expect(islamEpoch.weekday).toEqual(5);

        var islamEpochOnJulianCalendar = ajdIslamEpoch.to("julian", 0);
        expect(islamEpochOnJulianCalendar.year).toEqual(622);
        expect(islamEpochOnJulianCalendar.month).toEqual(7);
        expect(islamEpochOnJulianCalendar.day).toEqual(16);
        expect(islamEpochOnJulianCalendar.weekday).toEqual(5);
    });
    
    it("test islamic date conversion switch day at 6:00pm", function() {
        var myDate = ajd.date(2454349.222222222),
            isl = myDate.to("islamic", 0),
            testDate;
        
        expect(isl.toString()).toEqual("al-'arb`a' AH 1428-08-22 17:20:00 UTC");
        myDate.moment += (1 / 24);
        isl = myDate.to("islamic", 0);
        expect(isl.toString()).toEqual("al-khamis AH 1428-08-23 18:20:00 UTC");
        testDate = ajd.date(isl);
        expect(testDate.to("islamic", 0).toString()).toEqual("al-khamis AH 1428-08-23 18:20:00 UTC");
    });
    
    it("test mayan date conversion - end of world", function() {
        var myDate = ajd.date(2456282.5),
            lc = myDate.to("mayanLongCount", 0);
        
        expect(lc.toString()).toEqual("13.0.0.0.0");
    });
    
    it("test construct with mayan date", function() {
        var myDate = ajd.date({
            baktun: 13,
            katun: 0,
            tun: 1,
            uinal: 0,
            kin: 3, 
            calendar: "mayanLongCount"
        });
        expect(myDate.to("gregorian", 0).toString()).toEqual("Thu 2013-12-19 00:00:00 UTC");
    });
    
    it("Test convert Unix Epoch", function() {
        var unixEpoch = ajd.date({
            year: 1970,
            month: 1,
            day: 1,
            hour: 0,
            minute: 0,
            second: 0,
            minutesWestUtc: 0,
            calendar: "gregorian"});
        
        expect(unixEpoch.moment).toEqual(2440587.5);
        
        expect(unixEpoch.to("hebrew", 0).toLongString()).toEqual("Yom Chamishi, Tevet 23, 5730 AM 00:00:00 UTC");
        expect(unixEpoch.to("islamic", 0).toLongString()).toEqual("yawm al-khamis, Shawwāl 22, 1389 AH 00:00:00 UTC");
        expect(unixEpoch.to("gregorian", 0).toLongString()).toEqual("Thursday, January 01, 1970 00:00:00 UTC");
    });
    
    // always displays AD or BC
    function newGregorianFormatter() {
        var that = ajd.gregorianFormatter();
        
        that.toLongString = function(dateParts) { 
            var year = that.formatDisplayYear(dateParts.year, "after", true),
                tz = that.utcString(dateParts.minutesWestUtc),
                result = that.formatDisplayWeekday(dateParts.weekday, true) + ", " +
                         that.formatDisplayMonth(dateParts.month, dateParts.isLeapYear, true) + " " +
                         that.zeroPad(dateParts.day, 2) + ", " + year + " " +
                         that.zeroPad(dateParts.hour, 2) + ":" + that.zeroPad(dateParts.minute, 2) + ":" + that.zeroPad(dateParts.second, 2);

            if (dateParts.millisecond > 0) {
                result = result + "." + that.zeroPad(dateParts.millisecond, 3);
            }

            result = result + " " + tz;
            return result;
        };
        
        that.toTest = function(dateParts) { 
            return "test";
        };
        
        return that;
    }
    
    it("Test replace formatter", function() {
        var unixEpoch = ajd.date({
            year: 1970,
            month: 1,
            day: 1,
            hour: 0,
            minute: 0,
            second: 0,
            minutesWestUtc: 0,
            calendar: "gregorian"});
        
        var date = unixEpoch.to("gregorian", 0);
        
        expect(date.toLongString()).toEqual("Thursday, January 01, 1970 00:00:00 UTC");
        date.replaceFormatter(newGregorianFormatter());
        expect(date.toLongString()).toEqual("Thursday, January 01, 1970 CE 00:00:00 UTC");
        expect(date.toTest()).toEqual("test");
        date.replaceFormatter(ajd.gregorianFormatter());
        expect(date.toTest).toBeUndefined();
    });
    
    it("Test Easter 2014", function() { 
        var greg = ajd.calendars.gregorian;
        var jul = ajd.calendars.julian;
        
        var g_easter = greg.easter(2014);
        var j_easter = jul.easter(2014);
        
        expect(g_easter.toLongString()).toEqual("Sunday, April 20, 2014 00:00:00 UTC");
        expect(j_easter.toLongString()).toEqual("Sunday, April 07, 2014 00:00:00 UTC");

        g_easter = greg.easter(2013);
        j_easter = jul.easter(2013);
        
        expect(g_easter.toLongString()).toEqual("Sunday, March 31, 2013 00:00:00 UTC");
        expect(j_easter.toLongString()).toEqual("Sunday, April 22, 2013 00:00:00 UTC");
    });
    
    var julianOrthodoxEasters = [
        {year: 2000, month:	4, day: 17},
        {year: 2001, month: 4, day: 2},
        {year: 2002, month: 4, day: 22},
        {year: 2003, month: 4, day: 14},
        {year: 2004, month: 3, day: 29},
        {year: 2005, month: 4, day: 18},
        {year: 2006, month: 4, day: 10},
        {year: 2007, month: 3, day: 26},
        {year: 2008, month: 4, day: 14},
        {year: 2009, month: 4, day: 6},
        {year: 2010, month: 3, day: 22},
        {year: 2011, month: 4, day: 11},
        {year: 2012, month: 4, day: 2},
        {year: 2013, month: 4, day: 22},
        {year: 2014, month: 4, day: 7},
        {year: 2015, month: 3, day: 30},
        {year: 2016, month: 4, day: 18},
        {year: 2017, month: 4, day: 3},
        {year: 2018, month: 3, day: 26},
        {year: 2019, month: 4, day: 15},
        {year: 2020, month: 4, day: 6},
        {year: 2021, month: 4, day: 19},
        {year: 2022, month: 4, day: 11},
        {year: 2023, month: 4, day: 3},
        {year: 2024, month: 4, day: 22},
        {year: 2025, month: 4, day: 7},
        {year: 2026, month: 3, day: 30},
        {year: 2027, month: 4, day: 19},
        {year: 2028, month: 4, day: 3},
        {year: 2029, month: 3, day: 26},
        {year: 2030, month: 4, day: 15},
        {year: 2031, month: 3, day: 31},
        {year: 2032, month: 4, day: 19},
        {year: 2033, month: 4, day: 11},
        {year: 2034, month: 3, day: 27},
        {year: 2035, month: 4, day: 16},
        {year: 2036, month: 4, day: 7},
        {year: 2037, month: 3, day: 23},
        {year: 2038, month: 4, day: 12},
        {year: 2039, month: 4, day: 4},
        {year: 2040, month: 4, day: 23},
        {year: 2041, month: 4, day: 8},
        {year: 2042, month: 3, day: 31}
    ];
    
   it("Test Orthodox Easter from Julian Calendar", function() {
       var julianCalendar = ajd.calendars.julian;
       julianOrthodoxEasters.forEach(function(easter) { 
           var calculated = julianCalendar.easter(easter.year);
           expect(calculated.year).toEqual(easter.year);
           expect(calculated.month).toEqual(easter.month);
           expect(calculated.day).toEqual(easter.day);
       });
   });
    
   var gregorianOrthodoxEasters = [
       {year: 2000, month: 4, day: 30},
       {year: 2001, month: 4, day: 15},
       {year: 2002, month: 5, day: 5},
       {year: 2003, month: 4, day: 27},
       {year: 2004, month: 4, day: 11},
       {year: 2005, month: 5, day: 1},
       {year: 2006, month: 4, day: 23},
       {year: 2007, month: 4, day: 8},
       {year: 2008, month: 4, day: 27},
       {year: 2009, month: 4, day: 19},
       {year: 2010, month: 4, day: 4},
       {year: 2011, month: 4, day: 24},
       {year: 2012, month: 4, day: 15},
       {year: 2013, month: 5, day: 5},
       {year: 2014, month: 4, day: 20},
       {year: 2015, month: 4, day: 12},
       {year: 2016, month: 5, day: 1},
       {year: 2017, month: 4, day: 16},
       {year: 2018, month: 4, day: 8},
       {year: 2019, month: 4, day: 28},
       {year: 2020, month: 4, day: 19},
       {year: 2021, month: 5, day: 2},
       {year: 2022, month: 4, day: 24},
       {year: 2023, month: 4, day: 16},
       {year: 2024, month: 5, day: 5},
       {year: 2025, month: 4, day: 20},
       {year: 2026, month: 4, day: 12},
       {year: 2027, month: 5, day: 2},
       {year: 2028, month: 4, day: 16},
       {year: 2029, month: 4, day: 8},
       {year: 2030, month: 4, day: 28},
       {year: 2031, month: 4, day: 13},
       {year: 2032, month: 5, day: 2},
       {year: 2033, month: 4, day: 24},
       {year: 2034, month: 4, day: 9},
       {year: 2035, month: 4, day: 29},
       {year: 2036, month: 4, day: 20},
       {year: 2037, month: 4, day: 5},
       {year: 2038, month: 4, day: 25},
       {year: 2039, month: 4, day: 17},
       {year: 2040, month: 5, day: 6},
       {year: 2041, month: 4, day: 21},
       {year: 2042, month: 4, day: 13}
   ];
    
   it("Test Orthodox Easter from Gregorian Calendar", function() {
       var julianCalendar = ajd.calendars.julian;
       gregorianOrthodoxEasters.forEach(function(easter) { 
           var calculated = julianCalendar.easter(easter.year);
           calculated = ajd.date(calculated).to("gregorian", 0);
           expect(calculated.year).toEqual(easter.year);
           expect(calculated.month).toEqual(easter.month);
           expect(calculated.day).toEqual(easter.day);
       });
   });

   it("Test pull hebrew calendar", function() {
       var hebrewCalendar = ajd.calendars.hebrew;
       var year5773 = hebrewCalendar.calendarYear(5773);
       
       expect(year5773.numberDays).toEqual(353);
       expect(year5773.months.length).toEqual(12);
       expect(year5773.startingWeekday).toEqual(2);
       
       var testDate = ajd.date(year5773.startingMoment).to("hebrew", 0);
       expect(testDate.year).toEqual(5773);
       expect(testDate.month).toEqual(1);
       expect(testDate.day).toEqual(1);
       expect(testDate.hour).toEqual(18);
       expect(testDate.minute).toEqual(0);
       expect(testDate.second).toEqual(0);
       
       var year5774 = hebrewCalendar.calendarYear(5774);
       expect(year5774.numberDays).toEqual(385);
       expect(year5774.months.length).toEqual(13);
       expect(year5774.startingWeekday).toEqual(2);
       
       var year5768 = hebrewCalendar.calendarYear(5768);
       expect(year5768.numberDays).toEqual(383);
       expect(year5768.months.length).toEqual(13);
       expect(year5768.startingWeekday).toEqual(0);
       
       expect(year5768.months[0].numberDays).toEqual(30);
       expect(year5768.months[0].month).toEqual(7);
       expect(year5768.months[1].numberDays).toEqual(29);
       expect(year5768.months[1].month).toEqual(8);
       expect(year5768.months[2].numberDays).toEqual(29);
       expect(year5768.months[2].month).toEqual(9);
       expect(year5768.months[3].numberDays).toEqual(29);
       expect(year5768.months[3].month).toEqual(10);
       expect(year5768.months[4].numberDays).toEqual(30);
       expect(year5768.months[4].month).toEqual(11);
       expect(year5768.months[5].numberDays).toEqual(30);
       expect(year5768.months[5].month).toEqual(12);
       expect(year5768.months[6].numberDays).toEqual(29);
       expect(year5768.months[6].month).toEqual(13);
       expect(year5768.months[7].numberDays).toEqual(30);
       expect(year5768.months[7].month).toEqual(1);
       expect(year5768.months[8].numberDays).toEqual(29);
       expect(year5768.months[8].month).toEqual(2);
       expect(year5768.months[9].numberDays).toEqual(30);
       expect(year5768.months[9].month).toEqual(3);
       expect(year5768.months[10].numberDays).toEqual(29);
       expect(year5768.months[10].month).toEqual(4);
       expect(year5768.months[11].numberDays).toEqual(30);
       expect(year5768.months[11].month).toEqual(5);
       expect(year5768.months[12].numberDays).toEqual(29);
       expect(year5768.months[12].month).toEqual(6);
   });
   
   it("Test hebrew 20:00 is before hebrew 17:00", function() {
       var date1 = { calendar: "hebrew", year: 5768, month: 6, day: 5, hour: 20, minutesWestUtc: 0 };
       var date2 = { calendar: "hebrew", year: 5768, month: 6, day: 5, hour: 16, minutesWestUtc: 0 };
       
       var ajd1 = ajd.date(date1);
       var ajd2 = ajd.date(date2);
       
       expect(ajd1.moment).toBeLessThan(ajd2.moment);
   });
    
   it("Test traditional hebrew hours and parts", function() {
       var date1 = { calendar: "hebrew", year: 5768, month: 6, day: 5, hour: 20, minutesWestUtc: 0 };
       var convertedDate = ajd.date(date1);
       var convertedHebDate = convertedDate.to("hebrewTraditional", 0);
       expect(convertedHebDate.hour).toEqual(2);
       expect(convertedHebDate.parts).toEqual(0);
       expect(convertedHebDate.toString()).toEqual("Shishi AM 5768-06-05 2 h 0 p UTC");

       date1 = { calendar: "hebrew", year: 5768, month: 6, day: 5, hour: 20, minute:30, minutesWestUtc: 0 };
       convertedDate = ajd.date(date1);
       convertedHebDate = convertedDate.to("hebrewTraditional", 0);
       expect(convertedHebDate.hour).toEqual(2);
       expect(convertedHebDate.parts).toEqual(540);
       expect(convertedHebDate.toString()).toEqual("Shishi AM 5768-06-05 2 h 540 p UTC");
       
       var testDate = ajd.date(convertedHebDate);
       expect(testDate.moment).toEqual(convertedDate.moment);
   });
    
   it("Test gregorian calendar", function() {
       var gregorianCalendar = ajd.calendars.gregorian;
       var year1982 = gregorianCalendar.calendarYear(1982);
       expect(year1982.isLeapYear).toEqual(false);
       expect(year1982.numberDays).toEqual(365);
       expect(year1982.months.length).toEqual(12);
       expect(year1982.startingMoment).toEqual(2444970.5);
       
       expect(year1982.months[0].numberDays).toEqual(31);
       expect(year1982.months[1].numberDays).toEqual(28);
       expect(year1982.months[2].numberDays).toEqual(31);
       expect(year1982.months[3].numberDays).toEqual(30);
       expect(year1982.months[4].numberDays).toEqual(31);
       expect(year1982.months[5].numberDays).toEqual(30);
       expect(year1982.months[6].numberDays).toEqual(31);
       expect(year1982.months[7].numberDays).toEqual(31);
       expect(year1982.months[8].numberDays).toEqual(30);
       expect(year1982.months[9].numberDays).toEqual(31);
       expect(year1982.months[10].numberDays).toEqual(30);
       expect(year1982.months[11].numberDays).toEqual(31);
       
       expect(year1982.months[0].startingWeekday).toEqual(5);
       expect(year1982.months[0].weeks.length).toEqual(6);
       expect(year1982.months[1].weeks.length).toEqual(5);
   });
    
   it("Test start of hebrew year", function() {
       var date = ajd.date(2456540.5);
       var convertedHebDate = date.to("hebrew", 0);
       expect(convertedHebDate.year).toEqual(5774);
       date.moment -= 1;
       convertedHebDate = date.to("hebrew", 0);
       expect(convertedHebDate.year).toEqual(5773);
   });
    
   it("Test javascript dates passed in", function() {
       var date = new Date(2014, 4, 1, 10, 10, 10);
       var ajdDate = ajd.date(date);
       var gregDate = ajdDate.to("gregorian", date.getTimezoneOffset());
       expect(gregDate.toString().substring(4,23)).toEqual("2014-05-01 10:10:10");
       
       date = new Date();
       ajdDate = ajd.date(date);
       var jsDate = ajdDate.to("js");
       expect(date.getTime()).toBeCloseTo(jsDate.getTime(), 8);
   });
});