// Routes
// ========================================================================
~function (yayo) {"use strict";

    // Router takes care of switching states between playlists and searches

    yayo.Router = Backbone.Router.extend({
        routes: {
            ":playlist" : "playlist",
            ":playlist/search/:query" : "search"
        },
        playlist: function (playlist) {
            playlist = yayo.playlists && yayo.playlists.find(function (_playlist) {
                return _playlist.get('title') === playlist;
            });
            // TODO: handle navigating directly to url without having "selected" playlist in memory
            if (playlist) {
                console.log('playlist ' + playlist.get('title') + ' is now active; playlist route');
            } else {
                this.navigate();
            }
        },
        search: function (playlist, query) {
            // perform search
            yayo.searchController.tracks.fetch({
                data: {
                    // will load tracks.url + '&q=%query%'
                    q: query 
                }
            });
        }
    });

}(window.yayo || (window.yayo = {}));
