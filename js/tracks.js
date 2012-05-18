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
            this.collection.on('reset', function () {
                this.render();
            }, this).trigger('reset');

            // toggle presentation
            this.on('pause deactivated', function () {
                this.$el.find('.track').removeClass('active');
            }, this);
            this.on('play', function () {
                this.$el.find('.track').removeClass('active');
                this.$el.find(
                    '[data-track-id=\'' + this.collection.current.get('id') + '\']'
                ).addClass('active');
            }, this);

            yayo.audio.on('loaded', this.handleAudioLoaded, this);

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
            // render each track and prepare player objects
            this.collection.forEach(function (model) {
                html.push(Mustache.render(this.template, {
                    title: model.get('title'),
                    author: model.get('user') && model.get('user').username,
                    id: model.get('id'),
                    search: this.isSearch
                }));
            }, this);
            // insert collection into the DOM
            this.$el.html(html.join(''));
            return this;
        },

        events: {
            'click .toggler' : 'handleToggle',
            'click .remove' : 'handleRemove',
            'click .up' : 'handleUp',
            'click .down' : 'handleDown',
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
            this.$el.find(
                '[data-track-id=\'' + track.get('id') + '\']'
            ).remove();
            this.collection.remove(track);
        },

        handleUp: function () {
        },

        handleDown: function () {
        },

        toggle: function (track) {
            var id = track.get('id'),
                // inner quotes are reuired for Opera to comprehend
                // data-attribute selector
                element = this.$el.find('[data-track-id=\'' + id + '\']'),
                activeView = yayo.playlists.activeView;

            if (!this.active) this.active = true;

            if (activeView) {
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
            if (this.collection.current !== track) {
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

        handleAudioError: function () {
            if (!this.active) return;
            this.$el.find(
                '[data-track-id=\'' + this.collection.current.get('id') + '\']'
            ).remove();
            this.collection.remove(this.collection.current);
        },

        handleAudioEnded: function () {
            if (!this.active) return;
            var tracks = this.collection;
            this.$el.find('.track').removeClass('active');
            if (!this.isSearch && tracks.current && tracks.length > 0) {
                tracks.current !== tracks.last() ?
                    this.toggle(tracks.next()) :
                    (delete tracks.current);
            }
        }, 

        close: function () {
            yayo.audio.off('loaded', this.handleAudioLoaded);
            yayo.audio.off('error', this.handleAudioError);
            yayo.audio.off('ended', this.handleAudioEnded);
        }
    });

    return yayo.Tracks = {
        Model: Track,
        Collection: Tracks,
        View: TracksView
    };

}(window.yayo || (window.yayo = {}));
