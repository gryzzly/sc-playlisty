// App
// ========================================================================
~function (yayo) {

    yayo.SC_API = 'http://api.soundcloud.com';
    yayo.SC_ID = '7118ab0b5da08eafa2a36a2fca98a905';
    yayo.SPIN_CONFIG = {
      lines: 13, // The number of lines to draw
      length: 7, // The length of each line
      width: 4, // The line thickness
      radius: 10, // The radius of the inner circle
      rotate: 0, // The rotation offset
      color: '#555', // #rgb or #rrggbb
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: true, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 999, // The z-index (defaults to 2000000000)
      top: 'auto', // Top position relative to parent in px
      left: 'auto' // Left position relative to parent in px
    };

    // Properly kill views and provide a hook to remove references to this view
    Backbone.View.prototype.close = function () {
        this.$el.off();
        this.remove();
        this.off();
        this.close && this.close();
    };

    // enable :active on mobile devices
    document.addEventListener('touchend', function(){});

    // Communicate with SC
    Backbone.sync = function (method, model, options) {
        if ( method === 'read' ) {
            $.ajax({
                dataType: 'json',
                url: yayo.SC_API + model.url,
                data: _.extend({
                    format: 'json',
                    client_id: yayo.SC_ID
                    // good for debugging
                    // 'duration[from]': 5000,
                    // 'duration[to]': 8000
                }, options.data || {}),
                success: options.success
            });
        }
    };

    yayo.App = Backbone.View.extend({

        page: function (view) {
            // allow back navigation
            this._previousPage = this._currentPage;
            this._currentPage = view;
            // toggle DOM classes
            if (this._previousPage) this._previousPage.$el.addClass('hidden');
            this._currentPage.$el.removeClass('hidden');
        },

        back: function () {
            this.page(this._previousPage);
        },

        initialize: function () {
            var loading = $('.loading'), spinner;
            // initialize spinner 
            spinner = new Spinner(yayo.SPIN_CONFIG);
            // always create a collection of playlists on the application start
            yayo.playlistsView = new yayo.PlaylistsView({
                collection: (yayo.playlists = new yayo.Playlists)
            });
            yayo.audio.on('loading', function () {
                loading.removeClass('hidden');
                spinner.spin(loading[0]);
            });
            yayo.audio.on('loaded', function () {
                loading.addClass('hidden');
                spinner.stop();
            });
            loading.on(yayo.down, function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
        }
    });

    yayo.Router = Backbone.Router.extend({

        routes: {
            'playlists' : 'playlists',
            'playlists/:playlist' : 'playlist',
            'playlists/:playlist/search/:query' : 'search',
            '*other' : 'defaultRoute'
        },

        playlists: function (playlist) {
            console.log('Route: “playlists”');
            yayo.app.page(yayo.playlistsView);
        },

        playlist: function (playlist) {
            console.log('Route: ”playlist”: ' + playlist);
            playlist = decodeURIComponent(playlist);
            playlist = yayo.playlists.getByTitle(playlist)
            // when no playlist is found by this title, use default route
            if (!playlist) return this.navigate('playlists', true);
            yayo.playlists.setActive(playlist);
            yayo.app.page(yayo.playlists.activeView);
        },

        defaultRoute: function (other) {
            this.navigate('playlists', true);
        }
    });

    // initialize app
    yayo.app = new yayo.App();
    // initialize router
    yayo.router = new yayo.Router();
    // initialize history
    Backbone.history.start();

}(window.yayo || (window.yayo = {}));
