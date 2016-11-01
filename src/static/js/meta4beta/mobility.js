define(["jquery", "underscore", "backbone", "core"], function ($,_,Backbone, core) {

	/* *****************************************************************************************************************
		Mobility 
	**************************************************************************************************************** */

    return {

		boot: function(module, options) {
			if (!module) throw "meta4:fact:register:oops:missing-module";
			if (!navigator) throw "meta4:fact:register:oops:missing-phonegap-navigator";
			this._module = module

			this.documentTriggers();

		    if (options.geo) this.geo(module, options.geo)
		},

		documentTriggers: function() {
		    this.onDocumentTrigger("menubutton", "menu")
		    this.onDocumentTrigger("searchbutton", "search")
		    this.onDocumentTrigger("backbutton", "home")

		    this.onDocumentTrigger("offline")
		    this.onDocumentTrigger("online")
		    this.onDocumentTrigger("pause", "locked")
		    this.onDocumentTrigger("resume", "resume")
		},

        onDocumentTrigger: function(from, to) {
			if (!document) return
			var self = this
			document.addEventListener(from, function() { self._module.trigger(to||from) }, false)
        },

		geo: function(vent, geo_conf) {
			var self = this;
			if (!_.isObject(geo_conf)) return;
			if (!navigator || !navigator.geolocation) {
			    console.warn("GeoLocation is unavailable");
			    return;
			}
			navigator.geolocation.watchPosition(
				function(pos) {
					vent.trigger("location", pos, geo_conf);
				}, function(err) {
					vent.trigger("location:error", err, geo_conf);
				}, geo_conf );
		},

	    capture: function (options) {
	    	_.defaults(options, {duration: 300, limit: 1 });
	    	if (!navigator||!navigator.device||!navigator.device.capture) {
	    		this._module.trigger("capture:missing")
	    		return;
	    	}
	        // Launch device video recording app
	        navigator.device.capture.captureVideo( function(mediaFiles) {
				this._module.trigger("capture", mediaFiles)
	        }, function(error) {
				this._module.trigger("capture:error", error)
	        }, options);
	    },

	    upload: function (mediaFile) {
	    // Upload files to server
	        var ft = new FileTransfer(),
	            path = mediaFile.fullPath,
	            name = mediaFile.name;

	        ft.upload(path, config.api,
	            function(result) {
	                console.debug('Upload success: ' + result.responseCode);
	                console.debug(result.bytesSent + ' bytes sent');
	            },
	            function(error) {
	                console.error('Error uploading file ' + path + ': ' + error.code);
	            },
	            { fileName: name }
	        );
	    }
    };
});
