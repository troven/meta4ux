package todo.v1.code.server.auth
import com.scorpio4.strata.SocialLoginHandler
import org.pac4j.oauth.client.Google2Client

String key = core.config.get("google.key")
String secret = core.config.get("google.secret")
String callback = core.config.host+"public/api/auth/google"

def client = new Google2Client(key,secret);

def handler = new SocialLoginHandler(client, strata.owner, callback);
handler.handle(http.request, http.response)
