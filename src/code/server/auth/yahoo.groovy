package todo.v1.code.server.auth
import com.scorpio4.strata.SocialLoginHandler
import org.pac4j.oauth.client.YahooClient

String key = core.config.get("yahoo.key")
String secret = core.config.get("yahoo.secret")
String callback = core.config.host+"public/api/auth/yahoo"

def client = new YahooClient(key,secret);

def handler = new SocialLoginHandler(client, strata.owner, callback);
handler.handle(http.request, http.response)
