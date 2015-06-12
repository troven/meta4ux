var filename = this.model.get("url")

var path = "/www/ebook/viewer.html?file="+encodeURIComponent(filename)

console.debug("Preview PDF: %o %o %o", it, this, path)

scorpio4.ux.preview(path+"#page=1&zoom=page-fit")
