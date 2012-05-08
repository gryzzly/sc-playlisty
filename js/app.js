// App
// ========================================================================
~function (yayo) {

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

    yayo.App = Backbone.View.extend({
        initialize: function () {
            // initialize router
            yayo.router = new yayo.Router();
            // initialize history
            Backbone.history.start();
            // default page's playlists
            this.page(yayo.playlistsView = new yayo.PlaylistsView({
                collection: (yayo.playlists = new yayo.Playlists)
            }));
        },
        page: function (view) {
            console.log("app.page calld with route:", view.route)
            yayo.router.navigate(view.route, { trigger: true });
            // allow back navigation
            this._previousPage = this._currentPage;
            this._currentPage = view;
            // toggle DOM classes
            if (this._previousPage) this._previousPage.$el.addClass('hidden')
            this._currentPage.$el.removeClass('hidden');
        },
        back: function () {
            this.page(this._previousPage);
        }
    });

    yayo.app = new yayo.App();

}(window.yayo || (window.yayo = {}))