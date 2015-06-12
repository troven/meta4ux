package meta4beta.v1.code.server.api.models;

import com.scorpio4.api.APIHelper
import com.scorpio4.assets.AssetRegister
import com.scorpio4.vocab.COMMONS

log.debug("Fact:Collection: "+http.request.method+" ---> "+it);
log.debug("Fact:Config: "+core.config);

def model = it.json;
model = model==null?[:]:model

switch(http.request.method) {
    case "POST": // create
        model.id = model.id?model.id:"m_"+System.currentTimeMillis()
        model.label = model.label?model.label:"New "+model.id
        log.debug("CRUD:create: "+model)
    return model
    case "GET": //read
        if (it.id) {
            def asset = ((AssetRegister) core.use).getAsset(it.id, COMMONS.MIME_JSON)
            def asJSON = APIHelper.toList(asset)
            return asJSON
        }
    break
    case "PUT": // update
        log.debug("CRUD:update: "+model)
    return model
    case "DELETE":
        log.debug("CRUD:delete: "+model)
        model.label = "Deleted "+model.label
    return model
    default:
        log.debug("Oops: unsupported CRUD: "+http.request.method)
    break
}
return []