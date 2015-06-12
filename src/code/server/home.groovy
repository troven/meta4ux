package todo.v1.code.server

if (principal.isOnboard) {
    log.debug("Welcome ${it.provider} User: ${principal.id}")
    http.response.sendRedirect("/use/private/home/"+principal.getHomePage()+".html");
    return;
}

http.response.sendRedirect("/use/private/home/welcome.html");
