// Playlists
// ========================================================================
~function (yayo) {'use strict';

    // Memory copy of localStorage['yayo']
    var _store;

    // Single playlist
    yayo.Playlist = Backbone.Model.extend({
        defaults: {
            title: 'Untitled Playlist',
            description: '',
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
            this.search.tracks.on('selected', function () {
                this.$el.find('.add').removeClass('disabled');
            }, this);
        },
        initialize: function () {
            // assign route based on playlist's title
            this.route = 'playlists/' + encodeURIComponent(this.model.get('title'));
            // tracks related to a playlist
            this.tracksView = new yayo.Tracks.View({
                collection: new yayo.Tracks.Collection(this.model.get('tracks'))
            });
            // rerender things on change
            this.model.on('reset change add', function () {
                this.tracksView.collection.reset(this.model.get('tracks'));
            }, this);

            // update controls
            this.tracksView.on('play', function () {
                this.$el.find('.toggle').text('pause');
            }, this);
            this.tracksView.on('pause', function () {
                this.$el.find('.toggle').text('play');
            }, this);
            this.render();
        },
        events: {
            'click .add': 'addTracks',
            'click .page-back': 'list',
            'click .toggle' : 'toggle',
            'click .delete' : 'delete'
        },
        addTracks: function (e) {
            var target = $(e.target);
            if (target.hasClass('disabled')) return;
            // add tracks from search to the playlist
            console.log('adding tracks');
            this.model.set(
                'tracks',
                this.model.get('tracks').concat(this.search.tracks.getSelected())
            );
            console.log('added tracks', this.search.tracks.getSelected());
        },
        list: function (e) {
            e.preventDefault();
            console.log('to list view');
            yayo.router.navigate('playlists', true)
        },
        toggle: function (e) {
            this.playing = !this.playing;
            var tracks = this.tracksView.collection;
            this.tracksView.toggle(tracks.current || tracks.first());
        },
        'delete': function () {
            if (!confirm('Are you sure you want to remove this playlist?')) return;
            this.$el.html('');
            this.model.collection.remove(this.model);
            yayo.router.navigate('playlists', true)
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
            this.on('reset add change remove', function () {
                this.store();
            }, this);
            this.restore();
        },
        getByTitle: function (title) {
            return this.find(function(playlist) {
                return playlist.get('title') === title;
            });
        },
        setActive: function (playlist) {
            console.log('setting active playlist ' + playlist.get('title'));

            if (this.active !== playlist) {
                // save references to active playlist and its view
                this.active = playlist;
                // initialize playlist view
                this.activeView = new yayo.PlaylistView({ model: playlist });
            }
        }
    });
    // Playlists view
    yayo.PlaylistsView = Backbone.View.extend({
        el: $('.playlists'),
        template: $('#playlist-item-tpl').html(),
        // Render playlists into select box
        render: function () {
            var self = this;
            // for each of the playlists create an option in select box
            this.$el.find('.list').html(function (){
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
            this.collection.on('change add reset remove', this.render, this);
            // handle uniqueness of titles
            this.collection.on('error', function (model, error) {
                this.add();
            }, this);
            this.render();
        },
        // Events handlers map
        events: {
            'click .playlists-new' : 'add',
            'click li' : 'select'
        },
        // TODO: ask for truly unique titles
        // Add new playlist and then select it
        add: function () {
            var name = prompt('Please enter unique name of new playlist'), playlist;
            // if (this.collection.any(function (playlist) {
            //     return name === playlist.get('title');
            // })) return this.add();

            this.collection.add(name ? { title: name } : {});
            playlist = this.collection.last();
            yayo.app.page(new yayo.PlaylistView({model: playlist}));
            // this.collection.setActive(playlist);
        },
        // Remove playlist
        // @param {Object} playlist – playlist model
        remove: function (playlist) {

        },
        // Handle click on playlist
        // @param {Object} e – DOM event object propagated from this.$el
        select: function (e) {
            // this.collection.setActive();
            // navigate to the playlist page
            yayo.router.navigate(
                'playlists/' + 
                encodeURIComponent(this.collection.getByCid(e.target.dataset.playlistId).get('title')),
                true
            );
        }
    });

}(window.yayo || (window.yayo = {}));
