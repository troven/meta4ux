define(["jquery", "underscore"], function ($,_) {

    return {

		center: function($this, $parent) {
			$parent = $parent || $(document)
			var pWidth = $parent.width()
			var pHeight = $parent.height()
			var width = $this.width()
			var height = $this.height() || 256
			var top = (pHeight - height)/3
			var left = (pWidth - width)/2
			top = Math.max(top, 0)
			left = Math.max(left, 0)
			$this.css({ "position": "absolute", "top": top, "left": left})
// console.log("Splash Position: %o (%s x %s) @ (%s x %s) -> (%s x %s)", $this, width, height, pWidth, pHeight, top, left)
			return $this.position()
		},

		overlay: function($body) {
            $body = $body || $("body")
            var $overlay = $("<div class='overlay'/>").prependTo($body)
            $overlay.css({ "z-index": '10000', position : "absolute",
                width: "100%", height: "100%", "padding": "20px"
                })

            $body.css( { opacity: 0.9 })
            return $overlay;
		},

        open: function(options) {
            this.options = options = _.defaults(options || {}, { "url": "/static/splash.html" })
            this.$overlay = this.overlay()

            var self = this;
            var $div = $("<div/>").css({ "z-index": 11000, opacity: 0.95, width: "100%"}).load(options.url, function() {
                $div.appendTo(self.$overlay)
//                self.center($div)
// console.log("Splash open: %s -> %o", options.url, self.$overlay)
            })
        },

        close: function() {
            var self = this
//console.log("Splash close: %o", this)
            if (this.options.waitForClick) {
                self.$overlay.css( {cursor: "pointer"} )
                this.$overlay.click(function() {
                    self.$overlay.remove()
                })
            } else {
                this.$overlay.remove()
            }
            $("body").css( { opacity: 1.0 })
        },
    }
});
