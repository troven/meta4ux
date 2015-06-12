package meta4beta.v1.code.server.api.models

import com.scorpio4.api.APIHelper
import com.scorpio4.crud.CRUD
import com.scorpio4.crud.CRUDDomain
import com.scorpio4.oops.FactException

if (!it||!it.id) {
	log.error("Invalid Request: "+it)
	throw new FactException("Invalid Orient request")
}
def model = APIHelper.getModel(it);
log.debug("Orient (${it.id}) CRUD: ${Orient} -> ${model}")

def crud = (CRUD)orient.get(it.id)
model = model==null?[:]:model

switch(http.request.method) {
	case "POST": // create
		def created = crud.create(model)
		log.debug("Orient:create: "+it.id+" -> "+created)
		return created
	case "GET": //read
		def models = crud.read(model);
		log.debug("Orient:READ: "+it.id+" -> "+models.size()+" models")
		return models;
	case "PUT": // update
		crud.update(model)
		log.debug("Orient:update: "+it.id+" -> "+model)
		return model
	case "DELETE": // delete
		crud.delete(model)
		log.debug("Orient:delete: "+it.id+" -> "+model)
		return model
	default:
		log.debug("Oops: unsupported Orient: "+http.request.method)
		break
}
return []
