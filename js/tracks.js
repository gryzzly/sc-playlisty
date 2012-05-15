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
    // Tracks collection holds `current` property that contains ID of the 
    // currently playing track. 


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
                return next = (currentIndex === collection.length - 1) ?
                    collection.first() :
                    collection.at(currentIndex + 1);
                    
            }
        },
        prev: function () {
            var currentIndex, next;
            if (this.current) {
                currentIndex = this.indexOf(this.getByCid(this.current));
                return next = (currentIndex === 0) ?
                    collection.last() :
                    collection.at(currentIndex - 1);
            }
        }
    });

    // Tracks view
    var TracksView = Backbone.View.extend({
        tagName: 'ul',
        className: 'tracks-list',
        template: $('#track-tpl').html(),
        initialize: function (isSearch) {
            this.collection.on('reset', function () {
                this.render();
            }, this).trigger('reset');

            this.on('pause', function () {
                this.$el.find('.track').removeClass('active');
            }, this);
            this.on('play', function () {
                this.$el.find('.track').removeClass('active');
                this.$el.find(
                    '[data-track-id=\'' + this.collection.current.get('id') + '\']'
                ).addClass('active');
            }, this);


            isSearch && (this.isSearch = true);
        },
        render: function () {
            var html = [];
            // render each track and prepare player objects
            this.collection.forEach(function (model) {
                html.push(Mustache.render(this.template, {
                    title: model.get('title'),
                    author: model.get('user').username,
                    id: model.get('id'),
                    search: this.isSearch
                }));
                // TODO: isn't there a way to have one controller with list of tracks?
                // SC.stream(
                //     '/tracks/' + model.get('id'),
                //     {
                //         preferFlash: false,
                //         onfinish: _.bind(function () {
                //             this.collection.getByCid(this.model.get('id')).player.play();
                //         }, this)
                //     },
                //     function (player) {
                //         model.player = player;
                //     }.bind(this)
                // );
            }, this);
            // insert collection into the DOM
            this.$el.html(html.join(''));
            return this;
        },
        events: {
            'click button' : 'handleToggle',
            'change input' : 'select'
        },
        handleToggle: function (e) {
            this.toggle(
                this.collection.getByCid(
                    $(e.target).closest('.track').data('track-id')
                )
            );
        },
        toggle: function (track) {
            var id = track.get('id'),
                element = this.$el.find('[data-track-id=\'' + id + '\']');
            // load track
            if (this.collection.current !== track) {
                yayo.audio.load(id, _.bind(function () {
                    this.collection.current = track;
                    this.playPause();
                }, this));
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
        }
    });

    return yayo.Tracks = {
        Model: Track,
        Collection: Tracks,
        View: TracksView
    };

}(window.yayo || (window.yayo = {}));
