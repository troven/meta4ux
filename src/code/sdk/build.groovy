package todo.v1.code.sdk

import com.meta4beta.sdk.SDKAssets

log.debug("Meta4Beta Builder @ "+it)

new SDKAssets(new URL("file:'meta4cx"));

script.execute("api/meta4beta/models/build.groovy",it)
script.execute("api/meta4beta/views/build.groovy",it)
script.execute("api/meta4beta/code/build.groovy",it)
