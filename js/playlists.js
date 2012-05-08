// Playlists
// ========================================================================
~function (yayo) {'use strict';

    // In memory copy of localStorage['yayo']
    var _store;

    // Single playlist
    yayo.Playlist = Backbone.Model.extend({
        defaults: {
            title: "Untitled Playlist",
            description: "",
            tracks: []
        },
        hasTracks: function () {
            return this.get('tracks').length > 0;
        },
        // set IDs based on backbone CIDs
        initialize: function () {
            this.set('id', this.cid);
        }
    });

    // Single playlist view
    // It can nest two views:
    // - own tracks view, that contains tracks that are saved to this playlist
    // - search view, that contains a search control + list of playable tracks
    //   (search results)
    yayo.PlaylistView = Backbone.View.extend({
        el: $('.playlist'),
        template: $('#playlist-tpl').html(),
        render: function () {
            // `this.$el` is shared among instances of PlaylistView
            // so we need to unbind all event handlers bound to `this.$el`
            // by previous instances
            this.$el.off();
            // playlist meta data
            this.$el.html(
                Mustache.render(this.template, this.model.toJSON())
            );
            // playlist tracks
            this.$el.find('.tracks').html(this.tracksView.$el);
            // TODO: when there are tracks, show button to toggle search view
            if (!this.model.hasTracks()) {
                this.renderSearch();
            }
        },
        renderSearch: function () {
            this.search = new yayo.SearchView();
            this.$el.append(this.search.$el);
            this.search.on('selected', function () {
                // TODO: don't do this on every checkbox interaction
                this.$el.find('.playlist-add').prop('disabled', false);
            }, this);
        },
        initialize: function () {
            // assign route based on playlist's title
            this.route = 'playlists/' + encodeURIComponent(this.model.get('title')),
            // tracks related to a playlist
            this.tracksView = new yayo.Tracks.View({
                collection: new yayo.Tracks.Collection(this.model.get('tracks'))
            });
            // rerender things on change
            this.model.on('reset change add', function () {
                this.tracksView.collection.reset(this.model.get('tracks'));
            }, this);
            this.render();
        },
        events: {
            'click .playlist-add': 'addTracks',
            'click .back': 'back'
        },
        addTracks: function (e) {
            // add tracks from search to the playlist
            this.model.set(
                'tracks',
                this.model.get('tracks').concat(this.search.tracks.getSelected())
            );
        },
        back: function (e) {
            e.preventDefault();
            yayo.app.back();
        }
    });

    // Playlists list
    yayo.Playlists = Backbone.Collection.extend({
        model: yayo.Playlist,
        // Persist playlists to localStorage
        store: function () {
            // TODO: optimize storing to do less calls to localStorage
            //       maybe only store on unload? or per user action?
            _store = this.toJSON();
            localStorage['yayo'] = JSON.stringify(_store);
        },
        // Restore playlists from localStorage
        restore: function () {
            // read out the data
            _store = localStorage['yayo'];
            // cover both undefined and null
            if (_store == null) return;
            _store = JSON.parse(_store);
            this.reset(_store);
        },
        initialize: function () {
            this.on('reset add change', function () {
                this.store();
            }, this);
            this.restore();
        }
    });
    // Playlists view
    yayo.PlaylistsView = Backbone.View.extend({
        el: $('.playlists'),
        template: $('#playlist-option-tpl').html(),
        // Render playlists into select box
        render: function () {
            var self = this;
            // for each of the playlists create an option in select box
            this.$el.find('select').html(function (){
                var lists = [];
                self.collection.forEach(function (playlist) {
                    lists.push(Mustache.render(self.template, playlist.toJSON()));
                });
                return lists.join('');
            }());
        },
        // Attach event handlers and render the view
        initialize: function () {
            this.route = 'playlists';
            // TODO: only re-render when view is visible
            this.collection.on('change add reset', this.render, this);
            this.render();
        },
        // Events handlers map
        events: {
            "click .playlist-new" : "add",
            "click option" : "select",
        },
        // Add new playlist and then select it
        add: function () {
            var name = prompt("Please enter the name of new playlist"), playlist;
            this.collection.add(name ? { title: name } : {});
            playlist = this.collection.last();
            this.setActive(playlist);
        },
        // Remove playlist
        // @param {Object} playlist – playlist model
        remove: function (playlist) {

        },
        // Handle select box change
        // @param {Object} e – DOM event object propagated from this.$el
        select: function (e) {
            this.setActive(this.collection.getByCid(e.target.value));
        },
        // Select playlist
        // @param {Object} playlist – playlist model
        setActive: function (playlist) {
            console.log('setting active playlist ' + playlist.get('title'));

            if (!(this.collection.active && this.collection.active === playlist)) {
                this.collection.active = playlist;
                this.collection.activeView = new yayo.PlaylistView({ model: playlist });
            }
            // save references to active playlist and its view
            this.collection.active = playlist;

            // navigate to the playlist page
            yayo.app.page(this.collection.activeView);
            this.collection.trigger('set-active');
        }
    });

}(window.yayo || (window.yayo = {}))