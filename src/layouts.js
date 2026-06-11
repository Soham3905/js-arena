/**
 * Layout presets for the SDUI IDE.
 *
 * Each layout defines positions for the 5 sections on the 100×100 grid:
 *   header, tree, editor, testCases, console
 *
 * position: { colStart, colEnd, rowStart, rowEnd }
 * The header is always full-width row 1–7. Panels fill rows 7–101.
 */

export const LAYOUT_PRESETS = [
  {
    id: "default",
    name: "Default",
    description: "Explorer + Editor + Tests + Console",
    icon: "⬛",
    sections: {
      header:    { colStart: 1,   colEnd: 101, rowStart: 1,  rowEnd: 7   },
      tree:      { colStart: 1,   colEnd: 21,  rowStart: 7,  rowEnd: 101 },
      editor:    { colStart: 21,  colEnd: 76,  rowStart: 7,  rowEnd: 71  },
      testCases: { colStart: 76,  colEnd: 101, rowStart: 7,  rowEnd: 71  },
      console:   { colStart: 21,  colEnd: 101, rowStart: 71, rowEnd: 101 },
    },
    visibility: {
      header: true, tree: true, editor: true, testCases: true, console: true,
    },
  },
  {
    id: "focus",
    name: "Focus Mode",
    description: "Editor only — no distractions",
    icon: "▣",
    sections: {
      header:    { colStart: 1,  colEnd: 101, rowStart: 1,  rowEnd: 7   },
      tree:      { colStart: 1,  colEnd: 21,  rowStart: 7,  rowEnd: 101 },
      editor:    { colStart: 21, colEnd: 101, rowStart: 7,  rowEnd: 101 },
      testCases: { colStart: 1,  colEnd: 1,   rowStart: 1,  rowEnd: 1   }, // hidden
      console:   { colStart: 1,  colEnd: 1,   rowStart: 1,  rowEnd: 1   }, // hidden
    },
    visibility: {
      header: true, tree: true, editor: true, testCases: false, console: false,
    },
  },
  {
    id: "wide-editor",
    name: "Wide Editor",
    description: "Large editor with narrow side panels",
    icon: "▬",
    sections: {
      header:    { colStart: 1,  colEnd: 101, rowStart: 1,  rowEnd: 7   },
      tree:      { colStart: 1,  colEnd: 16,  rowStart: 7,  rowEnd: 101 },
      editor:    { colStart: 16, colEnd: 81,  rowStart: 7,  rowEnd: 71  },
      testCases: { colStart: 81, colEnd: 101, rowStart: 7,  rowEnd: 71  },
      console:   { colStart: 16, colEnd: 101, rowStart: 71, rowEnd: 101 },
    },
    visibility: {
      header: true, tree: true, editor: true, testCases: true, console: true,
    },
  },
  {
    id: "leetcode",
    name: "LeetCode Style",
    description: "Tests panel on right, console below editor",
    icon: "◧",
    sections: {
      header:    { colStart: 1,  colEnd: 101, rowStart: 1,  rowEnd: 7   },
      tree:      { colStart: 1,  colEnd: 1,   rowStart: 1,  rowEnd: 1   }, // hidden
      editor:    { colStart: 1,  colEnd: 51,  rowStart: 7,  rowEnd: 101 },
      testCases: { colStart: 51, colEnd: 101, rowStart: 7,  rowEnd: 61  },
      console:   { colStart: 51, colEnd: 101, rowStart: 61, rowEnd: 101 },
    },
    visibility: {
      header: true, tree: false, editor: true, testCases: true, console: true,
    },
  },
  {
    id: "full-test",
    name: "Test Studio",
    description: "Large test panel for test-driven development",
    icon: "◨",
    sections: {
      header:    { colStart: 1,  colEnd: 101, rowStart: 1,  rowEnd: 7   },
      tree:      { colStart: 1,  colEnd: 16,  rowStart: 7,  rowEnd: 101 },
      editor:    { colStart: 16, colEnd: 56,  rowStart: 7,  rowEnd: 101 },
      testCases: { colStart: 56, colEnd: 101, rowStart: 7,  rowEnd: 61  },
      console:   { colStart: 56, colEnd: 101, rowStart: 61, rowEnd: 101 },
    },
    visibility: {
      header: true, tree: true, editor: true, testCases: true, console: true,
    },
  },
  {
    id: "vertical",
    name: "Stacked",
    description: "Editor on top, console + tests below side by side",
    icon: "⬒",
    sections: {
      header:    { colStart: 1,  colEnd: 101, rowStart: 1,  rowEnd: 7   },
      tree:      { colStart: 1,  colEnd: 21,  rowStart: 7,  rowEnd: 101 },
      editor:    { colStart: 21, colEnd: 101, rowStart: 7,  rowEnd: 56  },
      testCases: { colStart: 21, colEnd: 61,  rowStart: 56, rowEnd: 101 },
      console:   { colStart: 61, colEnd: 101, rowStart: 56, rowEnd: 101 },
    },
    visibility: {
      header: true, tree: true, editor: true, testCases: true, console: true,
    },
  },
];

export const DEFAULT_LAYOUT_ID = "default";

/**
 * Given a preset id, returns the full preset object or null.
 */
export function getLayoutPreset(id) {
  return LAYOUT_PRESETS.find((p) => p.id === id) || null;
}

/**
 * Applies a layout preset to the existing layout sections array.
 * Preserves all existing section props/events/titles — only updates
 * position and visibility.
 */
export function applyLayoutPreset(currentSections, presetId) {
  const preset = getLayoutPreset(presetId);
  if (!preset) return currentSections;

  return currentSections.map((section) => {
    const newPos = preset.sections[section.id];
    const newVisible = preset.visibility[section.id];

    if (!newPos) return section; // unknown section — leave untouched

    return {
      ...section,
      position: { ...newPos },
      visible: newVisible,
    };
  });
}
