package todo.v1.code.server.auth

import com.scorpio4.api.APIHelper

APIHelper.setPrincipal(http.request, null)
http.response.sendRedirect("/www/")