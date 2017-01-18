define(["jquery", "underscore", "backbone", "core"], function ($,_,Backbone, core) {

	/* *****************************************************************************************************************
		Mobility 
	**************************************************************************************************************** */

    return {

		boot: function(module, options) {
			if (!module) throw "meta4:fact:register:oops:missing-module";
			if (!navigator) throw "meta4:fact:register:oops:missing-phonegap-navigator";

			this.documentTriggers(module);

		    if (options.geo) this.geo(module, options.geo)
		},

		documentTriggers: function(module) {
		    this.onDocumentTrigger(module, "menubutton", "menu");
		    this.onDocumentTrigger(module, "searchbutton", "search");
		    this.onDocumentTrigger(module, "backbutton", "home");

		    this.onDocumentTrigger(module, "offline");
		    this.onDocumentTrigger(module, "online");
		    this.onDocumentTrigger(module, "pause", "locked");
		    this.onDocumentTrigger(module, "resume", "resume");

            window.addEventListener('orientationchange', function() {
                module.orientation = getSimpleOrientation(module);
                module.trigger("orientation");
            });

            module.orientation = this.getSimpleOrientation(module);
            module.trigger("orientation");
        },

        getSimpleOrientation: function(module) {
            switch(window.orientation)
            {
                case -90:
                case 90:
                    return 1; // landscape
                default:
                    return 0; // portrait
            };
        },

        onDocumentTrigger: function(module, from, to) {
			if (!document) return;
			document.addEventListener(from, function() { module.trigger(to||from) }, false);
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
