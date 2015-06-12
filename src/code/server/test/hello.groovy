
log.debug("Hello World @ "+new Date())
def models = orient.files.read[:]
return [ hello: "World", models: models ]
