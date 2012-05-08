// Router
// ========================================================================
~function (yayo) {'use strict';

    yayo.Router = Backbone.Router.extend({
        routes: {
            "playlists" : "playlists",
            "playlists/:playlist/" : "playlist",
            "playlists/:playlist/search/:query" : "search"
        },
        playlists: function (playlist) {
            console.log('at playlists view');
        },
        playlist: function (playlist) {
            console.log('at ' + playlist + ' view');
        },
        search: function (playlist, query) {
            console.log('at ' + playlist + ' view, with search query: ' + query);
        }
    });

}(window.yayo || (window.yayo = {}))