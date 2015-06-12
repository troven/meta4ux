package meta4beta.v1.code.server.api.models;

import com.scorpio4.api.APIHelper
import com.scorpio4.assets.AssetRegister
import com.scorpio4.vocab.COMMONS

log.trace("Fact:Assets: "+http.request.method+" ---> "+it);

def model = it.json;
model = model==null?[:]:model

switch(http.request.method) {
    case "POST": // create
        log.debug("Assets:create: "+model)
        return model
    case "GET": //read
        if (it.id) {
            String metaPath = "models/meta/${it.id}.json"
            log.debug("Assets:read: "+metaPath)
            try {
                def asset = ((AssetRegister) core.use).getAsset(metaPath, COMMONS.MIME_JSON)
                def asMeta = APIHelper.toMap(asset)
                if (asMeta && asMeta.data) {
                    return asMeta.data
                };
                if (asMeta) {
                    String dataPath = "models/data/${asMeta.path?asMeta.path:it.id}.json"
                    asset = ((AssetRegister) core.use).getAsset(dataPath, COMMONS.MIME_JSON)
                    log.debug("Assets:data path: "+dataPath)
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
        log.debug("Assets:update: "+model)
        return model
    case "DELETE":
        log.debug("Assets:delete: "+model)
        model.label = "Deleted "+model.label
        return model
    default:
        log.debug("Oops: unsupported Assets: "+http.request.method)
        break
}
return []