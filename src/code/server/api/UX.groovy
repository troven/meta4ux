package todo.v1.code.server.api

import com.meta4beta.options.Options
import com.scorpio4.util.io.FileHelper

def scope = "public";


def id = meta4.options.get("id")
def paths = (Options)meta4.options.getOptions("paths");

def viewDir = paths.getOptions("views").get(scope, new File("src/views"));
def modelDir = paths.getOptions("models").get("meta", new File("src/models/meta/"));
def templateDir = paths.getOptions("templates").get("client", new File("src/templates/client"));
def codeDir = paths.getOptions("code").getOptions("client").get(scope, new File("src/code/client"));

viewDir.mkdirs()
modelDir.mkdirs()
templateDir.mkdirs()
codeDir.mkdirs()

Map module = new HashMap();
module.put("id", id);
module.put("requires", false );
module.put("notifications", false);
module.put("geo", false);
 // x_geo: [ timeout: 60000 ],
// x_timers: [ "1", "5", "60", "600"],
module.put("home", "home");

log.debug("UX models: "+modelDir.getAbsolutePath());
module.put("models", FileHelper.listContents(modelDir));

log.debug("UX views: "+viewDir.getAbsolutePath());
module.put("views", FileHelper.listContents(viewDir));

module.put("controllers", new ArrayList());

log.debug("UX templates: "+templateDir.getAbsolutePath());
module.put("templates", FileHelper.mapContents(templateDir));

log.debug("UX scripts: "+codeDir.getAbsolutePath());
module.put("scripts", FileHelper.mapContents(codeDir));


return [ modules: [module] ]