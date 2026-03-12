figma.showUI(__html__, { width: 320, height: 420, title: "Icon Resizer" });

const DEFAULTS = [
  { label: "Caption",   size: 12, stroke: 1.0 },
  { label: "Body",      size: 16, stroke: 1.5 },
  { label: "Title S",   size: 20, stroke: 1.8 },
  { label: "Title M",   size: 24, stroke: 2.5 },
  { label: "Title L",   size: 32, stroke: 2.8 },
  { label: "Title XL",  size: 40, stroke: 3.2 },
  { label: "Title XXL", size: 48, stroke: 4.5 },
  { label: "Title 4XL", size: 56, stroke: 5.2 },
];

// Загружаем сохранённые пресеты и отправляем в UI при старте
async function init() {
  const saved = await figma.clientStorage.getAsync("presets");
  figma.ui.postMessage({ type: "init", presets: saved || DEFAULTS });
}
init();

figma.ui.onmessage = async (msg) => {

  // Сохранить пресеты
  if (msg.type === "save-presets") {
    await figma.clientStorage.setAsync("presets", msg.presets);
    figma.ui.postMessage({ type: "presets-saved" });
  }

  // Сбросить пресеты
  if (msg.type === "reset-presets") {
    await figma.clientStorage.deleteAsync("presets");
    figma.ui.postMessage({ type: "init", presets: DEFAULTS });
  }

  // Применить один размер к выделенным
  if (msg.type === "apply") {
    const nodes = figma.currentPage.selection;
    if (nodes.length === 0) {
      figma.ui.postMessage({ type: "error", text: "Select at least one icon" });
      return;
    }
    for (const node of nodes) applyToNode(node, msg.size, msg.stroke);
    figma.ui.postMessage({ type: "success", text: `✓ Applied to ${nodes.length} icon(s)` });
  }

  // Создать все размеры из одной иконки
  if (msg.type === "generate-all") {
    const nodes = figma.currentPage.selection;
    if (nodes.length === 0) {
      figma.ui.postMessage({ type: "error", text: "Select a source icon first" });
      return;
    }

    const source = nodes[0];
    const GAP = 16;
    let offsetX = source.x + source.width + GAP * 2;
    const originY = source.y;
    const created = [];

    for (const preset of msg.presets) {
      const clone = source.clone();
      figma.currentPage.appendChild(clone);
      clone.x = offsetX;
      clone.y = originY;
      applyToNode(clone, preset.size, preset.stroke);
      offsetX += preset.size + GAP;
      created.push(clone);
    }

    figma.currentPage.selection = created;
    figma.viewport.scrollAndZoomIntoView(created);
    figma.ui.postMessage({ type: "success", text: `✓ Created ${created.length} icons` });
  }

  if (msg.type === "close") figma.closePlugin();
};

function applyToNode(node, size, stroke) {
  if ("resize" in node) node.resize(size, size);
  setStrokeRecursive(node, stroke);
  if (node.type === "INSTANCE") {
    try {
      const props = node.componentProperties;
      if (props && props["Size"]) node.setProperties({ Size: String(size) });
    } catch (e) {}
  }
}

function setStrokeRecursive(node, strokeWidth) {
  const vectorTypes = ["VECTOR", "LINE", "ELLIPSE", "RECTANGLE", "POLYGON", "STAR", "BOOLEAN_OPERATION"];
  if (vectorTypes.includes(node.type) && node.strokes && node.strokes.length > 0) {
    node.strokeWeight = strokeWidth;
  }
  if ("children" in node) {
    for (const child of node.children) setStrokeRecursive(child, strokeWidth);
  }
}
