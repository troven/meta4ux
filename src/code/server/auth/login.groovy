package todo.v1.code.server.auth

import com.scorpio4.security.acl.StrataPrincipal
import com.scorpio4.strata.TenantRequestHandler
import com.scorpio4.util.IdentityHelper
import com.scorpio4.vendor.orientdb.ODbCRUDDomain

if (!it.username || !it.password) {
	http.response.sendRedirect("/www/index.html?reason=missing-credentials")
	return
}
it.password = IdentityHelper.password(it.username, it.password)
log.debug("Salted User: "+it+" -> "+principal)

def odb = ((ODbCRUDDomain)odb);

def loginCRUD = odb.getCRUD("logins")

def logins = loginCRUD.query("SELECT user FROM logins WHERE username=:username AND password=:password", it);
if (logins.isEmpty()) {
	http.response.sendRedirect("/www/index.html?reason=unknown-credentials")
} else if (logins.size()==1) {
	def users = odb.getCRUD("users")
	def login = logins.get(0)
	log.debug("Found User: "+login)

	if (!login.user) {
		http.response.sendRedirect("/www/?reason=unidentified-user")
	} else {
		def user = users.find(login.user)

		if (user) {
			new TenantRequestHandler(strata.owner, new StrataPrincipal(user), http.request, http.response)
		} else {
			http.response.sendRedirect("/www/?reason=unknown-user")
		}
	}
} else {
	http.response.sendRedirect("/www/?reason=invalid-credentials")
}



