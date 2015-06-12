package todo.v1.code.server.auth
import com.scorpio4.strata.SocialLoginHandler
import org.pac4j.oauth.client.WindowsLiveClient

String key = core.config.get("windows.key")
String secret = core.config.get("windows.secret")
String callback = core.config.host+"public/api/auth/windows"

def client = new WindowsLiveClient(key,secret);

def handler = new SocialLoginHandler(client, strata.owner, callback);
handler.handle(http.request, http.response)
