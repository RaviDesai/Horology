function ajd() {
	var that = {};

	var y = 4716;
	var v = 3;
	var j = 1401;
	var u = 5;
	var m = 2;
	var s = 153;
	var n = 12;
	var w = 2;
	var r = 4;
	var B = 274277;
	var p = 1461;
	var C = -38;

	function to_gregorian(int minutes_west_utc) {
		var time;
		if (_time_type != "time") {
			double adjJulian = _julian - (((double) minutes_west_utc) / 1440);
			int J = (int) (adjJulian + 0.5);
			int f = J + j;
			f = f + ((int) ((((int) (4 * J + B) / 146097) * 3) / 4)) + C;
			int e = r * f + v;
			int g = (int) ((e % p) / r);
			int h = u * g + w;
			result.day = ((int)((h % s) / u)) + 1;
			result.month = ((((int) h / s) + m) % n) + 1;
			result.year = ((int) e/p) - y + ((int)((n + m - result.month) / n));

			time = adjJulian + .5;
		} else {
			time = _julian - (((double) minutes_west_utc) / 1440);
			result.day = (int) time;
		}

		time -= (int)time;
		double subms = (0.5 / 86400000);

		time = time * 24;
		subms = subms * 24;
		result.hour = (int) (time + subms);
		if (((int) time) != ((int) (time + subms))) {
			time -= (int)(time + subms);
			subms = 0;
		} else {
			time -= (int)(time + subms);
		}
	
		time = time * 60;
		subms = subms * 60;
		result.minute = (int) (time + subms);
		if (((int) time) != ((int) (time + subms))) {
			time -= (int)(time + subms);
			subms = 0;
		} else {
			time -= (int)(time + subms);
		}
	
		time = time * 60;
		subms = subms * 60;
		result.second = (int) (time + subms);
		if (((int) time) != ((int) (time + subms))) {
			time -= (int)(time + subms);
			subms = 0;
		} else {
			time -= (int)(time + subms);
		}

		time = time * 1000;
		subms = subms * 1000;
		result.millisecond = (int) (time + subms);

		result.minutes_west_utc = minutes_west_utc;
		result.time_type = _time_type;
		return result;
	}
	that.to_gregorian = to_gregorian;

	return that;
}
