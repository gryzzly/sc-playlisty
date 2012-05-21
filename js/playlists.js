// Playlists
// ========================================================================
~function (yayo) {'use strict';

    // Memory copy of localStorage['yayo']
    var _store;

    // Single playlist
    yayo.Playlist = Backbone.Model.extend({

        defaults: {
            title: 'Untitled Playlist',
            description: '',
            tracks: []
        },

        hasTracks: function () {
            return this.get('tracks').length > 0;
        },

        // set IDs based on backbone CIDs
        initialize: function () {
            this.set('id', this.cid);
        }
    });

    // Single playlist view
    // It can nest two views:
    // - own tracks view, that contains tracks that are saved to this playlist
    // - search view, that contains a search control + list of playable tracks
    //   (search results)
    yayo.PlaylistView = Backbone.View.extend({

        el: $('.playlist'),

        template: $('#playlist-tpl').html(),

        editTemplate: $('#playlist-edit-tpl').html(),

        render: function () {
            // playlist meta data
            this.$el.html(
                Mustache.render(this.template, this.model.toJSON())
            );
            this.renderTracks();
            // when there are no tracks, directly show search box
            !this.model.hasTracks() && this.renderSearch();
        },

        renderSearch: function () {
            this.search = new yayo.SearchView();
            this.$el.append(this.search.$el);
            this.search.tracks.on('selected', function () {
                this.$el.find('.add').removeClass('disabled');
            }, this);
            this.search.$el.find('.search-input').trigger('focus');
        },

        renderEdit: function () {
            this.$el
                .html(
                    Mustache.render(this.editTemplate, this.model.toJSON())
                );
            this.renderTracks({ edit: true });
        },

        renderTracks: function (options) {
            this.tracksView && this.tracksView.close();
            // tracks related to a playlist
            this.tracksView = new yayo.Tracks.View({
                collection: new yayo.Tracks.Collection(this.model.get('tracks'))
            });
            // update controls
            this.tracksView.on('play', function () {
                this.$el.find('.toggle').text('pause');
            }, this);
            this.tracksView.on('pause deactivated', function () {
                this.$el.find('.toggle').text('play');
            }, this);
            this.tracksView.collection.on('remove', function () {
                // FIXME: find a better approach 
                // https://github.com/documentcloud/backbone/pull/981
                this.updatingFromTracks = true;
                this.model.set({
                    tracks: this.tracksView.collection.toJSON()
                });
                this.updatingFromTracks = false;
            }, this);
            // playlist tracks
            this.$el.find('.tracks').html(this.tracksView.$el);
            options && options.edit && this.tracksView.$el.addClass('editing');
        },

        initialize: function () {
            // `this.$el` is shared among instances of PlaylistView
            // so we need to unbind all event handlers bound to `this.$el`
            // by previous instances
            this.$el.off();
            
            // hack to conditionally construct event handler names
            this.events = this.events || {};
            this.events[yayo.down + ' .add'] = 'addTracks';
            this.events[yayo.down + ' .page-back'] = 'list';
            this.events[yayo.down + ' .toggle'] = 'toggleAudio';
            this.events[yayo.down + ' .delete'] = 'deletePlaylist';
            this.events[yayo.down + ' .search'] = 'toggleSearch';
            this.events[yayo.down + ' .edit'] = 
                this.events[yayo.down + ' .save'] = 'toggleEdit';
            this.delegateEvents();

            // rerender things on change
            this.model.on('reset change add', function () {
                if (this.updatingFromTracks) return;
                this.tracksView.collection.reset(this.model.get('tracks'));
            }, this);
            yayo.audio.on('ended', function () {
                this.$el.find('.toggle').text('play');
            }, this);
            this.render();
        },

        addTracks: function (e) {
            var target = $(e.target);
            if (target.hasClass('disabled')) return;
            // add tracks from search to the playlist
            this.model.set(
                'tracks',
                this.model.get('tracks').concat(this.search.tracks.getSelected())
            );
        },

        list: function (e) {
            e.preventDefault();
            console.log('to list view');
            yayo.router.navigate('playlists', true);
        },

        toggleAudio: function (e) {
            var tracks = this.tracksView.collection;
            this.tracksView.toggle(tracks.current || tracks.first());
        },

        deletePlaylist: function () {
            if (!confirm('Are you sure you want to remove this playlist?')) return;
            this.$el.html('');
            this.model.collection.remove(this.model);
            yayo.router.navigate('playlists', true);
        },

        toggleSearch: function () {
            var searchNode;
            if (this.search) {
                searchNode = this.search.$el;
                if (searchNode.hasClass('hidden')) {
                    searchNode.removeClass('hidden');
                    searchNode.find('.search-input').trigger('focus');
                } else {
                    searchNode.addClass('hidden');
                }
                return;
            }
            this.renderSearch();
        },

        toggleEdit: function () {
            if (this.editing) {
                this.model.set(
                    'title',
                    this.$el.find('.title-input').val()
                );
                this.model.set(
                    'description',
                    this.$el.find('.description-textarea').val()
                );
                yayo.router.navigate(
                    'playlists/' + 
                    encodeURIComponent(this.model.get('title'))
                );
                this.render();
            } else {
                this.renderEdit();
            }
            this.editing = !this.editing;
        }
    });

    // Playlists list
    yayo.Playlists = Backbone.Collection.extend({

        model: yayo.Playlist,

        // Persist playlists to localStorage
        store: function () {
            // TODO: optimize storing to do less calls to localStorage
            //       maybe only store on unload? or per user action?
            _store = this.toJSON();
            localStorage['yayo'] = JSON.stringify(_store);
        },

        // Restore playlists from localStorage
        restore: function () {
            // read out the data
            _store = localStorage['yayo'];
            // cover both undefined and null
            if (_store == null) return;
            _store = JSON.parse(_store);
            this.reset(_store);
        },

        initialize: function () {
            this.on('reset add change remove', function () {
                this.store();
            }, this);
            this.restore();
        },

        getByTitle: function (title) {
            return this.find(function(playlist) {
                return playlist.get('title') === title;
            });
        },

        setActive: function (playlist) {
            console.log('setting active playlist ' + playlist.get('title'));
            if (this.active !== playlist) {
                // save references to active playlist and its view
                this.active = playlist;
                // initialize playlist view
                this.activeView = new yayo.PlaylistView({ model: playlist });
            }
        }
    });

    // Playlists view
    yayo.PlaylistsView = Backbone.View.extend({

        el: $('.playlists'),

        template: $('#playlist-item-tpl').html(),

        // Render playlists into select box
        render: function () {
            var self = this;
            // for each of the playlists create an option in select box
            this.$el.find('.list').html(function (){
                var lists = [];
                self.collection.forEach(function (playlist) {
                    lists.push(Mustache.render(self.template, playlist.toJSON()));
                });
                return lists.join('');
            }());
        },

        // Attach event handlers and render the view
        initialize: function () {
            // hack to conditionally construct event handler names
            this.events = this.events || {};
            this.events[yayo.down + ' .playlists-new'] = 'add';
            this.events[yayo.down + ' li'] = 'select';
            this.delegateEvents();

            this.route = 'playlists';
            // TODO: only re-render when view is visible
            this.collection.on('change add reset remove', this.render, this);
            // TODO: handle uniqueness of titles
            this.collection.on('error', function (model, error) {
                this.add();
            }, this);
            this.render();
        },

        // TODO: ask for truly unique titles
        // Add new playlist and then select it
        add: function () {
            var name = prompt('Please enter unique name of new playlist'), playlist;
            // if (this.collection.any(function (playlist) {
            //     return name === playlist.get('title');
            // })) return this.add();

            this.collection.add(name ? { title: name } : {});
            playlist = this.collection.last();
            yayo.router.navigate(
                'playlists/' + encodeURIComponent(playlist.get('title')), 
                true
            );
        },

        // Handle click on playlist
        select: function (e) {
            // navigate to the playlist page
            yayo.router.navigate(
                'playlists/' + 
                encodeURIComponent(
                    this.collection.getByCid(e.target.dataset.playlistId)
                        .get('title')
                ),
                true
            );
        }
    });

}(window.yayo || (window.yayo = {}));
