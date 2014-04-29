(function(ajd, undefined) {

    // returns (int) according to standard math rules:
    //    floor for numbers > 0, ceil for numbers < 0
    // Believe it or not, Math.ceil can return -0, which 
    // plays havoc with jasmine's toEqual function.
    // See here for more fun: 
    //    http://stackoverflow.com/questions/7223359/are-0-and-0-the-same
    //    https://github.com/pivotal/jasmine/issues/496
    ajd.toInt = function(value) {
        if (value > 0) {
            return Math.floor(value);
        }
        return Math.ceil(value) || 0;
    };

    // Modulus function
    ajd.mod = function(a, b) {
        return a - (b * Math.floor(a / b));
    };

    //  AMOD  --  Modulus function which returns numerator if modulus is zero
    ajd.amod = function(a, b) {
        return mod(a - 1, b) + 1;
    };

})(window.ajd = window.ajd || {});
