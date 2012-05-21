// Tracks
// ========================================================================
~function (yayo) {'use strict';

    // Generic constructors for tracks. Tracks collection that holds tracks
    // data and tracks view, that is responsible for playing these tracks.
    //
    // In our app tracks are populated either by playlist or by search
    // component.
    //
    // This module depends on audio.js, a wrapper for HTML5 audio element.
    // 
    // Tracks collection holds `current` property that contains reference 
    // to currently playing track's model.


    // Single track model
    var Track = Backbone.Model.extend({

        // caching IDs as CIDs allows for faster retrieval by getByCid
        initialize: function () {
            this.cid = this.get('id');
        }

    });

    // Tracks collection
    var Tracks = Backbone.Collection.extend({

        model: Track,

        url: '/tracks.json',

        getSelected: function () {
            return this.filter(function (track) {
                return !!track.selected;
            });
        },

        next: function () {
            var currentIndex, next;
            if (this.current) {
                currentIndex = this.indexOf(this.getByCid(this.current));
                return next = (currentIndex === this.length - 1) ?
                    this.first() :
                    this.at(currentIndex + 1);
                    
            }
        },

        prev: function () {
            var currentIndex, next;
            if (this.current) {
                currentIndex = this.indexOf(this.getByCid(this.current));
                return next = (currentIndex === 0) ?
                    this.last() :
                    this.at(currentIndex - 1);
            }
        }
    });

    // Tracks view
    var TracksView = Backbone.View.extend({

        tagName: 'ul',

        className: 'tracks-list',

        template: $('#track-tpl').html(),

        initialize: function (options, customOptions) {
            // hack to conditionally construct event handler names
            this.events = this.events || {};
            this.events[yayo.down + ' .toggler'] = 'handleToggle',
            this.events[yayo.down + ' .remove'] = 'handleRemove',
            this.events[yayo.down + ' .up'] = 'handleUp',
            this.events[yayo.down + ' .down'] = 'handleDown',
            this.delegateEvents();

            this.collection.on('reset', function () {
                this.render();
            }, this).trigger('reset');

            // toggle presentation
            this.on('deactivated', function () {
                this.collection.current && 
                    this.resetTrack(this.collection.current);
            }, this);
            this.on('pause', function () {
                this.$el.find('.track').removeClass('playing');
            }, this);
            this.on('play', function () {
                this.$el.find('.track').removeClass('playing');
                this.trackElementById(this.collection.current.get('id'))
                    .addClass('playing');
            }, this);

            // toggle playback
            yayo.audio.on('loaded', this.handleAudioLoaded, this);

            // update current time display
            yayo.audio.on('timeupdate', this.handleAudioTimeUpdate, this);

            // play consequent tracks
            yayo.audio.on('ended', this.handleAudioEnded, this);

            // handle errors while loading
            // TODO: for now I will simply delete broken 
            // tracks from the playback but needs investigation
            // about the reasons why they don't load
            // + notify user there was an error
            yayo.audio.on('error', this.handleAudioError, this);

            customOptions && customOptions.isSearch && (this.isSearch = true);
        },

        render: function () {
            var html = [];
            // render each track
            this.collection.forEach(function (model) {
                html.push(Mustache.render(this.template, {
                    title: model.get('title'),
                    author: model.get('user') && model.get('user').username,
                    id: model.get('id'),
                    search: this.isSearch,
                    duration: _secondsToTime(model.get('duration') / 1000)
                }));
            }, this);
            // insert collection into the DOM
            this.$el.html(html.join(''));
            return this;
        },

        events: {
            'change input' : 'select'
        },

        handleToggle: function (e) {
            this.toggle(
                this.collection.getByCid(
                    $(e.target).closest('.track').data('track-id')
                )
            );
        },

        handleRemove: function (e) {
            var track = this.collection.getByCid(
                $(e.target).closest('.track').data('track-id')
            );
            this.trackElementById(track.get('id')).remove();
            this.collection.remove(track);
        },

        handleUp: function () {
        },

        handleDown: function () {
        },

        toggle: function (track) {
            var id = track.get('id'),
                element = this.trackElementById(id),
                activeView = yayo.playlists.activeView,
                currentTrack = this.collection.current;

            // ensure the right tracks collection is communicating
            // with audio
            if (!this.active) this.active = true;
            if (this.isSearch) {
                if (activeView.tracksView) {
                    activeView.tracksView.trigger('deactivated');
                    activeView.tracksView.active = false;
                }
            } else {
                if (activeView.search) {
                    (activeView.search.tracksView.active = false);
                    activeView.search.tracksView.trigger('deactivated');
                }
            }

            // load track
            if (currentTrack !== track) {
                // set previous track's duration to initial value
                currentTrack && this.resetTrack(currentTrack);
                // toggle presentation
                this.trackElementById(track.cid).addClass('current');
                // update collection state
                this.collection.current = track;
                yayo.audio.load(id);
            } else {
                this.playPause();
            }
        },

        playPause: function () {
            yayo.audio.isPaused() ? 
                (yayo.audio.play(), this.trigger('play')) :
                (yayo.audio.pause(), this.trigger('pause'));
        },

        select: function (e) {
            var target = $(e.target);
            target.parent()[(e.target.checked ? 'add' : 'remove') + 'Class']('selected');
            var cid = target.closest('.track').data('track-id');
            this.collection.getByCid(cid).selected = e.target.checked;
            this.collection.trigger(
                (this.collection.getSelected().length > 0 ? '' : 'de') + 
                'selected'
            );
        },
        
        handleAudioLoaded: function () {
            if (!this.active) return;
            this.playPause();
        },

        handleAudioEnded: function () {
            if (!this.active) return;
            var tracks = this.collection;
            this.resetTrack(tracks.current);
            // toggle next track
            if (!this.isSearch && tracks.current && tracks.length > 0) {
                tracks.current !== tracks.last() ?
                    this.toggle(tracks.next()) :
                    (delete tracks.current);
            }
        }, 

        handleAudioTimeUpdate: function () {
            if (!this.active) return;
            var track = this.collection.current;
            if (!track) return;
            this.trackElementById(this.collection.current.get('id'))
                .find('.track-duration').text(
                    _secondsToTime(
                        track.get('duration') / 1000 - yayo.audio.currentTime()
                    )
                );
        },

        handleAudioError: function () {
            if (!this.active) return;
            this.trackElementById(this.collection.current.get('id')).remove();
            this.collection.remove(this.collection.current);
        },

        trackElementById: function (id) {
            // inner quotes are reuired for Opera to comprehend
            // data-attribute selector
            return this.$el.find('[data-track-id=\'' + id + '\']');
        },

        resetTrack: function (track) {
            this.trackElementById(track.cid).removeClass('playing current')
                .find('.track-duration')
                .text(_secondsToTime(track.get('duration') / 1000));
        },

        close: function () {
            yayo.audio.off('loaded', this.handleAudioLoaded);
            yayo.audio.off('error', this.handleAudioError);
            yayo.audio.off('timeupdate', this.handleAudioTimeUpdate);
            yayo.audio.off('ended', this.handleAudioEnded);
        }
    });

    var _secondsToTime = function (seconds) {
        var hours   = ~~(seconds / 3600),
            minutes = ~~((seconds - (hours * 3600)) / 60);
        
        seconds = ~~(seconds - (hours * 3600) - (minutes * 60));
        seconds < 10 && (seconds = '0' + seconds);
        return (hours ? (hours + ':') : '') + minutes + ':' + seconds;
    };

    return yayo.Tracks = {
        Model: Track,
        Collection: Tracks,
        View: TracksView
    };

}(window.yayo || (window.yayo = {}));
