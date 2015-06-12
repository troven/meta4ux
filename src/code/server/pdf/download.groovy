import com.scorpio4.util.io.FileHelper
import com.scorpio4.vendor.flyingsaucer.PDF

if (it.pdf) {
	String filename = FileHelper.stripExtension(FileHelper.getLocalName(it.pdf))+".pdf"
log.debug("Download as: "+filename)
	if (!it.pdf.startsWith("http:")&&!it.pdf.startsWith("http:")) it.pdf = http.webroot+it.pdf
	PDF.download(it.pdf, filename, http.response)
} else {
	http.response.sendError(204) // no-content
}
