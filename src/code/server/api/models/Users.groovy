package meta4beta.v1.code.server.api.models

import com.scorpio4.api.APIHelper
import com.scorpio4.crud.CRUDDomain

import javax.servlet.ServletException

// Test
if (!tenant) throw new ServletException("Anonymous tenant")

def model = APIHelper.getModel(it);

log.debug("Users (${it.id}) CRUD: ${odb} -> ${model} -> ${tenant}")

CRUDDomain odb = tenant.odb;

def crud = odb.getCRUD("meta4principals")

switch(http.request.method) {
	case "POST": // create
		def created = crud.create(model)
		log.debug("User:create: "+it.id+" -> "+created)
		return created
	case "GET": //read
		def crud2 = strata.odb.getCRUD("meta4principals")
		return crud2.read([:])
//		def models = crud2.query("SELECT users FROM tenants WHERE @RID = "+ principal.getTenant().getIdentity(), model )
//		if (models.size()==1) return models[0].users
//		return [];
	case "PUT": // update
		crud.update(model)
		log.debug("User:update: "+it.id+" -> "+model)
		return model
	case "DELETE": // delete
		crud.delete(model)
		log.debug("User:delete: "+it.id+" -> "+model)
		return model
	default:
		log.debug("Oops: unsupported Orient: "+http.request.method)
		break
}
return []
