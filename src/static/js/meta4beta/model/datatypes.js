define(["underscore", "core"], function (_, core) {

    var fact = core.fact;

    return {
        rq2rdf: {
            toURI: function(that, source) {
                if (_.isObject(that) && that.ID) {
// handle blank nodes - ensure they are globalized
//console.log("BLANK: %o", that, source);
                    return "<urn:local:"+that.ID+">";
                } else return "<"+that+">";
            },
            to: function(that, source) {
                if (_.isString(that)) {
                    return "\""+that+"\"";
                } else if (that.label) {
                    // LITERAL
                    try {
                        return "\""+that.label+"\""+(that.datatype?"^^<"+that.datatype.namespace+that.datatype.localName+">":"");
                    } catch(e) {
                        fact.DEBUG && console.warn("Parse Error:", that, e);
                        return "\""+that.label+"\"^^xsd:simpleType";
                    }
                } else if (that.namespace || that.localName) {
                    // CNAME / URI
                    return "<"+that.namespace+that.localName+">";
                } else if (that.ID) {
                    // BNODE
// handle blank nodes - ensure they are globalized
//console.log("BNODE: ", that, that.ID, source);
                    return "<urn:local:"+that.ID+">";
                }

            }
        },
        xsd2json: {
            to: function(that) {
                return that;
            }
        }
    }

});

