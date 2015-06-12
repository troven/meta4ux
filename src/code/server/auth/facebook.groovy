package todo.v1.code.server.auth
import com.scorpio4.strata.SocialLoginHandler
import org.pac4j.oauth.client.FacebookClient

String key = core.config.get("facebook.key")
String secret = core.config.get("facebook.secret")
String callback = core.config.host+"public/api/auth/facebook"

def client = new FacebookClient(key,secret);

def handler = new SocialLoginHandler(client, strata.owner, callback);
handler.handle(http.request, http.response)
