// Tracks
// ========================================================================
~function (yayo) {"use strict";

    // Generic constructors for tracks. Tracks collection that holds tracks
    // data and tracks view, that is responsible for playing these tracks.
    //
    // In our app tracks are populated either by playlist or by search
    // component.


    // Single track model
    var Track = Backbone.Model.extend({
        initialize: function () {
            this.cid = this.get('id');
        }
    });

    // Tracks collection
    var Tracks = Backbone.Collection.extend({
        model: Track,
        url: "/tracks.json",
        getSelected: function () {
            return this.filter(function (track) {
                return !!track.selected;
            });
        }
    });

    // Tracks view
    var TracksView = Backbone.View.extend({
        tagName: 'div',
        className: 'tracks-list',
        template: $('#track-tpl').html(),
        initialize: function () {
            this.collection.on('reset', function () {
                this.render();
            }, this).trigger('reset');
        },
        render: function () {
            var html = [];
            // render each track and prepare player objects
            this.collection.forEach(function (model) {
                html.push(Mustache.render(this.template, {
                    title: model.get('title'),
                    author: model.get('user').username,
                    id: model.get('id')
                }));
                // TODO: isn't there a way to have one controller with list of tracks?
                SC.stream(
                    '/tracks/' + model.get('id'),
                    {
                        preferFlash: false,
                        onfinish: _.bind(function () {
                            this.collection.getByCid(this.model.get('id')).player.play();
                        }, this)
                    },
                    function (player) {
                        model.player = player;
                    }.bind(this)
                );
            }, this);
            // insert collection into the DOM
            this.$el.html(html.join(''));
            return this;
        },
        events: {
            "click button" : "toggle",
            "change input" : "select"
        },
        toggle: function (e) {
            var target = $(e.target), cid, model;
            target.toggleClass('active');
            cid = target.closest('.track').data('track-id');
            // TODO: don't store reference to model in DOM
            model = this.collection.getByCid(cid);
            model.player && model.player.togglePause();
        },
        select: function (e) {
            var target = $(e.target);
            target.parent()[(e.target.checked ? 'add' : 'remove') + 'Class']('active');
            var cid = target.closest('.track').data('track-id');
            this.collection.getByCid(cid).selected = e.target.checked;
            this.collection.trigger(
                (this.collection.getSelected().length > 0 ? '' : 'de' ) + 'selected'
            );
        }
    });

    return yayo.Tracks = {
        Model: Track,
        Collection: Tracks,
        View: TracksView
    };

}(window.yayo || (window.yayo = {}));