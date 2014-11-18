"use strict";
/* global angular: true */

angular.module('mean.system').filter('euro', function () {
	return function (text, size) {

		size = size || 2;

		if (isNaN(text))
			return text;

		text = Math.round(Math.pow(10, size) * text) / Math.pow(10, size);

		text = text.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
		var t = text + ' €';
		return t;
	};
});

angular.module('mean.system').filter('percent', function () {
	return function (text, size) {

		size = size || 2;

		if (isNaN(text))
			return text;

		text = Math.round(Math.pow(10, size) * text) / Math.pow(10, size);

		text = text.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
		var t = text + ' %';
		return t;
	};
});

angular.module('mean.system').filter('object2Array', function () {
	return function (input) {
		var out = [];
		for (var i in input) {
			input[i].id = i;
			out.push(input[i]);
		}
		return out;
	};
});

angular.module('mean.system').filter('capitalize', function () {
	return function (input, scope) {
		if (input == null)
			return;

		input = input.toLowerCase();
		return input.substring(0, 1).toUpperCase() + input.substring(1);
	};
});

angular.module('mean.system').filter('phone', function () {
	return function (tel) {
		if (!tel) {
			return '';
		}

		var value = tel.toString().trim().replace(/^\+/, '');

		if (value.match(/[^0-9]/)) { // NOT a NUMBER
			return tel;
		}

		if (value.match(/^0/)) { // Start with 0
			country = value.slice(0, 1);
			city = "";
			number = value.slice(4);
			return country + city + value.slice(1, 2) + "." + value.slice(2, 4) + "." + value.slice(4, 6) + "." + value.slice(6, 8) + "." + value.slice(8);
		}

		var country, city, number;

		switch (value.length) {
			case 10: // +1PPP####### -> C (PPP) ###-####
				country = 1;
				city = value.slice(0, 3);
				number = value.slice(3);
				break;

				/*case 11: // +CPPP####### -> CCC (PP) ###-####
				 country = value[0];
				 city = value.slice(1, 4);
				 number = value.slice(4);
				 break;*/

			case 11: // +33####### -> +33 (0)#.##.##.##.##
				country = value.slice(0, 2);
				city = " (0)";
				number = value.slice(4);
				return "+" + country + city + value.slice(2, 3) + "." + value.slice(3, 5) + "." + value.slice(5, 7) + "." + value.slice(7, 9) + "." + value.slice(9);

			case 12: // +CCCPP####### -> CCC (PP) ###-####
				country = value.slice(0, 3);
				city = value.slice(3, 5);
				number = value.slice(5);
				break;

			default:
				return tel;
		}

		if (country == 1) {
			country = "";
		}

		number = number.slice(0, 3) + '-' + number.slice(3);

		return (country + " (" + city + ") " + number).trim();
	};
});

angular.module('mean.system').filter('makeRange', function () {
	return function (input) {
		var lowBound, highBound;
		switch (input.length) {
			case 1:
				lowBound = 0;
				highBound = parseInt(input[0]) - 1;
				break;
			case 2:
				lowBound = parseInt(input[0]);
				highBound = parseInt(input[1]);
				break;
			default:
				return input;
		}
		var result = [];
		for (var i = lowBound; i <= highBound; i++)
			result.push(i);
		return result;
	};
});

angular.module('mean.system').filter('userGroupArrayFilter', function () {
	return function (myArray) {
		return myArray.join(', ');
	};
});
