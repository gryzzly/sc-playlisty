# An application outline:

Modules:
- App
- Playlists
- Tracks
- Search

## App module

Main controller for the application that also contains the router.

## Playlists module

Consists of:
- Single playlist's model and view
- Collection of playlists and view representing the UI for the collection

### Single playlist model

Single playlist model stores copies of SoundCloud tracks as returned
by the API from server in an attribute `tracks`. There is also a convenience
method `hasTracks` that returns Boolean.

Its instances are usually part of playlists collection.

### Single playlist view

Single playlist view renders given playlist into DOM and handles user
interaction. Playlist can have two modes: viewing and editing.

While in viewing mode, user can start or stop playing tracks in the order
tracks are presented. By default, when one track will finish playing, the next
one will start. There is a button in UI to prevent that (“stop after playing“).
There is a currently playing view, that contains information about current
track with the controls: rewinding of the track is possible by interacting with
progress bar for the currently playing track.

While in editing mode, user can change playlist's title and description,
can  search for new tracks and add them to the playlist. It is also possible
to remove and reorder existing tracks. User can also completely remove
the playlist while in editing view. Then application switches to playlists
view.

### Playlists collection

Collection of playlists. Takes care of persisting and restoring the lists
to and from localStorage.

### Playlists view

Starting point of the application. Presents user's saved playlists and allows
to select one by tapping or clicking it. Contains a control that triggers
creating a new list.

## Tracks module

Generic constructors for tracks:
- Track model
- Tracks collection
- Tracks view

### Track model

Simple track's model, `id`s are used for identification.

### Tracks collection

Tracks can be selected for whatever purpose (picking tracks from search results
to then add them to a playlist, deleting tracks in batches from the playlist).
Tracks collection proviedes convenience method `getSelected` to retrieve these
selected tracks.

### Tracks view

Tracks view represents a list of tracks. Each of them can be played by hitting
play button. The list is ordered and tracks play one after another by that
order. User can use “next” and “previous” buttons to control playback.

## Search

