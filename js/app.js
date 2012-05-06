~function (doc, win, $, _, Backbone, undefined) {

    // SC API config
    SC.initialize({
        client_id: "7118ab0b5da08eafa2a36a2fca98a905"
    }); 
    // $.scPlayer.defaults.onDomReady = null;

    // Use SC object to do requests
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
            router.navigate("search/" + encodeURIComponent(this.input.val()), {trigger: true});
        }
    }));
    
    // Tracks
    // ========================================================================

    // Single track model
    var Track = Backbone.Model.extend();
    // Single track view
    var TrackView = Backbone.View.extend({
        tagName: 'li',
        template: $('#track-tpl').html(),
        initialize: function () {
            this.render();
        },
        render: function () {
            $('body').append(this.$el.html( Mustache.render(this.template, {
                title: this.model.get('title'),
                author: this.model.get('user').username
            })));
            // prepare player object
            SC.stream('/tracks/' + this.model.get("id"), function (player) {
                this.player = player;
            }.bind(this));
            return this;
        },
        events: {
            "change input" : "toggle"
        },
        toggle: function (e) {
            this.player.togglePause();
        }
    });
    // Tracks collection
    var tracks = new (Backbone.Collection.extend({
        model: Track,
        url: "/tracks.json",
        initialize: function () {
            // on track retrieval initialize track views
            this.on('reset', function () {
                tracks.forEach(function (track) {
                    // move to tracks view
                    new TrackView({ model: track })
                });
            });
        }
    }));

    // Routes
    // ========================================================================
    var router = new (Backbone.Router.extend({
        routes: {
            "search/:query" : "search"
        },
        search: function (query) {
            // set input to previous query 
            searchView.input.val(query);
            // perform search
            console.log(query);
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
