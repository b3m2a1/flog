/// <reference path="../annotatemd.ts" />
/// <reference path="../annotations/simple_transforms.ts" />
var PatternMatch = AnnotateMD.PatternMatch;
var description_pattern = new AnnotateMD.SequencePattern([
    new AnnotateMD.TagPattern(["h1", "h2"]),
    new AnnotateMD.TagPattern(["p"]),
], [[1, 1], [0, 1]], {
    applications: 1,
    transform: function (match) {
        AnnotateMD.Annotations.ClassAdder("docs-title")(match.slice(0, 1));
        AnnotateMD.Annotations.ClassAdder("docs-description")(match.slice(1, 2));
    }
});
var subsection_pattern = new AnnotateMD.SequencePattern([
    new AnnotateMD.TagPattern(["h3"]),
    new AnnotateMD.ExceptPattern(new AnnotateMD.TagPattern(["h1", "h2", "h3", "h4", "h5"])),
], [[1, 1], [0, -1]], {
    transform: AnnotateMD.Annotations.SectionMaker({
        section_class: "docs-section",
        header_class: "docs-section-header",
        body_class: "docs-section-body",
        remove_empty: true
    })
});
var method_pattern = new AnnotateMD.SequencePattern([
    new AnnotateMD.TagPattern(["p"]),
    new AnnotateMD.TagPattern(["div", "pre"]),
    new AnnotateMD.TagPattern(["p"]),
    new AnnotateMD.TagPattern(["ul"]) // the parameters
], [[1, 1], [1, 1], [0, 1], [0, 1]], {
    transform: function (match) {
        var submatch = match.slice(1, 4);
        var anchor_parent = match.nodes[0];
        var anchor_node = anchor_parent.firstElementChild;
        if (anchor_node !== null) {
            var anchor_id = anchor_node.id;
            var head_node = match.nodes[1];
            head_node.id = anchor_id;
            anchor_parent.remove();
        }
        AnnotateMD.Annotations.SectionMaker({
            section_class: "docs-method",
            header_class: "docs-method-header",
            body_class: "docs-method-body",
            collapsed: true
        })(submatch);
    }
});
var example_pattern = new AnnotateMD.PatternTest(new AnnotateMD.TagPattern(["h2", "h3", "h4"]), function (e) { return e.textContent === "Examples"; }, {
    transform: function () { return method_pattern.disable(); },
    apply_immediately: true
});
var annotator = new AnnotateMD.Annotator([
    description_pattern,
    subsection_pattern,
    example_pattern,
    method_pattern
]);
// Apply the annotations to the chosen root element
var root = document.getElementById("main-content");
annotator.apply(root);
