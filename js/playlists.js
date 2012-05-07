// PlayLists
// ========================================================================
~function (yayo) {"use strict";

    // Playlists collection holds reference to the currently selected 
    // playlist. `yayo.playlists.active` to retrive it

    // Minimize interaction with local storage by talking to memory instead
    var _store = {};

    // Cache $ calls
    var $playlists = $('.playlists'),
        $playlistTpl = $('.playlist-tpl').html();

    // Single Playlist
    var Playlist = Backbone.Model.extend({
        defaults: {
            title: "Untitled Playlist",
            description: "",
            tracks: []
        },
        // set IDs based on backbone CIDs
        initialize: function () {
            this.set('id', this.cid);
        }
    });

    // Single Playlist View
    var PlaylistView = Backbone.View.extend({
        tagName: 'div',
        className: 'current-playlist',
        template: $('#playlist-tpl').html(),
        render: function () {
            $playlists.after(
                this.$el.html(
                    Mustache.render(this.template, this.model.toJSON())
                )
            );
            this.$el.find('.tracks').html(this.tracksView.$el);
        },
        initialize: function () {
            console.log(this.model.get('tracks'));
            // tracks related to a playlist
            this.tracksView = new yayo.Tracks.View({
                collection: new yayo.Tracks.Collection(this.model.get('tracks'))
            });
            this.model.on('reset', this.render, this);
            this.render();
        },
        events: {
            'click .playlist-add': "addTracks"
        },
        addTracks: function (e) {
            this.model.set(
                'tracks', 
                yayo.searchController.tracks.getSelected()
            );
        }
    });

    // Playlist collection
    var Playlists = Backbone.Collection.extend({
        model: Playlist,
        // Persist playlists to localStorage
        store: function () {
            // TODO: optimize storing to do less calls to localStorage
            //       maybe only store on unload? or when pressing a button?
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
            this.on('reset', function () { console.log('reset playlists') });
            this.restore();
        }
    });

    // Playlists View
    var PlaylistsView = Backbone.View.extend({
        el: $('.playlists'),
        template: $('#playlist-option-tpl').html(),
        render: function () {
            console.log('rendering playlists');
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
        initialize: function () {
            this.collection.on('change add reset', this.render, this);
            this.collection.on('add change', function (playlist) {
                this.collection.store();
            }, this);
            // select first playlist
            if (!this.collection.isEmpty()) {
                this.setActive(this.collection.first());
            }
            this.render();
        },
        events: {
            "click .playlist-new" : "add",
            "change select" : "select",
        },
        // Add new playlist and then select it 
        add: function () {
            var name = prompt("Please enter the name of new playlist"), playlist;
            this.collection.add(name ? { title: name } : {});
            playlist = this.collection.last();
            this.setActive(playlist);
        },
        // Remove playlist
        remove: function () {
            
        },
        // Handle select box change 
        select: function (e) {
            this.setActive(this.collection.getByCid(e.target.value));
        },
        // Select playlist
        setActive: function (playlist) {
            console.log('setting active playlist ' + playlist.get('title'));
            // clean up previous playlist view
            this.collection.currentView && this.collection.currentView.remove();
            // save references to active playlist
            this.collection.active = playlist;
            this.collection.currentView = new PlaylistView({ model: playlist });
            yayo.router.navigate(playlist.get('title'), { trigger: true });
            this.collection.trigger('set-active');
        }
    });

    return yayo.Playlists = {
        Model: Playlist,
        Collection: Playlists,
        View: PlaylistsView
    };

}(window.yayo || (window.yayo = {}));
