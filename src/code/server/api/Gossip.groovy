package todo.v1.code.server.api

def gossip = odb.getCRUD("meta4gossip")

def model = [ user: principal.getName() ]
def messages = gossip.query("SELECT * FROM meta4gossip WHERE user=:user", model);

gossip.sql("DELETE FROM meta4gossip WHERE user=:user AND needsConfirm=false", model);

log.debug("Gossip:READ: "+model+" -> "+messages)

return messages;
