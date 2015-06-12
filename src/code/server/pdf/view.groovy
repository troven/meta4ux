import com.scorpio4.vendor.flyingsaucer.PDF

if (it.pdf) {
	if (!it.pdf.startsWith("http:")&&!it.pdf.startsWith("http:")) it.pdf = http.webroot+it.pdf
	PDF.view(it.pdf, http.response)
} else {
	http.response.sendError(204)  // no-content
}
