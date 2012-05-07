// TODO:
// - add tracks to chosen playlist
// - view single playlist and edit it
// - play all tracks in playlist from single "play" button
// - change order of tracks
// - persist playlists to local storage
// - add JSON lib for the incapable
//
~function (doc, win, $, _, Backbone, yayo, undefined) {"use strict";
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

    // NOTE: 
    // instances are starting with lower case letters,
    // constructors and modules are starting with uppercase 
    //
    // @example: 
    // yayo.tracks // instance of yayo.Tracks.Collection 
    // yayo.Tracks // module containing all tracks related contructors (Model, Collection and View)
    // yayo.Tracks.Collection // constructor to instantiate collections of tracks

    yayo.app = new (Backbone.View.extend({
        initialize: function () {
            // initialize router
            yayo.router = new yayo.Router();
            // initialize history
            Backbone.history.start();
            // initialize playlists
            yayo.playlistsView = new yayo.Playlists.View({
                collection: (yayo.playlists = new yayo.Playlists.Collection())
            });
            // initialize search 
            yayo.searchController = new yayo.SearchController();

            // enable search input if some playlist's selected
            yayo.playlists.on('set-active', function () {
                yayo.searchController.input.prop('disabled', !yayo.playlists.active);
            }, this).trigger('set-active');

            // enable "save selected" button on current playlist
            yayo.searchController.tracks.on('checkbox', function () {
                yayo.playlists.active.view
                    .$el.find('.playlist-add').prop('disabled', this.getSelected().length = 0);
            });

        }
    }));



}(document, window, window.jQuery || window.Zepto, _, Backbone, window.yayo || (window.yayo = {}));
