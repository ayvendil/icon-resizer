figma.showUI(__html__, { width: 320, height: 560, title: "Icon Rescissor" });

// ── Defaults ───────────────────────────────────────────────
const DEFAULTS = [
  { label: "Micro",   size: 12, stroke: 1.0 },
  { label: "Small",   size: 16, stroke: 1.5 },
  { label: "Base",    size: 20, stroke: 1.8 },
  { label: "Medium",  size: 24, stroke: 2.0 },
  { label: "Compact", size: 28, stroke: 2.4 },
  { label: "Large",   size: 32, stroke: 2.8 },
  { label: "XL",      size: 40, stroke: 3.0 },
  { label: "XXL",     size: 48, stroke: 4.5 },
  { label: "Max",     size: 56, stroke: 5.2 },
];

const DEFAULT_PATTERN = "{size}/{name}";
const GAP     = 16;
const ROW_GAP = 24;
const PADDING = 16;

// ── Init ───────────────────────────────────────────────────
async function init() {
  var saved        = await figma.clientStorage.getAsync("presets");
  var savedPattern = await figma.clientStorage.getAsync("renamePattern");
  figma.ui.postMessage({
    type:    "init",
    presets: saved || DEFAULTS,
    pattern: savedPattern || DEFAULT_PATTERN,
  });
  sendSelection();
}
init();

// ── Selection ──────────────────────────────────────────────
var skipNextSelection = false;

figma.on("selectionchange", function() {
  if (skipNextSelection) { skipNextSelection = false; return; }
  sendSelection();
});

function sendSelection() {
  var all        = figma.currentPage.selection;
  var nodes      = all.filter(function(n) { return n.type !== "SECTION"; });
  var hasSection = all.some(function(n)   { return n.type === "SECTION"; });
  var allComponents = nodes.length > 0 && nodes.every(function(n) {
    return n.type === "COMPONENT" || n.type === "COMPONENT_SET" || n.type === "INSTANCE";
  });
  var nodesData = getNodesData(nodes);

  if (nodes.length === 1) {
    figma.ui.postMessage({
      type:          "selection",
      width:         Math.round(nodes[0].width),
      height:        Math.round(nodes[0].height),
      srcStroke:     getSourceStroke(nodes[0]),
      nodes:         nodesData,
      count:         1,
      duplicates:    false,
      hasSection:    hasSection,
      allComponents: allComponents,
    });
  } else if (nodes.length > 1) {
    var names  = nodes.map(function(n) { return n.name.split("/").pop().trim(); });
    var unique = new Set(names).size;
    figma.ui.postMessage({
      type:          "selection",
      width:         null,
      height:        null,
      nodes:         nodesData,
      count:         nodesData.length,
      unique:        unique,
      duplicates:    unique < nodes.length,
      hasSection:    hasSection,
      allComponents: allComponents,
    });
  } else {
    figma.ui.postMessage({
      type: "selection", width: null, height: null,
      nodes: [], count: 0, duplicates: false, hasSection: false, allComponents: false,
    });
  }
}

// ── Message handler ────────────────────────────────────────
figma.ui.onmessage = async function(msg) {

  if (msg.type === "save-presets") {
    await figma.clientStorage.setAsync("presets", msg.presets);
    if (msg.pattern !== undefined) await figma.clientStorage.setAsync("renamePattern", msg.pattern);
    figma.ui.postMessage({ type: "presets-saved" });
  }

  if (msg.type === "reset-presets") {
    await figma.clientStorage.deleteAsync("presets");
    await figma.clientStorage.deleteAsync("renamePattern");
    figma.ui.postMessage({ type: "init", presets: DEFAULTS, pattern: DEFAULT_PATTERN });
  }

  if (msg.type === "apply") {
    var nodes = figma.currentPage.selection;
    if (!nodes.length) { return postError("Select at least one icon"); }

    if (msg.justResize) {
      for (var i = 0; i < nodes.length; i++) {
        var sz = getTargetSize(nodes[i], msg.size, msg.proportional);
        applyToNodeSized(nodes[i], sz.w, sz.h, msg.stroke);
      }
      sendSelection();
      figma.ui.postMessage({ type: "success", text: "✓ Resized " + nodes.length + " icon(s) to " + msg.size + "px" });
    } else {
      var created = [];
      var snapshots = nodes.map(function(n) {
        return { node: n, absX: n.absoluteTransform[0][2], absY: n.absoluteTransform[1][2], w: n.width };
      });
      for (var i = 0; i < snapshots.length; i++) {
        var s     = snapshots[i];
        var clone = s.node.clone();
        figma.currentPage.appendChild(clone);
        clone.x = s.absX + s.w + GAP;
        clone.y = s.absY;
        var sz = getTargetSize(s.node, msg.size, msg.proportional);
        applyToNodeSized(clone, sz.w, sz.h, msg.stroke);
        created.push(clone);
      }
      figma.currentPage.selection = created;
      figma.viewport.scrollAndZoomIntoView(created);
      figma.ui.postMessage({ type: "success", text: "✓ Created " + created.length + " icon(s) at " + msg.size + "px" });
    }
  }

  if (msg.type === "refresh-selection") { sendSelection(); }

  if (msg.type === "make-component") {
    var nodes = figma.currentPage.selection.filter(function(n) { return n.type !== "SECTION"; });
    if (!nodes.length) { return postError("Select icons first"); }

    var created = [];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") { created.push(node); continue; }
      var target = node.type === "INSTANCE" ? node.detachInstance() : node;
      var comp   = figma.createComponent();
      comp.resize(target.width, target.height);
      comp.name = target.name;
      comp.x    = target.x;
      comp.y    = target.y;
      var par   = target.parent;
      if (par && par.type !== "PAGE") par.appendChild(comp);
      if ("children" in target) {
        var ch = [...target.children];
        for (var j = 0; j < ch.length; j++) comp.appendChild(ch[j]);
      }
      target.remove();
      created.push(comp);
    }
    skipNextSelection = true;
    figma.currentPage.selection = created;
    figma.ui.postMessage({
      type: "selection",
      width: Math.round(created[0].width), height: Math.round(created[0].height),
      count: created.length, duplicates: false, hasSection: false,
      allComponents: true, madeComponent: true,
    });
  }

  if (msg.type === "generate-all") {
    var nodes = figma.currentPage.selection.filter(function(n) { return n.type !== "SECTION"; });
    if (!nodes.length) { return postError("Select source icon(s) first"); }

    var presets         = msg.presets;
    var useComponentSet = msg.outputMode === "componentset";
    var strokeMode      = msg.strokeMode      || "preset";
    var scaleBaseSize   = msg.scaleBaseSize   || null;
    var scaleBaseStroke = msg.scaleBaseStroke || null;
    var created = [];

    var startX = -Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var val = nodes[i].absoluteTransform[0][2] + nodes[i].width;
      if (val > startX) startX = val;
    }
    startX += GAP * 2;

    var offsetY = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var val = nodes[i].absoluteTransform[1][2];
      if (val < offsetY) offsetY = val;
    }

    for (var s = 0; s < nodes.length; s++) {
      var source          = nodes[s];
      var srcStroke       = getSourceStroke(source);
      var srcSize         = source.width;
      var effectiveBase   = strokeMode === "scale" && scaleBaseSize   ? scaleBaseSize   : srcSize;
      var effectiveStroke = strokeMode === "scale" && scaleBaseStroke ? scaleBaseStroke : srcStroke;

      if (useComponentSet) {
        var components = [];
        var buildX     = startX;
        for (var p = 0; p < presets.length; p++) {
          var preset = presets[p];
          var clone  = source.clone();
          figma.currentPage.appendChild(clone);
          clone.x = buildX;
          clone.y = offsetY;
          var stroke = resolveStroke(strokeMode, preset.stroke, effectiveStroke, effectiveBase, preset.size);
          applyToNode(clone, preset.size, stroke);
          buildX += preset.size + GAP;

          var comp;
          if (clone.type === "COMPONENT") {
            comp = clone;
          } else {
            var target = clone.type === "INSTANCE" ? clone.detachInstance() : clone;
            comp = figma.createComponent();
            comp.x = target.x; comp.y = target.y;
            comp.resize(target.width, target.height);
            comp.name = target.name;
            if ("children" in target) {
              var ch = [...target.children];
              for (var j = 0; j < ch.length; j++) comp.appendChild(ch[j]);
            }
            target.remove();
          }
          comp.name = "Size=" + preset.size;
          components.push(comp);
        }
        var set = figma.combineAsVariants(components, figma.currentPage);
        set.name = source.name;
        set.x    = startX;
        set.y    = offsetY;
        offsetY += set.height + ROW_GAP;
        created.push(set);

      } else {
        var frame = figma.createFrame();
        frame.name                  = source.name + " — sizes";
        frame.layoutMode            = "HORIZONTAL";
        frame.primaryAxisSizingMode = "AUTO";
        frame.counterAxisSizingMode = "AUTO";
        frame.paddingLeft = frame.paddingRight = frame.paddingTop = frame.paddingBottom = PADDING;
        frame.itemSpacing           = GAP;
        frame.counterAxisAlignItems = "CENTER";
        frame.fills                 = [{ type: "SOLID", color: { r: 0.11, g: 0.11, b: 0.11 } }];
        frame.cornerRadius          = 8;
        figma.currentPage.appendChild(frame);

        for (var p = 0; p < presets.length; p++) {
          var preset = presets[p];
          var clone  = source.clone();
          frame.appendChild(clone);
          var stroke = resolveStroke(strokeMode, preset.stroke, effectiveStroke, effectiveBase, preset.size);
          applyToNode(clone, preset.size, stroke);
        }
        frame.x  = startX;
        frame.y  = offsetY;
        offsetY += frame.height + ROW_GAP;
        created.push(frame);
      }
    }

    try { figma.currentPage.selection = created; } catch(e) {}
    figma.viewport.scrollAndZoomIntoView(created);
    var label = useComponentSet ? "component set" : "frame";
    figma.ui.postMessage({
      type: "success",
      text: "✓ Created " + created.length + " " + label + (created.length > 1 ? "s" : "") + " (" + presets.length + " sizes each)",
    });
  }

  if (msg.type === "add-prefix") {
    var selection = figma.currentPage.selection;
    if (!selection.length) { return postError("Select icons first"); }
    var targets = flattenSections(selection);
    var presets = msg.presets;
    var pattern = msg.pattern || DEFAULT_PATTERN;
    var count   = 0;
    for (var i = 0; i < targets.length; i++) {
      var node     = targets[i];
      var w        = Math.round(node.width);
      var preset   = null;
      for (var j = 0; j < presets.length; j++) { if (presets[j].size === w) { preset = presets[j]; break; } }
      var baseName = extractBaseName(node.name, presets);
      node.name    = applyPattern(pattern, baseName, w, preset ? preset.label : "");
      count++;
    }
    figma.ui.postMessage({ type: "success", text: "✓ Renamed " + count + " icons" });
  }

  if (msg.type === "detach-and-make-components") {
    var selection = figma.currentPage.selection;
    if (!selection.length) { return postError("Select icons first"); }
    var targets = flattenSections(selection);
    var created = [];
    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      if (target.type === "INSTANCE") target = target.detachInstance();
      var par  = target.parent;
      var x    = target.x, y = target.y;
      var comp = figma.createComponent();
      comp.resize(target.width, target.height);
      comp.name = target.name;
      if ("children" in target) {
        var ch = [...target.children];
        for (var j = 0; j < ch.length; j++) comp.appendChild(ch[j]);
      }
      if (par && par.type !== "PAGE") par.appendChild(comp);
      comp.x = x; comp.y = y;
      target.remove();
      created.push(comp);
    }
    try { figma.currentPage.selection = created; } catch(e) {}
    figma.ui.postMessage({ type: "success", text: "✓ " + created.length + " components created" });
  }

  if (msg.type === "resize") figma.ui.resize(msg.width, msg.height);
  if (msg.type === "close")  figma.closePlugin();
};

// ── Utilities ──────────────────────────────────────────────
function postError(text) {
  figma.ui.postMessage({ type: "error", text: text });
}

function flattenSections(nodes) {
  var result = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.type === "SECTION" && "children" in node) {
      for (var j = 0; j < node.children.length; j++) result.push(node.children[j]);
    } else {
      result.push(node);
    }
  }
  return result;
}

function flattenForExport(nodes) {
  var result = [];
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if ((n.type === "FRAME" || n.type === "GROUP" || n.type === "SECTION") && "children" in n) {
      var inner = flattenForExport(n.children);
      for (var j = 0; j < inner.length; j++) result.push(inner[j]);
    } else {
      result.push(n);
    }
  }
  return result;
}

function getNodesData(nodes) {
  return flattenForExport(nodes).map(function(n) {
    var props = null;
    try {
      if (n.type === "COMPONENT" || n.type === "INSTANCE") {
        var vp = n.type === "INSTANCE" ? n.variantProperties : (n.parent && n.parent.type === "COMPONENT_SET" ? n.variantProperties : null);
        if (vp && Object.keys(vp).length > 0) {
          props = Object.keys(vp).map(function(k) { return k + "=" + vp[k]; }).join(", ");
        }
      }
    } catch(e) {}
    return {
      name:   n.name.split("/").pop().trim(),
      size:   Math.round(n.width),
      stroke: getSourceStroke(n),
      props:  props,
    };
  });
}

function extractBaseName(fullName, presets) {
  var parts  = fullName.split("/");
  var sizes  = {};
  var labels = {};
  for (var i = 0; i < presets.length; i++) {
    sizes[String(presets[i].size)]          = true;
    sizes[String(presets[i].size) + "px"]   = true;
    if (presets[i].label) labels[presets[i].label.toLowerCase()] = true;
  }
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (!sizes[p] && !labels[p.toLowerCase()]) return p;
  }
  return parts[parts.length - 1].trim();
}

function applyPattern(pattern, name, size, label) {
  return pattern
    .replace(/{name}/g,  name)
    .replace(/{size}/g,  String(size))
    .replace(/{label}/g, label || "");
}

// ── Sizing ─────────────────────────────────────────────────
function getTargetSize(node, size, proportional) {
  if (!proportional || node.width === node.height) return { w: size, h: size };
  return { w: size, h: Math.round(size * (node.height / node.width)) };
}

function applyToNode(node, size, stroke) {
  applyToNodeSized(node, size, size, stroke);
}

function applyToNodeSized(node, w, h, stroke) {
  if ("resize" in node) node.resize(w, h);
  if (stroke !== null && stroke !== undefined) setStrokeRecursive(node, stroke);
  if (node.type === "INSTANCE") {
    try {
      var props = node.componentProperties;
      if (props && props["Size"]) node.setProperties({ Size: String(w) });
    } catch(e) {}
  }
}

// ── Stroke ─────────────────────────────────────────────────
const VECTOR_TYPES = ["VECTOR", "LINE", "ELLIPSE", "RECTANGLE", "POLYGON", "STAR", "BOOLEAN_OPERATION"];

function setStrokeRecursive(node, strokeWidth) {
  if (VECTOR_TYPES.indexOf(node.type) !== -1) {
    if (node.strokes && node.strokes.length > 0) node.strokeWeight = strokeWidth;
    return;
  }
  if ("children" in node) {
    for (var i = 0; i < node.children.length; i++) setStrokeRecursive(node.children[i], strokeWidth);
  }
}

function getSourceStroke(node) {
  if (VECTOR_TYPES.indexOf(node.type) !== -1) {
    if (node.strokes && node.strokes.length > 0) return node.strokeWeight;
  }
  if ("children" in node) {
    for (var i = 0; i < node.children.length; i++) {
      var w = getSourceStroke(node.children[i]);
      if (w !== null) return w;
    }
  }
  return null;
}

function resolveStroke(mode, presetStroke, sourceStroke, sourceSize, targetSize) {
  if (mode === "lock") return null;
  if (mode === "scale" && sourceStroke !== null && sourceSize > 0) {
    return Math.round(sourceStroke * (targetSize / sourceSize) * 10) / 10;
  }
  return presetStroke;
}
