
scorpio4 = {}
scorpio4.centralize = function($this) {
    var $parent = $("body")
    var pWidth = $parent.width()
    var pHeight = $parent.height()
    var width = $this.width()
    var height = $this.height()
    var top = (pHeight - height)/3
    var left = (pWidth - width)/2
    $this.css({ "position": "absolute", "top": top, "left": left })
    return $this.position()
}

scorpio4.overlay = function($this) {
    var $body = $("body")
    var $overlay = $("<div class='overlay'/>").appendTo($body)
    $overlay.css({ "z-index": 1000, position: absolute, top: 0, left: 0, opacity: "10%" })
    $this.appendTo($overlay)
    $this.css({ "z-index": 100+parseInt($overlay.css("z-index")), opacity: "100%" })
}

scorpio4.oauth = function() {
    var $oauth = $("[data-provider]")
    var subscription = $oauth.attr("subscription")

    $oauth.click(function() {
        var msg = $(this).html()
        var provider = $(this).attr("data-provider")
        var url = "/public/api/auth/"+provider

        BootstrapDialog.show({
            title: "Social Identity Check",
            message: function(dialog) {
                var $message = $("<h2>Contacting "+msg+" to verify your identity.</h2><p>Your login credentials are not revealed.</p> </div>");
                return $message;
            }
        });

        console.log("Authorise %s %s",subscription, provider)
        window.location.assign(url)
    })
}
