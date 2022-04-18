/// <reference path="../annotatemd.ts" />
var AnnotateMD;
(function (AnnotateMD) {
    var Annotations;
    (function (Annotations) {
        // We'll define a bunch of annotations helpers that will make it possible to do _common_ types of annotations
        // on our system
        function ClassAdder(addClass) {
            function add_classes(match) {
                match.nodes.forEach(function (m) { return add_class(m); });
            }
            function add_class(match) {
                if (match instanceof AnnotateMD.PatternMatch) {
                    add_classes(match);
                }
                else if (match instanceof Element) {
                    match.classList.add(addClass);
                }
                else if (match.nodeType === Node.ELEMENT_NODE) {
                    add_class(match);
                }
            }
            return add_classes;
        }
        Annotations.ClassAdder = ClassAdder;
        function IDSetter(addID) {
            function add_ids(match) {
                match.nodes.forEach(function (m) { return add_id(m); });
            }
            function add_id(match) {
                if (match instanceof AnnotateMD.PatternMatch) {
                    add_ids(match);
                }
                else if (match instanceof Element) {
                    match.id = addID;
                }
                else if (match.nodeType === Node.ELEMENT_NODE) {
                    add_id(match);
                }
            }
            return add_id;
        }
        Annotations.IDSetter = IDSetter;
        function SectionMaker(_a) {
            // set up something that will make a Section out of the data,
            // setting it up to be collapsible (if specified) or collapsed (if specified)
            var _b = _a === void 0 ? {} : _a, _c = _b.section_class, section_class = _c === void 0 ? null : _c, _d = _b.header_class, header_class = _d === void 0 ? null : _d, _e = _b.body_class, body_class = _e === void 0 ? null : _e, _f = _b.collapsible, collapsible = _f === void 0 ? true : _f, _g = _b.collapsed, collapsed = _g === void 0 ? false : _g, _h = _b.header_elements, header_elements = _h === void 0 ? 1 : _h, _j = _b.remove_empty, remove_empty = _j === void 0 ? false : _j;
            function make_groups(match) {
                var nodes = match.getNodeList({ recurse: false });
                if (remove_empty && nodes.length == 1) {
                    var first_node = nodes[0];
                    first_node.parentNode.removeChild(first_node);
                }
                else {
                    var first_node = nodes[0];
                    var parent_1 = first_node.parentNode;
                    var section_node_1 = document.createElement("div");
                    if (typeof section_class === "string") {
                        section_node_1.classList.add(section_class);
                    }
                    else if (section_class !== null) {
                        section_class.forEach(function (c) { return section_node_1.classList.add(c); });
                    }
                    var head_node_1 = document.createElement("div");
                    if (typeof header_class === "string") {
                        head_node_1.classList.add(header_class);
                    }
                    else if (header_class !== null) {
                        header_class.forEach(function (c) { return head_node_1.classList.add(c); });
                    }
                    var body_node_1 = document.createElement("div");
                    if (typeof body_class === "string") {
                        body_node_1.classList.add(body_class);
                    }
                    else if (body_class !== null) {
                        body_class.forEach(function (c) { return body_node_1.classList.add(c); });
                    }
                    section_node_1.appendChild(head_node_1);
                    if (collapsible) {
                        var id = Math.random().toString(36).substring(2, 15);
                        var header_collapse = {
                            "data-toggle": "collapse",
                            "data-target": "#collapsible-" + id,
                            "aria-expanded": (collapsed) ? "false" : "true",
                            "aria-controls": "collapseExample"
                        };
                        for (var k in header_collapse) {
                            head_node_1.setAttribute(k, header_collapse[k]);
                        }
                        var collapse_node = document.createElement("div");
                        collapse_node.classList.add("collapse");
                        if (!collapsed) {
                            collapse_node.classList.add("show");
                        }
                        collapse_node.setAttribute("id", "collapsible-" + id);
                        collapse_node.appendChild(body_node_1);
                        section_node_1.appendChild(collapse_node);
                    }
                    else {
                        section_node_1.appendChild(body_node_1);
                    }
                    // we can do any of the collapse behavior now if we want...
                    parent_1.replaceChild(section_node_1, first_node);
                    head_node_1.appendChild(first_node);
                    for (var i = 1; i < header_elements; i++) {
                        var n = nodes[i];
                        head_node_1.appendChild(n);
                        // parent.removeChild(n);
                    }
                    for (var i = header_elements; i < nodes.length; i++) {
                        var n = nodes[i];
                        body_node_1.appendChild(n);
                        // parent.removeChild(n);
                    }
                }
            }
            return make_groups;
        }
        Annotations.SectionMaker = SectionMaker;
    })(Annotations = AnnotateMD.Annotations || (AnnotateMD.Annotations = {}));
})(AnnotateMD || (AnnotateMD = {}));
