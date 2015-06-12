package todo.v1.code.server.auth

import com.scorpio4.vendor.orientdb.ODbCRUD

def crud = (ODbCRUD)odb.getCRUD("invites")

log.debug("Confirm: "+it)
def confirm = it.confirm
def query = "SELECT * FROM invites WHERE confirm='${confirm}'";
def models = crud.query(query)
if (models.confirm.size()>0) {
//	query = "UPDATE * FROM fact_model_invites WHERE confirm='${confirm}'";
//	models = crud.query(query)
	http.response.sendRedirect("/www/index.html?reason=confirmed")
	return;
} else {
	http.response.sendRedirect("/www/index.html?reason=confirm-failed")
}
