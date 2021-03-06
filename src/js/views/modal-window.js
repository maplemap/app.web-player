'use strict';

App.Views.ModalWindow = Backbone.View.extend({
    className: App.Settings.classPrefix + '-modal-window',
    template: $( App.TmpEngine.getTemplate('modalWindow') ),

    initialize: function () {
        App.Events.on('enable-upload-window', this.enableUploadWindow, this);
        App.Events.on('enable-loader-window', this.enableLoaderWindow, this);
        App.Events.on('disable-modal-window', this.disable, this);

        this.render();
    },

    render: function () {
        this.$el.append( this.template );
        this.$closeButton = this.$el.find('.close');
        this.$modalContent = this.$el.find('.modal-content');

        return this;
    },

    enable: function (content) {
        this.$el.addClass('active');
        this.$closeButton.on('click', function (e) { //ToDo: refactoring
            e.stopPropagation();
            App.Events.trigger('disable-modal-window');
        });

        this.$modalContent.html(content);
    },

    disable: function () {
        this.$el.removeClass('active');
        this.$closeButton.off('click');
        this.$modalContent.html('');
    },

    enableUploadWindow: function () {
        if( !this.fileUploader ) {
            this.fileUploader = new App.Views.FileUploader();
        }

        this.enable( this.fileUploader.render().el );
    },
    
    enableLoaderWindow: function () {
        App.LoadFiles.destroyAllCollection();

        if( !this.fileLoader ) {
            this.fileLoader = new App.Views.FileLoader();
        }

        this.enable( this.fileLoader.render().el );
        App.Events.trigger('start-loading-process');
    }
});