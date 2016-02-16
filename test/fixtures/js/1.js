define(function () {
    var id = 'main';
    require(id);

    // require(['index/main']);

    require([ 'common/lib', 'common/log' ]);
    require([ 'common/test' ], function (test) {
        // require('test');
    });

    require('./manage/main');

    /*
    require('./common/ui/main');
    */
    require('./manage/main');
    require([
        'er/main',
        'er/promise'
    ]);
});
