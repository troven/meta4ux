define(["underscore", "core"], function (_, core) {

    var fact = core.fact;

    return {

        mutate: function(options, model) {
            if (!options) return
            if (options.mutators) {
                _.each(options.mutators, function(fn, name) {
                    options[name] = model.get(fn)
                })
            }
            return options;
        }

    }

});