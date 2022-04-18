/**
 * AnnotateMD:
 *   Provides annotations for MarkDown-based websites. Allows patterns like:
 *       <p...>...</p>
 *       <img>...</img>
 *  to be containerized like:
 *       <div class="sample-image>
 *           <p.../>
 *           <img.../>
 *       </div>
 *  or whatever of that nature
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var AnnotateMD;
(function (AnnotateMD) {
    var PatternMatchResponse;
    (function (PatternMatchResponse) {
        PatternMatchResponse[PatternMatchResponse["Matching"] = 0] = "Matching";
        PatternMatchResponse[PatternMatchResponse["NonMatching"] = 1] = "NonMatching";
        PatternMatchResponse[PatternMatchResponse["Incomplete"] = 2] = "Incomplete";
        PatternMatchResponse[PatternMatchResponse["Completed"] = 3] = "Completed";
        PatternMatchResponse[PatternMatchResponse["Break"] = 4] = "Break";
        PatternMatchResponse[PatternMatchResponse["Unapplied"] = 5] = "Unapplied"; // means for one reason or another the pattern chose not to apply itself
    })(PatternMatchResponse || (PatternMatchResponse = {}));
    var PatternMatch = /** @class */ (function () {
        function PatternMatch(parent, nodes) {
            if (nodes === void 0) { nodes = []; }
            this.parent = parent;
            this.nodes = nodes;
            this.complete = false;
        }
        Object.defineProperty(PatternMatch.prototype, "unfinished", {
            get: function () {
                return this.nodes.length > 0 && this.complete == false;
            },
            enumerable: true,
            configurable: true
        });
        PatternMatch.prototype.push = function (node) {
            this.nodes.push(node);
        };
        PatternMatch._fillNodeList = function (match, fill_to, recurse) {
            for (var _i = 0, _a = match.nodes; _i < _a.length; _i++) {
                var node = _a[_i];
                if (node instanceof PatternMatch) {
                    if (recurse) {
                        PatternMatch._fillNodeList(node, fill_to, recurse);
                    }
                }
                else {
                    fill_to.push(node);
                }
            }
        };
        PatternMatch.prototype.getNodeList = function (_a) {
            var _b = _a.recurse, recurse = _b === void 0 ? true : _b;
            var node_list = [];
            PatternMatch._fillNodeList(this, node_list, recurse);
            return node_list;
        };
        PatternMatch.prototype.finalize = function () {
            this.complete = true;
        };
        PatternMatch.prototype.slice = function (start, end) {
            var new_match = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
            new_match.nodes = new_match.nodes.slice(start, end);
            return new_match;
        };
        PatternMatch.prototype.apply = function () {
            this.parent.apply(this);
        };
        return PatternMatch;
    }());
    AnnotateMD.PatternMatch = PatternMatch;
    var $DefaultDepth = 0;
    var $DefaultPriority = 0;
    var $DefaultAbsDepth = -1;
    var $DefaultApplications = -1;
    /**
     * Define a really general Pattern class that we'll use for our incremental DOM matching procedure
     *
     *  I currently don't actually support anything _other_ than open_ended but that'll come some day
     */
    var Pattern = /** @class */ (function () {
        function Pattern(matcher, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? $DefaultPriority : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? true : _f, _g = _b.depth, depth = _g === void 0 ? $DefaultDepth : _g, _h = _b.absolute_depth, absolute_depth = _h === void 0 ? $DefaultAbsDepth : _h, _j = _b.manage_match, manage_match = _j === void 0 ? true : _j, _k = _b.transform, transform = _k === void 0 ? null : _k, _l = _b.apply_immediately, apply_immediately = _l === void 0 ? false : _l, _m = _b.applications, applications = _m === void 0 ? $DefaultApplications : _m, _o = _b.enabled, enabled = _o === void 0 ? true : _o;
            this.matcher = matcher;
            this.priority = priority;
            this.compounds = compounds;
            this.terminal = terminal;
            this.open_ended = open_ended;
            this.depth = depth;
            this.absolute_depth = absolute_depth;
            this.match = manage_match ? new PatternMatch(this) : null;
            this.transform = transform;
            this.applications = applications;
            this._cur_depth = -1;
            this._applied = 0;
            this.enabled = enabled;
            this.apply_immediately = apply_immediately;
        }
        Pattern.prototype.disable = function () {
            this.enabled = false;
        };
        Pattern.prototype.enable = function () {
            this.enabled = true;
        };
        Pattern.prototype.disable_handling = function () {
            this.match = null;
        };
        Pattern.prototype.push = function (node) {
            if (this.match !== null) {
                this.match.push(node);
            }
        };
        Pattern.prototype.matches = function (node, depth) {
            // a few quick short-circuit cases for when that's applicable
            if (!this.enabled) {
                return PatternMatchResponse.Unapplied;
            }
            if (this.absolute_depth >= 0 && this.absolute_depth < depth) {
                return PatternMatchResponse.Unapplied;
            }
            if (this.applications >= 0 && this.applications <= this._applied) {
                return PatternMatchResponse.Unapplied;
            }
            // console.log(["???", depth, this._cur_depth, this.depth]);
            if (this._cur_depth >= 0 && this.depth >= 0 && depth - this._cur_depth > this.depth) {
                return PatternMatchResponse.Unapplied;
            }
            var matched = this.matcher(node, this.match, depth);
            if (matched == PatternMatchResponse.Matching || matched == PatternMatchResponse.Incomplete) {
                if (this._cur_depth === -1) {
                    this._cur_depth = depth;
                }
                if (matched == PatternMatchResponse.Matching) {
                    this._applied += 1;
                }
                this.push(node);
            }
            return matched;
        };
        Pattern.prototype.reset = function () {
            var match = this.match;
            this._cur_depth = -1;
            if (this.match !== null) {
                this.match = new PatternMatch(this);
            }
            return match;
        };
        Pattern.prototype.apply = function (match) {
            if (match === void 0) { match = null; }
            if (this.transform !== null) {
                this.transform((match === null) ? this.match : match);
            }
        };
        return Pattern;
    }());
    AnnotateMD.Pattern = Pattern;
    // Define a set of pattern functions that we can use
    // Set up patterns that operate on a field of an object
    var SimplePattern = /** @class */ (function (_super) {
        __extends(SimplePattern, _super);
        function SimplePattern(field_options, field_name, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? $DefaultPriority : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.depth, depth = _g === void 0 ? $DefaultDepth : _g, _h = _b.absolute_depth, absolute_depth = _h === void 0 ? $DefaultAbsDepth : _h, _j = _b.manage_match, manage_match = _j === void 0 ? true : _j, _k = _b.transform, transform = _k === void 0 ? null : _k, _l = _b.apply_immediately, apply_immediately = _l === void 0 ? false : _l, _m = _b.applications, applications = _m === void 0 ? $DefaultApplications : _m, _o = _b.exact, exact = _o === void 0 ? false : _o, _p = _b.all, all = _p === void 0 ? false : _p;
            var _this = _super.call(this, function (el, match, depth) { return (SimplePattern.match_field(el, _this.field_name, _this.field_options, _this.exact, _this.all, match, depth)); }, {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                depth: depth,
                absolute_depth: absolute_depth,
                manage_match: manage_match,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications
            }) || this;
            _this.field_options = field_options;
            _this.field_name = field_name;
            _this.exact = exact;
            _this.all = all;
            return _this;
        }
        SimplePattern.match_field = function (element, field_name, field_options, exact, all, match, depth) {
            var cname = element[field_name];
            var response = PatternMatchResponse.Matching;
            if (!all) {
                response = PatternMatchResponse.NonMatching;
                for (var _i = 0, field_options_1 = field_options; _i < field_options_1.length; _i++) {
                    var c = field_options_1[_i];
                    if (!exact) {
                        if (cname.indexOf(c) !== -1) {
                            response = PatternMatchResponse.Matching;
                            break;
                        }
                    }
                    else {
                        if (cname === c) {
                            response = PatternMatchResponse.Matching;
                            break;
                        }
                    }
                }
            }
            else {
                for (var _a = 0, field_options_2 = field_options; _a < field_options_2.length; _a++) {
                    var c = field_options_2[_a];
                    if (!exact) {
                        if (cname.indexOf(c) === -1) {
                            response = PatternMatchResponse.NonMatching;
                            break;
                        }
                    }
                    else {
                        if (cname !== c) {
                            response = PatternMatchResponse.NonMatching;
                            break;
                        }
                    }
                }
            }
            return response;
        };
        return SimplePattern;
    }(Pattern));
    AnnotateMD.SimplePattern = SimplePattern;
    var TagPattern = /** @class */ (function (_super) {
        __extends(TagPattern, _super);
        function TagPattern(tags, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? $DefaultPriority : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.depth, depth = _g === void 0 ? $DefaultDepth : _g, _h = _b.absolute_depth, absolute_depth = _h === void 0 ? $DefaultAbsDepth : _h, _j = _b.manage_match, manage_match = _j === void 0 ? true : _j, _k = _b.transform, transform = _k === void 0 ? null : _k, _l = _b.apply_immediately, apply_immediately = _l === void 0 ? false : _l, _m = _b.applications, applications = _m === void 0 ? $DefaultApplications : _m, _o = _b.exact, exact = _o === void 0 ? true : _o, _p = _b.all, all = _p === void 0 ? false : _p;
            return _super.call(this, tags.map(function (t) { return t.toUpperCase(); }), 'tagName', {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                depth: depth,
                absolute_depth: absolute_depth,
                manage_match: manage_match,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications,
                exact: exact,
                all: all
            }) || this;
        }
        return TagPattern;
    }(SimplePattern));
    AnnotateMD.TagPattern = TagPattern;
    var ClassPattern = /** @class */ (function (_super) {
        __extends(ClassPattern, _super);
        function ClassPattern(classes, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? $DefaultPriority : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.depth, depth = _g === void 0 ? $DefaultDepth : _g, _h = _b.absolute_depth, absolute_depth = _h === void 0 ? $DefaultAbsDepth : _h, _j = _b.manage_match, manage_match = _j === void 0 ? true : _j, _k = _b.transform, transform = _k === void 0 ? null : _k, _l = _b.apply_immediately, apply_immediately = _l === void 0 ? false : _l, _m = _b.applications, applications = _m === void 0 ? $DefaultApplications : _m, _o = _b.exact, exact = _o === void 0 ? false : _o, _p = _b.all, all = _p === void 0 ? true : _p;
            return _super.call(this, classes, 'className', {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                depth: depth,
                absolute_depth: absolute_depth,
                manage_match: manage_match,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications,
                exact: exact,
                all: all
            }) || this;
        }
        return ClassPattern;
    }(SimplePattern));
    AnnotateMD.ClassPattern = ClassPattern;
    /**
     * A SequencePattern provides support for matching a sequence of objects
     *
     */
    var SequencePattern = /** @class */ (function (_super) {
        __extends(SequencePattern, _super);
        function SequencePattern(patterns, repeats, _a) {
            if (repeats === void 0) { repeats = null; }
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? 1 : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.depth, depth = _g === void 0 ? $DefaultDepth : _g, _h = _b.absolute_depth, absolute_depth = _h === void 0 ? $DefaultAbsDepth : _h, _j = _b.manage_match, manage_match = _j === void 0 ? true : _j, _k = _b.transform, transform = _k === void 0 ? null : _k, _l = _b.apply_immediately, apply_immediately = _l === void 0 ? false : _l, _m = _b.applications, applications = _m === void 0 ? $DefaultApplications : _m;
            var _this = _super.call(this, function (el, match, depth) { return _this.match_seq(el, match, depth); }, {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                depth: depth,
                absolute_depth: absolute_depth,
                manage_match: manage_match,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications
            }) || this;
            _this.patterns = patterns;
            for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
                var pat = patterns_1[_i];
                pat.disable_handling();
            }
            _this.repeats = (repeats === null) ? patterns.map(function (el, i) { return [1]; }) : repeats;
            _this.cur = 0;
            _this.cur_counts = 0;
            return _this;
        }
        SequencePattern.prototype.inc_pattern = function () {
            this.cur++;
            this.cur_counts = 0;
        };
        SequencePattern.prototype.reset = function () {
            this.cur = 0;
            this.cur_counts = 0;
            return _super.prototype.reset.call(this);
        };
        SequencePattern.prototype.exhausted = function () {
            return this.cur >= this.patterns.length;
        };
        SequencePattern.prototype.match_seq = function (element, match, depth) {
            // console.log(">>>>");
            // console.log(this.cur);
            var pattern = this.patterns[this.cur];
            var resp = pattern.matches(element, depth);
            // we use these to determine whether a NonMatching means to progress to the next pattern or not
            // and to figure out if it's time to roll over to the next one
            var min_count = this.repeats[this.cur][0];
            var max_count = this.repeats[this.cur][this.repeats[this.cur].length - 1];
            // console.log([max_count, depth]);
            // NonMatching either means the pattern just doesn't match or that we need to check against the next element
            // in the sequence
            if (resp === PatternMatchResponse.NonMatching && this.cur_counts >= min_count) {
                // this means it's time to roll over to the next pattern in the sequence
                this.inc_pattern();
                // now we have to check if the _entire_ thing is exhausted (if it is we have to return Matching so we can reset)
                if (this.exhausted()) {
                    resp = PatternMatchResponse.Completed;
                }
                else {
                    resp = this.match_seq(element, match, depth);
                }
            }
            else if (resp === PatternMatchResponse.Matching || resp === PatternMatchResponse.Completed) {
                // if we haven't matched enough elements we just bump cur_counts up and return an Incomplete
                resp = PatternMatchResponse.Incomplete;
                this.cur_counts++;
                // if we have matched enough, we increment the pattern
                if (max_count > 0 && this.cur_counts >= max_count) {
                    this.inc_pattern();
                }
                // now we have to check if the _entire_ thing is exhausted (if it is we have to return Matching so we can reset)
                if (this.exhausted()) {
                    resp = PatternMatchResponse.Matching;
                }
            }
            // console.log(element.tagName);
            // console.log(resp);
            // console.log("<<<<");
            return resp;
        };
        return SequencePattern;
    }(Pattern));
    AnnotateMD.SequencePattern = SequencePattern;
    /**
     * IgnoredPattern tells the pattern matcher not to continue to recurse down this channel
     */
    var IgnoredPattern = /** @class */ (function (_super) {
        __extends(IgnoredPattern, _super);
        function IgnoredPattern(pattern, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? 1 : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? true : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.depth, depth = _g === void 0 ? $DefaultDepth : _g, _h = _b.absolute_depth, absolute_depth = _h === void 0 ? $DefaultAbsDepth : _h, _j = _b.manage_match, manage_match = _j === void 0 ? true : _j, _k = _b.transform, transform = _k === void 0 ? null : _k, _l = _b.apply_immediately, apply_immediately = _l === void 0 ? false : _l, _m = _b.applications, applications = _m === void 0 ? $DefaultApplications : _m;
            var _this = _super.call(this, function (el, match, depth) { return (IgnoredPattern.match_ignore(el, _this.pattern)); }, {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                depth: depth,
                absolute_depth: absolute_depth,
                manage_match: manage_match,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications
            }) || this;
            _this.pattern = pattern;
            pattern.disable_handling();
            return _this;
        }
        IgnoredPattern.match_ignore = function (el, pattern) {
            var resp = pattern.matches(el);
            switch (resp) {
                case PatternMatchResponse.Incomplete:
                case PatternMatchResponse.Break:
                case PatternMatchResponse.Matching:
                    resp = PatternMatchResponse.Break;
                    break;
            }
            return resp;
        };
        return IgnoredPattern;
    }(Pattern));
    AnnotateMD.IgnoredPattern = IgnoredPattern;
    /**
     * Provides an Intersection over the patterns, only matching if _all_ of them match
     */
    var AllPattern = /** @class */ (function (_super) {
        __extends(AllPattern, _super);
        function AllPattern(patterns, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? 1 : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.depth, depth = _g === void 0 ? $DefaultDepth : _g, _h = _b.absolute_depth, absolute_depth = _h === void 0 ? $DefaultAbsDepth : _h, _j = _b.manage_match, manage_match = _j === void 0 ? true : _j, _k = _b.transform, transform = _k === void 0 ? null : _k, _l = _b.apply_immediately, apply_immediately = _l === void 0 ? false : _l, _m = _b.applications, applications = _m === void 0 ? $DefaultApplications : _m;
            var _this = _super.call(this, function (el, match, depth) { return _this.match_all(el, match, depth); }, {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                depth: depth,
                absolute_depth: absolute_depth,
                manage_match: manage_match,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications
            }) || this;
            _this.patterns = patterns;
            for (var _i = 0, patterns_2 = patterns; _i < patterns_2.length; _i++) {
                var pat = patterns_2[_i];
                pat.disable_handling();
                // _all_ of them must match so there's no reason for any single pattern to hold
                // the match
            }
            return _this;
        }
        AllPattern.prototype.match_all = function (element, match, depth) {
            var resp = PatternMatchResponse.Matching;
            for (var _i = 0, _a = this.patterns; _i < _a.length; _i++) {
                var pat = _a[_i];
                resp = pat.matches(element, depth);
                if (resp !== PatternMatchResponse.Matching) {
                    break;
                }
            }
            return resp;
        };
        return AllPattern;
    }(Pattern));
    AnnotateMD.AllPattern = AllPattern;
    /**
     * Provides a Union over the patterns, matching the first option
     */
    var AnyPattern = /** @class */ (function (_super) {
        __extends(AnyPattern, _super);
        function AnyPattern(patterns, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? 1 : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.transform, transform = _g === void 0 ? null : _g, _h = _b.apply_immediately, apply_immediately = _h === void 0 ? false : _h, _j = _b.applications, applications = _j === void 0 ? $DefaultApplications : _j;
            var _this = _super.call(this, function (el, match, depth) { return _this.match_any(el, match, depth); }, {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                manage_match: false,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications
            }) || this;
            _this.patterns = patterns;
            _this.match = new PatternMatch(_this, _this.patterns.map(function (t) { return t.match; }));
            return _this;
        }
        AnyPattern.prototype.reset = function () {
            var m = this.match;
            for (var _i = 0, _a = this.patterns; _i < _a.length; _i++) {
                var pat = _a[_i];
                pat.reset();
            }
            this.match = new PatternMatch(this, this.patterns.map(function (t) { return t.match; }));
            return m;
        };
        AnyPattern.prototype.match_any = function (element, match, depth) {
            var resp = PatternMatchResponse.Matching;
            for (var _i = 0, _a = this.patterns; _i < _a.length; _i++) {
                var pat = _a[_i];
                resp = pat.matches(element, depth);
                if (resp !== PatternMatchResponse.NonMatching && resp !== PatternMatchResponse.Unapplied) {
                    break;
                }
            }
            return resp;
        };
        return AnyPattern;
    }(Pattern));
    AnnotateMD.AnyPattern = AnyPattern;
    /**
     * Provides a Negation over the patterns
     */
    var ExceptPattern = /** @class */ (function (_super) {
        __extends(ExceptPattern, _super);
        function ExceptPattern(pattern, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? 1 : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.transform, transform = _g === void 0 ? null : _g, _h = _b.apply_immediately, apply_immediately = _h === void 0 ? false : _h, _j = _b.applications, applications = _j === void 0 ? $DefaultApplications : _j;
            var _this = _super.call(this, function (el, match, depth) { return _this.match_execpt(el, _this.musnt_match, _this.must_match, match, depth); }, {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                manage_match: false,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications
            }) || this;
            _this.musnt_match = ((pattern instanceof Pattern) ? pattern : pattern[0]);
            _this.musnt_match.disable_handling();
            _this.must_match = ((pattern instanceof Pattern) ? null : pattern[1]);
            if (_this.must_match instanceof Pattern) {
            }
            return _this;
        }
        ExceptPattern.prototype.match_execpt = function (element, musnt, must, match, depth) {
            var resp = musnt.matches(element, depth);
            if (resp === PatternMatchResponse.Matching || resp === PatternMatchResponse.Completed) {
                resp = PatternMatchResponse.NonMatching;
            }
            else if (resp === PatternMatchResponse.NonMatching) {
                resp = PatternMatchResponse.Matching;
            }
            return resp;
        };
        return ExceptPattern;
    }(Pattern));
    AnnotateMD.ExceptPattern = ExceptPattern;
    var PatternTest = /** @class */ (function (_super) {
        __extends(PatternTest, _super);
        function PatternTest(pattern, test, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.priority, priority = _c === void 0 ? 1 : _c, _d = _b.compounds, compounds = _d === void 0 ? true : _d, _e = _b.terminal, terminal = _e === void 0 ? false : _e, _f = _b.open_ended, open_ended = _f === void 0 ? false : _f, _g = _b.manage_match, manage_match = _g === void 0 ? true : _g, _h = _b.transform, transform = _h === void 0 ? null : _h, _j = _b.apply_immediately, apply_immediately = _j === void 0 ? false : _j, _k = _b.applications, applications = _k === void 0 ? $DefaultApplications : _k;
            var _this = _super.call(this, function (el, match, depth) { return _this.match_test(el, _this.must_match, _this.test, match, depth); }, {
                priority: priority,
                compounds: compounds,
                terminal: terminal,
                open_ended: open_ended,
                manage_match: manage_match,
                transform: transform,
                apply_immediately: apply_immediately,
                applications: applications
            }) || this;
            _this.must_match = ((pattern instanceof Pattern) ? pattern : pattern[1]);
            if (_this.must_match instanceof Pattern) {
                _this.must_match.disable_handling();
            }
            _this.test = test;
            return _this;
        }
        PatternTest.prototype.match_test = function (element, must, test, match, depth) {
            var resp = must.matches(element, depth);
            if (resp === PatternMatchResponse.Matching || resp === PatternMatchResponse.Completed) {
                var subresp = test(element);
                if (!subresp) {
                    resp = PatternMatchResponse.NonMatching;
                }
            }
            return resp;
        };
        return PatternTest;
    }(Pattern));
    AnnotateMD.PatternTest = PatternTest;
    /**
     * Define an Annotator object that we can apply to the entire DOM and which can find and annotate the appropriate
     * Markdown blocks
     *
     */
    var HandleMatchResponse = /** @class */ (function () {
        function HandleMatchResponse(resp, break_flag) {
            this.resp = resp;
            this.break_flag = break_flag;
        }
        return HandleMatchResponse;
    }());
    var Annotator = /** @class */ (function () {
        function Annotator(patterns) {
            this.patterns = patterns;
        }
        Annotator.prototype._handle_match = function (core_response, pat, matches, match) {
            var resp = core_response;
            var break_flag = false;
            switch (resp) {
                case PatternMatchResponse.NonMatching:
                    // continue on to the next pattern, discarding any built-up state
                    pat.reset();
                    matches.delete(match);
                    break;
                case PatternMatchResponse.Incomplete:
                    // do nothing since the following patterns might still be relevant
                    // but make sure to put the match in matches in case we need to discard any
                    // _following_ matches if it turns out it matches in the end
                    matches.add(match);
                    break;
                case PatternMatchResponse.Completed:
                case PatternMatchResponse.Matching:
                    // here we have to check a) if the pattern is compounding (i.e. if multiple can apply)
                    //  --> this should be the default case unless there's some compelling reason why it can't
                    //  work like that
                    // then we should apply it
                    if (pat.apply_immediately) {
                        console.log(["....?", match]);
                        match.apply();
                    }
                    else {
                        matches.add(match);
                    }
                    if (!pat.compounds) {
                        // gotta drop all following state, kill any following matches, etc.
                        var match_list = Array.from(matches.values());
                        var match_ind = match_list.indexOf(match);
                        for (var kill = match_ind + 1; kill < match_list.length; kill++) {
                            var kill_match = match_list[kill];
                            kill_match.parent.reset();
                            matches.delete(kill_match);
                        }
                        break_flag = true;
                    }
                    if (pat.terminal) {
                        resp = PatternMatchResponse.Break;
                        break_flag = true;
                    }
                    pat.reset();
                    break;
                case PatternMatchResponse.Break:
                    break_flag = true;
                    break;
            }
            return new HandleMatchResponse(resp, break_flag);
        };
        Annotator.prototype._match_node = function (node, matches, depth) {
            var resp = PatternMatchResponse.Matching;
            var break_flag = false;
            for (var j = 0; j < this.patterns.length; j++) {
                // we iterate like this so as to be able to discard any matches following the current one
                // if it turns out we have a non-compounding pattern
                var pat = this.patterns[j];
                resp = pat.matches(node, depth);
                var handle_resp = this._handle_match(resp, pat, matches, pat.match);
                break_flag = handle_resp.break_flag;
                if (handle_resp.resp === PatternMatchResponse.Completed) {
                    // this means we actually need to apply this pattern to the node again :|
                    // this is because we basically did a look-ahead, found that our pattern doesn't match
                    // so we handled the match that we'd been building up, but now we need to go back and see if this
                    // new thing matches
                    resp = pat.matches(node, depth);
                    handle_resp = this._handle_match(resp, pat, matches, pat.match);
                    break_flag = break_flag || handle_resp.break_flag; // need to update this now...
                }
                if (break_flag) {
                    break;
                }
            }
            return resp;
        };
        Annotator.prototype._apply_rec = function (root, matches, max_depth, cur_depth) {
            var nodes = root.children;
            var node_count = nodes.length;
            if (max_depth <= 0 || cur_depth <= max_depth) {
                for (var i = 0; i < node_count; i++) {
                    var node = nodes[i];
                    var resp = this._match_node(node, matches, cur_depth);
                    if (resp !== PatternMatchResponse.Break) {
                        this._apply_rec(node, matches, max_depth, cur_depth + 1);
                    }
                }
            }
        };
        Annotator.prototype.apply = function (root, max_depth) {
            // we gotta walk the DOM, trying out different patterns and building our set of matches to work with
            // the basic algorithm will be to try out all of our different patterns one-by-one
            if (max_depth === void 0) { max_depth = -1; }
            // We're gonna do this in a DFS type way, but given that we don't expect much-to-any nesting of our
            // node structure since it's coming from Markdown there's nothing really to worry about
            var matches = new Set();
            this._apply_rec(root, matches, max_depth, 0); // this populates 'matches'
            // now we go through and apply all of them
            var match_iter = matches.values();
            var match = match_iter.next();
            while (!match.done) {
                match.value.apply();
                match = match_iter.next();
            }
        };
        return Annotator;
    }());
    AnnotateMD.Annotator = Annotator;
})(AnnotateMD || (AnnotateMD = {}));
