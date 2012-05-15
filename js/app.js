// App
// ========================================================================
~function (yayo) {

    yayo.SC_API = 'http://api.soundcloud.com';
    yayo.SC_ID = '7118ab0b5da08eafa2a36a2fca98a905';

    // Use SDK to communicate with SC
    Backbone.sync = function (method, model, options) {
        if ( method === 'read' ) {
            $.ajax({
                dataType: 'jsonp',
                url: yayo.SC_API + model.url,
                data: {
                    format: 'json',
                    client_id: yayo.SC_ID
                },
                success: options.success
            });
            // SC.get(
            //     // serialize data object
            //     model.url + (options.data ? ('?' + $.param(options.data)) : ''),
            //     { format: 'json' },
            //     options.success
            // );
        }
    };

    yayo.App = Backbone.View.extend({
        page: function (view) {
            // allow back navigation
            this._previousPage = this._currentPage;
            this._currentPage = view;
            // toggle DOM classes
            if (this._previousPage) this._previousPage.$el.addClass('hidden')
            this._currentPage.$el.removeClass('hidden');
        },
        back: function () {
            this.page(this._previousPage);
        },
        initialize: function () {
            // Always create a collection of playlists on the application start
            yayo.playlistsView = new yayo.PlaylistsView({
                collection: (yayo.playlists = new yayo.Playlists)
            });
            // show loading 
            var loading = $('.loading');
            yayo.audio.on('loading', function () {
                loading.removeClass('hidden');
                new Spinner().spin(loading[0]);
            });
            yayo.audio.on('loaded', function () {
                loading.addClass('hidden');
            });
            loading.on('click', function (e) {
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

    yayo.app = new yayo.App();
    // initialize router
    yayo.router = new yayo.Router();
    // initialize history
    Backbone.history.start();

}(window.yayo || (window.yayo = {}))
