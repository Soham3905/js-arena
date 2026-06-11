export const GRID = { cols: 100, rows: 100 };

const now = Date.now();

export const appConfig = {
  version: "1.0.0",

  workspace: {
    id: "workspace_1",
    name: "DSA Practice",
    description: "Data Structures & Algorithms Problem Solving",
    rootNodeId: "root",
    createdAt: now,
    updatedAt: now,
    owner: "local-user",
    version: "1.0.0",
  },

  layout: {
    sections: [
      {
        id: "header",
        type: "Header",
        visible: true,
        title: "Header",
        position: { colStart: 1, colEnd: 101, rowStart: 1, rowEnd: 7 },
        props: {},
        events: {},
      },
      {
        id: "tree",
        type: "FileTree",
        visible: true,
        title: "Explorer",
        position: { colStart: 1, colEnd: 21, rowStart: 7, rowEnd: 101 },
        props: {
          allowRename: true,
          allowDelete: true,
          allowAddFolder: true,
          allowAddFile: true,
        },
        events: {},
      },
      {
        id: "editor",
        type: "Editor",
        visible: true,
        title: "Editor",
        position: { colStart: 21, colEnd: 76, rowStart: 7, rowEnd: 71 },
        props: { readonly: false },
        events: {},
      },
      {
        id: "testCases",
        type: "TestCasePanel",
        visible: true,
        title: "Test Cases",
        position: { colStart: 76, colEnd: 101, rowStart: 7, rowEnd: 71 },
        props: {},
        events: {},
      },
      {
        id: "console",
        type: "ConsolePanel",
        visible: true,
        title: "Output",
        position: { colStart: 21, colEnd: 101, rowStart: 71, rowEnd: 101 },
        props: {},
        events: {},
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  FILE TREE
  // ─────────────────────────────────────────────────────────────────────────
  fileTree: {
    root: {
      id: "root",
      name: "Workspace",
      type: "folder",
      path: "/",
      parentId: null,
      expanded: true,
      children: ["folder_arrays", "folder_strings", "folder_matrix"],
      metadataId: "meta_root",
      permissionId: "perm_root",
    },

    // ── Arrays ───────────────────────────────────────────────────────────────
    folder_arrays: {
      id: "folder_arrays",
      name: "arrays",
      type: "folder",
      path: "/arrays",
      parentId: "root",
      expanded: true,
      children: ["file_max_element", "file_two_sum", "file_rotate_array"],
      metadataId: "meta_folder_arrays",
      permissionId: "perm_folder",
    },

    file_max_element: {
      id: "file_max_element",
      name: "maxElement.js",
      type: "file",
      extension: "js",
      path: "/arrays/maxElement.js",
      parentId: "folder_arrays",
      contentId: "content_max_element",
      metadataId: "meta_max_element",
      permissionId: "perm_file",
    },

    file_two_sum: {
      id: "file_two_sum",
      name: "twoSum.js",
      type: "file",
      extension: "js",
      path: "/arrays/twoSum.js",
      parentId: "folder_arrays",
      contentId: "content_two_sum",
      metadataId: "meta_two_sum",
      permissionId: "perm_file",
    },

    file_rotate_array: {
      id: "file_rotate_array",
      name: "rotateArray.js",
      type: "file",
      extension: "js",
      path: "/arrays/rotateArray.js",
      parentId: "folder_arrays",
      contentId: "content_rotate_array",
      metadataId: "meta_rotate_array",
      permissionId: "perm_file",
    },

    // ── Strings ──────────────────────────────────────────────────────────────
    folder_strings: {
      id: "folder_strings",
      name: "strings",
      type: "folder",
      path: "/strings",
      parentId: "root",
      expanded: true,
      children: ["file_reverse_string", "file_is_palindrome", "file_longest_substring"],
      metadataId: "meta_folder_strings",
      permissionId: "perm_folder",
    },

    file_reverse_string: {
      id: "file_reverse_string",
      name: "reverseString.js",
      type: "file",
      extension: "js",
      path: "/strings/reverseString.js",
      parentId: "folder_strings",
      contentId: "content_reverse_string",
      metadataId: "meta_reverse_string",
      permissionId: "perm_file",
    },

    file_is_palindrome: {
      id: "file_is_palindrome",
      name: "isPalindrome.js",
      type: "file",
      extension: "js",
      path: "/strings/isPalindrome.js",
      parentId: "folder_strings",
      contentId: "content_is_palindrome",
      metadataId: "meta_is_palindrome",
      permissionId: "perm_file",
    },

    file_longest_substring: {
      id: "file_longest_substring",
      name: "longestSubstring.js",
      type: "file",
      extension: "js",
      path: "/strings/longestSubstring.js",
      parentId: "folder_strings",
      contentId: "content_longest_substring",
      metadataId: "meta_longest_substring",
      permissionId: "perm_file",
    },

    // ── Matrix ───────────────────────────────────────────────────────────────
    folder_matrix: {
      id: "folder_matrix",
      name: "matrix",
      type: "folder",
      path: "/matrix",
      parentId: "root",
      expanded: true,
      children: ["file_matrix_sum", "file_spiral_order", "file_transpose"],
      metadataId: "meta_folder_matrix",
      permissionId: "perm_folder",
    },

    file_matrix_sum: {
      id: "file_matrix_sum",
      name: "matrixSum.js",
      type: "file",
      extension: "js",
      path: "/matrix/matrixSum.js",
      parentId: "folder_matrix",
      contentId: "content_matrix_sum",
      metadataId: "meta_matrix_sum",
      permissionId: "perm_file",
    },

    file_spiral_order: {
      id: "file_spiral_order",
      name: "spiralOrder.js",
      type: "file",
      extension: "js",
      path: "/matrix/spiralOrder.js",
      parentId: "folder_matrix",
      contentId: "content_spiral_order",
      metadataId: "meta_spiral_order",
      permissionId: "perm_file",
    },

    file_transpose: {
      id: "file_transpose",
      name: "transposeMatrix.js",
      type: "file",
      extension: "js",
      path: "/matrix/transposeMatrix.js",
      parentId: "folder_matrix",
      contentId: "content_transpose",
      metadataId: "meta_transpose",
      permissionId: "perm_file",
    },
  },

  tabs: {
    activeTabId: "file_max_element",
    openTabs: [
      { fileId: "file_max_element", pinned: false, dirty: false },
    ],
  },

  search: {
    recentFiles: [],
    searchIndex: [],
  },

  settings: {
    theme: "dark",
    fontSize: 14,
    tabSize: 2,
    autoSave: true,
    wordWrap: true,
  },

  componentRegistry: {
    Header:        { type: "Header",        version: "1.0.0", props: {}, events: {} },
    FileTree:      { type: "FileTree",      version: "1.0.0", props: {}, events: {} },
    Editor:        { type: "Editor",        version: "1.0.0", props: {}, events: {} },
    TestCasePanel: { type: "TestCasePanel", version: "1.0.0", props: {}, events: {} },
    ConsolePanel:  { type: "ConsolePanel",  version: "1.0.0", props: {}, events: {} },
  },

  actionRegistry: {
    SAVE_FILE:       { type: "SAVE_FILE" },
    RUN_TESTS:       { type: "RUN_TESTS" },
    RUN_ACTIVE_FILE: { type: "RUN_ACTIVE_FILE" },
    OPEN_FILE:       { type: "OPEN_FILE" },
    RENAME_NODE:     { type: "RENAME_NODE" },
    DELETE_NODE:     { type: "DELETE_NODE" },
    ADD_FILE:        { type: "ADD_FILE" },
    ADD_FOLDER:      { type: "ADD_FOLDER" },
    MOVE_NODE:       { type: "MOVE_NODE" },
    DUPLICATE_NODE:  { type: "DUPLICATE_NODE" },
    UNDO:            { type: "UNDO" },
    REDO:            { type: "REDO" },
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  FILE CONTENTS
  //
  //  HOW THE RUNNER WORKS:
  //  - test input is JSON.parsed, so "[3,1,7]" becomes the array [3,1,7]
  //  - if input is an array it's spread: solve(...args)
  //  - the entry function MUST be named  solve / solution / main
  // ─────────────────────────────────────────────────────────────────────────
  fileContents: {

    // ── ARRAYS ───────────────────────────────────────────────────────────────

    // Input format: a single JSON array  →  solve(arr)
    content_max_element: {
      id: "content_max_element",
      fileId: "file_max_element",
      language: "javascript",
      size: 600,
      content: [
        "/**",
        " * Problem : Find the Maximum Element in an Array",
        " * Difficulty: Easy",
        " *",
        " * Given an array of integers, return the largest element.",
        " * Example : [3, 1, 7, 2, 9, 4]  =>  9",
        " */",
        "",
        "function solve(arr) {",
        "  let max = arr[0];",
        "  for (let i = 1; i < arr.length; i++) {",
        "    if (arr[i] > max) max = arr[i];",
        "  }",
        "  return max;",
        "}",
        "",
        "// quick smoke-tests (visible in Run output)",
        "console.log(solve([3, 1, 7, 2, 9, 4]));  // 9",
        "console.log(solve([-5, -1, -3]));          // -1",
        "console.log(solve([42]));                  // 42",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },

    // Input: [[nums], target] — solve receives the full array, destructure inside
    content_two_sum: {
      id: "content_two_sum",
      fileId: "file_two_sum",
      language: "javascript",
      size: 750,
      content: [
        "/**",
        " * Problem : Two Sum",
        " * Difficulty: Easy",
        " *",
        " * Given an array of integers and a target, return the indices",
        " * of the two numbers that add up to the target.",
        " *",
        " * Test case input format: [[2, 7, 11, 15], 9]",
        " *   - First element is the nums array",
        " *   - Second element is the target",
        " * Example output: [0, 1]",
        " */",
        "",
        "function solve(input) {",
        "  const [nums, target] = input;",
        "  const map = new Map();",
        "  for (let i = 0; i < nums.length; i++) {",
        "    const complement = target - nums[i];",
        "    if (map.has(complement)) return [map.get(complement), i];",
        "    map.set(nums[i], i);",
        "  }",
        "  return [];",
        "}",
        "",
        "console.log(solve([[2, 7, 11, 15], 9]));   // [0, 1]",
        "console.log(solve([[3, 2, 4], 6]));         // [1, 2]",
        "console.log(solve([[3, 3], 6]));            // [0, 1]",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },

    // Input: [[nums], k] — solve receives the full array, destructure inside
    content_rotate_array: {
      id: "content_rotate_array",
      fileId: "file_rotate_array",
      language: "javascript",
      size: 820,
      content: [
        "/**",
        " * Problem : Rotate Array",
        " * Difficulty: Medium",
        " *",
        " * Rotate an array to the right by k steps in-place.",
        " *",
        " * Test case input format: [[1,2,3,4,5,6,7], 3]",
        " *   - First element is the nums array",
        " *   - Second element is k (steps)",
        " * Example output: [5,6,7,1,2,3,4]",
        " */",
        "",
        "function solve(input) {",
        "  const [nums, k] = input;",
        "  const steps = k % nums.length;",
        "  reverse(nums, 0, nums.length - 1);",
        "  reverse(nums, 0, steps - 1);",
        "  reverse(nums, steps, nums.length - 1);",
        "  return nums;",
        "}",
        "",
        "function reverse(arr, l, r) {",
        "  while (l < r) {",
        "    [arr[l], arr[r]] = [arr[r], arr[l]];",
        "    l++; r--;",
        "  }",
        "}",
        "",
        "console.log(solve([[1,2,3,4,5,6,7], 3]));  // [5,6,7,1,2,3,4]",
        "console.log(solve([[-1,-100,3,99], 2]));    // [3,99,-1,-100]",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },

    // ── STRINGS ──────────────────────────────────────────────────────────────

    // Input format: "\"hello\""  →  solve("hello")
    content_reverse_string: {
      id: "content_reverse_string",
      fileId: "file_reverse_string",
      language: "javascript",
      size: 480,
      content: [
        "/**",
        " * Problem : Reverse a String",
        " * Difficulty: Easy",
        " *",
        " * Given a string, return it reversed.",
        " * Example : \"hello\"  =>  \"olleh\"",
        " */",
        "",
        "function solve(s) {",
        "  return s.split('').reverse().join('');",
        "}",
        "",
        "console.log(solve('hello'));    // olleh",
        "console.log(solve('abcde'));    // edcba",
        "console.log(solve('racecar')); // racecar",
        "console.log(solve(''));         // (empty string)",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },

    // Input format: "\"A man...\""  →  solve("A man...")
    content_is_palindrome: {
      id: "content_is_palindrome",
      fileId: "file_is_palindrome",
      language: "javascript",
      size: 600,
      content: [
        "/**",
        " * Problem : Valid Palindrome",
        " * Difficulty: Easy",
        " *",
        " * After lowercasing and removing non-alphanumeric characters,",
        " * check whether the string reads the same forwards and backwards.",
        " * Example : \"A man, a plan, a canal: Panama\"  =>  true",
        " */",
        "",
        "function solve(s) {",
        "  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');",
        "  return clean === clean.split('').reverse().join('');",
        "}",
        "",
        "console.log(solve('A man, a plan, a canal: Panama')); // true",
        "console.log(solve('race a car'));                      // false",
        "console.log(solve(''));                                // true",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },

    // Input format: "\"abcabcbb\""  →  solve("abcabcbb")
    content_longest_substring: {
      id: "content_longest_substring",
      fileId: "file_longest_substring",
      language: "javascript",
      size: 840,
      content: [
        "/**",
        " * Problem : Longest Substring Without Repeating Characters",
        " * Difficulty: Medium",
        " *",
        " * Return the length of the longest substring without repeating characters.",
        " * Example : \"abcabcbb\"  =>  3  (substring \"abc\")",
        " */",
        "",
        "function solve(s) {",
        "  const map = new Map();",
        "  let left = 0, max = 0;",
        "  for (let right = 0; right < s.length; right++) {",
        "    if (map.has(s[right])) {",
        "      left = Math.max(left, map.get(s[right]) + 1);",
        "    }",
        "    map.set(s[right], right);",
        "    max = Math.max(max, right - left + 1);",
        "  }",
        "  return max;",
        "}",
        "",
        "console.log(solve('abcabcbb')); // 3",
        "console.log(solve('bbbbb'));    // 1",
        "console.log(solve('pwwkew'));   // 3",
        "console.log(solve(''));         // 0",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },

    // ── MATRIX ───────────────────────────────────────────────────────────────

    // Input format: [[rows]]  →  solve(matrix)
    content_matrix_sum: {
      id: "content_matrix_sum",
      fileId: "file_matrix_sum",
      language: "javascript",
      size: 580,
      content: [
        "/**",
        " * Problem : Sum of All Elements in a Matrix",
        " * Difficulty: Easy",
        " *",
        " * Given a 2-D matrix of integers, return the sum of all elements.",
        " * Example : [[1,2,3],[4,5,6],[7,8,9]]  =>  45",
        " */",
        "",
        "function solve(matrix) {",
        "  let total = 0;",
        "  for (const row of matrix) {",
        "    for (const val of row) {",
        "      total += val;",
        "    }",
        "  }",
        "  return total;",
        "}",
        "",
        "console.log(solve([[1,2,3],[4,5,6],[7,8,9]])); // 45",
        "console.log(solve([[0,0],[0,0]]));              // 0",
        "console.log(solve([[-1,2],[-3,4]]));           // 2",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },

    // Input format: [[rows]]  →  solve(matrix)
    content_spiral_order: {
      id: "content_spiral_order",
      fileId: "file_spiral_order",
      language: "javascript",
      size: 980,
      content: [
        "/**",
        " * Problem : Spiral Order Matrix Traversal",
        " * Difficulty: Medium",
        " *",
        " * Given an m×n matrix, return all elements in spiral order.",
        " * Example : [[1,2,3],[4,5,6],[7,8,9]]  =>  [1,2,3,6,9,8,7,4,5]",
        " */",
        "",
        "function solve(matrix) {",
        "  const result = [];",
        "  let top = 0, bottom = matrix.length - 1;",
        "  let left = 0, right = matrix[0].length - 1;",
        "",
        "  while (top <= bottom && left <= right) {",
        "    for (let c = left; c <= right; c++)  result.push(matrix[top][c]);",
        "    top++;",
        "    for (let r = top; r <= bottom; r++)  result.push(matrix[r][right]);",
        "    right--;",
        "    if (top <= bottom)",
        "      for (let c = right; c >= left; c--) result.push(matrix[bottom][c]);",
        "    bottom--;",
        "    if (left <= right)",
        "      for (let r = bottom; r >= top; r--) result.push(matrix[r][left]);",
        "    left++;",
        "  }",
        "  return result;",
        "}",
        "",
        "console.log(solve([[1,2,3],[4,5,6],[7,8,9]]));  // [1,2,3,6,9,8,7,4,5]",
        "console.log(solve([[1,2],[3,4]]));               // [1,2,4,3]",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },

    // Input format: [[rows]]  →  solve(matrix)
    content_transpose: {
      id: "content_transpose",
      fileId: "file_transpose",
      language: "javascript",
      size: 640,
      content: [
        "/**",
        " * Problem : Transpose a Matrix",
        " * Difficulty: Easy",
        " *",
        " * Return the transpose of a matrix (flip over the main diagonal).",
        " * Example : [[1,2,3],[4,5,6]]  =>  [[1,4],[2,5],[3,6]]",
        " */",
        "",
        "function solve(matrix) {",
        "  const rows = matrix.length;",
        "  const cols = matrix[0].length;",
        "  const result = Array.from({ length: cols }, () => Array(rows));",
        "  for (let r = 0; r < rows; r++) {",
        "    for (let c = 0; c < cols; c++) {",
        "      result[c][r] = matrix[r][c];",
        "    }",
        "  }",
        "  return result;",
        "}",
        "",
        "console.log(solve([[1,2,3],[4,5,6]]));     // [[1,4],[2,5],[3,6]]",
        "console.log(solve([[1,2],[3,4],[5,6]]));   // [[1,3,5],[2,4,6]]",
      ].join("\n"),
      createdAt: now,
      updatedAt: now,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  METADATA
  // ─────────────────────────────────────────────────────────────────────────
  metadata: {
    meta_root:             { id: "meta_root",             createdAt: now, updatedAt: now, createdBy: "user", extension: "",   encoding: "utf-8", size: 0,   isHidden: false, isReadonly: false },
    meta_folder_arrays:    { id: "meta_folder_arrays",    createdAt: now, updatedAt: now, createdBy: "user", extension: "",   encoding: "utf-8", size: 0,   isHidden: false, isReadonly: false },
    meta_folder_strings:   { id: "meta_folder_strings",   createdAt: now, updatedAt: now, createdBy: "user", extension: "",   encoding: "utf-8", size: 0,   isHidden: false, isReadonly: false },
    meta_folder_matrix:    { id: "meta_folder_matrix",    createdAt: now, updatedAt: now, createdBy: "user", extension: "",   encoding: "utf-8", size: 0,   isHidden: false, isReadonly: false },
    meta_max_element:      { id: "meta_max_element",      createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 600,  isHidden: false, isReadonly: false },
    meta_two_sum:          { id: "meta_two_sum",          createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 750,  isHidden: false, isReadonly: false },
    meta_rotate_array:     { id: "meta_rotate_array",     createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 820,  isHidden: false, isReadonly: false },
    meta_reverse_string:   { id: "meta_reverse_string",   createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 480,  isHidden: false, isReadonly: false },
    meta_is_palindrome:    { id: "meta_is_palindrome",    createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 600,  isHidden: false, isReadonly: false },
    meta_longest_substring:{ id: "meta_longest_substring",createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 840,  isHidden: false, isReadonly: false },
    meta_matrix_sum:       { id: "meta_matrix_sum",       createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 580,  isHidden: false, isReadonly: false },
    meta_spiral_order:     { id: "meta_spiral_order",     createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 980,  isHidden: false, isReadonly: false },
    meta_transpose:        { id: "meta_transpose",        createdAt: now, updatedAt: now, createdBy: "user", extension: "js", encoding: "utf-8", size: 640,  isHidden: false, isReadonly: false },
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  PERMISSIONS
  // ─────────────────────────────────────────────────────────────────────────
  permissions: {
    perm_root:   { id: "perm_root",   read: true, write: true, rename: false, delete: false, move: false, execute: false },
    perm_folder: { id: "perm_folder", read: true, write: true, rename: true,  delete: true,  move: true,  execute: false },
    perm_file:   { id: "perm_file",   read: true, write: true, rename: true,  delete: true,  move: true,  execute: true  },
  },

  history: {
    undoStack: [],
    redoStack: [],
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  PROBLEMS
  // ─────────────────────────────────────────────────────────────────────────
  problems: {
    currentProblem: "problem_max_element",
    entities: {
      problem_max_element: {
        id: "problem_max_element",
        title: "Find Maximum Element in Array",
        difficulty: "Easy",
        language: "javascript",
        starterFileId: "file_max_element",
        description: "Given an array of integers, return the largest element.\n\nConstraints:\n- 1 ≤ arr.length ≤ 10⁵\n- -10⁹ ≤ arr[i] ≤ 10⁹",
        tags: ["Array", "Linear Scan"],
      },
      problem_two_sum: {
        id: "problem_two_sum",
        title: "Two Sum",
        difficulty: "Easy",
        language: "javascript",
        starterFileId: "file_two_sum",
        description: "Given an array and a target, return indices of the two numbers that add up to the target.\n\nConstraints:\n- 2 ≤ nums.length ≤ 10⁴\n- Exactly one valid answer exists.",
        tags: ["Array", "Hash Map"],
      },
      problem_rotate_array: {
        id: "problem_rotate_array",
        title: "Rotate Array",
        difficulty: "Medium",
        language: "javascript",
        starterFileId: "file_rotate_array",
        description: "Rotate an array to the right by k steps.\n\nConstraints:\n- 1 ≤ nums.length ≤ 10⁵\n- 0 ≤ k ≤ 10⁵",
        tags: ["Array", "Two Pointers", "Reverse"],
      },
      problem_reverse_string: {
        id: "problem_reverse_string",
        title: "Reverse a String",
        difficulty: "Easy",
        language: "javascript",
        starterFileId: "file_reverse_string",
        description: "Given a string, return it reversed.\n\nConstraints:\n- 0 ≤ s.length ≤ 10⁵",
        tags: ["String", "Two Pointers"],
      },
      problem_is_palindrome: {
        id: "problem_is_palindrome",
        title: "Valid Palindrome",
        difficulty: "Easy",
        language: "javascript",
        starterFileId: "file_is_palindrome",
        description: "A phrase is a palindrome if, after lowercasing and removing non-alphanumeric characters, it reads the same forwards and backwards.",
        tags: ["String", "Two Pointers"],
      },
      problem_longest_substring: {
        id: "problem_longest_substring",
        title: "Longest Substring Without Repeating Characters",
        difficulty: "Medium",
        language: "javascript",
        starterFileId: "file_longest_substring",
        description: "Given a string, find the length of the longest substring without repeating characters.\n\nConstraints:\n- 0 ≤ s.length ≤ 5 × 10⁴",
        tags: ["String", "Sliding Window", "Hash Map"],
      },
      problem_matrix_sum: {
        id: "problem_matrix_sum",
        title: "Sum of All Elements in a Matrix",
        difficulty: "Easy",
        language: "javascript",
        starterFileId: "file_matrix_sum",
        description: "Given a 2-D matrix of integers, return the sum of all elements.\n\nConstraints:\n- 1 ≤ rows, cols ≤ 500",
        tags: ["Matrix", "Nested Loop"],
      },
      problem_spiral_order: {
        id: "problem_spiral_order",
        title: "Spiral Order Matrix Traversal",
        difficulty: "Medium",
        language: "javascript",
        starterFileId: "file_spiral_order",
        description: "Given an m × n matrix, return all elements in spiral order.\n\nConstraints:\n- m, n ≥ 1",
        tags: ["Matrix", "Simulation"],
      },
      problem_transpose: {
        id: "problem_transpose",
        title: "Transpose a Matrix",
        difficulty: "Easy",
        language: "javascript",
        starterFileId: "file_transpose",
        description: "Return the transpose of a matrix (flip over the main diagonal).\n\nConstraints:\n- 1 ≤ rows, cols ≤ 1000",
        tags: ["Matrix", "In-place"],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  RUNTIME — test cases per file
  //
  //  INPUT FORMAT rules (mirrors the runner in functions.js):
  //    • Input is JSON.parsed before being passed in.
  //    • If the parsed value is an ARRAY  →  solve(...arr)
  //    • Otherwise                        →  solve(value)
  //
  //  Single-arg problems (array / string):
  //    input: "[3,1,7,2,9,4]"   →  parsed → [3,1,7,2,9,4]  →  solve([3,1,7,2,9,4])
  //    input: "\"hello\""       →  parsed → "hello"          →  solve("hello")
  //
  //  Multi-arg problems (two-sum, rotate):
  //    input: "[[2,7,11,15],9]" →  parsed → [[2,7,11,15],9] →  solve([2,7,11,15], 9)
  // ─────────────────────────────────────────────────────────────────────────
  runtime: {
    testCasesByFile: {

      // ─── Arrays ─────────────────────────────────────────────────────────
      // solve(arr): input is just the array  e.g.  [3, 1, 7, 2, 9, 4]
      file_max_element: [
        { id: "tc_max_1", input: "[3, 1, 7, 2, 9, 4]", expected: "9",  hidden: false },
        { id: "tc_max_2", input: "[-5, -1, -3]",        expected: "-1", hidden: false },
        { id: "tc_max_3", input: "[42]",                expected: "42", hidden: true  },
      ],

      // solve(input) where input = [[nums], target]:  [[2,7,11,15], 9]
      file_two_sum: [
        { id: "tc_ts_1", input: "[[2,7,11,15], 9]", expected: "[0,1]", hidden: false },
        { id: "tc_ts_2", input: "[[3,2,4], 6]",     expected: "[1,2]", hidden: false },
        { id: "tc_ts_3", input: "[[3,3], 6]",       expected: "[0,1]", hidden: true  },
      ],

      // solve(input) where input = [[nums], k]:  [[1,2,3,4,5,6,7], 3]
      file_rotate_array: [
        { id: "tc_rot_1", input: "[[1,2,3,4,5,6,7], 3]", expected: "[5,6,7,1,2,3,4]", hidden: false },
        { id: "tc_rot_2", input: "[[-1,-100,3,99], 2]",  expected: "[3,99,-1,-100]",   hidden: false },
        { id: "tc_rot_3", input: "[[1,2], 1]",           expected: "[2,1]",            hidden: true  },
      ],

      // ─── Strings ────────────────────────────────────────────────────────
      // solve(s): just type the string as-is, e.g.  hello
      file_reverse_string: [
        { id: "tc_rev_1", input: "hello",   expected: "olleh",   hidden: false },
        { id: "tc_rev_2", input: "abcde",   expected: "edcba",   hidden: false },
        { id: "tc_rev_3", input: "racecar", expected: "racecar", hidden: true  },
        { id: "tc_rev_4", input: "",        expected: "",        hidden: true  },
      ],

      file_is_palindrome: [
        { id: "tc_pal_1", input: "A man, a plan, a canal: Panama", expected: "true",  hidden: false },
        { id: "tc_pal_2", input: "race a car",                      expected: "false", hidden: false },
        { id: "tc_pal_3", input: " ",                               expected: "true",  hidden: true  },
      ],

      file_longest_substring: [
        { id: "tc_ls_1", input: "abcabcbb", expected: "3", hidden: false },
        { id: "tc_ls_2", input: "bbbbb",    expected: "1", hidden: false },
        { id: "tc_ls_3", input: "pwwkew",   expected: "3", hidden: false },
        { id: "tc_ls_4", input: "",         expected: "0", hidden: true  },
      ],

      // ─── Matrix ─────────────────────────────────────────────────────────
      // solve(matrix): input is the 2-D array directly  e.g.  [[1,2,3],[4,5,6],[7,8,9]]
      file_matrix_sum: [
        { id: "tc_ms_1", input: "[[1,2,3],[4,5,6],[7,8,9]]", expected: "45", hidden: false },
        { id: "tc_ms_2", input: "[[0,0],[0,0]]",             expected: "0",  hidden: false },
        { id: "tc_ms_3", input: "[[-1,2],[-3,4]]",           expected: "2",  hidden: true  },
      ],

      file_spiral_order: [
        { id: "tc_sp_1", input: "[[1,2,3],[4,5,6],[7,8,9]]", expected: "[1,2,3,6,9,8,7,4,5]", hidden: false },
        { id: "tc_sp_2", input: "[[1,2],[3,4]]",             expected: "[1,2,4,3]",            hidden: false },
        { id: "tc_sp_3", input: "[[1]]",                     expected: "[1]",                  hidden: true  },
      ],

      file_transpose: [
        { id: "tc_tr_1", input: "[[1,2,3],[4,5,6]]",   expected: "[[1,4],[2,5],[3,6]]", hidden: false },
        { id: "tc_tr_2", input: "[[1,2],[3,4],[5,6]]", expected: "[[1,3,5],[2,4,6]]",  hidden: false },
        { id: "tc_tr_3", input: "[[1]]",               expected: "[[1]]",              hidden: true  },
      ],
    },

    executions: [],
    console: { logs: [] },
    lastTestRun: null,
    activeExecutionId: null,
    running: false,
  },
};
