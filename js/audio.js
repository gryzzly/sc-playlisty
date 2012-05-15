// Audio wrapper
//
// audio.play('src');
// audio.on('ended', function () {
//   audio.play(collection.next());
// })
// audio.on('loading', function () {
//   view.indicateLoading();
// })
// audio.on('loaded', function () {
//   view.stopLoading();
// })
//
//
// ========================================================================
~function (yayo) {'use strict';

    var client_id = '?client_id=7118ab0b5da08eafa2a36a2fca98a905';

    yayo.audio = _.extend({
        audio: new Audio(),
        load: function (id, callback) {
            var self = this;
            this.trigger('loading');
            this.audio.src = 'http://api.soundcloud.com/tracks/' + id + '/stream' + client_id;
            this.audio.load();
            // remove previously attached handler from Audio element
            this.audio.removeEventListener('canplay', this.currentHandler);
            // store reference to the current handler 
            this.currentHandler = _.bind(function () {
                callback && callback();
                this.trigger('loaded');
            }, this);
            this.audio.addEventListener('loadeddata', this.currentHandler, false);
        },
        init: function () {
            this.audio.addEventListener('ended', _.bind(function () {
                this.trigger('ended');
            }, this), false);
        },
        play: function () {
            // reset the playback if track has ended
            if (this.audio.ended) this.audio.currentTime = 0;
            this.audio.play();
            return this;
        },
        pause: function () {
            this.audio.pause();
            return this;
        },
        isPaused: function () {
            return this.audio.paused;
        }
    }, Backbone.Events);

    // var track = Backbone.View.extend({
    //     initialize: function (src) {
    //         this.audio = new Audio();
    //         this.audio.src = src;
    //         this.audio.gT
    //     }
    // });


}(window.yayo || (window.yayo = {}));
