angular.module('mean.system').filter('euro', function () {
    return function (text) {
        //text = text.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
        var t = text + '<span class="cur"> €</span>';
        return t;
    };
});