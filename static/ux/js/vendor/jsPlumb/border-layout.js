/*
 	
 	Border layout.

 */
;(function() {

	jsPlumbLayout.Layouts["Border"] = function(params) {
		var self = this,
			_super = jsPlumbLayout.AbstractLayout.apply(this, arguments),
			padding, border;

		self.defaultParameters = {
			padding:20,
			border:20,
			getCardinality:function(node) {
				return node.data.type;
			}
		};

		var CENTER = "center", 
			makeFaces = function() {
				return {
					"north":{ dx:1, dy:0, nodes:[], x:0, y:0, cx:0, cy:0 },
					"south":{ dx:1, dy:0, nodes:[], x:0, y:1, cx:0, cy:0 },
					"east":{ dx:0, dy:1, nodes:[], x:1, y:0, cx:0, cy:0 },
					"west":{ dx:0, dy:1, nodes:[], x:0, y:0, cx:0, cy:0 }
				};
			},
			faces = makeFaces(),
			_reset = function() {
				faces = makeFaces();
			},
			_append = function(node, padding) {
				var s = _super.getSize(node.id), cardinality = params.parameters.getCardinality(node);
				if (cardinality) {
					faces[cardinality].nodes.push({
						node:node,
						s:s,
						x:faces[cardinality].cx,
						y:faces[cardinality].cy
					});
					faces[cardinality].cx += faces[cardinality].dx * (s[0] + padding);
					faces[cardinality].cy += faces[cardinality].dy * (s[1] + padding);
//					console.log("Cardinality:", cardinality, faces[cardinality], node.data.obj.label, node.data.obj["this"])
				}
				else {
//					console.log("No Cardinality:", node, node.data, node.data.obj.label, node.data.obj["this"])
				}
			};

		self.reset = _reset;

		self.step = function(graph, toolkit, parameters) {
			// put the Center type node in the middle (centered in x and y)
			// put the north ones on top
			// put the east ones on the right
			// are you sensing a pattern.			
			_reset();

			getCardinality = parameters.getCardinality;

			var c = graph.getVertexCount();
			// position center and line up the other nodes, the ones on the faces
			for (var i = 0; i < c; i++) {
				var n = toolkit.getNodeAt(i);
				if (n.id == CENTER) {
					var s = _super.getSize(n.id),
						x = ((_super.width - (2 * parameters.padding)) - s[0]) / 2,
						y = ((_super.height - (2 * parameters.padding)) - s[1]) / 2;
/*
					console.log("padding", parameters.padding);
					console.log("dimensions", _super.width, _super.height, _super.width / 2, _super.height / 2)
					console.log("center node size", s[0], s[1]);
					console.log("positioning at", x, y)
*/
					_super.setPosition(n.id, x, y);
				}
				else {
					_append(n, parameters.padding);
				}
			}

			// shuffle along so the faces are centered.
			for (var i in faces) {
				if (faces[i].nodes.length > 0) {
					var fn = faces[i].nodes[faces[i].nodes.length - 1], 
						tx = fn.x + fn.s[0], 
						ty = fn.y + fn.s[1],
						sx = (faces[i].dx * ((_super.width - (2 * parameters.padding)) - tx) / 2),
						sy = faces[i].dy * ((_super.height - (2 * parameters.padding)) - ty) / 2;

//					console.log(i, sx,sy,tx,ty, faces[i].x, faces[i].y)

					for (var j = 0; j < faces[i].nodes.length; j++) {
						var x = faces[i].x == 1 ? _super.width - parameters.padding - faces[i].nodes[j].s[0] : sx + faces[i].nodes[j].x,
							y = faces[i].y == 1 ? _super.height - parameters.padding - faces[i].nodes[j].s[1] : sy + faces[i].nodes[j].y

						_super.setPosition(faces[i].nodes[j].node.id, x, y);
					}
				}
			}

			// finished.
			_super.setDone(true);

		};
	}

})();