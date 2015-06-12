/*
	jsPlumbToolkit utility functions, used both in browser and on server.
*/

var jsPlumbToolkitUtil = (typeof module !== "undefined" && module.exports) || {};	

;(function(exports) {

	exports.version = "0.1";
    exports.name = "jsPlumbToolkitUtil";
		
	exports.fastTrim = function(s) {
        var str = s.replace(/^\s\s*/, ''),
        ws = /\s/,
        i = str.length;
        while (ws.test(str.charAt(--i)));
        return str.slice(0, i + 1);
    };
		
	exports.uuid = function() {				
		return ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		}));        
	};
	
	exports.getInternetExplorerVersion = function() {
		var rv = -1; 
		if (navigator.appName == 'Microsoft Internet Explorer') {
			var ua = navigator.userAgent;
			var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
			if (re.exec(ua) != null)
				rv = parseFloat(RegExp.$1);
		}
		return rv;
	};
	
	// take the given model and expand out any parameters.
	exports.populate = function(model, values) {		
		// for a string, see if it has parameter matches, and if so, try to make the substitutions.
		var getValue = function(fromString) {
				var matches = fromString.match(/(\${.*?})/g);
				if (matches != null) {
					for (var i = 0; i < matches.length; i++) {
						var val = values[matches[i].substring(2, matches[i].length - 1)];
						if (val) {
							fromString = fromString.replace(matches[i], val);
						}
					}							
				}
				return fromString;
			},		
			// process one entry.
			_one = function(d) {
				if (d != null) {
					if (jsPlumbUtil.isString(d)) {
						return getValue(d);
					}
					else if (jsPlumbUtil.isArray(d)) {
						var r = [];	
						for (var i = 0; i < d.length; i++)
							r.push(_one(d[i]));
						return r;
					}
					else if (jsPlumbUtil.isObject(d)) {
						var r = {};
						for (var i in d) {
							r[i] = _one(d[i]);
						}
						return r;
					}
					else {
						return d;
					}
				}
			};
		
		return _one(model);	
	};
	
	exports.mergeWithParents = function(type, map, parentAttribute) {
	
		parentAttribute = parentAttribute || "parent";
		var _def = function(id) { return id ? map[id] : null; };
		var _parent = function(def) { return def ? _def(def[parentAttribute]) : null; };
				
		var _one = function(parent, def) {
			if (parent == null) return def;
			else {
				var d = jsPlumbUtil.merge(parent, def);
				return _one(_parent(parent), d);
			}
		};
		
		var d = _def(type);
		if (d)
			return _one(_parent(d), d);
		else
			return {};
	};
		
    exports.xml = {                
        /*
        * Function: setNodeText
        * Sets the node's text value.
        */    
        setNodeText : function(node, text) {
            node.text = text;  // IE
            try {
                node.textContent = text;
            }
            catch (e) { }
        },        
        /*
        * Function: getNodeText
        * Gets the text from the given node.
        */
        getNodeText : function(node) {
            return node != null ? node.text || node.textContent : "";
        },
        /*
        * Function: getChild
        * Gets the first instance of the child with the given tag name, null if none found.
        */
        getChild : function(parent, name) {
            var c = null;
            for (var i = 0; i < parent.childNodes.length; i++) {
                if (parent.childNodes[i].nodeType == 1 && parent.childNodes[i].nodeName == name) {
                    c = parent.childNodes[i];
                    break;
                }
            }
            return c;
        },
        /*
        * Function: getChildren
        * Gets children of the given node (only direct children), returning an array of nodes (an empty array if none found).
        */
        getChildren : function(parent, name) {
            var c = [];
            for (var i = 0; i < parent.childNodes.length; i++) {
                if (parent.childNodes[i].nodeType == 1 && parent.childNodes[i].nodeName == name) {
                    c.push(parent.childNodes[i]);                   
                }
            }
            return c;   
        },
        /*
        * Function: xmlToString
        * Serializes the given XML node to a string, throwing an Error if something goes bad.
        */
        xmlToString : function(xmlNode) {
            try {
                // Gecko-based browsers, Safari, Opera.
                return (new XMLSerializer()).serializeToString(xmlNode).replace(/\s*xmlns=\"http\:\/\/www.w3.org\/1999\/xhtml\"/g, "");
            }
            catch (e) {
                try {
                    // Internet Explorer.
                    return xmlNode.xml;
                }
                catch (ee) {
                    throw new Error("Cannot serialize XML " + ee);
                }
            }
            return false;           
        },
        createElement : function(name, attributes, text) {
            var n;
            //http://www.devguru.com/technologies/xmldom/quickref/document_createnode.html
            try { 
                n = new ActiveXObject("Microsoft.XMLDOM").createNode(1, name, "");
            }
            catch (e) {
                n = document.createElement(name);
            }
        
            if (text) jsPlumbToolkitUtil.xml.setNodeText(n, text);
            if (attributes) {
                for (var i in attributes)
                n.setAttribute(i, attributes[i]);
            }

            return n;
        } 
    };
})(jsPlumbToolkitUtil);/*
 * jsPlumbToolkit
 *
 * copyright 2012 morrisonpitt.com
 * http://morrisonpitt.com
 *
 * Licensed under the GPL2 license.  This software is not free.
 *
 * This is a Javascript implementation of a Graph, containing either directed or undirected edges, from nodes that have a one to N
 * ports, with Djikstra and FloydWarshall shortest path algorithms.  Also offers several 'centrality' measurement functions.
 *
 */

/*

	This file is in CommonJS module format and can be used both in the browser and on the server.
	
	DOM:

	-	No knowledge of the DOM.

	DEPENDENCIES:

	-	None.

*/
var jsPlumbGraph = (typeof module !== "undefined" && module.exports) || {};	

;(function(exports) {

	exports.version = "0.1";
    exports.name = "jsPlumbGraph";

	var Base = function() {
		var atts = {};
		this.setAttribute = function(key, value) { atts[key] = value; };
		this.getAttribute = function(key) { return atts[key]; };
	},
	_getId = function(data, idFunction) {
		return typeof data === 'string' ? data : idFunction != null ? idFunction(data) : data.id;	
	},
	_getType = function(data) {
		return typeof data === 'string' ? { id:data } : data;
	},

	/**
		This is a node in the graph. each Vertex can have one or more Edges to each other Vertex; this Edge may be
		directed.  Whenever an edge is added or removed we recompute the indegree and outdegree centrality
		values for the vertex.

		You instantiate a Vertex either with a String value for 'data', or a JSON object.  If you supply a String, 
		that value is assumed to be the Vertice's ID. If you supply a JSON object, an ID is extracted from that object,
		either with the supplied idFunction, or, if that is null, by assuming that the ID exists in the JSON as the 
		'id' member.		 
	*/
	Vertex = exports.Vertex = function(data, idFunction) {
		var self = this;

		Base.apply(this, arguments);

		this.id = _getId(data, idFunction);
		this.data = _getType(data);

		var edges = [], 
			indegreeCentrality = 0, 
			outdegreeCentrality = 0,
			nestedGraphs = [],
			ports = [];

		this.getEdges = function() { return edges; };
		this.addEdge = function(edge) {
			edges.push(edge);
			if (edge.source === self || !edge.isDirected()) {
				outdegreeCentrality++;
			}
			if (edge.target === self || !edge.isDirected()) {
				indegreeCentrality++;
			}
		};
		this.deleteEdge = function(edge) {
			var idx = -1;
			for (var i = 0; i < edges.length; i++) {
				if (edges[i]._id === edge._id) {
					idx = i;
					break;
				}
			}
			if (idx > -1) {
				edges.splice(idx, 1);
				if (edge.source === self || !edge.isDirected()) {
					outdegreeCentrality--;
				}
				if (edge.target === self || !edge.isDirected()) {
					indegreeCentrality--;
				}
				return true;
			}
			return false;
		};
		this.getAllEdges = function() {
			var e = edges.slice(0);
			for (var i = 0; i < ports.length; i++) {
				e.push.apply(e, ports[i].getEdges());
			}
			return e;
		};
		
		this.getIndegreeCentrality = function() {
			var pc = 0;
			for (var i = 0; i < ports.length; i++)
				pc += ports[i].getIndegreeCentrality();
			return indegreeCentrality + pc;
		};
				
		this.getOutdegreeCentrality = function() {
			var pc = 0;
			for (var i = 0; i < ports.length; i++)
				pc += ports[i].getOutdegreeCentrality();
			return outdegreeCentrality + pc;
		};
		
		this.getPorts = function() { return ports; };
		this.addPort = function(data, idFunction) {
			var id = _getId(data, idFunction), p = self.getPort(id);
			if (p == null) {
				p = new Port(data, idFunction, self);
				ports.push(p);		
			}
			return p;
		};
        
        /*
            Function: setPort
            Sets the underlying data for the port with the given id.  If the port does not yet exist,
            it is created.
        */
        this.setPort = function(id, data) {
            var p = self.getPort(id);
            if (!p) {
                p = self.addPort({id:id});
            }
            p.data = data;
            return p;
        };
		
		this.getPort = function(portId) {			
			for (var i = 0; i < ports.length; i++) {
				if (ports[i].id === portId)
					return ports[i];
			}
			return null;
		};
        
        this.removePort = function(port) {
            if (port) {
                var id = port.constructor == jsPlumbGraph.Port ? port.id : port, idx = -1;
                for (var i = 0; i < ports.length; i++) {
                    if (ports[i].id === id) {
                        idx = i; break;
                    }
                }    
                if (idx != -1) {
                    ports.splice(idx, 1);
                    return true;
                }
            }
            return false;       
        };

		this.inspect = function() { 
			var i = "{ id:" + id + ", edges:[\n";
			for (var j = 0; j < edges.length; j++) {
				i += edges[j].inspect() + "\n";
			}
			i+="]}";
			return i;
		};
	},
	Port = exports.Port = function(data, idFunction, node) {
		Vertex.apply(this, arguments);		
		this.getNode = function() { return node; };		
		this.getPorts = this.addPort = this.deletePort = this.getPort = null;
		this.getFullId = function() { return node.id + "." + this.id; };
	},
	// Group = exports.Group = function(id, nodes) {
				
	//},  ??
	/*
		Class: Edge
		This is an edge in the graph.  There can be one or zero of these for every pair of Vertices in the Graph.  Each Edge has an associated "cost".  This implementation has a static
		cost; that is it doesn't do any computation when asked what its cost is.  but in a dynamic
		system it is more likely an Edge's cost will change over time.
	*/
	Edge = exports.Edge = function(source, target, cost, directed) {
		Base.apply(this, arguments);
		this.source = source;
		this.target = target;
		var self = this,
			_cost = cost || 1,
			_directed = !(directed === false),
			_id = null,
			_connectionId  = null;
	
		this.data = {};
		this.getCost = function() { return _cost; };
		this.setCost = function(c) { _cost = c; };
		this.getId = function() { return _id === null ? self.source.id + "_" + self.target.id : _id; };
		this.setId = function(id) { _id = id; };
		this.isDirected = function() { return _directed; };

		this.inspect = function() { 
			if (_id === null) 			
				return "{ id:" + _id + ", connectionId:" + _connectionId + ", cost:" + _cost + ", directed:" + _directed+ ", source:" + self.source.id + ", target:" + self.target.id + "}";
		};
	},
	/*
		Class: Graph
		The Graph itself.  Contains a list of Vertex objects and a list of Edge objects.
		
		Parameters:
		
			defaultDirected - whether edges are directed by default; defaults to true.
			idFunction - function to use to extract an appropriate ID from the JSON for a give node. defaults to returning the 'id' property of the JSON.
	*/
	Graph = exports.Graph = function(params) {
		params = params || {};
		this.vertices = [];
		this.edges = [];
		var _vertexMap = {}, 
			_vertexCount = 0, 
			_edgeCount = 0,
			defaultDirected = !(params.defaultDirected === false),
			defaultCost = params.defaultCost || 1,
			self = this,
			_defaultIdFunction = params.idFunction || function(d) { return d.id; };

		/*
			Function: setIdFunction
			Sets the default function to use to extract an appropriate ID from the JSON for any given Node.
		*/
		self.setIdFunction = function(f) {
			_defaultIdFunction = f;
		};

		var _getVertex = function(e, createPortsIfMissing) {
			if (typeof e != "string") {
				return e;
			}
			else {
				var np = e.split("\."),
					nodeId = np[0],
					node = _vertexMap[nodeId];
	
				if (np.length === 2 && node != null) {
					var p = node.getPort(np[1]);
					if (p == null && createPortsIfMissing) 
						p = node.addPort(np[1]);
					return p;
				}
				else
					return node;
			}		
		};
	
		// -------------------------               public API               -----------------------

		/*
		* Function: clear
		* Clears the Graph of all its vertices and edges.
		*/
        this.clear = function() {
            self.vertices.splice(0, self.vertices.length);
			//  self.edges.splice(0, self.edges.length); ?  no. edges are stored on vertices. it is sufficient to set edgeCount to 0.
            _vertexCount = 0;
            _edgeCount = 0;
            _vertexMap = {};
        };
        
        /*
         * Function: getVertexCount
         * Returns the total number of vertices in the graph.
         */
        this.getVertexCount = function() {
			return self.vertices.length;
        };

        /*
        * Function: getVertexAt
        * Returns the vertex at the given index (used for bulk init type purposes)
        */
        this.getVertexAt = function(index) {
			return self.vertices[index];	
        };
        
		/*
		*	Function: getEdgeCount
		*	Returns the total number of edges in the graph.
		*/
        this.getEdgeCount = function() {
			return _edgeCount;
		};
		
        /*
        * Function: addEdge
        * Adds an Edge to the Graph. You can either supply a pre-constructed Edge, or up to four parameters
        * defining the edge.
        * 
        * Parameters:
        *	edge			-	if supplied as the first argument, this should be a pre-constructed Edge. other parameters will be ignored.
        *	sourceId		-	either a String id of the source vertex, or the source vertex object.
        *	targetId		-	either a String id of the target vertex, or the target vertex object.
        *	cost			-	optional; the cost of the edge. defaults to 1.
        *	directed		-	optional; whether or not the Edge is directed. defaults to true.
        */		
		this.addEdge = function(params) {
			var directed = params.directed == null ? defaultDirected === true : !(params.directed === false),
				cost = params.cost || defaultCost,
				edge = new Edge(_getVertex(params.source, true), _getVertex(params.target, true), cost, directed);			

			edge.data = params.data || {};
			edge.source.addEdge(edge);
			edge.target.addEdge(edge);
			edge.setId(_edgeCount++);
			 
			return edge;
		};
		/*
		* Function: addEdges
		* Adds a list of Edges to the Graph (Edges can be in any of the formats that addEdge supports).
		*
		this.addEdges = function(edges) {
			for (var i = 0; i < edges.length; i++) {
				self.addEdge(edges[i]);
			}
		};*/

		/*
		* Function: addVertex
		* Adds a vertex to the Graph
		*
		* Parameters:
		* vertexId		-	ID of the vertex.
		*/
		this.addVertex = function(data, idFunction) {
			var v = new Vertex(data, idFunction || _defaultIdFunction);
			self.vertices.push(v);
			_vertexMap[v.id] = v;
			v._id = _vertexCount++;
			return v;
		};		

		/*
		* Function: addVertices
		* Adds a list of vertices to the Graph
		*
		* Parameters:
		* vertexIds		-	IDs of the vertices.
		*/
		this.addVertices = function(data, idFunction) {
			for (var i = 0; i < data.length; i++) {
				self.addVertex(data[i], idFunction || _defaultIdFunction);
			}
		};		

			/*
			* Function: deleteVertex
			* Deletes a vertex
			*
			* Parameters:
			*	vertex		-	either a Vertex object, or a vertex id.
			*/
			this.deleteVertex = function(vertex) {
				var v = _getVertex(vertex);
				if (v) {
					var idx = -1;
					for (var i = 0; i < self.vertices.length; i++) {
						if (self.vertices[i].id === v.id) {
							idx = i;
							break;
						}
					}
					if (idx > -1) {
						self.vertices.splice(idx, 1);
					}
					var edges = v.getEdges();
					for (var j = 0; j < edges.length; j++) {
						self.deleteEdge(edges[j]);
					}
					_edgeCount -= edges.length;
			
					if (v.getPorts) {
						var ports = v.getPorts();
						for (var k = 0; k < ports.length; k++) {
							self.deleteVertex(ports[k]);
						}
					}
			
					delete _vertexMap[v.id];
					_vertexCount--;				
				}
			};

			/*
			* Function: addNode
			* Synonym for addVertex
			*/		 
			this.addNode = this.addVertex;

			/*
			* Function: addNodes
			* Synonym for addVertices
			*/
			this.addNodes = this.addVertices;

			/*
			* Function: deleteNode
			* Synonym for deleteVertex
			*/
			this.deleteNode = this.deleteVertex;

			/*
			* Function: deleteEdge
			* Deletes an edge.
			* Parameters:
			*	edge			-	an Edge object.
			*	ignoreOpposite	-	if true, won't delete the Edge's "_opposite" edge (if it exists that is. this parameter is for internal use). 
			*/
			this.deleteEdge = function(edge, ignoreOpposite) {
				var v = _getVertex(edge.source);
				if (v && v.deleteEdge(edge)) {
					_edgeCount--;
				}
				var v2 = _getVertex(edge.target);
				if (v2) {
					v2.deleteEdge(edge);
				}
			};

		/**
		 * Function:findPath 
		 * Finds the shortest path from source to target, using the Djikstra algorithm.
		 *
		 * Parameters:
		 * 	source - source Vertex
		 *  target - target Vertex
		 *  edgeSelector - optional yes/no function to filter active edges.
		 *  vertexSelector - optional yes/no function to filter active vertices.
		 *
		 * Returns:
		 * An array like [ {vertex, cost, edge}, {vertex,cost,edge} ... ] when successful; when unsuccessful the three compiled
		 * tables are returned - distances to nodes, each node's previous node, and the associated edge.  so you can call this method with
		 * no target set and get the entire table populated.
		 */
		this.findPath = function(source, target, edgeSelector, vertexSelector) {
			source = _getVertex(source);
			target = _getVertex(target);
			return Djikstra.compute( { graph:self, source:source, target:target, edgeSelector:edgeSelector, vertexSelector:vertexSelector } );
		};

		/**
		*	Function: getDistance
		*	Finds the distance between source and target.
		*
		*	Parameters:
		*	source 			-	source node
		*	target 			-	target node
		* 	edgeSelector 	- 	optional; used to filter edges.  currently not implemented.
		* 	vertexSelector 	- 	optional; used to filter vertices.  currently not implemented.
		*/
		this.getDistance = function(source, target, edgeSelector, vertexSelector) {
			var info = self.findPath(source, target, edgeSelector, vertexSelector);
			return info.pathDistance;
		};

		/*
		 * Function: getVertex
		 * Gets the vertex with the given id, null if not found.
	 	 */
		this.getVertex = _getVertex;		

		/*
		 * Function: printPath
		 * Returns the path from source to target as a String.
		 */
		this.printPath = function(source, target) {
			source = _getVertex(source);
			target = _getVertex(target);
			var path =  self.findPath(source, target);
			var s ="[" + source.id + " - " + target.id + "] : ";
			for (var i = 0; i < path.length; i++)
				s = s + "{ vertex:" + path[i].vertex.id + ", cost:" + path[i].cost + ", edge: " + path[i].edge.getId() + " } ";
			return s;
		};
		
		/**
			Function: getDiameter
			Returns the 'diameter' of the Graph.

			Parameters:
				dontUseMax	- 	whether or not to return Infinity if there is at least one pair of nodes for which there is no available path.
		*/
		this.getDiameter = function(dontUseMax) {
			var diameter = 0;       	
        	for (var i = 0; i < self.vertices.length; i++) {
	        	for (var j = 0; j < self.vertices.length; j++) {
	                if (j != i) {    	            
        	            var info = Djikstra.compute({graph:self, source:self.vertices[i], target:self.vertices[j]});
            	        if (info.path == null || info.path.length == 0) {
                    	    if (!dontUseMax) 
                    	    	return Infinity;
                    	}
                    	else
                        	diameter = Math.max(diameter, info.pathDistance);
                	}
            	}
        	}
        	return diameter;
        };

        this.diameter = this.getDiameter;

        /**
        	Function: getCentrality
        	Returns the degree centrality of the given node. This is an alias to getDegreeCentrality, as centrality
        	most commonly refers to degree centrality. Note that this returns incoming and outgoing connections; use
        	getIndegreeCentrality or getOutdegreeCentrality if you need to be more specific.

        	See:
        	getBetweenness
        	getCloseness
        */
        this.getCentrality = function(node, filter) {
        	node = _getVertex(node);
        	return (node.getIndegreeCentrality() + node.getOutdegreeCentrality()) / (self.getVertexCount() - 1);	        	
        };

        this.getDegreeCentrality = this.getCentrality;

        /**
        	Function: getIndegreeCentrality
        	Returns the indegree centrality of the given node (number of connections entering the vertex)
        */
        this.getIndegreeCentrality = function(node) {
        	node = _getVertex(node);
        	return node.getIndegreeCentrality() / (self.getVertexCount() - 1);	
        };

        /**
        	Function: getOutdegreeCentrality
        	Returns the outdegree centrality of the given node (number of connections exiting from the vertex)
        */
        this.getOutdegreeCentrality = function(node) {
        	node = _getVertex(node);
        	return node.getOutdegreeCentrality() / (self.getVertexCount() - 1);	
        };

        /**
        	Function: getCloseness
        	returns the Closeness centrality of the given node. This is the inverse of the node's farness.
        */
        this.getCloseness = function(node) {
        	return 1 / self.getFarness(node);
        };

        /**
        	Function: getFarness
        	Returns the farness centrality of the given node, ie. the sum of its distance from all other nodes.
        */
        this.getFarness = function(node) {
        	node = _getVertex(node);	
        	// sum all of its paths to every other node.
        	var info = Djikstra.compute({graph:self, source:node, target:node, processAll:true}), total = 0;
        	for (var i in info.dist) {
        		total += info.dist[i];
        	}
        	return total / (self.getVertexCount() - 1);
        };

        /**
        	Function: getBetweenness
        	Returns the betweenness centrality of the given node.
        */
        this.getBetweenness = function(node) {

        	var n = self.getVertexCount(), 
        		denominator = (n-1) * (n-2) / 2,
        		betweenness = 0,
        		totalPathsThroughFocus = 0,
        		processNode = function(source, target, info, pathFromTarget, paths) {
        			var parents = info.parents[source][target];
        			if (parents.length == 0) {
        				//console.log("trivial case found at node ", source);
        				var p = pathFromTarget.slice();
        				p.unshift(source);
        				paths.push(p);
        			}			
        			else {
        				for (var i = 0; i < parents.length; i++) {
        					//console.log("one parent of ", target, " is", parents[i][0].id);
        					if (pathFromTarget.indexOf(parents[i][0].id) == -1) {
	        					var p = pathFromTarget.slice();
	        					p.unshift(parents[i][0].id);
	        					processNode(source, parents[i][0].id, info, p, paths);
	        				}
        				}	
        			}
        		};        	
        		
        	node = _getVertex(node);
        	var info = FloydWarshall.compute({graph:self, focus:node});        		        	
        	
        	// for each node pair, retrieve the actual paths.  there may be multiple shortest paths for one given node
        	// pair, and we use the 'parents' array to help with this. its a 2d array containing null for [v1,v1],
        	// and an array of N entries for every [v1,vX]. N may be zero, which indicates that vN is adjacent to
        	// v1. if it is greater than zero then it tells you how many nodes adjacent to vN are on shortest paths, 
        	// but note that it _does not_ tell you how many shortest paths join to vN.  we have to recurse back from
        	// vN to each parent in this array, and look at that parent's entry; it will also be an array of N entries where
        	// N may be zero or more.  we recurse up this parent array until we hit the trivial case - that N = 0.
        	// as we go up the tree we can compare each node to see if it is the node for which we are computing
        	// betweenness. remember that it only counts if the node is on the path, not the source or target.

        	for (var v1 in info.paths) {
        		for (var v2 in info.paths[v1]) {
        			// v1 and v2 are the ids of our two nodes
        			//console.log(v1, v2, info.paths[v1][v2], info.parents[v1][v2]);
        			if (v1 != v2) {
        				var pathsForPair = [], pathsUsingFocusNode = 0;
        				processNode(v1, v2, info, [v2], pathsForPair);	
        				//console.log("paths for ", v1, v2, pathsForPair);
        				for (var i = 0; i < pathsForPair.length; i++) {
        					var idx = pathsForPair[i].indexOf(node.id);
        					if (idx > 0 && idx < pathsForPair[i].length - 1)
        						pathsUsingFocusNode++;
        				}
        			//	console.log("paths passing through", node.id, pathsUsingFocusNode);
        				betweenness += (pathsUsingFocusNode / pathsForPair.length);

        				totalPathsThroughFocus += pathsUsingFocusNode;
        			}
        		}
        	}

        	//console.log("total paths through node ", node.id, totalPathsThroughFocus);

        	return betweenness / denominator;
        };

        /**
        	Function: inspect
        	Helper method to dump the contents of the Graph to a string.
        */
        this.inspect = function() {
        	var r = "";
        	for (var i = 0; i < self.vertices.length; i++)
        		r += self.vertices[i].inspect() + "\n";
        		
        	return r; 
        };
	},

	/**
		finds the Vertex in the 'dist' table that has not yet been computed and has the smallest cost so far.
	*/
	_findSmallestDist = function(vertices, usedVertices, dist) {
		var idx = -1, node = null, smallest = Infinity;
		for (var i = 0; i < vertices.length; i++) {
			if (!usedVertices[i]) {
				if (dist[vertices[i].id] < smallest) {
					smallest = dist[vertices[i].id];
					idx = i;
					node = vertices[i];
				}
			}
		}
		return {node:node, index:idx};
	},

	/**
		assembles a path to the given target, using data from the 'dist' and 'previous' tables.  the source of the path is the source that was most recently passed in to the
		Djikstra.compute method.
	*/
	_findPath = function(dist, previous, edges, target) {
		var path = [], u = target;
		while(previous[u.id] != null) {
			path.splice(0,0,{vertex:u, cost:dist[u.id], edge:edges[u.id]});
			u = previous[u.id];
		}
		// insert start vertex.
		path.splice(0,0,{vertex:u, cost:0, edge:null});
		return path;
	},

	/**
		An implementation of the Djikstra shortest path algorithm.
	*/
	Djikstra = {
		compute : function(params) {
			var graph = params.graph, 
				source = params.source, 
				target = params.target,				
				dist = {}, 
				previous = {}, 
				edges = {}, 
				retVal = { dist:dist, previous:previous, edges:edges, path:[] },
				processAll = params.processAll;

			for (var i = 0; i < graph.vertices.length; i++) {
				dist[graph.vertices[i].id] = Infinity;				
			}
			if (source == null) source = graph.getVertex(params.sourceId);
			if (target == null) target = graph.getVertex(params.targetId);					
			if (source == null || target == null) return retVal;
			// save the nodes. source/target might be a port.
			var sourceNode = source, targetNode = target;
			
			// if source and/or target is a port, get the underlying Node.
			if (source.getNode) sourceNode = source.getNode();
			if (target.getNode) targetNode = target.getNode();			
			
			dist[sourceNode.id] = 0;
			var completedNodes = new Array(graph.vertices.length), 
				completed = 0,
				processEdges = function(nodeInfo, _edges, edgeSelector, neighbourSelector) {
					for (var i = 0; i < _edges.length; i++) {
						var edge = _edges[i];
						if (edgeSelector(edge)) {              
							
							var neighbour = neighbourSelector(edge);
							var alt = dist[nodeInfo.node.id] + edge.getCost();
							if (alt < dist[neighbour.tn.id]) {
								dist[neighbour.tn.id] = alt;
								previous[neighbour.tn.id] = nodeInfo.node;
								edges[neighbour.tn.id] = edge;
							}
						}
					}
				};

			while (completed < graph.vertices.length) {
				var curNodeInfo = _findSmallestDist(graph.vertices, completedNodes, dist);
				if (!curNodeInfo.node || dist[curNodeInfo.node.id] == Infinity) break;
				if (targetNode && curNodeInfo.node.id == targetNode.id) {
					 retVal.path = _findPath(dist, previous, edges, targetNode);
					 retVal.pathDistance = retVal.path[retVal.path.length - 1].cost;
					 if (!processAll) break;
				}
				completedNodes[curNodeInfo.index] = true;
				completed = completed + 1;
				processEdges(curNodeInfo, curNodeInfo.node.getAllEdges(), 
					function(e) { 
						var sn = e.source.getNode ? e.source.getNode() : e.source;
						return sn == curNodeInfo.node || !e.isDirected(); 
					}, 
					function(e) { 
						var sn = e.source.getNode ? e.source.getNode() : e.source,
							sp = e.source.getNode ? e.source : null,
							tn = e.target.getNode ? e.target.getNode() : e.target,
							tp = e.target.getNode ? e.target : null;
							
						return sn == curNodeInfo.node ? {tn:tn,tp:tp} : {tn:sn,tp:sp}; 
					});				
			}
			// the shortcut exit does not get here; this function returns two different types of value!
			return retVal;
		}
	},
	
	// http://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm
	/*
	 Assume a function edgeCost(i,j) which returns the cost of the edge from i to j
 	(infinity if there is none).
 	Also assume that n is the number of vertices and edgeCost(i,i) = 0


	int path[][];
 	A 2-dimensional matrix. At each step in the algorithm, path[i][j] is the shortest path
 	from i to j using intermediate vertices (1..kâˆ’1).  Each path[i][j] is initialized to
 	edgeCost(i,j).


 procedure FloydWarshall ()
    for k := 1 to n
       for i := 1 to n
          for j := 1 to n
             path[i][j] = min ( path[i][j], path[i][k]+path[k][j] );
    */
	FloydWarshall = {
		getPath:function(pathInfo, nextInfo, source, target) {			 			
			if (pathInfo[source.id][target.id] == Infinity) 
				return null;
			var intermediate = nextInfo[source.id][target.id];
			if (intermediate == null) 
				return " ";   /* there is an edge from i to j, with no vertices between */
			else
				return FloydWarshall.getPath(pathInfo, nextInfo, source, intermediate) + " " + intermediate.id + " " + FloydWarshall.getPath(pathInfo, nextInfo, intermediate,target);
		},
		getPaths:function(pathInfo, nextInfo, source, target, paths) {			 			
			if (pathInfo[source.id][target.id] == Infinity) 
				return null;
			var intermediate = nextInfo[source.id][target.id];
			if (intermediate.length == 0) 
				return " ";   /* there is an edge from i to j, with no vertices between */
			else
				return FloydWarshall.getPaths(pathInfo, nextInfo, source, intermediate[0]) + " " + intermediate[0].id + " " + FloydWarshall.getPaths(pathInfo, nextInfo, intermediate[0],target);
		},
		compute:function(params) {
			var graph = params.graph,
				n = graph.getVertexCount(),
				path = {},
				focus = params.focus,
				pathsThroughFocus = 0,
				next = {};			

			// init
			for	(var i = 0; i < n; i++) {
				var v = graph.getVertexAt(i);
				if (!path[v.id]) path[v.id] = {};
				if (!next[v.id]) next[v.id] = {};
				path[v.id][v.id] = 0;
				for (var j = 0; j < n; j++) {
					if (i != j) {
						var v2 = graph.getVertexAt(j);
						if (!path[v.id][v2.id]) path[v.id][v2.id] = Infinity;
						if (!next[v.id][v2.id]) next[v.id][v2.id] = [];
					}
				}				
				var edges = v.getEdges();
				//console.log("processing node", v.id, "with ", edges, "edges");
				for (var k = 0; k < edges.length; k++) {
					if (edges[k].source == v) {
						path[v.id][edges[k].target.id] = edges[k].getCost();
					}
					else {
						if (!path[edges[k].source.id]) {
							path[edges[k].source.id] = {};
							next[edges[k].source.id] = {};
						}
						path[v.id][edges[k].source.id] = edges[k].getCost();
					}
				}
			}	
			//
			for (var k = 0; k < n; k++) {
				for (var i = 0; i < n; i++) {
					for (var j = 0; j < n; j++) {
						if (i != j && j !=k && i !=k) {
							var id1 = graph.getVertexAt(i).id, id2 = graph.getVertexAt(j).id, id3 = graph.getVertexAt(k).id;
						//	console.log("testing ", "  sum of paths ", id1 + "-" + id3 + ":" + id3+"-" + id2, "(" + path[id1][id3] + "+" + path[id3][id2] + ") against ", id1 + "-" + id2, "(" + path[id1][id2] + ")");
							if ((path[id1][id3] + path[id3][id2]) <= path[id1][id2] && (path[id1][id3] + path[id3][id2]) != Infinity) {
						//		console.log("adding entry for ",id1 + "-" + id2, " to sum of paths ", id1 + "-" + id3 + ":" + id3+"-" + id2, "(" + (path[id1][id3] + path[id3][id2]) + ")");
								path[id1][id2] = path[id1][id3] + path[id3][id2];
								if (!next[id1][id2]) next[id1][id2] = [];
								next[id1][id2].unshift([graph.getVertexAt(k), path[id1][id2]]);
								//next[id1][id2] = (graph.getVertexAt(k));
							}
							//path[id1][id2] = Math.min ( path[id1][id2], path[id1][id3] + path[id3][id2] );	
						}										
					}
				}
			}

			//return [ path, pathsThroughFocus ];
			return {paths:path, parents:next};
		}
	};	

})(jsPlumbGraph);/*
 * jsPlumbToolkit
 *
 * copyright 2012 morrisonpitt.com
 * http://morrisonpitt.com
 *
 * Licensed under the GPL2 license.  This software is not free.
 *
 * This file contains IO support - loading/saving of GraphML and the internal JSON format used by the Toolkit.
 *
 */
 
/*
	DOM:
	
		- no knowledge of the DOM.
		
	DEPENDENCIES:
	
  		util  
*/

var jsPlumbToolkitIO = (typeof module !== "undefined" && module.exports) || {};	

;(function(exports) {

	exports.version = "0.1";
    exports.name = "jsPlumbToolkitIO";
    
    /*
		This uses the toolkit's internal JSON format.  
	*/	
	var JSONGraphParser = function(data, toolkit) {
		var nodes = data.nodes || [],
			edges = data.edges || [];
			
		for (var i = 0; i < nodes.length; i++) {
			var n = toolkit.addNode(nodes[i]);
		}
		for (var j = 0; j < edges.length; j++) {
			var c = edges[j].cost || 1,
				bd = (edges[j].bidirectional === true);
				
			toolkit.addEdge({source:edges[j].source, target:edges[j].target, cost:c, bidirectional:bd, data:edges[j]});
		}		
	},
	JSONGraphExporter = function(graph) {
	
	},
	// http://graphml.graphdrawing.org/primer/graphml-primer.html#BCfile	
	GraphMLParser = function(data, toolkit) {	
		var	util = jsPlumbToolkitUtil.xml,			
			root = util.getChild(data.documentElement, "graph");
			kCache = {
				"node":{},
				"edge":{}
			};

		if (root) {
			var keys = util.getChildren(data.documentElement, "key"),
				nodes = util.getChildren(root, "node") || [],
				edges = util.getChildren(root, "edge") || [],
				bidirectional = (root.getAttribute("edgedefault") || "undirected") == "undirected";
				
			for (var i = 0; i < keys.length; i++) {
				var kid = keys[i].getAttribute("id"),
					kfor = keys[i].getAttribute("for"),
					aName = keys[i].getAttribute("attr.name"),
					aType = keys[i].getAttribute("attr.type"),
					kd = util.getChild(keys[i], "default");

				kCache[kfor][kid] = {
					id:kid,
					name:aName,
					type:aType,
					_default:kd != null ? util.getNodeText(kd) : null
				};					
			}

			var applyDefaults = function(to, type) {
					for (var j in kCache[type]) {
						if (kCache[type][j]._default) {
							to.setAttribute(j, kCache[type][j]._default);
							to.data[j] = kCache[type][j]._default;
						}
					}	
				},
				applyAtts = function(el, to, type) {
					var keys = util.getChildren(el, "data");
					for (var i = 0; i < keys.length; i++) {
						var k = kCache[type][keys[i].getAttribute("key")];
						to.setAttribute(k.id, util.getNodeText(keys[i]));
						to.data[k.id] = util.getNodeText(keys[i]);
					}	
				};

			for (var i = 0; i < nodes.length; i++) {
				var n = toolkit.addNode(nodes[i].getAttribute("id"));					
				n.data = {};
				applyDefaults(n, "node");	
				applyAtts(nodes[i], n, "node");
			}	

			for (var i = 0; i < edges.length; i++) {
				var s = edges[i].getAttribute("source"),
					t = edges[i].getAttribute("target"),
					id = edges[i].getAttribute("id"),
					d = edges[i].getAttribute("directed"),
					_d = d != null ? !d : bidirectional,				
					e = toolkit.addEdge({source:s, target:t, bidirectional:_d});

				applyDefaults(e, "edge");	
				applyAtts(edges[i], e, "edge");
			}	
		}
	},
	GraphMLExporter = function(toolkit) {
		var util = jsPlumbToolkit.util.xml,
			root = util.createElement("graph");

		return util.xmlToString(root);
	};

	exports.exporters = {
		"graphml":GraphMLExporter,
		"json":JSONGraphExporter
	};
	
	exports.parsers = {
		"graphml":GraphMLParser,
		"json":JSONGraphParser
	};	

	exports.parse = function(type, source, toolkit, parameters) {		
		var parser = exports.parsers[type];
		if (parser === null)
			throw new Error(type + " is unsupported");
		else
			return parser(source, toolkit, parameters);			
	};

	exports["export"] = function(type, toolkit) {
		var exporter = exports.exporters[type];
		if (exporter === null)
			throw new Error(type + " is unsupported");
		else
			return exporter(toolkit);
	};
    
})(jsPlumbToolkitIO);/*
 * jsPlumbToolkit
 *
 * copyright 2012 morrisonpitt.com
 * http://morrisonpitt.com
 *
 * Licensed under the GPL2 license.  This software is not free.
 *
 * This file contains the layouts supported by the Toolkit.
 *
 */

/*
	DOM:

		knows about the DOM, sort of, through jsPlumb.CurrentLibrary. see below.
	
	DEPENDENCIES

	- jsPlumb.CurrentLibrary  to get element positions and sizes.  However, in the ideal world, this would not be dependent on the browser DOM.  it has 
	no real need to be, given that it does most of its calculations in its own coordinate space, and then just converts them into 
	DOM coords using jsPlumb.CurrentLibrary.

	So perhaps we can abstract out the interactions with jsPlumb.CurrentLibrary to a layer that gets/sets coordinates.				
*/

var jsPlumbLayout = (typeof module !== "undefined" && module.exports) || {};	

;(function(exports) {

	var AbstractLayout  = exports.AbstractLayout = function(params) {		
		params = params || {};
        var self = this, 
            jpcl = jsPlumb.CurrentLibrary, 
            _defaultParameters = function() {             
                return { padding:[0,0] }
            },
            // this takes the current value of 'parameters' and merges it on top of any default param
            // values declared by the layout, then assigns those to the parameters object.
            // it is called at 'begin'
            _prepareParameters = function() {
                var p = jsPlumb.extend(_defaultParameters(), self.defaultParameters || {});
                jsPlumb.extend(p, parameters || {});
                parameters = p;
            },
            parameters = params.parameters;
    

		self.animate = params.animate;
		self.adapter = params.adapter;		
		//self.margins = params.margins || [0,0]; // deprecated        
		//self.padding = params.padding || [0,0];        
		
		self.requiresScaling = false;				// force directed layouts will set this to true.
		var draggable = params.draggable !== false,
			dragOptions = params.dragOptions || {},
            _jsPlumb = params.jsPlumb || jsPlumb,
            _jsPlumbToolkit = params.jsPlumbToolkit || jsPlumbToolkit,
            graph = params.graph,
			// this x,y location of every element.  all layouts write to this.
			// this is a map whose keys are node ids and whose values are [x,y] positions.  access to it is restricted
			// to the 'getPosition' method, which creates an entry for the given node if one does not yet exist.
			positions = {},
            // x,y locations of elements when the user has intervened (via dragging or programmatically)
            userPositions = {},
			positionArray = [],
			sizes = {},
            container = jpcl.getElementObject(params.container || window),
            containerSize = jpcl.getSize(container),
            containerOffset = jpcl.getOffset(container),
            width = (params.width || containerSize[0]),
            height = (params.height || containerSize[1]),
            done = false;

        var _reset = function() { 
            done = false; 
            positions = {};
            userPositions = {};
            positionArray.splice(0);
            sizes = {};
            self.reset && self.reset();
        };        
		
        /*
            Function: setUserPosition
            Sets the x,y position of some node. This is called as the result of user activity, such as dragging, or
            programmatically setting the position of a node.  Layouts treat this in different ways: force directed
            layouts will give the associated node more mass, to stop it from moving (much).  Others may just honour
            directly the value you supply.

            Any user-supplied positions are cleared on reset (which is called on relayout), but not on refresh.
        */
        self.setUserPosition = function(nodeId, x, y) {           
            var p = positions[nodeId];
            if (!p)
                positions[nodeId] = [x,y];
            else {
                p[0] = x;
                p[1] = y;
            }
            userPositions[nodeId] = [x,y];
        };        
        
        /*
            Function: nodeRemoved
            Called by components to inform a layout that a given node was removed.
            
            Parameters:
                nodeId  -   id of the the node that was removed.
        */
        self.nodeRemoved = function(nodeId) {
            delete positions[nodeId];
            delete userPositions[nodeId];
            delete sizes[nodeId];
            if (self._nodeRemoved) self._nodeRemoved(nodeId);
        };
            		
            //
            // gets the size of the node with given id, caching it for later use.
            //
		var _getSize = function(id) {
                var s = sizes[id];
                if (!s) {
                    s = jpcl.getSize(jpcl.getElementObject(id));
                    sizes[id] = s;
                }
                return s;
            },
            //
            // gets the position of the node with given id, creating it if null and optionally setting values.
            // note this method does a 'pass by reference' thing as the return value - any changes you make will
            // be used by the final layout step (this is a good thing)
            //
            _getPosition = function(id, x, y) {
                var p = positions[id];
                if (!p) {
                    if (x != null && y != null)
                        p = [x, y];
                    else
                        p = [Math.floor(Math.random()*(width+1)), Math.floor(Math.random()*(height + 1))];
                    positions[id] = p;
                    positionArray.push([p, id]);
                }
                return p;
            },
            _setPosition = function(id, x, y) {
                var p = positions[id];
                if (!p) {
                    p = positions[id] = [ x, y ];
                    positionArray.push([p, id]);
                }
                else {
                    p[0] = x; p[1] = y;
                }
            },
            _getRandomPosition = function(id, w, h) {
                var p = positions[id];
                if (!p) {
                    p = positions[id] = [];
                }
                p[0] = Math.floor(Math.random()* w);
                p[1] = Math.floor(Math.random()* h);
                return p;
            },
            _getUserPosition = function(id) {
                var up = userPositions[id];
                if (!up) 
                    up = userPositions[id] = [];
                return up;
            },
            _setUserPosition = function(id, x, y) {
                var up = userPositions[id];
                if (!up) 
                    up = userPositions[id] = [ x, y ];
                else {
                    up[0] = x; up[1] = y;
                }
            },
            //
			// gets the bounding box for all positioned elements.  this is in the coord space of the layout in use, and
			// may differ from pixels coords.  it is mapped by the updateUIPosition function to pixel space.
		    //
            getBoundingBox = function() {
                var xmin = ymin = Infinity, xmax = ymax = -Infinity;
                for (var i in positions) {
                    var s = _getSize(i);
                    xmin = Math.min(xmin, positions[i][0]);
                    xmax = Math.max(xmax, positions[i][0]);
                    ymin = Math.min(ymin, positions[i][1]);
                    ymax = Math.max(ymax, positions[i][1]);																
                }
                return [ [ xmin, ymin ], [ xmax, ymax ], Math.abs(xmin - xmax), Math.abs(ymin - ymax) ];
            },
            // creates a sorted array of positions (each of which contains element id, element, vertex etc).
            // they are sorted by their distance from the top left corner of the bounding box.
            // this array can then be iterated through to perform a "magnetisation" function, which will push
            // apart elements that are overlapping each other.
            _sortPositions = function(bb) {
                positionArray.sort(function(a,b) {
                    var distA = Math.sqrt(Math.pow(a[0][0] - bb[0][0], 2) + Math.pow(a[0][1] - bb[0][1], 2)),
                        distB = Math.sqrt(Math.pow(b[0][0] - bb[0][0], 2) + Math.pow(b[0][1] - bb[0][1], 2));
    
                    a.push(distA);b.push(distB);
                    return distA < distB ? -1 : distA > distB ? 1 : 0;
                });					
            },
            _isOnEdge = function(r, axis, dim, v) { return (r[axis] <= v && v <= r[axis] + r[dim]); },
            _xAdj = [ function(r1, r2) { return r1.x + r1.w - r2.x; }, function(r1, r2) { return r1.x - (r2.x + r2.w); } ],
            _yAdj = [ function(r1, r2) { return r1.y + r1.h - r2.y; }, function(r1, r2) { return r1.y - (r2.y + r2.h); } ],
            _adj = [
                null,
                [ _xAdj[0], _yAdj[1] ],
                [ _xAdj[0], _yAdj[0] ],
                [ _xAdj[1], _yAdj[0] ],
                [ _xAdj[1], _yAdj[1] ]
            ],					
            _genAdj = function(r1, r2, m, b, s) {
                if (isNaN(m)) m = 0;
                var y = r2.y + r2.h, 
                    x = (m == Infinity || m == -Infinity) ? r2.x + (r2.w / 2) :  (y - b) / m,
                    theta = Math.atan(m);
    
                if (_isOnEdge(r2, "x", "w", x)) {	
                    // hypotenuse =  rise / sin(theta)
                    // run = hypotenuse * cos(theta)
                    var rise = _adj[s][1](r1, r2), 
                        h = rise / Math.sin(theta),
                        run = h * Math.cos(theta);
                    return {
                        left:run,
                        top:rise
                    };
                }			
                else {
                    // hypotenuse =  rise / cos(theta)
                    // run = hypotenuse * sin(theta)
                    var run = _adj[s][0](r1, r2),
                        h = run / Math.cos(theta),
                        rise = h * Math.sin(theta);
                    return {
                        left:run,
                        top:rise
                    };
                }
            },
            // split out from magnetize, this is the code that calculates how far to move one rectangle from
            // another in order that there is space between them. it is also used by the circular layout.
            _calculateSpacingAdjustment = function(r1, r2) {
                var c1 = [ r1.x + (r1.w / 2), r1.y + (r1.h / 2) ],
                    c2 = [ r2.x + (r2.w / 2), r2.y + (r2.h / 2) ],
                    m = jsPlumbUtil.gradient(c1, c2),
                    s = jsPlumbUtil.segment(c1, c2),
                    b = (m == Infinity || m == -Infinity || isNaN(m)) ? 0 : c1[1] - (m * c1[0]);
                        
                return _genAdj(r1, r2, m, b, s);		
            },
            _magnetize = function() {						
                _sortPositions(getBoundingBox());					// it seems this might not be necessary.
    
                var iterations = 100, iteration = 1, uncleanRun = true;
                while (uncleanRun && iteration < iterations) {
                    uncleanRun = false;
                    for (var i = 0; i < positionArray.length; i++) {
                        var jpcl = jsPlumb.CurrentLibrary,
                            o1 = positions[positionArray[i][1]],
                            s1 = sizes[positionArray[i][1]],
                            // create a rectangle for first element: this encompasses the element and padding on each
                            //side
                            r1 = { x:o1[0] - self.padding[0], y: o1[1] - self.padding[1], w:s1[0] + (2 * self.padding[0]), h:s1[1] + (2 * self.padding[1]) };
    
                        for (var j = 0; j < positionArray.length; j++) {
                            if (i != j) {								
                                var o2 = positions[positionArray[j][1]],
                                    s2 = sizes[positionArray[j][1]],
                                    // create a rectangle for the second element, again by putting padding of the desired
                                    // amount around the bounds of the element.
                                    r2 = { x:o2[0] - self.padding[0], y: o2[1] - self.padding[1], w:s2[0] + (2 * self.padding[0]), h:s2[1] + (2 * self.padding[1]) };								
    
                                // if the two rectangles intersect then figure out how much to move the second one by.
                                if (jsPlumbUtil.intersects(r1, r2)) {									
                                    uncleanRun = true;																			
                                    var adjustBy = _calculateSpacingAdjustment(r1, r2);																
                                    o2[0] += (adjustBy.left + 1);
                                    o2[1] += (adjustBy.top + 1);
                                }
                            }
                        }	
                    }	
                    iteration++;
                }				
            },
            dumpPos = function() {
                for (var e in positions)	
                    console.log(e, positions[e][0], positions[e][1]);
            },
            _draw = function() {
                // draw all the nodes. some layouts have placed everything exactly where they want it,
                // but others - like force directed - have ended up with the nodes bunched together somewhere, with values
                // that need to be scaled.
                var bb = getBoundingBox(),
                    dx = ((width - bb[2]) / 2) - bb[0][0],
                    dy = ((height - bb[3]) / 2) - bb[0][1],
                    scale = function(pos) {
                        if (!self.requiresScaling) {
                            // if no scaling, center the point in the layout.
                            return {
                                //left:pos[0] + dx,
                                //top:pos[1] + dy
                                left:pos[0], top:pos[1]
                            };
                        }
                        else {                            
                            var xscale = ((pos[0] - bb[0][0]) / bb[2]) + 0.05,
                                yscale = ((pos[1] - bb[0][1]) / bb[3]) + 0.05;
                            return {
                                left:xscale * width * 0.9,
                                top:yscale * height * 0.9
                            };
                        }
                    };				
                                
                for (var e in positions) {			
                    var el = jpcl.getElementObject(e),
                        p = positions[e],
                        up = userPositions[e],
                        o = up && up[0] != null && up[1] != null ? {left:up[0], top:up[1]} : scale(p);
                    
                    self.adapter.setOffset(el, o);					
                }
                /*
                for (var e in positions) {			
                    var el = jpcl.getElementObject(e),
                        p = positions[e],
                        up = userPositions[e],
                        o = up && up[0] && up[1] ? {left:up[0], top:up[1]} : {left:p[0], top:p[1] };
                    
                    self.adapter.setOffset(el, o);					
                }*/
            },
            bb = function(msg) {
                console.log(msg);
                var b = getBoundingBox();
                dumpPos();
                console.log(b[0], b[1], b[2], b[3]);
            };
        
        // debug
        self.bb = bb;
        
        // begin and end are 'abstract' functions that subclasses may implement if they wish.
        self.begin = function() { };
        self.end = function() { };
			
        /*
            Function: execute
            Runs the layout.
        */
        var _layout = function() {

            _prepareParameters();

            self.begin && self.begin(graph, _jsPlumbToolkit, parameters);
            
            while (!done) {
				self.step(graph, _jsPlumbToolkit, parameters);										
			}			

			if (self.doMagnetize) _magnetize();				
			_draw();	
            self.end && self.end(graph, _jsPlumbToolkit, parameters);
        };        
        
        /*
            Function: relayout
            runs the layout, first doing a reset.

            Parameters:

                newParameters   -   optional new set of parameters to apply.
        */
		self.relayout = function(newParameters) {		            
			_reset();
            if (newParameters != null)
                parameters = newParameters;
			_layout();
		};
		
				
        /*
            Function: layout
            Re-runs (or runs for the first time) the layout without resetting any user-supplied or previously calculated positions.
        */
		self.layout = function() {
            done = false;
			_layout();
		};

        self.clear = function() {
            _reset();
        };
        
        return {
            jsPlumb:_jsPlumb,
            toolkit:_jsPlumbToolkit,
            graph:graph,
            getPosition:_getPosition,
            setPosition:_setPosition,
            getRandomPosition:_getRandomPosition,
            getSize:_getSize,
            getUserPosition:_getUserPosition,        
            setUserPosition:_setUserPosition,
            calculateSpacingAdjustment:_calculateSpacingAdjustment,
            width:width,
            height:height,
            setDone : function(d) { done = d; }
        };
	};

    /*
        Mixin for force directed layouts.
    */
    var ForceDirectedLayout = function(params) {
        var self = this,
            _super = AbstractLayout.apply(this, arguments);							
        
        //self.doMagnetize = true;		
        return _super;
    };
    
    /*
        Mixin for layouts that have an absolute backing.  This includes, of course, the 'Absolute' layout.
    */
    var AbsoluteBackedLayout = function(params) {
        params = params || {};
        var _super = AbstractLayout.apply(this, arguments),
            self = this;
                                        
        self.begin = function(graph, toolkit, parameters) {					
            var count = graph.getVertexCount(),
                locationFunction = parameters.locationFunction || function(n) {
                   return [ n.data.left, n.data.top ];
                };

            for (var i = 0; i < count; i++) {
                var v = graph.getVertexAt(i),
                    id = toolkit.getNodeId(v.data),
                    l = locationFunction(v);
                
                _super.setPosition(id, l[0], l[1]);
                _super.setUserPosition(id, l[0], l[1]);
            }					
        };
        
        self.step = function() { 
            // all the work was done in 'begin'            
            _super.setDone(true);
        };
        
        return _super;
    };

    /**
    * Class: HierarchicalLayout
    * Mixin for hierarchical layouts (those that expect a root node)
    *		
    * Parameters:		
    * root - id of the root node. if you do not supply this, the layout will just use the first node it finds as the root.
    */
    var HierarchicalLayout = function(params) {
        var self = this,
            _super = jsPlumbLayout.AbstractLayout.apply(this, arguments);	

        self.begin = function(graph, toolkit, parameters) {
            //parameters.root = params.root;
            parameters.ignoreLoops = !(params.ignoreLoops === false)
            if (!parameters.root) {
                if (graph.getVertexCount() > 0) {
                    parameters.rootNode = graph.getVertexAt(0);
                    parameters.root = parameters.rootNode.id;								
                }			
                else
                    _super.setDone(true);
                  //  throw "No root specified and graph is empty";				
            }	
            else
                parameters.rootNode = graph.getVertex(parameters.root);
        };
        
        return _super;
    };
	
    exports.Layouts = {					
        
        /*
            Class: Magnetized Layout
            A simple layout that pushes elements away from the element whose [top,left] corner is closest
            to the origin.
        
            Parameters:
                reverse -   reverse the order of node traversal. Defaults to false.
        */
        "Magnetized":function(params) {
            var self = this,			
                _super = jsPlumbLayout.AbstractLayout.apply(this, arguments),				    
                reverse = params.reverse;
            
            self.doMagnetize = true;		
                
            self.step = function(graph, toolkit) { 
                var nodeCount = graph.getVertexCount(),
                    _one = function(idx) {
                        var sourceNode = graph.getVertexAt(idx),
                            snId = sourceNode.id,
                            sourceNodePos = _super.getPosition(snId);
                    }; 
                // this has the effect of just reserving a random spot for each node.
                if (reverse) {
                    for (var i = nodeCount - 1; i > -1; i--) {
                        _one(i);
                    }
                }
                else {
                    for (var i = 0; i < nodeCount; i++) {
                        _one(i);
                    }
                }
                _super.setDone(true);
                // now the magnetize routine will push everything apart
            };
        },
        /*
            Class: Balloon layout
            Provides a "balloon" layout, in which child nodes of a given node are grouped around it in a circle,
            with nodes that themselves have children further away than nodes that have no children.

            Parameters:				
                padding - minimum distance between a node and its child nodes. Defaults to 30 pixels.                    

        */	
        "Balloon":function(params) {
            params = params || {};
            var self = this,								
                _super = HierarchicalLayout.apply(this, arguments),
                _nodes = {}, _visitedNodes = {},
                curX = 0, curY = 0,
                jpcl = jsPlumb.CurrentLibrary,					
                _id = _super.toolkit.getNodeId,						
                _add = function(node, x, y, size, depth, angle) {
                    var info = {
                        node:node,
                        id:node.id,
                        size:size,
                        pos:_super.getPosition(node.id, x, y),
                        depth:depth,
                        angle:angle,
                        children:[]
                    };
                    
                    jsPlumbUtil.addToList(_nodes, depth, info);										
                    return info;
                };
                        
            var _doOne = function(info, dist, angle, parameters) {													

                if (_visitedNodes[info.node.id]) {										
                    if (!_super.ignoreLoops) 
                        throw "Circular loop: cannot layout hierarchy";
                    else
                        return;
                }
                    
                _visitedNodes[info.node.id] = true;

                var edges = info.node.getAllEdges(),
                    degreesPerChild = 2 * Math.PI / edges.length,										
                    nodeSize = _super.getSize(info.node.id),
                    nodeRect = {
                        x:info.pos[0] - (nodeSize[0] / 2) - parameters.padding,
                        y:info.pos[1] - (nodeSize[1] / 2) - parameters.padding,
                        w:nodeSize[0] + (parameters.padding * 2),
                        h:nodeSize[1] + (parameters.padding * 2)
                    },
                    minx = nodeRect.x, miny = nodeRect.y, maxx = minx + nodeRect.w, maxy = miny + nodeRect.h;
                            
                angle += degreesPerChild;

                //console.log("processing node ", info.node.id, "num children is", edges.length);
                var counter = 0, radius = 0;
                for (var i = 0; i < edges.length; i++) {
                    if (info.node == edges[i].source) {
                        var target = _super.graph.getVertex(edges[i].target),
                            ccx = info.pos[0] + (Math.cos(angle) * dist),
                            ccy = info.pos[1] + (Math.sin(angle) * dist),
                            s = _super.getSize(target.id);
                        info.children.push(_add(target, ccx, ccy, s, info.depth + 1, angle));
                        angle += degreesPerChild;
                    }
                }
                    
                // at this point i have the location of the focused node and the min/max extent of all its children
                // as they have been placed.								
                for (var i = 0; i < info.children.length; i++) {
                    _doOne(info.children[i], dist, info.children[i].angle + Math.PI, parameters );										
                    //console.log("parent is ", info.node.id, "with", info.children[i].children.length, "children");
                    var targetPadding = info.children[i].children.length > 0 ? parameters.padding * 4 : parameters.padding,
                        targetRect = {
                            x:info.children[i].pos[0] - (info.children[i].size[0] / 2) - targetPadding,
                            y:info.children[i].pos[1] - (info.children[i].size[1] / 2) - targetPadding,
                            w:info.children[i].size[0] + (2 * targetPadding),
                            h:info.children[i].size[1] + (2 * targetPadding)
                        },
                        adjustChildren = function(nodeInfo, delta) {
                            nodeInfo.pos[0] += delta.left;
                            nodeInfo.pos[1] += delta.top;
                            if (nodeInfo.children) {
                                for (var j = 0; j < nodeInfo.children.length; j++) {																
                                    adjustChildren(nodeInfo.children[j], delta);
                                }
                            }
                        };
                                
                    if (jsPlumbUtil.intersects(nodeRect, targetRect)) {
                        var delta = _super.calculateSpacingAdjustment(nodeRect, targetRect);
                        adjustChildren(info.children[i], delta);												
                    }										
                }								
            };	

            self.defaultParameters = {
                padding:30
            };

            self.step = function(graph, toolkit, parameters) {
                var rs = _super.getSize(parameters.root),
                    info = _add(parameters.rootNode, curX, curY, rs, 0);
                
                info.root = true;						
                _doOne(info, 1, -(Math.PI / 2), parameters);								
                _super.setDone(true);
            };	

            self.reset = function() {
                _nodes = {}; 
                _visitedNodes = {};
                curX = 0; curY = 0;
            };
        },
        /*
            Class: Hierarchical layout
            Provides a hierarchical tree layout.

            Parameters:				
            padding - minimum distance between a node and its child nodes. This is an array with [x,y] values; the defaults are [20,20].

        */
        "Hierarchical":function(params) {
            var self = this,
                _super = HierarchicalLayout.apply(this, arguments),                
                orientation, _horizontal, axisIndex, axisDimension, nodeCount, padding,
                jpcl = jsPlumb.CurrentLibrary,
                maxSizes = [],
                _hierarchy = [], _childGroups = [],
                _id = _super.toolkit.getNodeId,					
                _get = function(depth) {
                    var h = _hierarchy[depth];
                    if (!h) {
                        h = { nodes:[], pointer:0 };
                        _hierarchy[depth] = h;
                    }
                    return h;
                },
                _add = function(node, nodeSize, depth, parent, childGroup) {
                    // get the info for this level; info contains a list of nodes and a current pointer for position
                    // of the next inserted node. this pointer is incremented by the size of each new node plus padding.
                    // note that we have derived 'axisIndex' above to tell us whether to use width or height, depending on the
                    // layout's orientation.
                    var h = _get(depth),
                        // make an entry for this node.
                        i = {
                            node:node,
                            parent:parent,
                            childGroup:childGroup,
                            loc:h.pointer,
                            index:h.nodes.length,
                            dimensions:nodeSize,
                            size:nodeSize[axisIndex]
                        };
                    var otherAxis = nodeSize[axisIndex == 0 ? 1 : 0];
                    if (maxSizes[depth] == null) maxSizes[depth] = otherAxis; else Math.max(maxSizes[depth], otherAxis);
                    // increment the pointer by the size of the node plus padding.
                    h.pointer += (nodeSize[axisIndex] + padding[axisIndex]);
                    // add the new node.
                    h.nodes.push(i);
                    //console.log("added node " + _id(node) + " to level " + depth + " with index " + h.nodes.length + " at loc " + i.loc + "; level pointer is now " + h.pointer);
                    return i;
                },
                // register a child group at a given depth.
                _addChildGroup = function(cg, depth) {
                    var level = _childGroups[depth];
                    if (!level) {
                        level = []
                        _childGroups[depth] = level;
                    }
                    cg.index = level.length;
                    level.push(cg);								
                },
                _centerChildGroup = function(cg) {
                    if (cg.size > 0) {
                        var idealLoc = (cg.parent.loc + (cg.parent.size / 2)) - ((cg.size - padding[axisIndex]) / 2) ; // remove last padding from child group in size calc
                        //console.log("ideally centering child group of size " + cg.size + " at loc ", idealLoc, "parent is", _id(cg.parent.node));
                        // get the existing groups for this groups level and find the furthest pointer.
                        var groups = _childGroups[cg.depth],
                            lastPointer = -Infinity,
                            delta = 0;
                                
                        if (groups != null && groups.length > 0) {
                            var lg = groups[groups.length - 1],
                                lgn = lg.nodes[lg.nodes.length - 1];
                            lastPointer = lgn.loc + lgn.size + padding[axisIndex];
                        }
                                    
                        //console.log("pointer from last child group is ", lastPointer);
                        if (idealLoc >= lastPointer) {
                            //console.log("child group can go here.");
                            cg.loc = idealLoc;										
                        }
                        else {
                            delta = lastPointer - idealLoc;
                            //console.log("child group cannot get here; it must be shifted by ", delta);
                            cg.loc = lastPointer;
                        }
                            
                        // place the nodes in the child group now.
                        // we may now have to re-center the parent for this group
                        var _l = cg.loc;
                        for (var i = 0; i < cg.nodes.length; i++) {
                            cg.nodes[i].loc = _l;
                            _l += cg.nodes[i].size;
                            _l += padding[axisIndex];
                            //console.log("placing node ", _id(cg.nodes[i].node), " at ", cg.nodes[i].loc);
                        }
                            
                        if (delta > 0) {
                            _centerParents(cg);
                        }
                            
                        _addChildGroup(cg, cg.depth);
                    }
                },
                _centerParent = function(cg) {
                    var min = cg.nodes[0].loc,
                        max = cg.nodes[cg.nodes.length - 1].loc + cg.nodes[cg.nodes.length - 1].size,
                        c = (min + max) / 2,
                        pl = c - (cg.parent.size / 2),
                        pDelta = pl - cg.parent.loc;
                            
                    cg.parent.loc = pl;
                        
                    if (!cg.parent.root) {
                        // now, find the child group the parent belongs to, and its index in the child group, and adjust the
                        // rest of the nodes to the right of the parent in that child group.
                        var parentChildGroup = cg.parent.childGroup;
                        for (var i = cg.parent.childGroupIndex + 1; i < parentChildGroup.nodes.length; i++)
                            parentChildGroup.nodes[i].loc += pDelta;									
                    }
                },
                _centerParents = function(cg) {
                    var _c = cg;
                    while (_c != null) {
                        _centerParent(_c);
                        _c = _c.parent.childGroup;
                    }
                },				
                _doOne = function(info, level) {
                    var edges = info.node.getAllEdges(_id(info.node)),
                        childGroup = {
                            nodes:[], loc:0, size:0, parent:info, depth:level+1
                        },
                        childInfoList = [];
                            
                    for (var i = 0; i < edges.length; i++) {								
                        if (edges[i].source == info.node) {
                            // for each child node, get the node and its element object and dimensions
                            var childNode = _super.graph.getVertex(edges[i].target),
                                s = _super.getSize(_id(childNode)),
                                // add the child node to the appropriate level in the hierarchy
                                childInfo = _add(childNode, s, level + 1, info, childGroup);
                            // and add it to this node's childGroup too.
                            childInfo.childGroupIndex = childGroup.nodes.length;
                            childGroup.nodes.push(childInfo);
                            // calculate how much room this child group takes 										
                            childGroup.size += (s[axisIndex] + padding[axisIndex]);
                            childInfoList.push(childInfo);
                        }
                    }
                    // now try to center this child group, with its computed size. this will place the individual node
                    // entries, and adjust parents and their siblings as necessary.
                    _centerChildGroup(childGroup);
                
                    for (var i = 0; i < childInfoList.length; i++) {								
                        _doOne(childInfoList[i], level + 1);								
                    }						
                };

            self.defaultParameters = {
                padding:[20,20],
                orientation:"horizontal"
            };    
    
            var sb = self.begin;
            self.begin = function(graph, toolkit, parameters) {
                sb.apply(this, arguments);
                orientation = parameters.orientation;
                _horizontal = (orientation === "horizontal");
                axisIndex = _horizontal ? 0 : 1;
                axisDimension = _horizontal ? "width" : "height";
                nodeCount = graph.getVertexCount();                    
                padding = parameters.padding;
            };

            self.step = function(graph, toolkit, parameters) {
                var rs = _super.getSize(parameters.root),
                    info = _add(parameters.rootNode, rs, 0, null, null);
                        
                info.root = true;
                // this will recurse down and place everything.
                _doOne(info, 0, null);
                // write positions. 
                var otherAxis = 0;
                for (var i = 0; i < _hierarchy.length; i++) {
                    for (var j = 0; j < _hierarchy[i].nodes.length; j++) {
                        var x = axisIndex == 0 ? _hierarchy[i].nodes[j].loc : otherAxis;
                        var y = axisIndex == 1 ? _hierarchy[i].nodes[j].loc : otherAxis;
                        _super.setPosition(_id(_hierarchy[i].nodes[j].node), x, y);										
                    }
                    otherAxis += (maxSizes[i] + padding[axisIndex == 0 ? 1 : 0]);
                }
                
                _super.setDone(true);
            };	
        },
        "Circular":function(params) {
            var self = this;
            params = params || {};
            var _super = AbstractLayout.apply(this, arguments);

            self.defaultParameters = {
                padding:30
            };
                
            self.step = function(graph, toolkit, parameters) {
                var nodeCount = graph.getVertexCount(), 
                    x = 0, y = 0, 
                    maxWidth = 0, maxHeight = 0,
                    radius = 10,
                    degreesPerNode = 2 * Math.PI / nodeCount, 
                    curDegree = -Math.PI / 2;

                //console.log("there are ", nodeCount , "vertices", "degreesPerNode is ", degreesPerNode);
                // so the basic algorithm is to set a radius of 1, and assign centers to each of the elements, and as
                // we go along we keep track of the largest element. then, we re-calculate the radius of the circle
                // as if all the elements were as large as the largest one. we can do that by drawing a box whose
                // dimensions are as big as the largest node at loc 0,0.  then we draw the same box, rotated by
                // however many degrees separate each node from the next (360 / nodeCount)
                for (var i = 0; i < nodeCount; i++) {
                    var n = graph.getVertexAt(i);
                    _super.setPosition(n.id, x + (Math.sin(curDegree) * radius), y + (Math.cos(curDegree) * radius));                    
                    curDegree += degreesPerNode;									
                }
                    
                // take the first one, and the one next to it, and pad the second one.
                var n1 = graph.getVertexAt(0),
                    s1 = _super.getSize(n1.id),
                    p1 = _super.getPosition(n1.id),
                    r1 = {
                        x:p1[0] - parameters.padding,
                        y:p1[1] - parameters.padding,
                        w:s1[0] + (2 * parameters.padding),
                        h:s1[1] + (2 * parameters.padding)
                    },
                    n2 = graph.getVertexAt(1),
                    s2 = _super.getSize(n2.id),
                    p2 = _super.getPosition(n2.id),
                    r2 = {
                        x:p2[0] - parameters.padding,
                        y:p2[1] - parameters.padding,
                        w:s2[0] + (2 * parameters.padding),
                        h:s2[1] + (2 * parameters.padding)
                    },
                    adj = _super.calculateSpacingAdjustment(r1, r2);							

                            
                var c1 = [ p1[0] + (s1[0] / 2), p1[1] + (s1[1] / 2)],
                    c2 = [ p2[0] + adj.left + (s2[0] / 2), p2[1] + adj.top + + (s2[1] / 2)],
                    d = Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2));
                 
                 // sin theta/2 = (d/2) / radius
                 // radius = (d/2) / sin(theta/2)
                 radius = (d/2) / Math.sin(degreesPerNode / 2);                 
                 for (var i = 0; i < nodeCount; i++) {
                    var n = graph.getVertexAt(i);                            
                    _super.setPosition(n.id, x + (Math.sin(curDegree) * radius), y + (Math.cos(curDegree) * radius));                                        
                    curDegree += degreesPerNode;										
                }
                                                    
                _super.setDone(true);
            };				
        },
        /*
         * Function:AbsoluteLayout
         * This layout places elements with absolute positioning. The default is to look for a 'left' and 'top'
         * member in each node, but you can supply your own 'locationFunction' parameter to the constructor to
         * derive your own position from each node.
         */
        "Absolute":function(params) {
            AbsoluteBackedLayout.apply(this, arguments);                                                        
        },
			
        "Spring":function(params) {
            var self = this,			
                _super = AbsoluteBackedLayout.apply(this, arguments);
            
            self.requiresScaling = true;     

            self.defaultParameters = {
                stiffness:200.0,
                repulsion:200.0,
                limit:10000,
                damping:0.5
            };                    
            var currentParameters = self.defaultParameters;                                                        
            
            var    _nodes = {},
                _w = 100,
                _h = 100,
                _magnitude = function(v) { return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2)); },
                _divide = function(v, n) { return [ (v[0] / n) || 0, (v[1] / n) || 0 ]; },
                _multiply = function(v, n) { return [ v[0] * n, v[1] * n ]; },
                _add = function(v1, v2) { return [ v1[0] + v2[0], v1[1] + v2[1] ]; },
                _subtract = function(v1, v2) { return [ v1[0] - v2[0], v1[1] - v2[1] ]; },
                _getNodeMass = function(node) {
                    return node.s[0] * node.s[1];//node.m;
                },
                _get = function(node) {
                    if ("CENTER" == node) {
                        return {
                            v:[0,0],
                            //p:[_super.width / 2, _super.height / 2],
                            p:[ _w / 2, _h / 2],
                            a:[0,0], 
                            m:100.0
                        };
                    }
                    // get actual Node, if this was a Port.
                    if (node.getNode) node = node.getNode();
                    var n = _nodes[node.id];
                    if (!n) {                    
                        n = _nodes[node.id] = {
                            v:[0,0],
                            // randomize current point.
                            //p:_super.getRandomPosition(node.id, _super.width + 1, _super.height + 1),
                            p:_super.getRandomPosition(node.id, _w, _h),
                            a:[0,0],
                            m:1.0,
                            s:_super.getSize(node.id)
                        };                                                
                    }
                    return n;
                },
                _normalise = function(v) { return _divide(v, _magnitude(v)); },
                _applyForce = function(n, f) { n.a = _add(n.a, _divide(f, n.m)); },
                _coulomb = function(node, otherNode) {
                    var n1 = _get(node), n2 = _get(otherNode);
                        
                    if (n1.p != n2.p) {

//console.log("comparing nodes ", node.id, n1.p, n1.s, otherNode.id, n2.p, n2.s);

                        var _p = [ n1.p[0] - n2.p[0], n1.p[1] - n2.p[1] ],
                            dist = _magnitude(_p) + 0.1, 
                            dir = _normalise(_p),
                            dir_rep = _multiply(dir, currentParameters.repulsion),
                            n1f = _divide(dir_rep, dist * dist * 0.5),
                            n2f = _divide(dir_rep, dist * dist * -0.5);
            
//console.log("distance is ", dist);            

//console.log("applying forces ", n1f, n2f)


                        _applyForce(n1, n1f);
                        _applyForce(n2, n2f);                            
                    }								
                },
                _hooke = function(node, edge) {
                    var n1 = _get(node),
                        n2 = _get(edge.target),
                        d = _subtract(n2.p, n1.p),							
                        displacement = 1.0 - _magnitude(d), // TODO varying lengths?
                        dir =_normalise(d),
                        n1f = _multiply(dir, currentParameters.stiffness * displacement * -0.5),
                        n2f = _multiply(dir, currentParameters.stiffness * displacement * 0.5);
                        
                    _applyForce(n1, n1f);
                    _applyForce(n2, n2f);
                },
                _center = function(node) {
                    var n = _get(node), dir = _multiply(n.p, -1.0);
                    _applyForce(n, _multiply(dir, currentParameters.repulsion / 50.0));
                },
                _velocity = function(node, step) {
                    var n = _get(node), v2 = _multiply(_add(n.v, _multiply(n.a, step)), currentParameters.damping); 							
                    n.v = v2;
                    n.a = [0,0];
                },
                _position = function(node, step) {					
                    var n = _get(node), p2 = _add(n.p, _multiply(n.v, step));							
                    n.p[0] = p2[0]; 
                    n.p[1] = p2[1];
                },
                _recalcTotal = function(count) {
                    var tke = 0;
                    for (var i = 0; i < count; i++) {
                        var node = _super.graph.getVertexAt(i),
                            n = _get(node),
                            s = _magnitude(n.v),
                            m = _getNodeMass(n);
                            
                        tke += 0.5 * m * s * s;
                    }                   
                    return tke;
                };
            
            //console.log(limit, _super.width, _super.height);
            self.map = function(v, xMin, yMin, xMax, yMax) {
                
            };
            
            // provide this for the superclass to call.
            self.reset = function() {
                _nodes = {};
            };
            
            self._nodeRemoved = function(nodeId) {
                delete _nodes[nodeId];
            };
                            
            self.step = function(graph, toolkit, parameters) {
                var count = graph.getVertexCount();
                currentParameters = parameters;
                for (var i = 0; i < count; i++) {
                    var me = graph.getVertexAt(i), 
                        edges = me.getAllEdges();						

                    // coulomb
                    for (var j = 0; j < count; j++) {		
                        if (i != j) {
                            _coulomb(me, graph.getVertexAt(j));
                        }
                    }
                    
                    // hooke
                    for (var k = 0; k < edges.length; k++) {
                        _hooke(me, edges[k]);
                    }
                    // this is an edge to a fake element located in the center of the graph.
                    // it helps to keep disconnected nodes from being pushed too far away.
                    _hooke(me, { target:"CENTER" } );
                    
                    _center(me);						
                    _velocity(me, 0.03);
                    _position(me, 0.03);
                }					
                
                if (_recalcTotal(count) < currentParameters.limit)
                    _super.setDone(true);
            };				
        },

        "ForceDirected":function(params) {    
        //http://www.brad-smith.info/blog/archives/129        
            var self = this,            
                _super = AbsoluteBackedLayout.apply(this, arguments),
                totalDisplacement = 0,
                _nodes = {},
                repulsion = params.repulsion || 1000,
                attraction = params.attraction || 0.1,                
                limit = 5,
                damping = params.damping || 0.5,
                springLength = params.springLength || 100,
                iteration = 0,
                maxIterations = 150,
                _w = 100, _h = 100,
                _add = function(a, b) {
                    var aX = a.m * Math.cos((Math.PI / 180.0) * a.b);
                    var aY = a.m * Math.sin((Math.PI / 180.0) * a.b);

                    var bX = b.m * Math.cos((Math.PI / 180.0) * b.b);
                    var bY = b.m * Math.sin((Math.PI / 180.0) * b.b);

                    // add x-y components
                    aX += bX;
                    aY += bY;
                    
                    var magnitude = Math.sqrt(Math.pow(aX, 2) + Math.pow(aY, 2));

                    // calculate direction using inverse tangent
                    var direction = (magnitude == 0) ? 0 : (180.0 / Math.PI) * Math.atan2(aY, aX);

                    return new Vector(magnitude, direction);
                },
                Vector = function(m, b) {
                    this.m = m;
                    this.b = b;
                    this.multiply = function(n) {
                        this.m *= n;
                        return this;
                    };
                    this.toPoint = function() {
                        // break into x-y components
                        var aX = this.m * Math.cos((Math.PI / 180.0) * this.b),
                            aY = this.m * Math.sin((Math.PI / 180.0) * this.b);

                        return [aX, aY];
                    };
                },
                _get = function(node) {                   
                    // get actual Node, if this was a Port.
                    if (node.getNode) node = node.getNode();
                    var n = _nodes[node.id];
                    if (!n) {                    
                        n = _nodes[node.id] = {
                            v:new Vector(0,0),
                            // randomize current point.
                            //p:_super.getRandomPosition(node.id, _super.width + 1, _super.height + 1),
                            p:_super.getRandomPosition(node.id, _w, _h),                                                     
                            s:_super.getSize(node.id)
                        };                                                
                    }
                    return n;
                },
                _dist = function(p1, p2) {
                    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
                },
                calcRepulsion = function(node, otherNode) {
                    var n1 = _get(node), n2 = _get(otherNode),
                        dist = _dist(n1.p, n2.p),
                        force = repulsion * Math.pow(dist, 2),
                        theta = jsPlumbUtil.theta(n1.p, n2.p);

                    return new Vector(force, theta);
                },
                calcAttraction = function(node, otherNode) {                    
                    var n1 = _get(node), n2 = _get(otherNode),
                        dist = _dist(n1.p,n2.p),
                        force = attraction * Math.max(dist - springLength, 0),
                        theta = jsPlumbUtil.theta(n1.p, n2.p);

                    return new Vector(force, theta);
                };

            self.requiresScaling = true;

            this.step = function() {    
                totalDisplacement = 0;                           
                var count = _super.graph.getVertexCount();
                for (var i = 0; i < count; i++) {
                    var me = _super.graph.getVertexAt(i), 
                        nodeInfo = _get(me),
                        edges = me.getAllEdges(),
                        netForce = new Vector(0,0),
                        currentPosition = new Vector(_dist([0,0], nodeInfo.p), jsPlumbUtil.theta([0,0], nodeInfo.p));

                    // coulomb
                    for (var j = 0; j < count; j++) {       
                        if (i != j) {
                            netForce = _add(netForce, calcRepulsion(me, _super.graph.getVertexAt(j)));
                        }
                    }
                    
                    // hooke
                    for (var k = 0; k < edges.length; k++) {
                        netForce = _add(netForce, calcAttraction(me, edges[k].target));
                    }

                    nodeInfo.v = _add(nodeInfo.v, netForce);
                    nodeInfo.v.multiply(damping);
                    nodeInfo.next = _add(currentPosition, nodeInfo.v).toPoint();
                }       

                for (var i = 0; i < count; i++) {
                    var nodeInfo = _get(_super.graph.getVertexAt(i));

                    totalDisplacement += _dist(nodeInfo.p, nodeInfo.next);
                    nodeInfo.p = nodeInfo.next;
                }            
                
                if (totalDisplacement > limit)
                    _super.setDone(true);   

                iteration++;
                if (iteration >= maxIterations)
                    _super.setDone(true);         
            };

            // provide this for the superclass to call.
            self.reset = function() {
                _nodes = {};
                iteration = 0;
            };
            
            self._nodeRemoved = function(nodeId) {
                delete _nodes[nodeId];
            };
        }
    };

})(jsPlumbLayout);
/*
 * jsPlumbToolkit
 *
 * copyright 2012 morrisonpitt.com
 * http://morrisonpitt.com
 *
 * Licensed under the GPL2 license.  This software is not free.
 *
 * Higher level functionality built on top of jsPlumb.  This script provides various layout/ui generation
 * algorithms such as tree generation, force directed graph layout, shortest path calculations, animations etc.
 *
 */
//var jsPlumbToolkit = (typeof module !== "undefined" && module.exports) || {};   

// TODO 'clone' function: create a new instance of the toolkit from the current one, with all the data, and event listeners.

;(function(exports) {

    exports.version = "0.1";
    exports.name = "jsPlumbToolkit";

    var jpcl = jsPlumb.CurrentLibrary,        
        
        /*
            Function: _defaultGetId
            This is the default function the jsPlumb Toolkit will use to derive an ID for some piece of JSON representing a node.  It looks
            for an 'id' member in the JSON.
         */
        _defaultGetId = function(data) {
            return data.id;
        },
		/*
            Function: _defaultGetType
            This is the default function the jsPlumb Toolkit will use to derive a type for some piece of JSON representing a node.  It looks
            for a 'type' member in the JSON.
         */
        _defaultGetType = function(data) {
            return data.type || "default";
        };    

    // DataSources.  
    var AbstractDataSource = function(params, toolkit) {
        var self = this;
        this.fetch = function() {                        
            if (params.url) {
                jpcl.ajax({
                    url:params.url, 
                    success:function(data) { 
                        toolkit.setGraph(self.process(data));
                        if (params.success) params.success();
                    }, 
                    error:function(err) {
                        if (params.error) params.error(err);
                    }
                });            
            }
            else {
                if (params.data) {
                    try {
                        toolkit.setGraph(self.process(params.data));
                        if (params.success) params.success(params.data);
                    }
                    catch (e) {
                        if (params.error) params.error("cannot import: " + e);                       
                    }
                }
                else if (params.error) 
                    params.error("no data specified");                
            }
        };
    };

    /*
    * Function: jsPlumbToolkitInstance
    * An instance of the jsPlumbToolkit.  This is backed by a Graph, and has zero or more renderers. 
    */
    var jsPlumbToolkitInstance = function(params) {
				
		params = params || {};
		
		var _idFunction = params.idFunction || _defaultGetId,
            _typeFunction = params.typeFunction || _defaultGetType,
            _edgeIdFunction = params.edgeIdFunction || _idFunction,
            _edgeTypeFunction = params.edgeTypeFunction || _typeFunction,            
            _portIdFunction = params.portIdFunction || _idFunction,
            _portTypeFunction = params.portTypeFunction || _typeFunction,            
            _currentInstance = this,
            _suspendGraph = false,
            debugEnabled = false,
            _palette = params.palette,
            _defaultObjectFactory = function(type, data, callback) {
				data = jsPlumb.clone(data || {});
				data.id = data.id || jsPlumbToolkitUtil.uuid();
				data.type = type;
				callback(data);
            },
            _nodeFactory = params.nodeFactory || _defaultObjectFactory,
            _edgeFactory = params.edgeFactory || _defaultObjectFactory,
            _portFactory = params.portFactory || _defaultObjectFactory;
            
		this.getNodeFactory = function() { return _nodeFactory; };            
		this.getEdgeFactory = function() { return _edgeFactory; };
		this.getPortFactory = function() { return _portFactory; };		
		this.setNodeFactory = function(f) { _nodeFactory = f; };            
		this.setEdgeFactory = function(f) { _edgeFactory = f; };
		this.setPortFactory = function(f) { _portFactory = f; };		
            
		this.setDebugEnabled = function(d) { debugEnabled = d; };
		this.isDebugEnabled = function() { return debugEnabled; };
		
		this.getPalette = function(p) {
			return _palette || {};
		};

        this.setSuspendGraph = function(v) {
            _suspendGraph = v;
        };

        jsPlumbUtil.EventGenerator.apply(this, arguments);
				
		this.getTypeFunction = function() { return _typeFunction; };
		    
        /*
        * Function: connect
        * Connect two nodes, by ID. This function does not know about the DOM. You cannot pass it DOM elements
        * or selectors. It will create nodes that are missing.
        *
        * Parameters:
        *	source	-	 either a node, or a node id, representing the source node in the connection
        *	target  -	 either a node, or a node id, representing the target node in the connection        
        *	cost	-	optional; the cost of the connection.
        *	directed	-	optional, defaults to false. whether the connection is directed.
        *	doNotCreateMissingNodes - optional, defaults to false. Whether to create nodes that do not exist yet.
        */
        this.connect = function(params) {
			params = params || {};
			if (!_suspendGraph) {
               var sv = _graph.getVertex(params.source),
                   tv = _graph.getVertex(params.target),
                   cost = params.cost,
                   directed = params.directed;
               
                if(!sv) {
					if (!params.doNotCreateMissingNodes) {
                    	sv = _graph.addVertex(params.source);                    	
                        _currentInstance.fire("nodeAdded", { data:{}, node:sv });
                    }
                	else
                		return;  // probaby better to throw here? but maybe not.
                }
                	
                if(!tv) {
                    if(!params.doNotCreateMissingNodes) {
                    	tv = _graph.addVertex(params.target);
                        _currentInstance.fire("nodeAdded", { data:{}, node:tv });
                    }
                    else
                    	return;
                }

                var edge = _graph.addEdge({source:sv, target:tv, cost:cost, directed:directed});				
				
				_currentInstance.fire("edgeAdded", edge);                
            }
		};
        /*
        * Function:clear
        * Clears the graph. This function returns the current jsPlumbToolkit
        * instance, so it can be chained.        
        */
        this.clear = function() {
            _graph.clear();
            _currentInstance.fire("graphCleared");  
            return _currentInstance;
        };

       /* this.Defaults = {
            nodeClass:"jtk-node"
        };*/				

        var _graph = new jsPlumbGraph.Graph();

        /*
        *   Function: getGraph
        *   Returns the current Graph.
        */
        this.getGraph = function() { return _graph; };
        /*
        *   Function: setGraph
        *   Sets the current Graph, and fires an event to publish the fact.
        */
        this.setGraph = function(g) {
            _graph = g;
            _currentInstance.fire("graphChanged", _graph);    
        };
        
        /*
        *   Function: getNodeCount
        *   Returns the count of nodes
        */
        this.getNodeCount = function() {
            return _graph.getVertexCount();
        };
        
        /*
        *   Function: getNodeAt
        *   Returns the node at the given index.
        */
        this.getNodeAt = function(idx) {
            return _graph.getVertexAt(idx);
        };
		
		/*
		 * Function: getEdgeCount
		 * Returns the total number of Eges.
		 */ 
		this.getEdgeCount = function() {
			return _graph.getEdgeCount();
		};					

        /*
            Function: layout
            Runs a layout with the given params, the contents of which will vary depending on
            the layout you are requesting.  At the very least the params object should contain
            a *type* member, which is a string that gives the name of the layout you are
            requesting.

            if you supply a 'container' parameter then everything will be laid out inside the container, wherever
            possible.

            if you supply a Surface, the Surface will take care of positioning.

            if you provide neither of these, the DOM window will be used as the container.
         */
        this.layout = function(params, adapter) {
            if (!jsPlumbLayout.Layouts[params.type]) throw "no such layout [" + params.type + "]";
            var p = jsPlumb.extend({ }, params);
            p.graph = _graph;
            p.jsPlumbToolkit = _currentInstance;            
            p.adapter = adapter;
            return new jsPlumbLayout.Layouts[params.type](p);
        };
		
        /*
		 * Function: getNodeId
		 * Gets the id of the node represented by the given arguments. If this is a JS object, we extract the id using the 
		 * current idFunction. Otherwise we just pass it back as-is.
         */
        this.getNodeId = function(node) {
            return jsPlumbUtil.isObject(node) ? _idFunction(node) : node;
        };
		
		/*
        * Function: getNodeType
        * Gets the type of the node represented by the given JS object. We first try for a return value from the current typeFunction,
		* but if that returns nothing we just return 'default'.
        */
        this.getNodeType = function(node) {
            return _typeFunction(node) || "default";
        };
        
        /*
		* Function: getEdgeId
		* Gets the id of the edge represented by the given arguments. If this is a JS object, we extract the id using the 
		* current edgeIdFunction. Otherwise we just pass it back as-is.
        */
        this.getEdgeId = function(edge) {
            return jsPlumbUtil.isObject(edge) ? _edgeIdFunction(edge) : edge;
        };
		
		/*
         * Function: getEdgeType
         * Gets the type of the edge represented by the given JS object.
         */
        this.getEdgeType = function(edge) {
            return _edgeTypeFunction(edge) || "default";
        };
        
        /*
		* Function: getPortId
		* Gets the id of the port  represented by the given arguments. If this is a JS object, we extract the id using the 
		* current portIdFunction. Otherwise we just pass it back as-is.
        */
        this.getPortId = function(port) {
            return jsPlumbUtil.isObject(port) ? _portIdFunction(port) : port;
        };
		
		/*
         * Function: getPortType
         * Gets the type of the port represented by the given JS object.
         */
        this.getPortType = function(port) {
            return _portTypeFunction(port) || "default";
        };

       /*
        * Function: addNode
        *
        * 
        * Adds a node of the given type.  The nodeType must be for a node that has previously been registered with 
        * the toolkit, using either registerNodeType or registerNodeTypes, or via a Palette.  If no id can be derived for
        * the given data, or if the data is null, the Toolkit creates a uuid and sets it as the data object's 'id' member.
        *
        * Parameters:
        *   data            -   the node's backing data - from your data model.  
        */
        this.addNode = function(data) {                        
            // assign an id if one was not supplied.
            if (_idFunction(data) == null) {
				data.id = jsPlumbToolkitUtil.uuid();            
            }
                                    
            // tell the Graph about the node.		
            var v = _graph.addNode(data, _idFunction);
            
            // fire an event.
			_currentInstance.fire("nodeAdded", {data:data, node:v});
			
            return v;
        };
		
		/*
		 * Function: addNodes
		 * Adds a list of nodes.  nodeList is expected to be an array of arrays.
		 */ 
		this.addNodes = function(nodeList) {
			for (var i = 0; i < nodeList.length; i++) {
				_currentInstance.addNode.apply(_currentInstance, [ nodeList[i] ]);
			}
		};
		
		/*
		 * Function: getNode
		 * Gets a node by id, or if the given object is already a node, hands that back.
		 */
		this.getNode = function(nodeId) {
			return _graph.getVertex(nodeId);
		};
		
		/*
         * Function:removeNode
         * Removes the given node, which may be passed in as the actual node object, or its id.
         */
        this.removeNode = function(node, doNotFireEvent) {
            node = (node.constructor == jsPlumbGraph.Vertex || node.constructor == jsPlumbGraph.Port) ? node : _graph.getVertex(node);
//            var id = (node.constructor == jsPlumbGraph.Vertex || node.constructor == jsPlumbGraph.Port) ? node.id : _currentInstance.getNodeId(node);
            var edges = node.getAllEdges() || [];
            for (var i = 0; i < edges.length; i++)
                _currentInstance.removeEdge(edges[i]);
            // delete the vertex from the graph.
            _graph.deleteVertex(node.id);
            if (!doNotFireEvent) {
                _currentInstance.fire("nodeRemoved", { node:node, nodeId:node.id, edges:edges });                
            }
        };
		
		/*
			Function: addEdge
			Adds an Edge to the Graph.  
			
			Parameters:
			
			params - JS object containing:
			
				source - source node, or id of the source node. If given as a string, this may be in "dotted" format, eg. nodeId.portId, to identify a particular port on the source node.
				target - target node, or id of the target node. If given as a string, this may be in "dotted" format, eg. nodeId.portId, to identify a particular port on the target node.
				data - optional JS backing data for the edge. 
				
			doNotFireEvent - optional flag to tell the Toolkit not to fire an event. Defaults to false.
		*/				
		this.addEdge = function(params, doNotFireEvent) {
			var sourceId = jsPlumbUtil.isObject(params.source) ? _currentInstance.getNodeId(params.source) : params.source,
				targetId = jsPlumbUtil.isObject(params.target) ? _currentInstance.getNodeId(params.target) : params.target,
				edge = _graph.addEdge({
					source:sourceId, 
					target:targetId, 
					data:params.data,
					cost:params.cost,
					directed:params.directed
				});
				
			if (!doNotFireEvent) {
				_currentInstance.fire("edgeAdded", edge, null);
			}
				
			return edge;
		};
		
		/*
			Function: removeEdge
			Removes an Edge from the Graph.  
			
			Parameters:
			
			edge - the Edge to remove.				
			doNotFireEvent - optional flag to tell the Toolkit not to fire an event. Defaults to false.
		*/				
		this.removeEdge = function(edge, doNotFireEvent) {
            if (edge != null) {
                // delete the vertex from the graph.
                _graph.deleteEdge(edge);   // ?
                if (!doNotFireEvent) {
                    _currentInstance.fire("edgeRemoved", edge, null);
                }
            }
        };


        /*
            Function: addNewPort
            Adds a new port to some node. This will call the current portFactory for a new port.
        */
        this.addNewPort = function(node, type, portData, doNotFireEvent) {
            var node = _graph.getVertex(node);            
            _portFactory({node:node, type:type}, portData, function(p) {
                var portId = _portIdFunction(p),
                    port = node.addPort(portId);        
                
                port.data = p;
                if (!doNotFireEvent) {
				    _currentInstance.fire("portAdded", { node:node, data:p, port:port }, null);
			     }		                                
            });
        };
        
        /*
            Function: addPort
            Adds a port from existing data to some node.
        */
        this.addPort = function(node, data, fireEvent) {        
            var p = node.addPort(data, _portIdFunction);    
            if (fireEvent) {
                _currentInstance.fire("portAdded", { node:node, data:data, port:p }, null);
            }		                                            
            return p;
        };    
        
        /*
            Function: removePort
            Removes the port with the given id from the given node.

            Parameters:

                node            -   either a node id, or a Node
                portId          -   id of the port to remove from the given node.
                doNotFireEvent  -   whether or not to fire an event. defaults to false (meaning an event is fired).

            Returns:
                True if port existed and was removed, false otherwise.
        */
        this.removePort = function(node, portId, doNotFireEvent) {
            var removed = false;
            node = (node.constructor == jsPlumbGraph.Vertex || node.constructor == jsPlumbGraph.Port) ? node : _graph.getVertex(node);
            var port = node.getPort(portId);
            if (port) {
                var edges = port.getAllEdges();
                removed = node.removePort(port);
                if (removed && !doNotFireEvent) {
                    _currentInstance.fire("portRemoved", { node:node, port:port, edges:edges }, null);
                    for(var i = 0; i < edges.length; i++)
                        //_currentInstance.fire("edgeRemoved", { edge:edges[i] });
                        // TODO has the graph already removed these?
                        _currentInstance.removeEdge(edges[i]);
                }
            }
            return removed;
        };

// ----------------- end nodes

// -------------------------- miscellaneous -------------------------------------

        

// -------------------------- end miscellaneous -------------------------------------

// ---------------------------- paths ------------------------------------------------

		// Gets the shortest path from source to target.         
		var _getPath = function(params) {							
			return _graph.findPath(params.source, params.target);
		};

		/*
         * Function: getPath
		 * Gets the shortest path from source to target, and wraps the result in an object with a few convenience
		 * methods.
		 */
		this.getPath = function(params) {			
				
			var p = _getPath(params),
                api = {},		
                deleteEdges = function() {
					//detach all edges in the path
					for (var i = 0; i < p.path.length; i++) {
						if (p.path[i].edge) {
							_currentInstance.removeEdge(p.path[i].edge);
						}
					}
                    return api;
				},
                deleteNodes = function() {
                    for (var i = 0; i < p.path.length; i++) {
                        _currentInstance.removeNode(p.path[i].vertex);
                    }
                    return api;
                },
                contains = function(obj) {
                    var gObj = _findGraphObject(obj), c = false;
                    if (gObj) {
                        for (var i = 0; i < p.path.length; i++) {
                            if (p.path[i].vertex == gObj || p.path[i].edge == gObj) {
                                c = true; break;
                            }
                        }
                    }
                    return c;
                }
			
			api.getNodeCount = function() { return p.path.length; };
			api.getEdgeCount = function() { return p.path.length == 0 ? 0 : p.path.length - 1; };
			api.path = p;
            api.deleteEdges = deleteEdges;
            api.deleteNodes = deleteNodes;
            api.deleteAll = deleteNodes;
            api.isEmpty = function() { return p.path.length == 0; };
            api.getCost = function() { return p.pathDistance; };
            api.contains = contains;

			return api;
		};
        
        // select helper methods
        var _findGraphObject = function(spec) {
            if (spec == null) return null;
            else if (jsPlumbUtil.isString(spec)) 
                return _graph.getVertex(spec);
            else if (spec.constructor == jsPlumbGraph.Vertex || spec.constructor == jsPlumbGraph.Port)
                return spec;
            
            return null;
        };
        
        var _selectEdges = function(params, edgeSelector, checkForPorts) {
            var edges = [], _edgeMap = {}, 
                _add = function(edge) {
                    if (!_edgeMap[edge.getId()]) {
                        edges.push(edge);
                        _edgeMap[edge.getId()] = true;
                    }
                };
                _addEdges = function(obj, matchSource, matchTarget, matchElement) {
                    if (obj != null) {
                        var e = obj[edgeSelector]();
                        for (var i = 0; i < e.length; i++) {                            
                            var isSource = (e[i].source == obj || (checkForPorts && e[i].source.constructor == jsPlumbGraph.Port && e[i].source.getNode() == obj)),
                                isTarget = (e[i].target == obj || (checkForPorts && e[i].target.constructor == jsPlumbGraph.Port && e[i].target.getNode() == obj));
                                            
                            if ((matchSource && isSource) || (matchTarget && isTarget) || (matchElement && (isSource || isTarget)))
                                _add(e[i]);
                        }
                    }
                };
        
            _addEdges(_findGraphObject(params.source), true, false, false);
            _addEdges(_findGraphObject(params.target), true, false, false);
            _addEdges(_findGraphObject(params.element), false, false, true);
            return edges;
        }
        
        /*
            Function: selectEdges
        */
        this.selectEdges = function(params) {
            return _selectEdges(params, "getEdges", false);
        };
        
        /*
            Function: selectAllEdges
        */
        this.selectAllEdges = function(params) {
            return _selectEdges(params, "getAllEdges", true);
        };        

// ---------------------------- end paths ------------------------------------------------

// ---------------------- import /export -------------------------------

        /*
        * Function: load
        * Loads the given data.
        * 
        * Parameters:
        *   type - required.  specifies the data type of the data to load.
        *   data - optional. JSON data to load directly.
        *   url - optional, but you need to supply either this or 'data'. URL to retrieve data from.
        *   jsonp - optional, defaults to false. Tells the Toolkit that the data is coming via JSON-P.
        *   onload - optional callback to execute once the data has loaded. Most often used when you are retrieving remote data (using url and possibly jsonp)
        *
        * Returns:
        * The current instance of the Toolkit. If you provide data directly to this method you can then chain a load call with a subsequent 'render'.
        */
        this.load = function(params) {
            var type = params.type || "json",
                data = params.data,						
                url = params.url,
                jsonp = params.jsonp,
                onload = params.onload,
                parameters = params.parameters || {};			

            var parse = function(d) {
                _currentInstance.fire("dataLoadStart");
                jsPlumbToolkitIO.parse(type, d, _currentInstance, parameters);
                _notifyDataLoaded();
                if (onload) onload(_currentInstance, d);
                _currentInstance.fire("graphChanged");
            };

            // then, import the data.
            if (data) {
                parse(data);
            }
            else if (url) {
                if (jsonp) {
                    var sep = url.indexOf("?") === -1 ? "?" : "&";
                    url = url + sep + "callback=?";  
                }
    
                if (type === "json") {
                    // TODO: abstract out AJAX. probably into jsPlumb.
                    $.getJSON(url, function(d) {
                        parse(d);
                    });
                }
                else {
                    $.get(url, function(d) {
                        parse(d);
                    });
                }
            }

            return _currentInstance;
        };                

// --------------------- rendering -------------------------------------

		var _renderParams = {}, // keyed by container id
			_renderersByContainer = {};
            
        // notification that some data was loaded. initializes all current renderers.
        var _notifyDataLoaded = function() {			
            _currentInstance.setSuspendGraph(true);
			_currentInstance.fire("dataLoadEnd");                     		
			_currentInstance.setSuspendGraph(false);            
        };
        
        /*
        * Function: render
        * Renders the current contents to the given element, registering it so that it reflects any changes to the
        * underlying data. This method turns the given element into a Surface if it is not already one.  You can supply
        * layout arguments to this method (layout type + layout specific parameters), as well as jsplumb rules for
        * endpoints, paint styles etc.  

                container:"demo",
                layout:"Hierarchy",
                draggable:true,
                orientation:"horizontal",
                horizontalSpacing:60,
                verticalSpacing:110,                            
                template:"tmplNode"

        */
        this.render = function(params) {            
            var renderer = _initialiseRenderer(params);
			// TODO we should not call initialize here.  Renderers should initialise themselves; and this is being
			// used as an overloaded way to get the renderer to do an initial draw. that should be handled with
			// appropriate events.
            renderer.initialize();		
            return renderer;
        };
				
        /**
            Turns the given element (either an id, a DOM element or a selector) into a Renderer of the given type.
        */     
		var _initialiseRenderer = function(params) {
			params = params || {};
            var p = jsPlumb.extend({
                    toolkit:_currentInstance
                }, params),
                type = p.type || jsPlumbToolkit.DefaultRendererType,
                r = new jsPlumbToolkit.Renderers[type](p);
            
            return r;
        };
		
		// if data supplied to constructor, load it.
		// KEEP. toolkit specific.
        if (params.data) {
            var t = params.dataType || "json";
            _currentInstance.load({
                data:params.data,
                type:t
            });
        }
    };

// ---------------------- static jsPlumbToolkit members ----------------------------------------
	window.jsPlumbToolkit = new jsPlumbToolkitInstance({});
	jsPlumbToolkit.DefaultRendererType = null;
	jsPlumbToolkit.ready = jsPlumb.ready; // TODO will this suffice? what about loading palettes?

    //exports.newInstance = function(params, jsPlumbDefaults) {
	jsPlumbToolkit.newInstance = function(params) {
        return new jsPlumbToolkitInstance(params);
    };
	
    /*exports.load = function(params, jsPlumbDefaults) {
        var jti = exports.newInstance(params, jsPlumbDefaults);
        jti.load(params);
    };*/
		
	/*exports*/jsPlumbToolkit.Renderers = {};

    /*exports*/jsPlumbToolkit.util = {
        Cookies:{
            get : function(key) {                
                var value =  document.cookie.match((new RegExp(key + "=[a-zA-Z0-9.()=|%/_]+($|;)" , "g")));                
                if(!val || val.length == 0) 
                    return null;
                else 
                    return unescape(val[0].substring(key.length + 1, val[0].length).replace(";" , "")) || null;                
            },
            set : function(key, value, path, ttl) {
                var c = [ key + "=" + escape(value),
                    "path=" +    (!path)  ? "/" : path,
                    "domain=" +  (!domain) ? window.location.host : domain ],
                    _ttl = function() {
                        if (parseInt(ttl) == 'NaN' ) return "";
                        else {
                            var now = new Date();
                            now.setTime(now.getTime() + (parseInt(ttl) * 60 * 60 * 1000));
                            return now.toGMTString();                       
                        }
                    };                    
                
                if (ttl)         
                    c.push(_ttl(ttl));

                return document.cookie = c.join('; ');
            },
            unset : function(key, path, domain) {
                path   = (!path   || typeof path != "string") ? '' : path;
                domain = (!domain || typeof domain != "string") ? '' : domain;
                if (jsPlumbToolkit.util.Cookies.get(key)) 
                    jsPlumbToolkit.util.Cookies.set(key, '', 'Thu, 01-Jan-70 00:00:01 GMT', path, domain);
            }
        },
        Storage : {
            set : function(key, value) {
                if (typeof localStorage == "undefined")
                    jsPlumbToolkit.util.Cookies.set(key, value);
                else {
                   localStorage.setItem(key, value);
                }
            },
            get : function(key) {
                return (typeof localStorage == "undefined") ? 
                    jsPlumbToolkit.util.Cookies.read(key) : 
                    localStorage.getItem(key);            
            },
            clear : function(key) {
                if (typeof localStorage == "undefined")
                    jsPlumbToolkit.util.Cookies.unset(key);
                else {
                   localStorage.removeItem(key);
                }
            },
            clearAll : function() {
                if (typeof localStorage == "undefined")
                    alert("HOW DO I UNSET ALL COOKIES?");
                else {
                   while (localStorage.length > 0) {
                    var k = localStorage.key(0);
                    localStorage.removeItem(k);
                   }
                }
            }
        }
    };

})({}/*jsPlumbToolkit*/);/*
 * jsPlumbToolkit
 *
 * copyright 2012 morrisonpitt.com
 * http://morrisonpitt.com
 *
 * Licensed under the GPL2 license.  This software is not free.
 *
 * This file contains the various UI components offered by the jsPlumb Toolkit.
 */
 
 /*
	DOM

	This script knows about the DOM.  It is designed to run in browsers.

	DEPENDENCIES

	- jsPlumb.CurrentLibrary	-	to get DOM nodes, element positions, element sizes etc
	- jsPlumb					-	to render things!
*/
;(function() {

	jsPlumbToolkit.Palette = function(params, _jsPlumb) {
	
		params = params || { };
		params.nodes = params.nodes || {};
		params.edges = params.edges || {};
		params.ports = params.ports || {};		
		
		var _getNodeDefinition = function(typeId) {		
				var def = jsPlumbToolkitUtil.mergeWithParents(typeId, params.nodes);			
				delete def.parent;
				return def;
			},		
			_getEdgeDefinition = function(typeId) {
				var def = jsPlumbToolkitUtil.mergeWithParents(typeId, params.edges);			
				delete def.parent;
				return def;
			},		
			_getPortDefinition = function(portId, nodeDefinition) {
				var def = nodeDefinition && nodeDefinition.ports ? jsPlumbToolkitUtil.mergeWithParents(portId, nodeDefinition.ports) : jsPlumbToolkitUtil.mergeWithParents(portId, params.ports);			
				delete def.parent;
				return def;
			};
	
// populate the connection and endpoint types in the supplied jsPlumb instance.
			
		// edges (connections)		
		for (var i in params.edges) {
			var def = _getEdgeDefinition(i);
			_jsPlumb.registerConnectionType(i, def);
		}		
		// ports (endpoints)
		for (var i in params.ports) {
			var def = _getPortDefinition(i);
			_jsPlumb.registerEndpointType(i, def);		
		}
	
		return {
			getNodeDefinition:_getNodeDefinition,
			getEdgeDefinition:_getEdgeDefinition,
			getPortDefinition:_getPortDefinition
		};
	
	};
	
	var jpcl = jsPlumb.CurrentLibrary;


/*

IE zoom


SETUP:

var fE = $("<div class='tb-task' style='display:none;'></div>");
        canvas.append(fE);
        taskFontSize = fE.css("font-size") || $("body").css("font-size");
        taskFontSize = taskFontSize.substring(0, taskFontSize.length - 2);
        fE.remove();
        canvasFontSize = canvas.css("font-size") || $("body").css("font-size");
        canvasFontSize = canvasFontSize.substring(0, canvasFontSize.length - 2);
        fontZoomRatio =  canvasFontSize /  taskFontSize;

HELPER METHOD:

         //* returns the given pixel value in em units, scaled to the canvas's current zoom and
         //* taking into account its font size.  this is used when adding tasks to the UI and after
         //* dragging: providing em units as the left/top position allows us to do a zoom simply by
         //* changing the canvas's font size.  so the two cases we have are when a tree is loaded
         //* we convert the pixel values into em, and then after dragging - jQuery UI, sets the
         //* position in pixels, so we have a drag stop callback that converts the position back.
        // *
        //toEmCanvas : function(px) {
         //   return ((px / _currentZoom) * fontZoomRatio / canvasFontSize).toFixed(8) + "em";
        //},

ON DRAG STOP:


                    // this resets the location of the element to use 'em' for the style's
                    // left and top values: jquery uses absolute positioning, which then means
                    // if we change the font-size of the canvas element it does not get applied
                    // to the positions of the task elements. changing left and top back to em
                    // here means we can apply zoom with one css call.
                    var _e = $(e.target).parents(sel.task),
                    sl = _e[0].style.left,
                    st = _e[0].style.top,
                    ssl = sl.substring(0, sl.length - 2),
                    sst = st.substring(0, st.length - 2),
                    eml = TaskBuilder.toEmCanvas(ssl),
                    emt = TaskBuilder.toEmCanvas(sst);

                    updateTaskLocation(_e.attr("id"), ssl, sst);// update the XML

                    _e[0].style.left = eml;
                    _e[0].style.top = emt;       


HOW JQUERY DOES IT:

getStyles = function( elem ) {
		return elem.currentStyle;
	};

	curCSS = function( elem, name, _computed ) {
		var left, rs, rsLeft,
			computed = _computed || getStyles( elem ),
			ret = computed ? computed[ name ] : undefined,
			style = elem.style;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are proportional to the parent element instead
		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rs = elem.runtimeStyle;
			rsLeft = rs && rs.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				rs.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				rs.left = rsLeft;
			}
		}

		return ret === "" ? "auto" : ret;
	};                     


*/        
	
	var ZoomHelper = function(_el) {
		var self = this,
			transforms = [ "-moz-transform", "-webkit-transform", "-o-transform", "transform", "-ms-transform" ],
			ieVersion = jsPlumbToolkitUtil.getInternetExplorerVersion(),
			useZoom = ieVersion > 0 && ieVersion < 9,			
			core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
			rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
			rposition = /^(top|right|bottom|left)$/,
			getFontSize = function(el) {
				var name = "fontSize",
					left, rs, rsLeft,
					computed = el.currentStyle,
					ret = computed ? computed[ name ] : undefined,
					style = el.style;

				if ( ret == null && style && style[ name ] ) {
					ret = style[ name ];
				}
				if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

					// Remember the original values
					left = style.left;
					rs = el.runtimeStyle;
					rsLeft = rs && rs.left;

					// Put in the new values to get a computed value out
					if ( rsLeft ) {
						rs.left = el.currentStyle.left;
					}
					style.left = name === "fontSize" ? "1em" : ret;
					ret = style.pixelLeft + "px";

					// Revert the changed values
					style.left = left;
					if ( rsLeft ) {
						rs.left = rsLeft;
					}
				}

				return ret === "" ? "auto" : ret;
			}, originalFontSizeStr, originalFontSize,
			toEmCanvas = function(px) {
				//return (px / 16) + "em";
				return ((px * self.curZoom) / originalFontSize).toFixed(8) + "em";
         		//return ((px / curZoom) * fontZoomRatio / canvasFontSize).toFixed(8) + "em";
        	};

			if (useZoom) {
				originalFontSizeStr = getFontSize(_el);
				originalFontSize = originalFontSizeStr.substring(0, originalFontSizeStr.length - 2);
			}

			

        self.curZoom = 1;

		this.zoom = function(value) {						
			// useful zoom links
			
			// http://jsfiddle.net/mjaric/9Nqrh/
			// http://bugs.jqueryui.com/ticket/6844				
			if (!useZoom) {
				var s = "scale(" + value + ")";						
					
				for (var i = 0; i < transforms.length; i++) {
					_el.style[transforms[i]] =  s;
				}										
			}
			else {											
				//_el.style["fontSize"] = (value * originalFontSize) + "px";
				_el.style["fontSize"] = (value  * 100) + "%";
			}		

			self.curZoom = value;																					
		};

		//
		// called when drag ends for some item. if we are using the fontSize method of
		// zooming, we have to convert the element's absolute position into em units instead
		// of pixels. we do this by knowing the ...actually how do we do this?
		this.dragStop = function(_e) {
			if (useZoom) {
				var sl = _e.style.left,
	                st = _e.style.top,
	                ssl = sl.substring(0, sl.length - 2),
	                sst = st.substring(0, st.length - 2),
	                eml = toEmCanvas(ssl),
	                emt = toEmCanvas(sst);

                _e.style.left = eml;
                _e.style.top = emt;
			}
		};
	};
	
	var atts = {
        NODE:"data-jtk-node-id",        
        PORT:"data-jtk-port-id"        
    },
    classes = {
		MINIVIEW_CANVAS:"jtk-miniview-canvas",
		MINIVIEW_PAN:"jtk-miniview-pan",
		MINIVIEW_ELEMENT:"jtk-miniview-element",
		NODE:"jtk-node",
		NODE_PALETTE:"jtk-node-palette",
		NODE_PALETTE_ENTRY:"jtk-node-palette-entry",
        PORT:"jtk-port",
		SURFACE:"jtk-surface",
		SURFACE_CANVAS:"jtk-surface-canvas",
		SURFACE_LASSO:"jtk-surface-lasso",
		SURFACE_PAN:"jtk-surface-pan",
		SURFACE_PAN_LEFT:"jtk-surface-pan-left",
		SURFACE_PAN_TOP:"jtk-surface-pan-top",
		SURFACE_PAN_RIGHT:"jtk-surface-pan-right",
		SURFACE_PAN_BOTTOM:"jtk-surface-pan-bottom",
		SURFACE_PAN_ACTIVE:"jtk-surface-pan-active",
		SURFACE_SELECTED_ELEMENT:"jtk-surface-selected-element",
		TOOLBAR:"jtk-toolbar",
		TOOLBAR_TOOL:"jtk-tool",
		TOOLBAR_TOOL_SELECTED:"jtk-tool-selected",
		TOOLBAR_TOOL_ICON:"jtk-tool-icon"		
	},
	constants = { left:"left", right:"right", top:"top", bottom:"bottom", width:"width", height:"height",
		leftmin:"leftmin", leftmax:"leftmax", topmin:"topmin", topmax:"topmax", min:"min",max:"max",
		px:"px",onepx:"1px",nopx:"0px",em:"em",absolute:"absolute",relative:"relative",none:"none",block:"block",
		hidden:"hidden",div:"div",id:"id",plusEquals:"+=",minusEquals:"-=",dot:".", transform:"transform",
		transformOrigin:"transform-origin",div:"div"
	},
	events = {
		anchorChanged:"anchorChanged",
        canvasClick:"canvasClick",
		click:"click",
		connection:"connection",
		connectionDetached:"connectionDetached",
		contentDimensions:"contentDimensions",		
		contextmenu:"contextmenu",
        dataLoadStart:"dataLoadStart",
		dataLoadEnd:"dataLoadEnd",
		drag:"drag",		
		edgeAdded:"edgeAdded",
		edgeRemoved:"edgeRemoved",
		elementDragged:"elementDragged",
		elementAdded:"elementAdded",
		elementRemoved:"elementRemoved",		
		graphCleared:"graphCleared",
		modeChanged:"modeChanged",
		mousedown:"mousedown",
		mousemove:"mousemove",
		mouseout:"mouseout",
		mouseup:"mouseup",		
		nodeAdded:"nodeAdded",
        nodeMoveStart:"nodeMoveStart",        
        nodeMoveEnd:"nodeMoveEnd",
		nodeRemoved:"nodeRemoved",		
		objectRepainted:"objectRepainted",
		pan:"pan",		
		portAdded:"portAdded",
		portRemoved:"portRemoved",        
		start:"start",
		stop:"stop",		
		touchend:"touchend",
		touchmove:"touchmove",
		touchstart:"touchstart",
		unload:"unload"
	},
	_cl = classes,
	_c = constants, // just so i can type fewer characters
	_e = events,
	_log = function(msg) {
		console.log(msg);
	},
	// get the position of the element by reading its style left/top and stripping the suffix.
	_pos = function(element, curZoom) {
		var _strip = function(s) { return s.substring(0, s.length - 2); },			
			x = parseInt(_strip(element.style.left)),
			y = parseInt(_strip(element.style.top)),
			w = parseInt(_strip(element.style.width)),
			h = parseInt(_strip(element.style.height)),
			xz = x + ( (1 - curZoom) * w / 2),
			yz = y + ( (1 - curZoom) * h / 2);

		return { left:x, top:y };	
	},
	_getAbsoluteOffset = function(el) {
		var _s = function(s) { return parseInt(s.substring(0, s.length - 2)) || 0; };
		return {left:_s(el.style.left), top:_s(el.style.top)};
	},
	_setAbsoluteOffset = function(el, left, top, scale, xOffset, yOffset) {
		scale = scale || 1;
		el.style.left = (xOffset || 0) + (scale * left) + _c.px;	
		el.style.top = (yOffset || 0) + (scale * top) + _c.px;
	},
	_createElement = function(params, parent) {
		var d = document.createElement(params.type || _c.div),
			units = params.units || _c.px;

		if (params.top != null) d.style.top = params.top + _c.px;	
		if (params.left != null) d.style.left = params.left + _c.px;
		if (params.right != null) d.style.right = params.right + _c.px;	
		if (params.bottom != null) d.style.bottom = params.bottom + _c.px;		
		d.style.width = params.width;
		d.style.height = params.height;
		d.style.position = params.position || _c.absolute;
		if (params.id) d.setAttribute(_c.id, params.id);
		if(params.display) d.style.display = params.display;
		if (params.clazz) d.className = params.clazz;
		jpcl.appendElement(d, parent);
		return d;
	};
	
// **************** rendering ************

	// register ready listener to process templates. note this listens to ready on the static
		// jsplumb instance.
        jsPlumb.ready(function() {
            var templateHolder = document.getElementById("jsPlumbToolkitTemplates");
            if (!templateHolder) {
                templateHolder = document.createElement(_c.div);
                templateHolder.style.display = _c.none;
				templateHolder.id = "jsPlumbToolkitTemplates";
                document.body.appendChild(templateHolder);			        
				var tags = document.getElementsByTagName("script");             
				for (var i = 0; i < tags.length ;i++) {
					var type = tags[i].getAttribute("type"),
						src = tags[i].getAttribute("src");
					if (type == "text/x-jsplumb-palette") {     
						jpcl.ajax({
							url:src, 
							success:function(html) {
								var ih = templateHolder.innerHTML;
								ih += html;
								templateHolder.innerHTML = ih;
							}, 
							error:function(http) {
								_log("jsPlumbToolkit: cannot load palette from " + src);
							}
						});
					}    
				}
			}
        });


 	/*
		Function: _defaultNodeRenderFunction
		This is the default that the jsPlumb toolkit will use if you do not supply either a render function or a template id.
		It draws a div with a basic 1px solid border.
	 */
	var _defaultNodeRenderFunction = function(data, id) {
			var d = document.createElement("div");
			d.innerHTML = data.name || data.id;
			d.className = _cl.NODE;
			d.style.border = "1px solid #456";
			d.style.position = "absolute";
			d.setAttribute("id", id);
			return d;
		},
		_defaultTemplateRenderers = {
            "jquery":{
                render:function(templateId, data, renderMode) {
                    // first try to find one with the given render mode...
                    var t = $("#" + templateId + "-" + renderMode);
                    if (!t || t.length == 0)
                        t = $("#" + templateId);
                    
                    if (!t)
                        throw new Error("Cannot resolve template " + templateId);
                    else
                        return t.tmpl(data)[0];
                }
            },
            "icanhaz":{
                render:function(templateId, data, renderMode) {
                    // TODO SVG/VML
                    return ich[templateId](data);                        
                }
            },
            "underscore":{
                render:function(templateId, data, renderMode) {
                    var html = _.template(document.getElementById(templateId).innerHTML)(data),
                    	d = document.createElement("div");
	
					d.innerHTML = jsPlumbToolkitUtil.fastTrim(html);
                    var c = d.firstChild;
                    return c;
                }
            },
            "handlebars":{
                render:function(templateId, data, renderMode) {
                    var source  = document.getElementById(templateId).innerHTML,
						template = Handlebars.compile(source),
						d = document.createElement("div"); 

                    d.innerHTML = jsPlumbToolkitUtil.fastTrim(template(data));
                    var c = d.firstChild;
                    return c;
                }
                /*  HOW TO HAVE NESTED TEMPLATES
                Handlebars.registerHelper('applyTemplate', function(subTemplateId, ctx){    
                var subTemplate =  Handlebars.compile($('#' + subTemplateId).html());
                var innerContent = ctx.fn({});
                var subTemplateArgs = _.extend({}, 
                  ctx.hash, 
                  {content: new Handlebars.SafeString(innerContent)});

                return subTemplate(subTemplateArgs)
            });
*/
            },
            "mustache":{
                render:function(templateId, data, renderMode) {
                    var source  = document.getElementById(templateId).innerHTML,
						template = Mustache.compile(source),
						d = document.createElement("div"); 

                    d.innerHTML = jsPlumbToolkitUtil.fastTrim(template(data));
                    var c = d.firstChild;
                    return c;
                }
            }
		},
        _defaultTemplateRendererName = "jquery";
	
	
	// *********** adapters for positioning - layouts call adapters and dont work directly with offsets. ***************************

	/** 
		Adapter for a normal DOM element
	*/
	var DOMElementAdapter = function(params) {
		var jpcl = jsPlumb.CurrentLibrary,
			_el = jpcl.getElementObject(params.container),
			el = jpcl.getDOMElement(params.container),
			_offset = el == window ? { left:0, top:0 } : jpcl.getOffset(_el);                

		this.getWidth = function() { return jpcl.getSize(_el)[0]; };
		this.getHeight = function() { return jpcl.getSize(_el)[1]; };

		this.append = function(e) {
			var _e = jpcl.getElementObject(e);
			jpcl.appendElement(_e, _el);
		};

		this.remove = function(e) {
			var _e = jpcl.getElementObject(e);
			jpcl.removeElement(_e);
		};

		this.setOffset = function(e, offset) {
			var _e = jpcl.getElementObject(e);
			jpcl.setOffset(_e, {
				left:_offset.left + offset.left,
				top:_offset.top + offset.top
			});   
		};

		this.getOffset = function(e) {
			var _e = jpcl.getElementObject(e);
			return jpcl.getOffset(_e);
		};
		
		this.getContainerOffset = function() {
			return jpcl.getOffset(jpcl.getElementObject(params.container));
		};
	};
    
    // a layout that does nothing except present the functions present in the layout API
    var EmptyLayout = function() {
        this.refresh = this.relayout = this.nodeRemoved = this.nodeAdded = this.setUserPosition = function() { };
    };
    
	/*
	 * Superclass for renderers.
	 */
	var AbstractRenderer = function(params) {
		params = params || {};
		var self = this,			
			_toolkit = params.toolkit,
			_layout = new EmptyLayout(),
			jpcl = jsPlumb.CurrentLibrary,
			container = jpcl.getElementObject(params.container),
			containerElement = jpcl.getDOMElement(container),
			draggable = !(params.draggable === false),
			dragOptions = params.dragOptions || {},
            _suspendRendering = false,
			_nodeTypes = {},
			_edgeTypes = {},
			_portTypes = {},						
			_idFunction = params.idFunction || function(node) { 
                return _toolkit.getNodeId(node); 
            },			
			_typeFunction = params.typeFunction || function(node) { return _toolkit.getNodeType(node); },
			_edgeIdFunction = params.edgeIdFunction || function(edge) { return _toolkit.getEdgeId(edge); },
			_edgeTypeFunction = params.edgeTypeFunction || function(edge) { return _toolkit.getEdgeType(edge); },
			_portIdFunction = params.portIdFunction || function(port) { return _toolkit.getPortId(port); },
			_portTypeFunction = params.portTypeFunction || function(port) { return _toolkit.getPortType(port); },
			_thisTemplateRenderer = params.templateRenderer ? jsPlumbUtil.isString(params.templateRenderer) ? _defaultTemplateRenderers[params.templateRenderer] : { render:params.templateRenderer } : _defaultTemplateRenderers[_defaultTemplateRendererName];
			
		var jsPlumbParams = jsPlumbUtil.merge(params.jsPlumb || {}, { Container:$(".jtk-surface-canvas") }),
			_jsPlumb = jsPlumb.getInstance(jsPlumbParams),
			containerId = _jsPlumb.getId(container);
 
 		jsPlumbUtil.EventGenerator.apply(this, arguments);
        
        // expose jsplumb mostly for testing
		self.getJsPlumb = function() { return _jsPlumb; };            
		// renderer has some events, but also exposes jsplumb events
		var localEvents = [ _e.canvasClick, _e.nodeAdded, _e.nodeRemoved, 
                           _e.nodeMoveStart, _e.nodeMoveEnd, _e.portAdded, 
                           _e.portRemoved, _e.edgeAdded, _e.edgeRemoved,
                           _e.dataLoadEnd, _e.anchorChanged, _e.objectRepainted,
                           _e.pan ],
			_bind = self.bind, _jbind = _jsPlumb.bind;

		self.bind = function(evt, fn) {
			if (jsPlumbUtil.indexOf(localEvents, evt) == -1)
				_jbind(evt, fn);
			else
				_bind(evt, fn);
		};
		
		var _ignoreToolkitEvents = false;
		// TODO strictly speaking, node ids and DOM element ids should not have to match. so here in fact we want to tell the 
		// toolkit the actual node ids, not the ids of the dom elements.
		// and also, from the type of connection, we'd like to know the cost and whether it is directed
		//
		// ALSO, here the user has created an edge implicitly, but how does it get added to the data model? it's like in fact
		// we want to call the toolkit at drag start to get it to prepare a new edge for us, and then at successful connection
		// tell it to commit the change.
		_jbind(_e.connection, function(info) {
			_ignoreToolkitEvents = true;
            var sourcePortTypeId = info.sourceEndpoint.getParameter("portType"),
                sourcePortType = palette.getPortDefinition(sourcePortTypeId),
                edgeType = sourcePortType != null && sourcePortType.edgeType ? sourcePortType.edgeType : "default",
                edgeTypeDefinition = palette.getEdgeDefinition(edgeType),
                sourceNodeId = info.sourceEndpoint.getParameter("nodeId"),
                sourcePortId = info.sourceEndpoint.getParameter("portId"),
                targetNodeId = info.targetEndpoint.getParameter("nodeId"),
                targetPortId = info.targetEndpoint.getParameter("portId"),
                sourceId = sourceNodeId + (sourcePortId ? "." + sourcePortId : ""),
                targetId = targetNodeId + (targetPortId ? "." + targetPortId : ""),
                params = {
                    sourceNodeId:sourceNodeId,    
                    sourcePortId:sourcePortId,                    
                    targetNodeId:targetNodeId,
                    targetPortId:targetPortId,
                    type:edgeType,
                    source:_toolkit.getNode(sourceId),
                    target:_toolkit.getNode(targetId),
                    sourceId:sourceId,
                    targetId:targetId
                };
            
			var doAbort = _toolkit.getEdgeFactory()(params, {}, function(data) {
                // TODO doesn't take ports into account, does it?
				params.edge = _toolkit.addEdge({
					source:sourceId,
					target:targetId,
					cost:info.connection.getCost(),
					directed:info.connection.isDirected(),
					data:data,
					addedByMouse:true
				}, self);                
                connMap[params.edge.getId()] = info.connection;
                info.connection.setParameter("edge", params.edge);
                _maybeAttachEdgeEvents(edgeType, params.edge, info.connection);
                
                self.fire(_e.edgeAdded, params);
			});
            // if edge factory explicitly returned false, delete the connection.
            if (doAbort === false) {
                _jsPlumb.detach(info.connection);
            }
			_ignoreToolkitEvents = false;
		});
        // fired only when an edge was removed via the UI.
		_jbind(_e.connectionDetached, function(info) {
			_ignoreToolkitEvents = true;
			_toolkit.removeEdge(info.connection.edge);
			_ignoreToolkitEvents = false;
            var sp = info.sourceEndpoint.getParameters(), tp = info.targetEndpoint.getParameters(), 
                sourceId = sp.nodeId + (sp.portId ? "." + sp.portId : ""),
                targetId = tp.nodeId + (tp.portId ? "." + tp.portId : "");
            self.fire(_e.edgeRemoved, {
                sourceNodeId:sp.nodeId,
                targetNodeId:tp.nodeId,
                sourcePortId:sp.portId,
                targetPortId:tp.portId,
                sourceId:sourceId,
                targetId:targetId,
                source:_toolkit.getNode(sourceId),
                target:_toolkit.getNode(targetId),
                edge:info.connection.getParameter("edge")
            });
		});							  
					
// ---------- bind to events in the toolkit ---------------------
        
        _toolkit.bind(_e.dataLoadStart, function() {
            _jsPlumb.setSuspendDrawing(true);
            _suspendRendering = true;
        });
			
		_toolkit.bind(_e.dataLoadEnd, function() {
            // SHOULD CLEAR HERE, if we're going to initialize.
//            self.initialize();
            _suspendRendering = false;
            if (_layout) _layout.relayout();
            _jsPlumb.setSuspendDrawing(false, true);
            if (_layout) self.fire(_e.dataLoadEnd);
		});		
		
		var nodeMap = {}, portMap = {};
		/*
		* Notification a new Node was added - this function renders it, and then calls refresh on the layout if there is
		* one.
		*/
		_toolkit.bind(_e.nodeAdded, function(params) {
			// get the node definition, and add any ports. this should really be done by the toolkit.
			// what else should the toolkit know about nodes, though? max connections? probably - it's a data model concern.
			var nd = palette.getNodeDefinition(_typeFunction(params.data));
			if (nd && nd.ports) {
				for (var i in nd.ports) {
					params.node.addPort({id:i});
				}
			}

			// does the node already exist in the DOM?
			var node = jpcl.getDOMElement(params.node.id);
			if (node == null) {
				node = nodeRenderer(params.node, params.data, params.node);
				if (!node) throw new Error("Cannot render node");
				self.append(node);
			}
			else {
				// we need to set its jtk
				node.jtk = { node:params.node };
			}
            _checkForPorts(jpcl.getDOMElement(node), params.node, params.node.id);
			
			// store node el in map
			nodeMap[params.node.id] = node;
            
            // look for any ports that were rendered with it
            var ports = _jsPlumb.getSelector(node, "[data-port-id]"); // TODO might want to have parameterised this class.
            for (var i = 0; i < ports.length; i++) {
                var portId = ports[i].getAttribute("data-port-id");
                portMap[params.node.id + "." + portId] = ports[i];
                ports[i].jtk = ports[i].jtk || { node:params.node, port:params.node.getPort(portId) }; // port may still be null here; that's ok.
            }
			
			self.fire(_e.nodeAdded, {node:params.node, data:params.data, el:node});
			self.refresh();			
			return node;
		});		
		
		/*
		* Notification a Node was removed - this function removes all UI components, and then calls refresh on the layout if there is
		* one.
		*/
		_toolkit.bind(_e.nodeRemoved, function(params) {
            // now remove the node.
			var _nodeElId = _idFunction(params.node.data);                        
            // update the layout
            self.getLayout().nodeRemoved(_nodeElId);
	
			self.fire(_e.nodeRemoved, { node:params.node });         			  
            
            _jsPlumb.setSuspendEvents(true);
            _jsPlumb.remove(_nodeElId);
            _jsPlumb.setSuspendEvents(false);			
            
            delete nodeMap[params.nodeId];
            
			self.refresh();
		});

		var connMap = {},
            _getConnectionForEdge = function(edge) { return connMap[edge.getId()]; },
            _getConnectionsForEdges = function(edges) { 
                var c = [];
                for (var i = 0; i < edges.length; i++)
                    c.push(connMap[edges[i].getId()]);
                return c;
            },
            _bindAConnectionEvent = function(id, listener, edge, connection) {
            	connection.bind(id, function(e, originalEvent) { 
                	var args = [ originalEvent, edge, connection ];
                	args.push.apply(args, arguments);                       	
                    listener.apply(listener, args);
                });
            },
            _maybeAttachEdgeEvents = function(type, edge, connection) {            	
            	// if this connection already has an associated edge, do nothing.
            	if (connection.getParameter("edge")) return; 
                var edgeTypeDefinition = palette.getEdgeDefinition(type);
                // set events too, if they were provided in the edge definition
                if (edgeTypeDefinition && edgeTypeDefinition.events) {
                    for (var i in edgeTypeDefinition.events) {
              			_bindAConnectionEvent(i, edgeTypeDefinition.events[i], edge, connection);          
                    }
                }
            };
        
		/*
		* Notification that an edge was added. we want to create an appropriate connection in the jsPlumb
		* instance we are managing. Note 'connMap' above; we use that to map edges to actual connections.
		*/
		_toolkit.bind(_e.edgeAdded, function(edge) {
			if (!_ignoreToolkitEvents) {
				var connectionParams = _prepareConnectionParams(edge);					
				connectionParams.doNotFireConnectionEvent = true;
				if(_toolkit.isDebugEnabled()) console.log("Renderer", "adding edge with params", connectionParams );
                var conn = _jsPlumb.connect(connectionParams);
                conn.edge = edge;
				connMap[edge.getId()] = conn;
                _maybeAttachEdgeEvents(connectionParams.type, edge, conn);
                self.fire(_e.edgeAdded, {
                	source:edge.source,
                	target:edge.target,
                	connection:conn,
                	edge:edge
                });
			}
		});
		
		/*
		* Notification that an edge was removed. We want to remove the corresponding connection from our jsPlumb instance.
		*/
		_toolkit.bind(_e.edgeRemoved, function(edge) {
			if (!_ignoreToolkitEvents) {
                var connection = connMap[edge.getId()];
				if (connection) {
                    if(_toolkit.isDebugEnabled()) console.log("Renderer", "removing edge", edge );
					_jsPlumb.detach({connection:connMap[edge.getId()],fireEvent:false});
					delete connMap[edge.getId()];
                    _fireEdgeRemoved(connection, edge);                    
				}
			}
		});		
        
        var _fireEdgeRemoved = function(c, edge) {
            var sp = c.endpoints[0].getParameters(), tp = c.endpoints[1].getParameters(), 
                sourceId = sp.nodeId + (sp.portId ? "." + sp.portId : ""),
                targetId = tp.nodeId + (tp.portId ? "." + tp.portId : "");
            
            self.fire(_e.edgeRemoved, {
                sourceNodeId:sp.nodeId,
                targetNodeId:tp.nodeId,
                sourcePortId:sp.portId,
                targetPortId:tp.portId,
                sourceId:sourceId,
                targetId:targetId,
                source:_toolkit.getNode(sourceId),
                target:_toolkit.getNode(targetId),
                edge:edge
            });
        };
		
		/*
		* Notification that the graph was cleared. We remove everything from our jsPlumb instance (but do not
		* unbind any event listeners).
		*/
		_toolkit.bind(_e.graphCleared, function() {						
			// clear nodes
			for (var n in nodeMap) {
				_jsPlumb.remove(nodeMap[n]);
			}
			_layout && _layout.clear();
			_jsPlumb.deleteEveryEndpoint();
			connMap = {};
			nodeMap = {};
		});		
		
		/*
		* Notification that a new port was added to some node.  We want to find the corresponding element for the
		* given node, then render the portData using the current rendering mechanism, and finally hand off the node's
		* element and the renderer port element to a helper function (supplied as 'portAdded' to the constructor), for
		* the application to insert the port's UI component at the appropriate location. If no 'portAdded' callback
		* was supplied, we just append the port to the node. 
		*
		* For an example of this, consider the database visualizer demo app.  when the user adds a new column it is
		* added as a 'port' to the table node.  We are given the portData and we render it using the column
		* template, but then where does this column get added?  We hand off to the app, and the app knows that it
		* should add the element to the UL that contains the table's columns.
		*/
		_toolkit.bind(_e.portAdded, function(params) {		
			var nodeEl = nodeMap[params.node.id];			
			//console.log("PORT ADDED TO NODE", params.node, nodeEl);			
			// get the port element rendered, and then hand it off to the helper, which is responsible for
			// appending it to the appropriate place in the UI.
			var portEl = portRenderer(params.port, params.data, params.node);					
            portMap[params.node.id + "." + params.port.id] = portEl;
            
            _checkForPorts(jpcl.getDOMElement(portEl), params.node, params.node.id);
            			
            self.fire(_e.portAdded, {
				node:params.node,
				nodeEl:nodeEl,
				port:params.port,
				portEl:portEl
			});
            
            _jsPlumb.recalculateOffsets(nodeEl);
			self.refresh();
		});
		
		/*
		* Notification that a port was removed from some node.  We want to retrieve the associated node and 
		* port elements, then hand off to a helper function (supplied as 'portRemoved' to the constructor) for
		* the application to remove the port's UI component.  If no 'portRemoved' callback was supplied we just
		* attempt to remove the port's element from its parent (which, for many applications, is probably
		* sufficient).
		*/
		_toolkit.bind(_e.portRemoved, function(params) {
			var nodeEl = nodeMap[params.node.id], pId = params.node.id + "." + params.port.id,
                portEl = portMap[pId];        
            
            // remove the port element (suspend events while doing so)
            _jsPlumb.setSuspendEvents(true);
            _jsPlumb.remove(portEl);
            _jsPlumb.setSuspendEvents(false);
            
            delete portMap[pId];            			
            self.fire(_e.portRemoved, {
				node:params.node,
				port:params.port,
                portEl:portEl
			});
            _jsPlumb.recalculateOffsets(nodeEl);
			self.refresh();
		});
// ----------------------------------------- palettes    -------------------------------------		
			
		// create a palette. we merge in the palette that has optionally been registered on the toolkit
		// when we do this.  this allows us to register data model stuff on the toolkit (such as max
		// connections etc), and render level stuff on this object.
		var pp = jsPlumbUtil.merge(_toolkit.getPalette(), params.palette || {}),
			palette = new jsPlumbToolkit.Palette(pp, _jsPlumb);
		
		var _prepareConnectionParams = function(edge) {
			// we use jsPlumb's type system for edge appearance.
			var p = {
				type : _edgeTypeFunction(edge.data),
				// pass the 'data' object in; it is used if the edge type is parameterised at all.
				data : edge.data,
				cost : edge.getCost(),
				directed : edge.isDirected()
			};

			var _one = function(name) {
				if (edge[name].getNode) {
					var n = edge[name].getNode(),						
						portIdentifier = n.id + "." + edge[name].id,
						ep = portEndpointMap[portIdentifier];	
						
					if (ep == null) {
						ep = portMaps[name][portIdentifier];
					}
						
					p[name] = ep;
				}
				else
					p[name] = _idFunction(edge[name].data);
			};
			
			_one("source"); _one("target");						
			
			return p;
		};					
		
// ---------------------- create the default node renderer ---------------------------		
		
		var createRenderer = function(objectType, idFunctionToUse, typeFunctionToUse, 
		definitionResolver, defaultRenderFunction, makeDraggableIfRequired,
                                     jtkClass, jtkAttributeName) {			
            return function(object, data, node) {
            
				var id = idFunctionToUse(data),
					d = document.getElementById(id),
					obj = null;
				
				if (!d) {           
					// can i expect users to use the same mechanism for port type
					// as for node type? i think probably that is ok. besides, if they supply their own typeFunction,
					// they can probably discriminate inside there.
					var typeId = typeFunctionToUse(data), 
						def = definitionResolver(typeId);
						
					// get parameters from definition and its parents		            
		            var _data = jsPlumb.extend({}, def ? def.parameters || {} : {} );
		            // then merge node on top, so its values take priority.
		            jsPlumb.extend(_data, data);
					
					//  expand any params that were supplied as functions, by executing them with the given data (NOTE: not parameters as well).
		            var mappedData = {};
		            for (var i in _data) {
		            	if (_data[i] != null) {
			                if (_data[i].constructor == Function) 
			                    mappedData[i] = _data[i](data);
			                else
			                    mappedData[i] = _data[i];
			            }
		            }
						
					if (def && def.template) {
						if (!def.templateRenderer) {                    
							obj = _thisTemplateRenderer.render(def.template, mappedData, _jsPlumb.getRenderMode());
						}
						else {
							obj = def.templateRenderer(def.template, mappedData, _jsPlumb.getRenderMode());
						}
					}
					else obj = defaultRenderFunction(mappedData, id);
					
					var objEl = jpcl.getElementObject(obj);
				
				// TODO do i need to set node id here?
					jpcl.setAttribute(objEl, "id", id);	
                    jpcl.setAttribute(objEl, jtkAttributeName, id);
                    jpcl.addClass(objEl, jtkClass);
				
					// write the data to the element.
					obj.jtk = obj.jtk || {};
					obj.jtk[objectType] = object;
                    // always write node. 
                    obj.jtk.node = node;
					
					// CHECK FOR PORTS...TODO check this...this will work when rendering a PORT, but the problem is that
					// ports have to be registered against a node.
                    //_checkForPorts(jpcl.getDOMElement(obj), data, node.id);
					
					// only for nodes.
					if (makeDraggableIfRequired && draggable)
						self.makeDraggable(obj);
					
					// -------------- events -----------------------					
					
					var _bindOne = function(evt) {
						jpcl.bind(objEl, evt, function() {
							def.events[evt]({node:node, el:obj});
						});						
					};
						
					// EVENTS
					if (def && def.events) {
						for (var i in def.events) {
							_bindOne(i);
						}						
					}				
						
					return obj;
				}
				else {					
					d.jtk = { node:node };
					return jpcl.getElementObject(d);
				}
			};                                                  
        };
        
        var nodeRenderer = createRenderer("node", _idFunction, _typeFunction, palette.getNodeDefinition, _defaultNodeRenderFunction, true, classes.NODE, atts.NODE);
        var portRenderer = createRenderer("port", _portIdFunction, _portTypeFunction, palette.getPortDefinition, _defaultNodeRenderFunction, false, classes.PORT, atts.PORT);
						
		// 
		self.initialize = function() {			
			_toolkit.setSuspendGraph(true);
			// suspend drawing until its all loaded
            _jsPlumb.setSuspendDrawing(true);	
			
			// now add nodes for all vertices			
            for(var i = 0; i < _toolkit.getNodeCount(); i++) {
                var n = _toolkit.getNodeAt(i);
                var nodeEl = nodeRenderer(n, n.data, n);
                self.append(nodeEl);
                nodeMap[n.id] = nodeEl;
                _checkForPorts(jpcl.getDOMElement(nodeEl), n, n.id);
            }			
			// next, connect all nodes
            for (var i = 0; i < _toolkit.getNodeCount(); i++) {
                var n = _toolkit.getNodeAt(i), edges = n.getAllEdges();
                for (var j = 0; j < edges.length; j++) {
                    if (edges[j].source == n || edges[j].source.getNode && edges[j].source.getNode() == n) {                        
                        var connectionParams = _prepareConnectionParams(edges[j]);					
						connectionParams.doNotFireConnectionEvent = true;
						var conn = _jsPlumb.connect(connectionParams);
						conn.edge = edges[j];
						connMap[edges[j].getId()] = conn;
						_maybeAttachEdgeEvents(connectionParams.type, edges[j], conn);
                    }
                }	
            }
			if (_layout) _layout.relayout();			
			_jsPlumb.setSuspendDrawing(false, true);
			_toolkit.setSuspendGraph(false);			
		};
		
		self.getContainer = function() { return container; };
		self.getContainerId = function() { return containerId; };
			
		self.setLayout = function(layoutParams) {
			if (layoutParams) {
				var lp = _jsPlumb.extend({container:container}, layoutParams);
				_layout = _toolkit.layout(lp, self);
			}
		};
		
		self.getLayout = function() {
			return _layout;
		};
		
        /*
            Function: refresh
            Incrementally update the layout, without a reset.   
        */
		self.refresh = function() {
            if (!_suspendRendering) {
                if (_layout) _layout.layout();
                 _jsPlumb.repaintEverything();
            }
		};			

		self.redrawEdge = function(edge) {			
			connMap[edge.getId()].reapplyTypes(edge.data);
		};
		
        /*
            Function: relayout
            Reset the layout and run it again.  This is different to refresh in that
            refresh does not reset the layout first.
        */
		self.relayout = function(newParameters) {
            if (!_suspendRendering) {            
                if (_layout) _layout.relayout(newParameters);			
                 _jsPlumb.repaintEverything();
            }
		};        

        /*
            Function: draggable
            Initializes the given element or selector to be draggable, ensuring that
            any jsPlumb connections are repainted when a drag occurs.
        */
        self.draggable = function(selector, params) {
            params.doNotRemoveHelper = true;
            _jsPlumb.draggable(selector, params);    
        };
				
		var portEndpointMap = {}, portMaps = {
			source:{},
			target:{}
		};
        
        var makeFilterFunction = function(_el, selector) {
            return function(evt, element) {
                var t = evt.target || evt.srcElement, ok = false, 
                    sel = _jsPlumb.getSelector(_el, selector);
                for (var j = 0; j < sel.length; j++) {
                    if (sel[j] == t) {
                        ok = true;
                        break;
                    }
                }
                return ok;
            };
        };        
        
		var _checkForPorts = function(el, node, nodeId) {			
			
			// get port parameters from some element 
			var _getPortParameters = function(fromEl) {
				
				var	//path = fromEl.getAttribute("path"), // will we do this?
					portId = fromEl.getAttribute("port-id"),
					portType = fromEl.getAttribute("port-type") || "default",
					portScope = fromEl.getAttribute("scope") || _jsPlumb.getDefaultScope(),					
					nodeType = _typeFunction(node),
					nodeDefinition = palette.getNodeDefinition(nodeType),
					portDefinition = palette.getPortDefinition(portId, nodeDefinition),
					portTypeDefinition = palette.getPortDefinition(portType, nodeDefinition),
					mergedPortDefinition = jsPlumbUtil.merge(portTypeDefinition, portDefinition),
					params = mergedPortDefinition == null ? {} : jsPlumbToolkitUtil.populate(mergedPortDefinition, node),
					_curryListener = function(listener) {
						return function(info) {
                			var p = info.endpoint.getParameters(),
                				//node = _toolkit.getNode(nodeId),
                				port = node.getPort(portId),
                				args = [{
	                				portId:portId,
		                			nodeId:nodeId,
		                			port:port,
		                			node:node,
		                			portType:portType,
		                			endpoint:info.endpoint,
		                			anchor:info.anchor
		                		}];
		                	listener.apply(listener, args);
                		};
					};
					
				if (params.edgeType) {
					// expand out the edge type. now what about the fact that the edge type might take parameters? we don't have an Edge at this point.
					// i suppose when a connection starts we might want to get an edge from the edge factory or something?  how will this work? we need
					// to somehow inject this functionality right at the start of a drag, before the drag has even started in fact, because we want to get
					// the edge and rubber stamp it.
					var mappings = {
							"paintStyle":"connectorStyle",
							"hoverPaintStyle":"connectorHoverStyle",
							"overlays":"connectorOverlays",
							"endpointStyle":"paintStyle"
						},
						edgeParams = palette.getEdgeDefinition(params.edgeType);
						
					if (edgeParams) {
						for (var i in edgeParams) {
							var m = mappings[i] || i;
							params[m] = edgeParams[i];
						}
					}		
					params.connectionType = params.edgeType;			
				}
				
				params.portId = portId;
                params.portType = portType;
				params.scope = portScope;
                
                // set jsplumb parameters
                params.parameters = params.parameters || {};
                params.parameters.portId = portId;
                params.parameters.portType = portType;
				params.parameters.scope = portScope;                
                params.parameters.nodeId = nodeId;      

                params.events = {};
                if (mergedPortDefinition.events) {
                	for (var i in mergedPortDefinition.events) {                		
                		params.events[i] = _curryListener(mergedPortDefinition.events[i]);
                	}
                }          

                // event capture
                params.events.anchorChanged = function(info) {
            		self.fire("anchorChanged", {
            			portId:portId,
            			nodeId:nodeId,
            			portType:portType,
            			node:node,
            			port:node.getPort(portId),
            			endpoint:info.endpoint,
            			anchor:info.anchor
            		});
            	};                
								
				return params;
			};                        
		
			if (el.childNodes) {
                var nodesToRemove = [];
				for (var i = 0; i < el.childNodes.length; i++) {
					if (el.childNodes[i].nodeType != 3 && el.childNodes[i].nodeType != 8 ) {
                                                
						// JTK-PORT element						
						if (el.childNodes[i].tagName.toUpperCase() == "JTK-PORT") {						
                            var portParameters = _getPortParameters(el.childNodes[i]);
							var ep = _jsPlumb.addEndpoint(el, portParameters);	
							// store the mapping from node.port to endpoint
							portEndpointMap[nodeId + "." + portParameters.portId] = ep;
                            // add a port to the node.
                            var port = node.addPort({id:portParameters.portId});
                            nodesToRemove.push(el.childNodes[i]);               
                            ep.graph = {
								node:node,
								port:port
							};
						}
						// JTK-SOURCE element
						if (el.childNodes[i].tagName.toUpperCase() == "JTK-SOURCE") {
                            var portParameters = _getPortParameters(el.childNodes[i]);
							var filterSelector = el.childNodes[i].getAttribute("filter-selector");
								
							// save source port mapping for element.
							portMaps.source[nodeId + "." + portParameters.portId] = el;
                            // add a port to the node.
                            node.addPort({id:portParameters.portId});
								
							// if the user supplied a selector to the filter-selector attribute, create a filter function
                            // to use with it. jsPlumb should just support the filter selector argument really.
							if (filterSelector) {
								portParameters.filter = filterSelector;//makeFilterFunction(el, filterSelector);
							}
							
							_jsPlumb.makeSource(el, portParameters);	
                            nodesToRemove.push(el.childNodes[i]);
						}
						// JTK-TARGET element
						if (el.childNodes[i].tagName.toUpperCase() == "JTK-TARGET") {
                            var portParameters = _getPortParameters(el.childNodes[i]);
							var filterSelector = el.childNodes[i].getAttribute("filter-selector");
								
							// save target port mapping for element.
				            portMaps.target[nodeId + "." + portParameters.portId] = el;								
							// add a port to the node.
                            node.addPort({id:portParameters.portId});
                            
							_jsPlumb.makeTarget(el, portParameters);	
                            nodesToRemove.push(el.childNodes[i]);                            
						}
						
						_checkForPorts(el.childNodes[i], node, nodeId);
					}
				}
                for (var i = 0; i < nodesToRemove.length; i++)
                    nodesToRemove[i].parentNode.removeChild(nodesToRemove[i]);
			}
		};				
		
		self.setLayout(params.layout);
		
		return {
			jsPlumb:_jsPlumb,
            toolkit:_toolkit,
			container:container,
			containerId:containerId,
            getConnectionsForEdges:_getConnectionsForEdges,
            getConnectionForEdge:_getConnectionForEdge,
           // redrawEdge:_redrawEdge,
            getObjectInfo:function(obj) {
            	var out = { el:null, obj:null, type:null, id:null },
            		_findJtkParent = function(el) {
            			if (el != null) {
            				if (el.jtk) return el;
            				return _findJtkParent(el.parentNode);
            			}		
            		};
            	if (obj != null) {
            		var de = jpcl.getDOMElement(obj);
            		if (de != null && de.jtk) {
            			out.el = de;
            			out.obj = de.jtk.port || de.jtk.node;
            			out.type = de.jtk.port ? "port" : "node";            			
            		} else if (obj.tagName !== null) {
            			// it's some element that is a child of a toolkit object.
            			var jp = _findJtkParent(de);
            			if (jp != null) {
            				out.el = jp;
            				out.obj = jp.jtk.port || jp.jtk.node;
            				out.type = jp.jtk.port ? "port" : "node";            			
            			}
            		} else {
            			// it's a toolkit object (in theory.)
            			out.obj = obj;
            			out.el = obj.getNode ? portMap[obj.id] : nodeMap[obj.id];
            			out.type = obj.getNode ? "port" : "node";
            		}            		
            	}
            	return out;
            }
		};
	};		
		
	/**
	 * Function: DOMElementRenderer
	 *
	 * A basic Renderer that can have a Layout applied but offers no extra functionality such as zoom/pan etc. This
	 * Renderer simply drops elements onto the DOM.
	 */
	jsPlumbToolkit.Renderers.DOM = function(params) {
		AbstractRenderer.apply(this, arguments);
		DOMElementAdapter.apply(this, arguments);
	};

	/*
		Function: Surface
		This is a component that supports pan/zoom/saving state etc.

		Parameters:
			container			-	required.  id or selector of the element to turn into a surface.
			elementsDraggable	-	optional, defaults to true.  whether or not to initialise appended elements as draggable.
			dragOptions			-	optional, defaults to {}. options for dragging of elements.
			dropOptions 		-	optional, defaults to {}. options for what to do when an element is dropped on the surface.
			pannable			-	optional, defaults to true. whether or not to support panning the Surface.
			selectable          -   optional, defaults to true. whether or not to support selecting multiple nodes with a lasso.
			zoomable			 	optiona, defaults to true. whether or not to support zooming.
			padding				-	optional, defaults to 20px. number of pixels to leave visible of the chart when panning would have pushed the visible area off screen.
			panDistance			-	optional, default pan distance. defaults to 50px.
			autoPanIncrement	-	optional, increment to step in while auto panning. defaults to 5px.
			panStartInterval    -   optional, delay in milliseconds before auto pan begins. defaults to 250ms.
			autoPanRate         -   optional, number of milliseconds between ticks during auto pan. defaults to 50ms.
			activeMargin		-	optional, defaults to 60px.  Distance from margins inside which Surface will show pan divs.
			maximumZoomTravel   -   optional, defaults to 150px. Furthest distance of travel within which to still apply a zoom operation using the mouse.
			zoomRange 			- 	optional, defaults to [0.2, 3]. Defines the min and max zoom levels.
	*/
	jsPlumbToolkit.Renderers.Surface = function(params) {		
		var self = this;
	
		var _super = AbstractRenderer.apply(this, arguments);
		DOMElementAdapter.apply(this, arguments);
		this.getObjectInfo = _super.getObjectInfo;
		
		params = params || {};		
		var jpcl = jsPlumb.CurrentLibrary,			
			container = jpcl.getElementObject(params.container),
			containerElement = jpcl.getDOMElement(container),
			elementsDraggable = !(params.elementsDraggable === false),
			dragOptions = params.dragOptions || {},
			dropOptions = params.dropOptions || {},
			pannable = !(params.pannable === false),
			selectable = !(params.selectable === false),
			padding = params.padding || 20,
			panDistance = params.panDistance || 50,
			autoPanIncrement = params.autoPanIncrement || 5,
			activeMargin = params.activeMargin || 60,
			miniviews = [], _elements = {}, _elementPositions = {},
			containerSize = jpcl.getSize(container),
			_contentWidth = 0, _contentHeight = 0,
			maximumZoomTravel = params.maximumZoomTravel || 150,
			zoomable = !(params.zoomable === false),
			zoomRange = params.zoomRange || [0.2, 3],
			isIOS = ((/iphone|ipad/gi).test(navigator.appVersion)),
			downEvent = isIOS ? _e.touchstart : _e.mousedown,
			upEvent = isIOS ? _e.touchend : _e.mouseup,
			moveEvent = isIOS ? _e.touchmove : _e.mousemove,
			saveStateOnExit = params.saveStateOnExit,
			saveStateOnDrag = params.saveStateOnDrag,
			stateHandle = params.stateHandle,
			_consumeRightClick = !(params.consumeRightClick === false);
		
		// create the canvas div; this will be the parent of all elements, and the one we pan/zoom etc.
		var canvasElement = _createElement({ position:_c.relative, width:"300px", height:"300px", left:0, top:0, clazz:classes.SURFACE_CANVAS }, container),
			canvas = jpcl.getElementObject(canvasElement),
			// create the lasso we use for selection. it is a parent of the canvas, and is initially not visible of course.
			lassoElement = _createElement({ position:_c.absolute, width:"5px", height:"5px", left:0, top:0, clazz:classes.SURFACE_LASSO }, canvas),
			lasso = jpcl.getElementObject(lassoElement);
        
        // bind click listener to the container
        jpcl.bind(container, _e.click, function(e) {
            self.fire("canvasClick", container, e);
        });
        
        // bind nodeRemoved listener to toolkit
        _super.toolkit.bind(_e.nodeRemoved, function(params) {
            delete _elements[params.node.id];               
        });
			
		lassoElement.style.display = _c.none;		
		
		// set as the container for jsplumb.
		self.getJsPlumb().Defaults.Container = canvas;

		self._contentDimensions = { width:0, height:0, minLeft:0, minTop:0, maxLeft:0, maxTop:0 };
		self._canvasElement = { width:300, height:300, left:0, top:0 };

		var _plocs = {
				"left":function(w, cs) { return {left:0, top:0, width:w, height:"100%", clazz:classes.SURFACE_PAN_LEFT}; },
				//"right":function(w, cs) { return {left:cs[0] - w, top:0, width:w, height:cs[1], clazz:classes.SURFACE_PAN_RIGHT}; },
				"right":function(w, cs) { return {right:0, top:0, width:w, height:"100%", clazz:classes.SURFACE_PAN_RIGHT}; },
				"top":function(w, cs) { return {left:0, top:0, width:"100%", height:w, clazz:classes.SURFACE_PAN_TOP}; },
				//"bottom":function(w, cs) { return {left:0, top:cs[1] - w, width:cs[0], height:w, clazz:classes.SURFACE_PAN_BOTTOM}; }
				"bottom":function(w, cs) { return {left:0, bottom:0, width:"100%", height:w, clazz:classes.SURFACE_PAN_BOTTOM}; }
			},
			panStartInterval = params.panStartInterval || 250,
			autoPanRate = params.autoPanRate || 50,  		
			panStartIntervalTimer = null, autoPanInterval = null, didAutoPan = false,
			panIntervalFunction = null, currentPanButton = null, hidePanButtonTimeout = null, currentlyDragging = false,		
			panDiv = function(location, container, jpcl, panAnimFunction, panDirectFunction) {
				var cs = jpcl.getSize(container),
					w = "30px", // allow for this to be parameterised. just as soon as you figure out what it is.
					dim = _plocs[location](w, cs),
					containerId = _super.jsPlumb.getId(container),
					ourId = containerId + "_jsptp_" + location,
					d = _createElement({ left:dim.left, top:dim.top, right:dim.right, bottom:dim.bottom, width:dim.width, height:dim.height,
					display:_c.none, id:ourId, clazz:classes.SURFACE_PAN + " " + dim.clazz	}, container);
	
				jpcl.bind(d, _e.click, function() {		
					window.clearTimeout(hidePanButtonTimeout);	
					if (!didAutoPan) {		
						panAnimFunction();
						if (currentPanButton) {
							jpcl.removeClass(currentPanButton, classes.SURFACE_PAN_ACTIVE);
							currentPanButton = null;
						}	
					}
					didAutoPan = false;
				});
		
				jpcl.bind(d, downEvent, function() {
					window.clearTimeout(hidePanButtonTimeout);
					jpcl.addClass(d, classes.SURFACE_PAN_ACTIVE);
					currentPanButton = d;
					panStartIntervalTimer = window.setTimeout(function() {
						didAutoPan = true;										
						autoPanInterval = window.setInterval(panDirectFunction, autoPanRate);
					}, panStartInterval);	
				});						
			},
			showPanButton = function(container, loc) {
				window.clearTimeout(hidePanButtonTimeout);
				if (!currentlyDragging && !_canvasMouseDown && !_panButtonsDisabled) {
					var id = _super.jsPlumb.getId(container) + "_jsptp_" + loc,
						d = document.getElementById(id);
					
					// parameterise the show/hide stuff - user should be able to supply.
					if (d) d.style.display = _c.block;
	
					hidePanButtonTimeout = window.setTimeout(hidePanButtons, 650);
				}
			},
			hidePanButtons = function(immediately) {				
				// TODO JQUERY SPECIFIC
				$("." + classes.SURFACE_PAN).fadeOut();
			};

		// the cancel auto pan mouse listener goes on the document.
		jpcl.bind(document, upEvent, function() {
			window.clearTimeout(panStartIntervalTimer);
			panIntervalFunction = null;		
			window.clearInterval(autoPanInterval);
			if (currentPanButton) {
				jpcl.removeClass(currentPanButton, classes.SURFACE_PAN_ACTIVE);
				currentPanButton = null;
			}	
		});
		
		// bind to resize to reposition pan divs

		containerElement.style.overflow = _c.hidden;		
		jpcl.addClass(container, classes.SURFACE);

		// these are the current computed canvas bounds - the min/max in each direction.
		// they are recomputed every time something has finished dragging, or when something is
		// added to, or removed from, the canvas.
		var _canvasBounds = { leftmin:[], leftmax:[], topmin:[], topmax:[] },
			_updateBoundsEntry = function(elId, type, value) {
				var found = false;
				for (var i = 0; i < _canvasBounds[type].length; i++) {
					if (_canvasBounds[type][i][1] == elId) {
						_canvasBounds[type][i][0] = value;
						found = true;
						break;
					}							
				}	
				if (!found) _canvasBounds[type].push([value, elId]);
			},		
			_removeBoundsEntry = function(elId, type) {
				var idx = -1;
				for (var i = 0; i < _canvasBounds[type].length; i++) {
					if (_canvasBounds[type][i][1] == elId) {
						idx = i;
						break;
					}							
				}	
				if (idx > -1) _canvasBounds[type].splice(idx, 1);
			},			
			_minBound = function(type) { 
				return _canvasBounds[type + _c.min].length > 0 ? _canvasBounds[type + _c.min][0] : 0; 
			},
			_maxBound = function(type) { 
				return _canvasBounds[type + _c.max].length > 0 ? _canvasBounds[type + _c.max][_canvasBounds[type + _c.max].length - 1] : 0; 
			},
			_getApparentCanvasOrigin = function() {

				var w1 = self._canvasElement.width * zoomHelper.curZoom,
					h1 = self._canvasElement.height * zoomHelper.curZoom,
					tox = self._canvasElement.left + (transformOriginX * self._canvasElement.width),
					toy = self._canvasElement.top + (transformOriginY * self._canvasElement.height);


				/*console.log( [
					tox - (transformOriginX * w1),
					toy - (transformOriginY * h1)
				]);*/

				//console.log([ self._canvasElement.left + ((1 - zoomHelper.curZoom) * (self._canvasElement.width / 2)),
            	//		 self._canvasElement.top + ((1 - zoomHelper.curZoom) * (self._canvasElement.height / 2)) ]);

				return [
					tox - (transformOriginX * w1),
					toy - (transformOriginY * h1)
				];

				// TODO this assumes canvas transform origin is at [50%, 50].
				//return [ self._canvasElement.left + ((1 - zoomHelper.curZoom) * (self._canvasElement.width / 2)),
            	//		 self._canvasElement.top + ((1 - zoomHelper.curZoom) * (self._canvasElement.height / 2)) ];
            	//return [ self._canvasElement.left + ((1 - zoomHelper.curZoom) * (self._canvasElement.width * transformOriginX)),
            	//		 self._canvasElement.top + ((1 - zoomHelper.curZoom) * (self._canvasElement.height * transformOriginY)) ];
			},
			_recalculateContentDimensions = function() {				
				var _sort = function(a,b) {
					if (a[0] < b[0]) return -1;
					if (a[0] > b[0]) return 1;
					return 0;
				};

				_canvasBounds[_c.leftmin].sort(_sort);
				_canvasBounds[_c.topmin].sort(_sort);
				_canvasBounds[_c.leftmax].sort(_sort);
				_canvasBounds[_c.topmax].sort(_sort);

				var mil = _minBound(_c.left)[0], mal = _maxBound(_c.left)[0],
					mit = _minBound(_c.top)[0], mat = _maxBound(_c.top)[0];

				_contentWidth = mal - mil;
				_contentHeight = mat - mit;

				self._contentDimensions = {
					minLeft:mil, minTop:mit, maxLeft:mal, maxTop:mat,
					width:_contentWidth, height:_contentHeight 
				};

				_dispatch(_e.contentDimensions);
			},
			_updateBoundsEntries = function(elId, offset, size) {				
				if (!_elements[elId]) _elements[elId] = {};
				_elements[elId].loc = offset;				
				_updateBoundsEntry(elId, _c.leftmin, offset.left);
				_updateBoundsEntry(elId, _c.topmin, offset.top);
				_updateBoundsEntry(elId, _c.leftmax, offset.left + size[0]);
				_updateBoundsEntry(elId, _c.topmax, offset.top + size[1]);
				_recalculateContentDimensions();
			},
			_removeBoundsEntries = function(elId) {
				_removeBoundsEntry(elId, _c.leftmin);
				_removeBoundsEntry(elId, _c.topmin);
				_removeBoundsEntry(elId, _c.leftmax);
				_removeBoundsEntry(elId, _c.topmax);
				_recalculateContentDimensions();		
			},
			_recalculateBounds = function(el, domEl) {			
				el = jpcl.getElementObject(el);
				var id = _super.jsPlumb.getId(el),					
					s = jpcl.getSize(el),
					loc = _getAbsoluteOffset(domEl);
		
				_updateBoundsEntries(id, loc, s);
				return loc;			
			},
			_setOffset = self.setOffset,
			// appends the given element to the canvas, recalculating bounds etc.
			// part of the public API.
			_append = function(el) {
				el = jpcl.getElementObject(el);
				jpcl.appendElement(el, canvas);
				var domEl = jpcl.getDOMElement(el),
                    loc = _recalculateBounds(el, domEl),
					id = _super.jsPlumb.getId(el),
					size = jpcl.getSize(el);					
		
				_elements[id] = { el:el, id:id, loc:loc, size:size, node:domEl.jtk.node };	

				// dispatch event, like to miniview.
				_dispatch(_e.elementAdded, { 
					id:id,
					el:domEl, 
					offset:loc, 
					size:size,
					canvasOffset:jpcl.getOffset(canvas),
					width:_contentWidth,
					height:_contentHeight 
				});
			},	
			_makeDraggable = function(el) {
				el = jpcl.getElementObject(el);
				var id = _super.jsPlumb.getId(el),
					domEl = jpcl.getDOMElement(el);
				// init as draggable
				if (elementsDraggable) {
					var _dragOptions = _super.jsPlumb.extend({}, dragOptions),
						stopEvent = jpcl.dragEvents[_e.stop],
						dragEvent = jpcl.dragEvents[_e.drag],
						startEvent = jpcl.dragEvents[_e.start],
						canvasOffset = null,
                        _getDragInfo = function(args) {
                            var dragObject = jpcl.getDragObject(args),
                                dragDOMElement = jpcl.getDOMElement(dragObject),
                                dragObjectId = dragDOMElement.getAttribute("id"),
                                pos = self.getNodePosition(dragObjectId),
                                node = dragDOMElement.jtk.node;
                            
                            return {
                                node:node,
                                el:dragObject,
                                pos:pos
                            };                            
                        };

					_dragOptions[startEvent] = _super.jsPlumb.wrap(_dragOptions[startEvent], function() {
						canvasOffset = jpcl.getOffset(canvas);
                        self.fire(_e.nodeMoveStart, _getDragInfo(arguments));
					});
                     
					_dragOptions[stopEvent] = _super.jsPlumb.wrap(_dragOptions[stopEvent], function() {
						currentlyDragging = false;						
						var loc = _recalculateBounds(el, domEl);
						
						// inform the zoom helper:it will rewrite position to em if we are in ie <9 and using font-size for zoom.
						zoomHelper.dragStop(domEl);
                        
                        // update layout with the user's new position.  this will be honoured in different
                        // ways by different layouts.  force directed layouts, for instance, will set
                        // the node to have a large mass, so that its position is honoured (for this 
                        // pass through the layout only).  others, like
                        // the hierarchical ones, will just remember that the user moved this and override
                        // where they would ordinarily place the node.
                        if (self.getLayout() != null) {
                            self.getLayout().setUserPosition(domEl.jtk.node.id, loc.left, loc.top);                            
                        }
                        
						if (saveStateOnDrag && stateHandle)
							self.State.save();
                                                                    
                        self.fire(_e.nodeMoveEnd, _getDragInfo(arguments));                        
					});
			
					_dragOptions[dragEvent] = _super.jsPlumb.wrap(_dragOptions[dragEvent], function() {
						var pos = jpcl.getUIPosition(arguments);						
						var loc = {left:pos.left - canvasOffset.left, top:pos.top - canvasOffset.top };
						_elements[id].loc = loc;
                        // TODO this should fire something like nodeMove or something, to be keeping
                        // with the other two node move events. and it should hand over the same
                        // info.
						_dispatch(_e.elementDragged, { id:id, el:domEl/*, offset:jpcl.getOffset(el) */});	
					});											
					
					_super.jsPlumb.draggable(el, _dragOptions);
				}		
			},
			_remove = function(el) {
				el = jpcl.getElementObject(el);
				var id = _super.jsPlumb.getId(el),
					domEl = jpcl.getDOMElement(el);
				delete _elements[id];
				_removeBoundsEntries(id);

				jpcl.removeElement(el);				

				_dispatch(_e.elementRemoved, { 
					id:id,
					el:domEl, 
					canvasOffset:jpcl.getOffset(canvas),
					width:_contentWidth,
					height:_contentHeight 
				});	
			},	
			// for the given proposed left and top, return those values clamped by our desire to
			// keep the chart visible on screen. this takes zoom into account.
			_clamp = function(left, top, curZoom) {					
				var s = jpcl.getSize(canvas),
					sc = jpcl.getSize(container),
					dx = 0, dy = 0,
					canvasDeltaX = (1 - curZoom) * s[0] / 2,			
					canvasDeltaY = (1 - curZoom) * s[1] / 2,
					mil = (padding * curZoom) - (left + canvasDeltaX + (_maxBound(_c.left)[0] * curZoom)),
					mit = (padding * curZoom) - (top + canvasDeltaY + (_maxBound(_c.top)[0] * curZoom)),
					mal = (sc[0] - (padding * curZoom)) - (left + canvasDeltaX + (_minBound(_c.left)[0] * curZoom)),
					mat = (sc[1] - (padding * curZoom)) - (top + canvasDeltaY + (_minBound(_c.top)[0] * curZoom));

				if (mil > 0) dx += mil;				
				if (mit > 0) dy += mit;
				if (mal < 0) dx += mal;
				if (mat < 0) dy += mat;
				
				//console.log("CLAMPING ", dx, dy);

				return [dx, dy];
				//return [0,0];
			},
			// pans the canvas by a given amount
			_pan = function(left, top, noAnimation) {					
							
				if (pannable) {						
					currentlyDragging = true;	
					var o = _pos(canvasElement, zoomHelper.curZoom),
						desiredLeft = o.left + left,
						desiredTop = o.top + top,
						clamped = _clamp(desiredLeft, desiredTop, zoomHelper.curZoom);

					if (!noAnimation) {
						// TODO should be able to pass animation arguments in to the Surface.
						var args = {
							left: _c.plusEquals + (left + clamped[0]),
							top: _c.plusEquals + (top + clamped[1])
						},
						argsToDispatch = {
							left:(left + clamped[0]),
							top:(top + clamped[1])
						};

						// ensure canvas id
						_super.jsPlumb.getId(canvas);
						_super.jsPlumb.animate(canvas, args);						
	
						self.fire(_e.pan);
						_dispatch(_e.pan, { args:argsToDispatch, animate:true });
					}
					else {
						self._canvasElement.left = desiredLeft + clamped[0];
						self._canvasElement.top = desiredTop + clamped[1];

						canvasElement.style.left = self._canvasElement.left + _c.px;
						canvasElement.style.top = self._canvasElement.top + _c.px;

						self.fire(_e.pan);
						_dispatch(_e.pan, { left:desiredLeft + clamped[0], top:desiredTop + clamped[1], animate:false });
					}
				}
			},
			_curryPan = function(left, top, noAnimation) {
				return function() {
					_pan(left, top, noAnimation);
				};
			},
			_moveBy = function(x, y) {
				if (pannable) {
					var desiredLeft = _canvasWhenMouseDown.left + x,
						desiredTop = _canvasWhenMouseDown.top + y,
						clamped = _clamp(desiredLeft, desiredTop, zoomHelper.curZoom);	

					self._canvasElement.left = desiredLeft + clamped[0];
					self._canvasElement.top = desiredTop + clamped[1];

					canvasElement.style.left = self._canvasElement.left + _c.px;
					canvasElement.style.top = self._canvasElement.top + _c.px;

					self.fire(_e.pan);
					_dispatch(_e.pan, { left:desiredLeft + clamped[0], top:desiredTop + clamped[1], animate:false });
				}
			},
			_zoomBy = function(dx, dy, zoomLocation) {
				if (dy < (-maximumZoomTravel)) dy = (-maximumZoomTravel);
				if (dy > maximumZoomTravel) dy = maximumZoomTravel;
				_zoomWithMappedRange(_zoomAtMouseDown, dy, (-maximumZoomTravel), maximumZoomTravel, zoomLocation);				
			},
			panLeftAnim			= _curryPan(-panDistance, 0),					
			panRightAnim		= _curryPan(panDistance, 0),
			panUpAnim			= _curryPan(0, -panDistance),
			panDownAnim			= _curryPan(0, panDistance),
			panUpLeftAnim		= _curryPan(-panDistance, -panDistance),					
			panUpRightAnim		= _curryPan(panDistance, -panDistance),
			panDownLeftAnim		= _curryPan(-panDistance, panDistance),
			panDownRightAnim	= _curryPan(panDistance, panDistance),

			panLeftDirect		= _curryPan(-autoPanIncrement, 0, true),					
			panRightDirect		= _curryPan(autoPanIncrement, 0, true),
			panUpDirect			= _curryPan(0, -autoPanIncrement, true),
			panDownDirect		= _curryPan(0, autoPanIncrement, true),
			panUpLeftDirect		= _curryPan(-autoPanIncrement, -autoPanIncrement, true),					
			panUpRightDirect	= _curryPan(autoPanIncrement, -autoPanIncrement, true),
			panDownLeftDirect	= _curryPan(-autoPanIncrement, autoPanIncrement, true),
			panDownRightDirect	= _curryPan(autoPanIncrement, autoPanIncrement, true),
			
			getPan = function() {
				return _pos(canvasElement, zoomHelper.curZoom);
			},

			// these are shared between all mouse modes.
			_mouseDownAt = null,
			_zoomAtMouseDown = null,
			_canvasMouseDown = false,
			_panning = false,
			_zooming = false,
			_canvasWhenMouseDown = null,
			_panButtonsDisabled = false,
			_selectedElements = [],
			_storeCanvasPosition = function() {
				_canvasWhenMouseDown = _pos(canvasElement, zoomHelper.curZoom);
			},
			_dispatch = function(event, data) {
				for (var i = 0; i < miniviews.length; i++) {
					try {
							miniviews[i][event](data);
					}
					catch (e) {
						// jsplumb log!
						console.log("oh dear!", e, event);
					}
				}		
			},
			_registerMiniview = function(m) {
				miniviews.push(m);
				m.init({
					width:_contentWidth,
					height:_contentHeight,
					viewport:container,
					canvas:canvasElement
				});
			},
			_unregisterMiniview = function(m) {
				var i = miniviews.indexOf(m);
				if (i > -1) miniviews.splice(i, 1);
			},
			_setMode = function(modeId) {
				if (_modes[modeId] != null) {
					if (mode != null) mode.cleanup();
					mode = _modes[modeId];		
					self.fire(_e.modeChanged, modeId);
				}
			},
			// helper to get page location from either mouse or touch events.
			_pageLocation = function(e) {
				if (e.pageX)
					return [e.pageX, e.pageY];
				else if (e.page && e.page.x)
					return [ e.page.x, e.page.y ];
				else {
					// this is for iPad. may not fly for Android.
					return [e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY];
				}        	
			},
			_selectNode = function(elInfo) {
				_selectedElements.push(elInfo);
				jpcl.addClass(elInfo.el, classes.SURFACE_SELECTED_ELEMENT);
			},
			_deselectNode = function(elInfo) {
				jpcl.removeClass(elInfo.el, classes.SURFACE_SELECTED_ELEMENT);				
			},			
			_deselectAll = function() {				
				for (var i = 0; i < _selectedElements.length; i++) {
					_deselectNode(_selectedElements[i]);
				}

				_selectedElements = [];

				lassoElement.style.display = _c.none;
				lassoElement.style.width = _c.nopx;
				lassoElement.style.height = _c.nopx;
			},
			_selectAll = function() {
				_selectedElements = [];
				for (var elId in _elements) {
					_selectNode(_elements[elId]);
				}
			},
			_modes = {
				PAN:{
					id:"pan",
					isEnabled:function() { return pannable || zoomable; },
					start:function(e) {
						if (e.which < 3) {
							_panning = true; _zooming = false;
						}
						else {
							_zooming = true; _panning = false;
						}
					},
					step:function(e) {
						var loc = _pageLocation(e),							
							dx = loc[0] - containerElement.scrollLeft - _mouseDownAt[0],
							dy = loc[1] - containerElement.scrollTop - _mouseDownAt[1];
								
						if (_zooming)
							_zoomBy(dx, dy, _mouseDownAt);
						else	
							_moveBy(dx, dy);
					},
					stop:function(e) {
						_panning = false;
						_zooming = false;
					},
					cleanup:function() { },
					click:function(e) { }
				},
				SELECT:{
					id:"select",
					isEnabled:function() { return selectable; },
					start:function(e) {		
						_modes.SELECT.cleanup();			
						lassoElement.style.width = _c.nopx;
						lassoElement.style.height = _c.nopx;												
						lassoElement.style.display = _c.block;
						var co = jpcl.getOffset(canvas);
						_setAbsoluteOffset(lassoElement, _mouseDownAt[0] - co.left, _mouseDownAt[1] - co.top);
					},
					step:function(e) {
						
						var loc = _pageLocation(e),
							pos = [ loc[0] - containerElement.scrollLeft, loc[1] - containerElement.scrollTop ],
							w = Math.abs(pos[0] - _mouseDownAt[0]),
							h = Math.abs(pos[1] - _mouseDownAt[1]),
							x = Math.min(_mouseDownAt[0], pos[0]),
							y = Math.min(_mouseDownAt[1], pos[1]),
							co = jpcl.getOffset(canvas);
							
						_setAbsoluteOffset(lassoElement, x - co.left, y - co.top);
						lassoElement.style.width = w + _c.px;
						lassoElement.style.height = h + _c.px;

						_selectedElements = [];	
						// now figure out which elements are coincident with the lasso
						for (var elId in _elements) {												
							var _i = jsPlumbUtil.intersects({
								x:x - co.left,
								y:y - co.top,
								w:w,
								h:h
							},{
								x:_elements[elId].loc.left,
								y:_elements[elId].loc.top,
								w:_elements[elId].size[0],
								h:_elements[elId].size[1],
							});

							if (_i)								
								_selectNode(_elements[elId]);															
							else
								_deselectNode(_elements[elId]);
						}
					},
					stop:function(e) {
						// remove the select lasso but leave the nodes selected.
						lassoElement.style.display = _c.none;
						lassoElement.style.width = _c.nopx;
						lassoElement.style.height = _c.nopx;

//						_setMode("PAN");		// revert to PAN.  we could make this a superclass 
				// a single select or multi select mode in the future, meaning we'd remove this call.
				// single select would revert to PAN; multi select would remain in this mode.
				// but remember we'd want to not clear out the selectedElements array in the step
				// function; we'd need to add to the list (if the el was not already there...need a hashset)
					},
					cleanup:function() { },
					click:function(e) {
						_deselectAll();
					}
				}
			},
			mode = _modes.PAN,
			_mouseDownDispatch = function(e) {
				
				//downAt = pageLocation(e);
				//console.log("target is ", e.target, "src is ", e.srcElement);
				
				if (mode != null && mode.isEnabled() && e.target == containerElement || e.target == canvasElement) {					
					_canvasMouseDown = true;
					var loc = _pageLocation(e);
					_mouseDownAt = [ loc[0] - containerElement.scrollLeft, loc[1] - containerElement.scrollTop ];					
					_zoomAtMouseDown = zoomHelper.curZoom;
					_apparentCanvasOriginWhenMouseDown = _getApparentCanvasOrigin();
					
					//console.log("zoom is ", zoomHelper.curZoom, "mousedown at", _mouseDownAt[0], _mouseDownAt[1], "canvas offset is ", _pos(canvasElement, zoomHelper.curZoom).left, _pos(canvasElement, zoomHelper.curZoom).top);
			
					_storeCanvasPosition();					
					mode.start(e);
					
					e.stopPropagation();
					e.preventDefault();
				}	
			},
			EventConsumingDispatcher = function(fn, consumeFilter) {
				return function(e) {
					fn(e);
					if (consumeFilter == null || consumeFilter(e)) {
						e.preventDefault();
						e.stopPropagation();
					}
				};
			},
			_mouseMoveDispatch = function(e) {
				if (mode != null && mode.isEnabled() && _canvasMouseDown) {					
					mode.step(e);
				}	
			},
			_mouseUpDispatch = function(e) {
				if (mode != null && mode.isEnabled() && _canvasMouseDown) {														
					var consume = (currentlyDragging == true);
					currentlyDragging = false;	
					_canvasMouseDown = false;
					_mouseDownAt = null;					
					if (consume) {			
						e.preventDefault();
						return false;
					}
					mode.stop(e);
				}					
			},
			_clickDispatch = function(e) {
				if (mode != null && mode.isEnabled()) {
					mode.click(e);
				}
			
				_canvasMouseDown = false;
			},
			transformOriginX = 0.5,
			transformOriginY = 0.5,
			_transformOriginString = function() { return (transformOriginX * 100) + "% " + (transformOriginY * 100) + "%"; },
			transforms = [ "-moz-transform", "-webkit-transform", "-o-transform", "transform", "-ms-transform" ],
			ieVersion = jsPlumbToolkitUtil.getInternetExplorerVersion(),
			useZoom = ieVersion > 0 && ieVersion < 9,
			zoomHelper = new ZoomHelper(canvasElement),
			_zoom = function(value, pageLocation) {
				
				// useful zoom links
				
				// http://jsfiddle.net/mjaric/9Nqrh/
				// http://bugs.jqueryui.com/ticket/6844
				
				if (zoomable) {											
					
					/*if (pageLocation != null) {
						// set transform origin to cater for where the given x,y falls on the canvas.
						var canvasLoc = _getApparentCanvasOrigin(),
							co = jpcl.getOffset(container),
							canvasSize = jpcl.getSize(canvas),
							dx = pageLocation[0] - co.left,
							dy = pageLocation[1] - co.top;

						console.log("location in canvas is ", dx, dy)
					}*/
					/*
					var tos = _transformOriginString();
					for (var i = 0; i < transforms.length; i++) 
						canvasElement.style[transforms[i] + "-origin"] =  tos;
					*/

					// set the canvas element's zoom.
					zoomHelper.zoom(value);
					_super.jsPlumb.setZoom(value);
					
					var p = _pos(canvasElement, zoomHelper.curZoom);
					
					// now clamp the ui
					var clamped = _clamp(p.left, p.top, zoomHelper.curZoom);
						
					self._canvasElement.left = p.left + clamped[0];
					self._canvasElement.top = p.top + clamped[1];

					canvasElement.style.left = self._canvasElement.left + _c.px;
					canvasElement.style.top = self._canvasElement.top + _c.px;
					
				}
				return zoomHelper.curZoom;
			},
			_zoomDelta = function(increment, x, y) {
				var i = zoomHelper.curZoom + increment;
				if (i > zoomRange[0] && i < zoomRange[1]) 
					_zoom(i, x, y);
			},
			_zoomWithMappedRange = function(startZoom, value, low, high, zoomLocation) {
				var p = value / ((value >= 0) ? high : low),
					idx = value >= 0 ? 1 : 0,
					z = startZoom + (p * (zoomRange[idx] - startZoom));					

				_zoom(z, zoomLocation);		
			},			
			_zoomToFit = function(padding) {
				if (zoomable) {
					padding = padding || 20;
					var min = [ _minBound("left"), _minBound("top") ],
						max = [ _maxBound("left"), _maxBound("top") ],
						w = (max[0][0] - min[0][0]) + padding,
						h = (max[1][0] - min[1][0]) + padding,
						mx = (max[0][0] + min[0][0]) / 4,
						my = (max[1][0] + min[1][0]) / 4,
						containerOffset = jpcl.getOffset(container),
						containerSize = jpcl.getSize(container),
						zx = containerSize[0] / w,
						zy = containerSize[1] / h,
						mz = Math.min(zx, zy),
						z = mz < 1 ? mz : 1;

					// center the canvas
					self._canvasElement.left = mx;
					self._canvasElement.top = my;

					canvasElement.style.left = self._canvasElement.left + _c.px;
					canvasElement.style.top = self._canvasElement.top + _c.px;						

					_zoom(z);

					console.log(min, max, w, h, containerOffset, containerSize);
				}
			};	
        
        /*
            
            Function: centerOn
            Centers the view on the given Node.  

            Parameters:
                node              -  the underlying node data, or the element representing that node.
                doNotAnimate    -   if true, will pan directly without animation. defaults to false.
        */
        self.centerOn = function(node, doNotAnimate) {            
                        
            var info = _super.getObjectInfo(node),
            	_el = jpcl.getElementObject(info.el),
                s = jpcl.getSize(_el),
                canvasOrigin = _getApparentCanvasOrigin(),                
                l = _elements[info.obj.id].loc.left,
                t = _elements[info.obj.id].loc.top,
                containerOffset = jpcl.getOffset(container),
                containerSize = jpcl.getSize(container);
                       
            _pan (((containerSize[0] - s[0]) / 2) - (canvasOrigin[0] + l),((containerSize[1] - s[1]) / 2) - (canvasOrigin[1] + t), doNotAnimate);
        };
        
		/*
            Function: getNodePositions
			Returns a map of [id->[left,top]] values. These values are respective to the 
            top,left corner of the viewport origin, with zoom taken into account.
		*/
		self.getNodePositions = function(relativeToContentOrigin) {			
			var o = {};            
			for (var i in _elements) {
				o[i] = self.getNodePosition(i, relativeToContentOrigin);
			}			                        
			return o;			
		};
		
		/*
			Function: getNodePosition
			Returns [left,top] for the given element. These values are respective to the 
            top,left corner of the viewport origin, with zoom taken into account.
		*/
		self.getNodePosition = function(id, relativeToContentOrigin) {			
            var dx = relativeToContentOrigin ? (-1 * _canvasBounds["leftmin"][0][0]) : 0,
                dy = relativeToContentOrigin ? (-1 * _canvasBounds["topmin"][0][0]) : 0;            
			return [
                _elements[id].loc.left + dx,
                _elements[id].loc.top + dy,
            ];
		};        
        
        /*
            Function: mapEventLocation
            Maps the page location of the given event to a value relative to the viewport origin. 
            This takes into account the offsetX and offsetY values in the event so that what 
            you get back is the mapped position of the target element's [left,top] corner. If
            you wish, you can supply true for 'doNotAdjustForOffset', to suppress that behavior.

            Parameters:
                event - browser event
                doNotAdjustForOffset - optional; defaults to false.
        */        
        self.mapEventLocation = function(event, doNotAdjustForOffset) {
            
            // get apparent offset of canvas, taking zoom into account.
            var apparentOrigin = _getApparentCanvasOrigin(),
            	// possibly adjust event left,top to take size of element into account.
            	dx = doNotAdjustForOffset ? 0 : event.offsetX,
                tlX = event.pageX - dx,
                dy = doNotAdjustForOffset ? 0 : event.offsetY,
                tlY = event.pageY - dy,
                // find position relative to container:
                containerOffset = jpcl.getOffset(container),
                tlcx = tlX - containerOffset.left,
                tlcy = tlY - containerOffset.top;

            // finally, subtract the canvas element's apparent position and adjust for zoom
            return {
                left:parseInt((tlcx - apparentOrigin[0]) / zoomHelper.curZoom),
                top:parseInt((tlcy - apparentOrigin[1]) / zoomHelper.curZoom)
            };
        };
		
		/*
			Function: storePositionsInModel
			Writes the current left/top for each node into the actual model. A common use case is to run an auto layout the first time
			some dataset is seen, and then to save the locations of all the nodes once a human being has moved things around.
			
			Parameters:
			
				leftAttribute	-	name of the attribute to use for the left position. Default is 'left'
				topAttribute	-	name of the attribute to use for the top position. Default is 'top'				
		*/
		self.storePositionsInModel = function(params) {
			params = params || {};
			var la = params.leftAttribute || "left",
				ta = params.topAttribute || "top";
				
			var p = self.getNodePositions();
			for (var i in p) {
				var node = _elements[i].node;
				node.data[la] = p[i][0];
				node.data[ta] = p[i][1];
			}
		};
		
		/*
            
			Function: storePositionInModel
			Writes the current left/top for some node into the actual model. A common use case is to run an auto layout the first time
			some dataset is seen, and then to save the locations of all the nodes once a human being has moved things around.
			
			Parameters:			
				id				-	node id
				leftAttribute	-	name of the attribute to use for the left position. Default is 'left'
				topAttribute	-	name of the attribute to use for the top position. Default is 'top'				
				
			Returns:
				the current position as [left, top].
		*/
		self.storePositionInModel = function(params) {
			var la = params.leftAttribute || "left",
				ta = params.topAttribute || "top",
				np = self.getNodePosition(params.id);
				
			_elements[id].node.data[la] = np[0];
			_elements[id].node.data[ta] = np[1];	
			return np;
		};
			
		// override self.setOffset
		self.setOffset = function(el, o) {
			var de = jpcl.getDOMElement(el);
            de.style.left = o.left + "px";
            de.style.top = o.top + "px";
			_recalculateBounds(el, de);
		};
		
		/*
			Function: setPageOffset
			Sets the offset of this element, relative to the page origin, not the renderer origin. So the
			renderer has to translate the offset by a certain amount (the location of its container).
		*/
		self.setPageOffset = function(el, o) {
			var co = jpcl.getOffset(container),
				dl = o.left - co.left,
				dt = o.top - co.top;
			
			self.setOffset(el, {
				left:dl / zoomHelper.curZoom,
				top:dt / zoomHelper.curZoom
			});
		};
		
		/*
			Function: makeDropTarget
			Configures the renderer's workspace as a drop target. This is used by the NodePalette widget, each
			instance of which calls this function with its own unique scope. You can use this method to attach
			your own drop listeners to the workspace if you need to; it is just a pass-through to the underlying
			drop initialize method from the supporting library.

            Parameters:

                dropOptions - any valid drop options from the underlying library.
		*/
		self.makeDropTarget = function(dropOptions) {
			jpcl.initDroppable(container, dropOptions); 
		};

		var _droppablesHandler = function(droppableParams) {
			droppableParams = droppableParams || {};
			var dataGenerator = droppableParams.dataGenerator || function() { return { }; },
				typeExtractor = droppableParams.typeExtractor,
				droppables = droppableParams.droppables,
				dragOptions = droppableParams.dragOptions || {},
				dropOptions = droppableParams.dropOptions || {},				
				scope = "scope_" + (new Date()).getTime(),
				drop = function(e, ui) {
					var dragObject = jpcl.getDragObject(arguments),
						type = typeExtractor(dragObject),
						data = dataGenerator(type),
						eventLocation = self.mapEventLocation(e);
							                
	                data.left = eventLocation.left;
	                data.top = eventLocation.top;
												
					_super.toolkit.getNodeFactory()(type, data, function(n) {
						_super.toolkit.addNode(n);
					});	
				};

			dropOptions.scope = scope;
			dropOptions.drop = jsPlumb.wrap(dropOptions.drop, drop);
			jpcl.initDroppable(container, dropOptions);

			dragOptions.scope = scope;
			dragOptions.helper = "clone";
			dragOptions.doNotRemoveHelper = true;
			for (var i = 0; i < droppables.length; i++) {
				jpcl.initDraggable(jpcl.getElementObject(droppables[i]), dragOptions);
			}
		};

		/*
			Function: registerDroppableNodes
			Allows you to register a list of droppables that can be dropped onto the 
		*/
		self.registerDroppableNodes = function(droppableParams) {
			new _droppablesHandler(droppableParams);
		};
        
        /*
            Function: select
            Selects some set of nodes. 

			TODO

        */
        self.select = function(params) {
            
        };              
        
        var _selectEdges = function(params, edgeSelectFunction) {            
            var p = jsPlumb.extend({}, params);
            p.source = _super.getObjectInfo(params.source).obj;
            p.target = _super.getObjectInfo(params.target).obj;
            p.element = _super.getObjectInfo(params.element).obj;            
            
            var edges = _super.toolkit[edgeSelectFunction](p),
                connections = _super.getConnectionsForEdges(edges);
            
            return _super.jsPlumb.select({connections:connections});
        };
        
        /*
            Function: selectEdges
            Selects a set of edges. If you supply a DOM element for any of the arguments here, the underlying graph object - a Node or a Port - will be
            determined, and the edges for that object will be retrieved.  note that for a Port this method does the same thing as
            selectAllEdges, but for a Node, which may have Ports registered on it, this method will retrieve only the Edges directly
            registered on the Node itself.  You may need to use selectAllEdges if you want everything from some Node.

            Parameters:
            
                source  -   source node, as a Node, a DOM element, a selector, or a String (including support for wildcard '*')
                target  -   target node, as a Node, a DOM element, a selector, or a String (including support for wildcard '*')
                element -   source or target node, as a Node, a DOM element, a selector, or a String (including support for wildcard '*')
        */        
        self.selectEdges = function(params) {
            return _selectEdges(params, "selectEdges");
        };
        
        /*
            Function: selectAllEdges
            Selects a set of Edges.  Parameters are the same as for selectEdges; the difference here is that when you're working with
            Nodes, this method will return all of the Node's Edges as well as those of all the Ports registered on the Node.
        */
        self.selectAllEdges = function(params) {
            return _selectEdges(params, "selectAllEdges");
        };
        
        /*
            Function: repaint
            Repaints the element for the given node, including all connections.
            
            Parameters:

                node:   either a toolkit Node, or a DOM element, or an element id.
        */
        self.repaint = function(node) {
            var nodeEl = _super.getObjectInfo(node).el;
            if (nodeEl) {
                _super.jsPlumb.recalculateOffsets(nodeEl);
                _super.jsPlumb.repaint(_super.jsPlumb.getId(nodeEl));  
                self.fire(_e.objectRepainted, nodeEl);
            }
        };                
		
		/*
			Function: setConsumeRightClick	
			Sets whether or not to consume right click. Default is true.
		*/
		self.setConsumeRightClick = function(c) {
			_consumeRightClick = c;
		};

		jpcl.bind(container, downEvent, _mouseDownDispatch);
		jpcl.bind(container, _e.contextmenu, new EventConsumingDispatcher(_mouseDownDispatch, function() { return _consumeRightClick; }));
		jpcl.bind(document, moveEvent, _mouseMoveDispatch);
		jpcl.bind(container, upEvent, _mouseUpDispatch);
		jpcl.bind(document, upEvent, _mouseUpDispatch);
		//jpcl.bind(document, _e.click, _mouseUpDispatch);
		jpcl.bind(document, _e.click, _clickDispatch);
		jpcl.bind(canvas, upEvent, _mouseUpDispatch);

		jpcl.bind(container, moveEvent, function(e) {
			var et = jpcl.getElementObject(e.target);

			// TODO SVG in SAFARI 5...still necessary?
			if (jpcl.hasClass(et, classes.SURFACE) || jpcl.hasClass(et, classes.SURFACE_CANVAS)) {
				if (e.offsetY < activeMargin)
					showPanButton(container, _c.top);
				else if (e.offsetX < activeMargin)
					showPanButton(container, _c.left);
				else if (e.offsetX > containerSize[0] - activeMargin)
					showPanButton(container, _c.right);
				else if (e.offsetY > containerSize[1] - activeMargin)
					showPanButton(container, _c.bottom);
				else
					hidePanButtons();
			}
		});					

		panDiv(_c.left, container, jpcl, panLeftAnim, panLeftDirect);
		panDiv(_c.right, container, jpcl, panRightAnim, panRightDirect);
		panDiv(_c.top, container, jpcl, panUpAnim, panUpDirect);
		panDiv(_c.bottom, container, jpcl, panDownAnim, panDownDirect);

		// TODO the last thing is to have the pan divs fade in and out when the mouse nears that side of
		// the container
		_super.jsPlumb.bind(container, _e.mouseout, function() {
			// TODO this is JQUERY SPECIFIC
			$(_c.dot + classes.SURFACE_PAN).fadeOut();
		});

		// set the attribute that indicates the surface has been initialised
		jpcl.setAttribute(container, "data-jtk-surface", "true");

// ******************************* save/restore UI state (from either cookies or html5 storage, depending on the browser )

		self.State = {
			/**
			* Function: State.save
			* Writes the current location of each node in the UI to local storage (using either a cookie or html5 storage,
			* depending on browser capabilities). You pass this function a 'handle' argument, which is used to restore the state
			* at some stage in the future.
			*/
			save : function(handle) {
				handle = handle || stateHandle;
				var o = _getAbsoluteOffset(canvasElement),
					s = o.left + " " + o.top + " " + zoomHelper.curZoom + " "; 

				for (var id in _elements) {
					s += (id + " " + _elements[id].loc.left + " " + _elements[id].loc.top + " ");
				}	        	

				jsPlumbToolkit.util.Storage.set("jtk-state-" + handle, s);	            
			},
			/**
			* Function: State.restore
			* Restores the UI state to the state it was in when it was saved with the given handle. If the handle does not
			* exist, nothing happens.
			* TODO: it is possible a future incarnation of this could support animating a UI back to some state.        
			*/
			restore : function(handle) {
				handle = handle || stateHandle;			
				var s = jsPlumbToolkit.util.Storage.get("jtk-state-" + handle);	        	
				if (s) {
					_s = s.split(" ");
					canvasElement.style.left = _s[0] + "px";
					canvasElement.style.top = _s[1] + "px";					
					for (var i = 3; i < _s.length; i+=3) {
						var id = _s[i], d = document.getElementById(id);
						if (_elements[id] && d) {
							if (!_elements[id].loc) _elements[id].loc = {};
							_elements[id].loc.left = _s[i + 1];
							_elements[id].loc.top = _s[i + 2];
							//_elementPositions[id] = _elements[id].loc;
							_setAbsoluteOffset(d, _s[i+1], _s[i+2]);	
						}	
					}
					// set the zoom.
					_zoom(parseFloat(_s[2]));					
				}
			},
			/**
			* Function: State.clear
			* Clears the state that was stored against the given handle.
			*/
			clear : function(handle) {
				handle = handle || stateHandle;			
				jsPlumbToolkit.util.Storage.clear("jtk-state-" + handle);	        			   
			},
			/**
			* Function: State.clearAll
			* Removes all saved UI state information.
			*/
			clearAll : function() {
				jsPlumbToolkit.util.Storage.clearAll();	        			   
			}
		};
		
		/*
			Function: saveState
			Saves the current state of the UI, either to local storage or a cookie, depending on the browser's capabilities.

			Parameters:
				handle	-	the handle to save the state as, If this is not supplied, and stateHandle was supplied
				as a constructor parameter, that is used instead.
		*/
		self.saveState = self.State.save;
		
		/*
			Function: restoreState
			Restores the current state of the UI, either from local storage or a cookie, depending on the browser's capabilities.

			Parameters:
				handle	-	the handle to restore the state from, If this is not supplied, and stateHandle was supplied
				as a constructor parameter, that is used instead.
		*/
		self.restoreState = function(handle) {
			self.State.restore(handle);
			self.getJsPlumb().repaintEverything();
		};
		
		/*
			Function: clearState
			Clears the state stored by the given handle.

			Parameters:
				handle	-	the handle to restore the state from. If this is not supplied, and stateHandle was supplied
				as a constructor parameter, that is used instead.
		*/		
		self.clearState = function(handle) {
			self.state.clear(handle);
		};
		
		// bind unload listener. if user has set saveStateOnExit, then do so!
		jpcl.bind(window, _e.unload, function() {
			if (saveStateOnExit && stateHandle) {
				self.State.save();
			}
		});
		
// ******************************* end of save/restore UI state (from either cookies or html5 storage, depending on the browser )
	
// *************** events ********************************
		if (params.events) {
			for (var i in params.events) {
				self.bind(i, params.events[i]);
			}
		}
// *************** /events ********************************	

// ************* public API

		//return {
			self.getContainer 			= 	function() { return container; };
			self.append 				= 	_append;
			self.remove 				= 	_remove;
			self.isPannable 			= 	function() { return pannable === true; };
			self.setPannable	    	= 	function(p) { pannable = (p === true); };
			self.pan             		= 	_pan;
			self.getPan					=	getPan;
			self.setMode 				=	_setMode;
			self.deselectAll 			=	_deselectAll;
			self.selectAll 				=	_selectAll;
			self.makeDraggable			=	_makeDraggable;
			//self._setPan			    =   _setPan;        // exposed for miniview. saves the current state of the canvas.
			self._moveBy             = 	_moveBy;
			self._storeCanvasPosition = _storeCanvasPosition;
			self._disablePanButtons = function() { _panButtonsDisabled = true; };
			self._enablePanButtons = function() { _panButtonsDisabled = false; };
			self.panLeft				= 	panLeftAnim;
			self.panRight			= 	panRightAnim;
			self.panUp				= 	panUpAnim;
			self.panDown				= 	panDownAnim;
			self.panUpLeft			= 	panUpLeftAnim;
			self.panUpRight			= 	panUpRightAnim;
			self.panDownLeft			= 	panDownLeftAnim;
			self.panDownRight		= 	panDownRightAnim;
			self.registerMiniview 	= 	_registerMiniview;
			self.unregisterMiniview 	= 	_unregisterMiniview;				
			self.setZoom = _zoom;
			self.zoomToFit = _zoomToFit;	
			self.getZoom = function() { return zoomHelper.curZoom; };			
	};

// ------------------- end of Surface -------------------------------
	
	
	
	/*
		Class: NodePalette
		Container for a palette of nodes that can be dragged onto, or selected and then dropped via a click onto,
		a Renderer.
		
		TODO: support sections
		TODO: support a grid-like view instead of a list
	*/
	jsPlumbToolkit.NodePalette = function(params) {
		params = params || {};
		var jpcl = jsPlumb.CurrentLibrary,
			toolkit = params.toolkit,
			container = jpcl.getElementObject(params.container),
			containerElement = jpcl.getDOMElement(container),
			orientation = params.orientation || "vertical",
			defaultRenderer = function(t) { 
				var d = document.createElement("div");
				d.innerHTML = t.name;
				return d;
			},
			renderFunction = params.renderFunction || defaultRenderer,					
			renderer = params.renderer,
			dragScope = jsPlumbToolkitUtil.uuid(),
			ul = document.createElement("ul"),
			data = params.data || [];
			
		// create a ul and append to the container.
		ul.className = classes.NODE_PALETTE;
		containerElement.appendChild(ul);
		
		// drop handler function. we get the node type, then we need to go to the 'node factory' to get a new node. if there
		// is no node factory set, we just create a simple object for the node, with all the properties from the data, and a
		// uuid for its id.
		
		var nodeAdded = function(data) {
	            if (mostRecentNode != null && data.node.data == mostRecentNode) {
	                renderer.setPageOffset(data.el, mostRecentNodeOffset);
	            }
	            mostRecentNode = null;
			},
			mostRecentNode = null,
			mostRecentNodeOffset = null;
        
        renderer.bind(_e.nodeAdded, nodeAdded);
			
		// register as a drop target listener on the renderer.
		renderer.makeDropTarget({
			drop:function(e, ui) { 
				var dragObject = jpcl.getDragObject(arguments),
					idx = jpcl.getAttribute(dragObject, "data-index"),
					type = jpcl.getAttribute(dragObject, "data-type");							
					
                mostRecentNodeOffset = renderer.mapEventLocation(e);
                
                var _data = jsPlumbUtil.clone(data[idx] || {});
                _data.left = mostRecentNodeOffset.left;
                _data.top = mostRecentNodeOffset.top;                
											
				toolkit.getNodeFactory()(type, _data, function(n) {
					mostRecentNode = n;
					toolkit.addNode(n);				// add to toolkit; this will cause to be rendered.
													// we will catch the nodeRendered event and move the node
													// to the position where it was dropped.
				});													
			},
			scope:dragScope				
		});						
		
		var _render = function() {
			ul.innerHTML = "";
			for (var i = 0; i < data.length; i++) {
				var d = renderFunction(data[i]), li = document.createElement("li");
				li.appendChild(d);
				li.className = classes.NODE_PALETTE_ENTRY; // TODO will the user want to provide their own classes too?
				li.setAttribute("data-type", data[i].type);
				li.setAttribute("data-index", i);						
				if (orientation != "vertical") {
					li.style.display = "inline";
				}
				ul.appendChild(li);
				
				// TODO is this helper:clone jQuery specific? yes it probably is.
				jpcl.initDraggable(jpcl.getElementObject(li), { scope:dragScope, helper:"clone", doNotRemoveHelper:true });						
			}				
		};				
		_render();					
	};	


	// register the Surface as the default renderer type for the Toolkit.  If the Toolkit is being used
	// server-side, this script will not have been included and so this won't be set.
	jsPlumbToolkit.DefaultRendererType = "Surface";

})();