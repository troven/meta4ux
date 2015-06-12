package todo.v1.code.server.auth

import com.scorpio4.security.acl.StrataPrincipal
import com.scorpio4.strata.TenantRequestHandler
import com.scorpio4.util.IdentityHelper
import com.scorpio4.util.io.EmailHelper
import com.scorpio4.util.map.MapUtil
import org.apache.commons.validator.routines.EmailValidator
import org.pac4j.http.profile.HttpProfile

import javax.servlet.ServletException

def REQUIRED = ["firstname", "lastname", "username", "password"]
def crud = odb.getCRUD("logins")

if (it.confirm) {
	def logins = crud.query("SELECT * FROM logins WHERE confirm=:confirm", it)
	if (!logins.size()==1) {
		http.response.sendRedirect("/public/signup.html?reason=invalid-confirmation")
		return
	}
	def login = logins.get(0)
	log.debug("Found Login: "+login)

	def profile = new HttpProfile()
	profile.build(it.confirm, login)
	profile.addAttribute("email", login.username)
	profile.addAttribute("label", login.firstname+" "+login.lastname)

	StrataPrincipal principal = strata.owner.getPrincipal(profile);
	if (!principal) {
		throw new ServletException("Missing principal")
	}
	log.debug("Confirm User: "+login+" -> "+profile)
	new TenantRequestHandler(strata.owner, principal, http.request, http.response)
	crud.update( principal )

	return
} else {
	http.session.setAttribute("signup", it)
	if (!it.username || !it.password) {
		http.response.sendRedirect("/public/signup.html?reason=missing-credentials")
		return
	}
	if (!MapUtil.hasRequired(it, REQUIRED)) {
		http.response.sendRedirect("/public/signup.html?reason=missing-fields")
		return
	}
	if (!it.agree) {
		http.response.sendRedirect("/public/signup.html?reason=no-agreement")
		return
	}
	if (it.passwordConfirm != it.password) {
		http.response.sendRedirect("/public/signup.html?reason=mismatched-password")
		return
	}
	if (!EmailValidator.getInstance().isValid(it.username)) {
		http.response.sendRedirect("/public/signup.html?reason=username-not-email")
		return
	}
	def passwordStrength = IdentityHelper.getPasswordStrength(it.password);
	if (passwordStrength<3) {
		http.response.sendRedirect("/public/signup.html?reason=weak-password#"+passwordStrength)
		return
	}

	// do we have an existing registration?
	def logins = crud.query("SELECT * FROM logins WHERE username=:username", it)
	def invitee = null

	if (logins.size>1) {
		http.response.sendRedirect("/public/signup.html?reason=duplicate-registration")
		return
	} else if (logins.size()==0) {
		// new registration
		it.confirm = IdentityHelper.uuid("");
		it.remove("passwordConfirm")
		it.password = IdentityHelper.password(it.username, it.password)
		log.debug("Register: "+it+" -> "+principal)
		invitee = crud.create(it)
	} else {
		// TODO: update invite details?
		invitee = logins.get(0)
log.debug("Re-registered: "+invitee)
	}

	def email = template.render("template/email/register.html", invitee)

	Map emailConfig = MapUtil.getConfig(core.config,"outgoing.")
	if (emailConfig) {
		String appName = MapUtil.getString(core.config,"name", "")

log.debug("Email Config: "+emailConfig)
		EmailHelper emailHelper = new EmailHelper(emailConfig);
		emailHelper.send(it.username, "Welcome to "+appName, email);
log.debug("Welcome Email Sent: ${it.username}")
		http.response.sendRedirect("/public/welcome.html")
	} else
		throw new ServletException("Email is not configured")
}
