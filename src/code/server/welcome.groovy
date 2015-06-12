package todo.v1.code.server

import com.meta4beta.sdk.Module
import com.scorpio4.crud.CRUDDomain

log.debug("Welcome User: ${it}")

if (it.isOnboard) {
    principal.isOnboard=true
    // save
    def odb = (CRUDDomain) strata?.tenant?.odb?strata?.tenant?.odb:odb
    def meta4principals = odb.getCRUD("meta4principals")
    meta4principals.update(principal);
}

def assetsDir = new File(core.config.get("use.file"))
def module = Module.boot(assetsDir);

return [ user: principal, modules: [ module ] ]
