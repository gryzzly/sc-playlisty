// Searching
// ========================================================================
~function (yayo) {"use strict";

    // Search component is responsible for firing search over SC API
    // and that holds reference to the list of tracks returned from that search.
    // To retrieve tracks from search results, talk to SearchController.tracks 
    // collection.
    //
    // Search input is disabled by default, it only get activated when 
    // some playlist is selected. Controlled by yayo.app
    // 
    // Search controller depends on an instance of Playlists collection
    // as it needs to have knowledge about the current playlist.

    yayo.SearchController = Backbone.View.extend({
        el: $('.search'),
        initialize: function () {
            this.input = this.$el.find('input');
            // tracks related to search
            this.tracksView = new yayo.Tracks.View({
                collection: (this.tracks = new yayo.Tracks.Collection())
            });
            // append tracks view to hold search results
            this.$el.find('.search-results').html(this.tracksView.$el);
        },
        events: {
            "submit form" : "search"
        },
        search: function (e) {
            e.preventDefault();
            console.log('searching for ' + this.input.val());
            yayo.router.navigate(
                yayo.playlists.active.get('title') + '/search/' + encodeURIComponent(this.input.val()), 
                { trigger: true }
            );
        }
    });

}(window.yayo || (window.yayo = {}));
