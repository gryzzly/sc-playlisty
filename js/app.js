~function (doc, win, $, _, Backbone, undefined) {
    // SC SDK config
    SC.initialize({
        client_id: "7118ab0b5da08eafa2a36a2fca98a905"
    }); 

    // Use SDK to communicate with SC
    Backbone.sync = function (method, model, options) {
        if ( method === "read" ) {
            SC.get(
                // serialize data object
                model.url + (options.data ? ("?" + $.param(options.data)) : ""),
                { format: "json" },
                options.success
            );
        }
    };

    // Searching
    // ========================================================================
    var searchView = new (Backbone.View.extend({
        el: $('.search'),
        initialize: function () {
            this.input = this.$el.find('input');
        },
        events: {
            "submit form" : "search"
        },
        search: function (e) {
            e.preventDefault();
            router.navigate("search/" + encodeURIComponent(this.input.val()), {
                trigger: true
            });
        }
    }));
    
    // Tracks
    // ========================================================================

    // Single track model
    var Track = Backbone.Model.extend();
    // Tracks view
    var tracksView, TracksView = Backbone.View.extend({
        el: $('.search-results'),
        trackTemplate: $('#track-tpl').html(),
        initialize: function () {
            this.collection.on('reset', function () {
                this.render();
            }, this);
            this.render();
        },
        render: function () {
            var html = [];
            // render each track and prepare player objects
            this.collection.forEach(function (model) {
                html.push(Mustache.render(this.trackTemplate, {
                    title: model.get('title'),
                    author: model.get('user').username,
                    cid: model.cid
                }));
                // TODO: isn't there a way to have one controller with list of tracks?
                SC.stream(
                    '/tracks/' + model.get("id"),
                    { preferFlash: false },
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
            cid = target.closest('.track').data('track-cid');
            // TODO: don't store reference to model in DOM 
            model = this.collection.getByCid(cid);
            model.player && model.player.togglePause();
        },
        select: function (e) {
            var target = $(e.target);
            target.parent()[(e.target.checked ? 'add' : 'remove') + 'Class']('active');
            var cid = target.closest('.track').data('track-cid');
            this.collection.getByCid(cid).set('selected', e.target.checked);
        }
    });
    // Tracks collection
    var tracks, Tracks = Backbone.Collection.extend({
        model: Track,
        url: "/tracks.json"
    });

    // initialize tracks
    tracksView = new TracksView({ collection: (tracks = new Tracks) });

    // PlayLists
    // ========================================================================
    var Playlist = Backbone.Model.extend({
        defaults: {
            title: "Untitled Playlist",
            description: "",
            tracks: []
        }
    });
    var playlists, Playlists = Backbone.Collection.extend({
        model: Playlist
    });
    var playlistsView, PlaylistsView = Backbone.View.extend({
        el: $('.playlists'),
        template: $('#playlist-tpl').html(),
        render: function () {
            var self = this;
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
            this.render();
        },
        events: {
            "click button" : "add",
            "change select" : "select"
        },
        add: function () {
            var name = prompt("Please enter the name of new playlist"), playlist;
            this.collection.add({ title: name });
            playlist = this.collection.last();
            this.setActive(playlist);
        },
        select: function (e) {
            this.setActive(this.collection.getByCid(e.target.value));
        },
        setActive: function (playlist) {
            this.collection.active = playlist;
            router.navigate(playlist.get('title'));
        }
    });
    // initialize playlists
    playlistsView = new PlaylistsView({ collection: playlists = new Playlists() });

    // Routes
    // ========================================================================
    var router = new (Backbone.Router.extend({
        routes: {
            ":playlist" : "playlist",
            ":playlist/?search=:query" : "search"
        },
        playlist: function (playlist) {
            
        },
        search: function (query) {
            // perform search
            tracks.fetch({
                data: {
                    // will load tracks.url + '&q=%query%'
                    q: query 
                }
            });
        }
    }));

    // initialize history change handler
    Backbone.history.start();

}(document, window, window.jQuery || window.Zepto, _, Backbone);
