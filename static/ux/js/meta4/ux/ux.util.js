define(["jquery", "underscore", "marionette", "Handlebars", "core", "meta4/ux/ux.mixin"],
    function ($,_, Marionette, handlebars, core, ux) {

    ux.util = ux.util || {}

    /* Device Detection
     https://github.com/PoeHaH/devicedetector
    */

    ux.util.detect = function () {
        var ua = navigator.userAgent.toLowerCase();
        var detect = (function(s) {
            if(s===undefined)s=ua;
            else ua = s.toLowerCase();
            if(/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua))
                        return 'tablet';
                else
                if(/(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds|archos|skyfire|puffin|blazer|bolt|gobrowser|iris|maemo|semc|teashark|uzard)/.test(ua))
                            return 'phone';
                        else return 'desktop';
        });

        return {
            device:detect(),
            detect:detect,
            isMobile:((detect()!='desktop')?true:false),
            userAgent:ua
        };
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    // Various helper functions

    ux.position = {
        center: function($this, $parent) {
            $parent = $parent || $("body")
            var pWidth = $parent.width()
            var pHeight = $parent.height()
            var width = $this.width()
            var height = $this.height()
            var top = (pHeight - height)/2
            var left = (pWidth - width)/2
            $this.css({ "position": "absolute", "top": top, "left": left })
            return $this.position()
        },
        modal: function($this, $parent) {
            $parent = $parent || $(document)
            var pWidth = $parent.width()
            var pHeight = $parent.height()
            var width = $this.width()
            var height = $this.height()
            var top = (pHeight - height)/3
            var left = (pWidth - width)/2
            top = Math.max(top, 0)
            left = Math.max(left, 0)
            $this.css({ "position": "absolute", "top": top, "left": left })
// console.log("Position Modal: %o (%s x %s) @ (%s x %s) -> (%s x %s)", $this, width, height, pWidth, pHeight, top, left)
            return $this.position()
        }
    }

    // silence events
    ux.muffle = function(e) {
        e.stopImmediatePropagation()
        e.preventDefault()
    }

    return ux
})
