angular.module('mean.system').filter('euro', function() {
	return function(text, size) {

		size = size || 2;

		if (isNaN(text))
			return;

		text = Math.round(Math.pow(10, 2) * text) / Math.pow(10, 2);

		text = text.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
		var t = text + ' €';
		return t;
	};
});

angular.module('mean.system').filter('capitalize', function() {
	return function(input, scope) {
		if (input == null)
			return;

		input = input.toLowerCase();
		return input.substring(0, 1).toUpperCase() + input.substring(1);
	}
});
