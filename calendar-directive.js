angular.module("multiCalendar", [])
    .controller('Ctrl', function($scope) {
        $scope.calendars = [];
        for (var cal in ajd.calendars) {
            if (ajd.calendars.hasOwnProperty(cal) && ajd.calendars[cal].calendarYear) {
                $scope.calendars.push({name: cal, calendar: ajd.calendars[cal]});
            }
        }
        $scope.selectedCalendar = $scope.calendars[2];
        $scope.selectedJulian = ajd.date().moment;
        $scope.minutesWestUtc = new Date().getTimezoneOffset();
        
        $scope.getMayanLongCount = function() {
            var date = ajd.date($scope.selectedJulian).to("mayanLongCount", $scope.minutesWestUtc);
            return date.toString();
        };
    })
    .directive("calendar", [function() {
        function setupClickButton(buttonClass, clickFunction) {
            var button = $("." + buttonClass);
            button.click(function() {
                if (!button.hasClass('fc-state-disabled')) {
                    clickFunction();
                }
            })
            .mousedown(function() {
                button
                    .not('.fc-state-active')
                    .not('.fc-state-disabled')
                    .addClass('fc-state-down');
            })
            .mouseup(function() {
                button.removeClass('fc-state-down');
            })
            .hover(
                function() {
                    button
                        .not('.fc-state-active')
                        .not('.fc-state-disabled')
                        .addClass('fc-state-hover');
                },
                function() {
                    button
                        .removeClass('fc-state-hover')
                        .removeClass('fc-state-down');
                }
            );
        }
        
        function setCurrentMonthAndIndex($scope, calendarMonth) {
            $scope.currentMonthIndex = 0;
            for (var i = 0; i < $scope.yearInCalendar.months.length; i += 1) {
                if (calendarMonth == $scope.yearInCalendar.months[i].month) {
                    $scope.currentMonthIndex = i;
                    $scope.currentMonth = $scope.yearInCalendar.months[i];
                    break;
                }
            }
        }

        return {
            restrict: 'A',
            scope: {
                calendar: "=mcCalendar",
                julianDate: "=mcJulianDate",
                minutesWestUtc: "@mcMinutesWestUtc"
            },
            
            templateUrl: 'calendar-directive.html',
            
            link: function($scope) {
                if (! $scope.julianDate) {
                    $scope.julianDate = ajd.date().moment;
                }
                
                var calendar = $scope.calendar && $scope.calendar.calendar;
                if (calendar === null || typeof calendar === "undefined") {
                    throw 'bad calendar!';
                }
                var dateOnCalendar = ajd.date($scope.julianDate * 1).to(calendar.calendarName, $scope.minutesWestUtc);
                
                $scope.yearInCalendar = calendar.calendarYear(dateOnCalendar.year, $scope.minutesWestUtc);
                setCurrentMonthAndIndex($scope, dateOnCalendar.month);
                if (! $scope.currentMonth) {
                    $scope.todayButtonClick();
                }
                
                $scope.prevButtonClick = function() {
                    var calendar = $scope.calendar && $scope.calendar.calendar;
                    if ($scope.currentMonthIndex === 0) {
                        $scope.yearInCalendar = calendar.calendarYear($scope.currentMonth.year - 1, $scope.minutesWestUtc);
                        $scope.currentMonthIndex = $scope.yearInCalendar.months.length - 1;
                        $scope.currentMonth = $scope.yearInCalendar.months[$scope.currentMonthIndex];
                    } else {
                        $scope.currentMonthIndex -= 1;
                        $scope.currentMonth = $scope.yearInCalendar.months[$scope.currentMonthIndex];
                    }
                    $scope.$apply();
                };
                $scope.nextButtonClick = function() {
                    var calendar = $scope.calendar && $scope.calendar.calendar;
                    if ($scope.currentMonthIndex === $scope.yearInCalendar.months.length - 1) {
                        $scope.yearInCalendar = calendar.calendarYear($scope.currentMonth.year + 1, $scope.minutesWestUtc);
                        $scope.currentMonthIndex = 0;
                        $scope.currentMonth = $scope.yearInCalendar.months[$scope.currentMonthIndex];
                    } else {
                        $scope.currentMonthIndex += 1;
                        $scope.currentMonth = $scope.yearInCalendar.months[$scope.currentMonthIndex];
                    }
                    $scope.$apply();
                };
                $scope.todayButtonClick = function() {
                    var calendar = $scope.calendar.calendar;
                    var now = ajd.date();
                    $scope.julianDate = now.moment;
                    var nowOnCalendar = now.to(calendar.calendarName, $scope.minutesWestUtc);
                    $scope.yearInCalendar = calendar.calendarYear(nowOnCalendar.year, $scope.minutesWestUtc);
                    setCurrentMonthAndIndex($scope, nowOnCalendar.month);
                    $scope.$apply();
                };
                
                $scope.todayIsShown = function() {
                    var now = ajd.date().moment;
                    return $scope.currentMonth.startingMoment <= now && 
                        now <= $scope.currentMonth.startingMoment + $scope.currentMonth.numberDays;
                };
                
                var watchFunction = function() {
                    if (! $scope.julianDate) {
                        $scope.julianDate = ajd.date().moment;
                    }
                    var calendar = $scope.calendar && $scope.calendar.calendar;
                    if (calendar === null || typeof calendar === "undefined") {
                        throw 'bad calendar!';
                    }
                    var dateOnCalendar = ajd.date($scope.julianDate * 1).to(calendar.calendarName, $scope.minutesWestUtc);

                    $scope.yearInCalendar = calendar.calendarYear(dateOnCalendar.year, $scope.minutesWestUtc);
                    setCurrentMonthAndIndex($scope, dateOnCalendar.month);
                };
                
                $scope.$watch("calendar", watchFunction);
                $scope.$watch("julianDate", watchFunction);
                
                $scope.isToday = function(day) {
                    return day.moment <= $scope.julianDate && day.moment + 1 > $scope.julianDate;
                };
                
                $scope.isEaster = function(day) {
                    if (! day.moment) return false;
                    if ($scope.calendar.calendar.easter) {
                        var easterThisYear = $scope.calendar.calendar.easter($scope.yearInCalendar.year);
                        easterThisYear.minutesWestUtc = $scope.minutesWestUtc;
                        var ajdEaster = ajd.date(easterThisYear);
                        return day.moment <= ajdEaster.moment && 
                            ajdEaster.moment < day.moment + 1;
                    }
                    return false;
                };
                
                $scope.displayValue = function(day) {
                    if ($scope.isEaster(day)) return "Easter";
                    if (!day.moment) return "";
                    return day.moment.toString();
                };

                $scope.choose = function(day) {
                    if (day.moment) {
                        $scope.julianDate = day.moment;
                    }
                };

                setupClickButton("fc-button-prev", $scope.prevButtonClick);
                setupClickButton("fc-button-next", $scope.nextButtonClick);
                setupClickButton("fc-button-today", $scope.todayButtonClick);
            }
            
        };
    }]);