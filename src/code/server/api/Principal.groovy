package todo.v1.code.server.api

if (it.id == principal.id) {

//    def odb = (CRUDDomain)tenant?.odb?tenant.odb:odb
//
//    it.photoURL?it.photoURL:SocialHelper.getGravatar(it.email);
//
//    def crud = odb.getCRUD("meta4principals")
//    crud.update(ODbHelper.shallow(it))
//
//    ((StrataPrincipal)principal).putAll(it);

    log.debug("Saved User Profile: "+ it)
} else {
    log.error("Wrong User Profile: "+ it)
}

return principal;
