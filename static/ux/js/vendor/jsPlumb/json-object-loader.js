;(function() {

	var _iterate = function(o, fn) {
			if (o == null) return;
			if (o.length != null) {
				for (var i = 0; i < o.length; i++) {
					fn(o[i], i);
				}
			}
			else {
				for (var i in o) {
					fn(o[i], i);
				}
			}
		},
		_format = function(o) {
			if (typeof o == "string")
				return o.substring(0, 8);
			else return o;
		},
		_processObject = function(obj, label, id, parentNode, edges, toolkit) {
			var counter = 0,
				aNode = {
					id:id,
					obj:obj,
					label:label,
					text:label,
					clazz:"resource"
				};

			toolkit.addNode(aNode);

			_iterate(obj, function(_obj, lbl) {
				var childId = id + "-" + (counter++);
				if (typeof _obj == "object") {								
					_processObject(_obj, lbl, childId, aNode, edges, toolkit);	
					edges.push({ source:id, target:childId, data:{ label:lbl } });			
				}
				else {
					/* static value (string or number) */
					toolkit.addNode({
						id:childId,
						obj:_obj,
						label:_format(_obj),
						text:_obj,
						clazz:"static"
					});
					edges.push({ source:id, target:childId, data:{ label:lbl } });
				}										
			});	
		};

	jsPlumbToolkitIO.parsers["scorpio4-json"] = function(dataArr, toolkit) {
		var rootId = "design", edges = [];		
		_processObject(dataArr, "Design", rootId, null, edges, toolkit);			
		for (var l = 0; l < edges.length; l++) {				
			toolkit.addEdge(edges[l]);			
		}		
	};
})();