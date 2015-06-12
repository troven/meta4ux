package todo.v1.code.server.auth
import com.scorpio4.strata.SocialLoginHandler
import org.pac4j.oauth.client.LinkedIn2Client

String key = core.config.get("linkedin.key")
String secret = core.config.get("linkedin.secret")
String callback = core.config.host+"public/api/auth/linkedin"

def client = new LinkedIn2Client(key, secret)

def handler = new SocialLoginHandler(client, strata.owner, callback);
handler.handle(http.request, http.response)

