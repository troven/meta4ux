
http.response.setContentType("text/html")

return """
<html>
<body>
<h2>Hello World: ${auth.can('login')}</h2>
</body>
</html>
""".toString()