package meta4beta.v1.code.server.api.models

import com.meta4beta.options.Options;
import com.scorpio4.api.APIHelper
import com.scorpio4.assets.AssetRegister
import com.scorpio4.assets.FileAssetRegister
import com.scorpio4.vocab.COMMONS

log.trace("Fact:SDK: "+http.request.method+" ---> "+it);

def model = it.json;
model = model==null?[:]:model

def options = (Options)meta4.options;
def sdkHome = options.getOptions("paths").get("sdk", new File("src/sdk"))
log.debug("SDK Home: "+sdkHome.getAbsolutePath())
def assets = new FileAssetRegister(sdkHome)

switch(http.request.method) {
    case "POST": // create
        log.debug("SDK:create: "+model)
        return model
    case "GET": //read
        if (it.id) {
            String metaPath = "models/meta/${it.id}.json"
            log.debug("SDK:read: "+metaPath)
            try {
                def asset = assets.getAsset(metaPath, COMMONS.MIME_JSON)
                def asMeta = APIHelper.toMap(asset)
                if (asMeta && asMeta.data) {
                    return asMeta.data
                };
                if (asMeta) {
                    String dataPath = "models/data/${asMeta.path?asMeta.path:it.id}.json"
                    asset = assets.getAsset(dataPath, COMMONS.MIME_JSON)
                    log.debug("SDK:data path: "+dataPath)
                    return APIHelper.toList(asset)
                };
                return []
            } catch(IOException e) {
                log.warn("Assets not found: "+metaPath+" -> "+e.getMessage())
                return []
            }
        }
        break
    case "PUT": // update
        log.debug("SDK:update: "+model)
        return model
    case "DELETE":
        log.debug("SDK:delete: "+model)
        model.label = "Deleted "+model.label
        return model
    default:
        log.debug("Oops: unsupported SDK: "+http.request.method)
        break
}
return []