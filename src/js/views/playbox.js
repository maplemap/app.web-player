'use strict';

App.Views.Playbox = Backbone.View.extend({
    className: App.Settings.classPrefix + '-playbox',
    volumeDefault: 0.2,

    events: {
        'click .stop': 'stopTrack',
        'click .play': 'playTrack',
        'click .pause': 'pauseTrack',
        'click .prev': 'prevTrack',
        'click .next': 'nextTrack'
    },

    initialize: function () {
        this.$audioBox = $( App.TmpEngine.getTemplate('audiobox') );
        this.playbox = App.TmpEngine.getTemplate('playbox');

        App.Events.on('start-playing-track', this.startTrack, this);

        this.render();
    },

    render: function () {
        this.$el.append( this.$audioBox );
        this.$el.append( this.playbox );

        this.$albumCover = this.$el.find('.album-cover');
        this.$progressBar = this.$el.find('.progress-bar');
        this.$loadingBar = this.$progressBar.find('.loading-bar');
        this.$volumeBar = this.$el.find('.volume-bar');
        this.$trackInfoName = this.$el.find('.track-info .name');
        this.$trackInfoExtra = this.$el.find('.track-info .extra');
        this.$trackTimePlayed = this.$el.find('.track-time .played');
        this.$trackTimeDuration = this.$el.find('.track-time .duration');
        this.$playBtn = this.$el.find('.play');

        this.initAudioJS();

        return this;
    },

    initProgressBar: function () {
        var that = this;

        this.$progressBar.slider({
            range: "min",
            min: 0,
            max: 1,
            step: 0.01,
            slide: function ( event, ui ) {
                that.audio.skipTo(ui.value);
            }
        });
    },

    initVolumeBar: function () {
        var that = this;
        that.audio.setVolume( that.volumeDefault );

        this.$volumeBar.slider({
            range: "min",
            min: 0,
            max: 1,
            step: 0.01,
            value: that.volumeDefault,
            slide: function( event, ui ) {
                that.audio.setVolume( ui.value );
            }
        });
    },

    initAudioJS: function () {
        var that = this,
            $audioElement = that.$audioBox.find('audio');

        audiojs.events.ready( function() {
            that.audio = audiojs.create( $audioElement, {
                loadStarted: function () {
                    console.log('start');
                },
                loadProgress: function(percent) {
                    console.log(percent);
                    that.$loadingBar.css('width', percent*100 + '%');
                },
                loadError: function (e) {
                  console.log('Loading stop');
                },
                updatePlayhead: function (percent) {
                    that.$progressBar.slider('value', percent);
                    that.refreshTrackTime(this.duration, percent);
                },
                trackEnded: function () {
                    that.nextTrack();
                }

            } )[0];

            that.initVolumeBar();
            that.initProgressBar();
        });
    },

    startTrack: function (model) {
        this.audio.skipTo(0);
        this.skipLoadingBar();

        var source = model.get('link');
        this.currenTrackIndex = model.get('index');
        App.Events.trigger('set-active-class-for-track', this.currenTrackIndex);

        this.audio.load(source);
        this.audio.play();

        this.refreshTrackInfo(model);
        this.$playBtn.attr('class', 'pause');
    },

    playTrack: function () {
        if (this.currenTrackIndex) {
            this.audio.play();
            this.$playBtn.attr('class', 'pause');
        } else {
            var model = App.Tracks.where({ index: 1 })[0];
            this.startTrack( model );
        }
    },

    pauseTrack: function () {
        this.audio.pause();
        this.$playBtn.attr('class', 'play');
    },

    stopTrack: function () {
        this.pauseTrack();
        this.audio.skipTo(0);
        this.skipLoadingBar();

        this.currenTrackIndex = null;
        this.refreshTrackInfo();
        App.Events.trigger('stop-playing-track');
    },

    prevTrack: function () {
        if (!this.currenTrackIndex) return;

        var prevIndex = this.currenTrackIndex - 1;

        if (prevIndex < 1) {
            this.stopTrack();
        } else {
            var model = App.Tracks.where({ index: prevIndex })[0];
            this.startTrack( model );
        }
    },

    nextTrack: function () {
        if (!this.currenTrackIndex) return;

        var nextIndex = this.currenTrackIndex + 1;

        if (nextIndex > App.Tracks.length) {
            this.stopTrack();
        } else {
            var model = App.Tracks.where({ index: nextIndex })[0];
            this.startTrack( model );
        }
    },

    refreshTrackInfo: function (model) {
        var name = '', artist = '', album = '';

        if(model) {
            name = model.get('name');
            artist = model.get('artist');
            album = ' - ' + model.get('album');
        }

        this.$trackInfoName.text( name ).attr('title', name);
        this.$trackInfoExtra.text(artist + album).attr('title', artist + album);
    },

    refreshTrackTime: function (duration, percentPlayed) {
        duration = Math.floor( duration );
        var played = Math.floor( duration * percentPlayed),
            durationTime = App.Tracks.getTimeFromSeconds( duration),
            playedTime = App.Tracks.getTimeFromSeconds( played );

        this.$trackTimePlayed.text( playedTime );
        this.$trackTimeDuration.text( durationTime );
    },

    skipLoadingBar: function () {
        this.$audioBox.find('audio').attr('src', '');
        this.$loadingBar.css('width', 0);
    }
});