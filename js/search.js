// Searching
// ========================================================================
~function (yayo) {'use strict';

    // Search component is responsible for firing search over SC API
    // and holds reference to the list of tracks returned from that search.
    // To retrieve tracks from search results, talk to SearchView.tracks
    // collection.

    yayo.SearchView = Backbone.View.extend({

        tagName: 'div',

        className: 'search-view',

        tpl: $('#search-tpl').html(),

        render: function () {
            this.$el.html($(this.tpl));
        },

        initialize: function () {
            this.render();
            this.input = this.$el.find('input');
            // tracks related to search
            this.tracksView = new yayo.Tracks.View({
                collection: (this.tracks = new yayo.Tracks.Collection())
            }, {
                isSearch: true
            });
            // append tracks view to hold search results
            this.$el.find('.tracks').html(this.tracksView.$el);
            // propagate 'selected' events when tracks are selected
            this.tracks.on('selected', function () {
                this.trigger('selected');
            }, this);
        },

        events: {
            'submit form' : 'search'
        },

        search: function (e) {
            e.preventDefault();
            console.log('searching for ' + this.input.val());
            this.tracks.fetch({
                data: {
                    q: this.input.val()
                }
            });
        }
    });

}(window.yayo || (window.yayo = {}));
