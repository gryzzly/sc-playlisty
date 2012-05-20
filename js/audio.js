// Audio wrapper
// ========================================================================
~function (yayo) {'use strict';

    // Example usage:
    // audio.load(id); // where id is sound cloud track id
    // audio.on('ended', function () {
    //   audio.play(collection.next());
    // })
    // audio.on('loading', function () {
    //   view.indicateLoading();
    // })
    // audio.on('loaded', function () {
    //   view.stopLoading();
    // })

    var client_id = '?client_id=7118ab0b5da08eafa2a36a2fca98a905';

    yayo.audio = _.extend({

        audio: new Audio(),

        // by using 'handleEvent' as event listener we eliminate the need
        // to use Function.prototype.bind and don't waste memory for closures
        // we also don't need to create reference for each of the handlers
        // to clear them after new audio has loaded
        handleEvent: function (e) {
            switch (e.type) {
                case 'loadeddata': 
                    this.trigger('loaded');
                    break;
                case 'ended':
                    this.trigger('ended');
                    break;
                case 'timeupdate':
                    this.trigger('timeupdate');
                    break;
                case 'error':
                    this.trigger('error');
                    break;
            }
        },

        load: function (id, callback) {
            var audio = this.audio,
                events = ['loadeddata', 'ended', 'error', 'timeupdate'];

            this.trigger('loading');
            audio.src = 'http://api.soundcloud.com/tracks/' + id + '/stream' + client_id;
            audio.load();

            // - remove previously attached handlers from Audio element 
            // - propagate Audio events to the module
            _.forEach(events, function (eventType) {
                audio.removeEventListener(eventType, this, false);
                audio.addEventListener(eventType, this, false);
            }, this);
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

        end: function () {
            this.audio.currentTime = 0;
        },

        isPaused: function () {
            return this.audio.paused;
        },

        currentTime: function () {
            return ~~this.audio.currentTime;
        }

    }, Backbone.Events);

}(window.yayo || (window.yayo = {}));
