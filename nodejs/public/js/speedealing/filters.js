angular.module('mean.system').filter('euro', function () {
    return function (text, size) {
		
		size = size || 2;
		
		if(isNaN(text))
			return;
		
		text = Math.round(Math.pow(10,2)*text)/Math.pow(10,2);
		
        text = text.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
        var t = text + ' €';
        return t;
    };
});