import { applyLayoutPreset } from "./layouts";

export const ACTIONS = {
  ADD_FILE: "ADD_FILE",
  ADD_FOLDER: "ADD_FOLDER",
  CHANGE_LAYOUT: "CHANGE_LAYOUT",
  CLOSE_TAB: "CLOSE_TAB",
  DELETE_NODE: "DELETE_NODE",
  DUPLICATE_NODE: "DUPLICATE_NODE",
  MOVE_NODE: "MOVE_NODE",
  OPEN_FILE: "OPEN_FILE",
  REDO: "REDO",
  RENAME_NODE: "RENAME_NODE",
  RUN_ACTIVE_FILE: "RUN_ACTIVE_FILE",
  RUN_TESTS: "RUN_TESTS",
  SAVE_FILE: "SAVE_FILE",
  SWITCH_TAB: "SWITCH_TAB",
  TOGGLE_FOLDER: "TOGGLE_FOLDER",
  UNDO: "UNDO",
  UPDATE_FILE_CONTENT: "UPDATE_FILE_CONTENT",
  ADD_TEST_CASE: "ADD_TEST_CASE",
  UPDATE_TEST_CASE: "UPDATE_TEST_CASE",
  DELETE_TEST_CASE: "DELETE_TEST_CASE",
  // Search overlay actions
  OPEN_QUICK_OPEN:        "OPEN_QUICK_OPEN",
  OPEN_CONTENT_SEARCH:    "OPEN_CONTENT_SEARCH",
  CLOSE_SEARCH:           "CLOSE_SEARCH",
  // Command palette actions
  OPEN_COMMAND_PALETTE:   "OPEN_COMMAND_PALETTE",
  CLOSE_COMMAND_PALETTE:  "CLOSE_COMMAND_PALETTE",
};

export function clone(obj) {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

export function generateId(prefix = "node") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value || "").trim();
}

function safeParseWorkspace(value) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatConsoleValue(value) {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getFileExtension(name) {
  const safeName = String(name || "");
  const lastDot = safeName.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === safeName.length - 1) return "";
  return safeName.slice(lastDot + 1).toLowerCase();
}

function getLanguageForName(name) {
  switch (getFileExtension(name)) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return "binary";
    default:
      return "text";
  }
}

function normalizeMetadataRecord(record = {}) {
  return {
    id: record.id || generateId("meta"),
    createdAt: record.createdAt ?? Date.now(),
    updatedAt: record.updatedAt ?? record.createdAt ?? Date.now(),
    createdBy: record.createdBy || "user",
    extension: record.extension || "",
    encoding: record.encoding || "utf-8",
    size: record.size ?? 0,
    isHidden: record.isHidden ?? false,
    isReadonly: record.isReadonly ?? false,
    lastOpenedAt: record.lastOpenedAt ?? null,
    lastEditedAt: record.lastEditedAt ?? null,
    lastExecutedAt: record.lastExecutedAt ?? null,
  };
}

function normalizePermissionsRecord(record = {}) {
  return {
    id: record.id || generateId("perm"),
    read: record.read ?? true,
    write: record.write ?? true,
    rename: record.rename ?? true,
    delete: record.delete ?? true,
    move: record.move ?? true,
    execute: record.execute ?? false,
  };
}

function buildConsoleLog(type, message, timestamp = Date.now(), extra = {}) {
  return {
    id: generateId("log"),
    type,
    message,
    timestamp,
    ...extra,
  };
}

function buildExecutionEntry(overrides = {}) {
  return {
    id: overrides.id || generateId("execution"),
    fileId: overrides.fileId || null,
    timestamp: overrides.timestamp ?? Date.now(),
    status: overrides.status || "Completed",
    mode: overrides.mode || "run",
    passed: overrides.passed ?? null,
    total: overrides.total ?? null,
    duration: overrides.duration || "0ms",
    summary: overrides.summary || "",
    error: overrides.error || null,
  };
}

export function generatePath(parentPath, name) {
  const safeName = normalizeText(name).replace(/^\/+|\/+$/g, "");
  const safeParent = parentPath && parentPath !== "/" ? String(parentPath).replace(/\/+$/g, "") : "";

  if (!safeParent) return safeName ? `/${safeName}` : "/";
  return safeName ? `${safeParent}/${safeName}` : safeParent;
}

function mergeWorkspace(defaults = {}, source = {}) {
  return {
    ...clone(defaults),
    ...clone(source),
    workspace: {
      ...(defaults.workspace || {}),
      ...(source.workspace || {}),
    },
    layout: {
      ...(defaults.layout || {}),
      ...(source.layout || {}),
      sections: clone(source.layout?.sections || defaults.layout?.sections || []),
    },
    tabs: {
      ...(defaults.tabs || {}),
      ...(source.tabs || {}),
      openTabs: clone(source.tabs?.openTabs || defaults.tabs?.openTabs || []),
    },
    search: {
      ...(defaults.search || {}),
      ...(source.search || {}),
      recentFiles: clone(source.search?.recentFiles || defaults.search?.recentFiles || []),
      searchIndex: clone(source.search?.searchIndex || defaults.search?.searchIndex || []),
      // Search overlay state
      isOpen:             source.search?.isOpen             ?? defaults.search?.isOpen             ?? false,
      mode:               source.search?.mode               ?? defaults.search?.mode               ?? "file",
      // Command palette state
      commandPaletteOpen: source.search?.commandPaletteOpen ?? defaults.search?.commandPaletteOpen ?? false,
    },
    settings: {
      ...(defaults.settings || {}),
      ...(source.settings || {}),
    },
    componentRegistry: {
      ...(defaults.componentRegistry || {}),
      ...(source.componentRegistry || {}),
    },
    actionRegistry: {
      ...(defaults.actionRegistry || {}),
      ...(source.actionRegistry || {}),
    },
    fileTree: {
      ...(defaults.fileTree || {}),
      ...(source.fileTree || {}),
    },
    fileContents: {
      ...(defaults.fileContents || {}),
      ...(source.fileContents || {}),
    },
    metadata: {
      ...(defaults.metadata || {}),
      ...(source.metadata || {}),
    },
    permissions: {
      ...(defaults.permissions || {}),
      ...(source.permissions || {}),
    },
    history: {
      ...(defaults.history || {}),
      ...(source.history || {}),
      undoStack: clone(source.history?.undoStack || defaults.history?.undoStack || []),
      redoStack: clone(source.history?.redoStack || defaults.history?.redoStack || []),
    },
    problems: {
      ...(defaults.problems || {}),
      ...(source.problems || {}),
      entities: {
        ...(defaults.problems?.entities || {}),
        ...(source.problems?.entities || {}),
      },
    },
    runtime: {
      ...(defaults.runtime || {}),
      ...(source.runtime || {}),

      testCasesByFile: {
        ...(defaults.runtime?.testCasesByFile || {}),
        ...(source.runtime?.testCasesByFile || {}),
      },

      executions: clone(
        source.runtime?.executions ||
        defaults.runtime?.executions ||
        []
      ),

      console: {
        ...(defaults.runtime?.console || {}),
        ...(source.runtime?.console || {}),
        logs: clone(
          source.runtime?.console?.logs ||
          defaults.runtime?.console?.logs ||
          []
        ),
      },

      lastTestRun: clone(
        source.runtime?.lastTestRun ||
        defaults.runtime?.lastTestRun ||
        null
      ),

      activeExecutionId:
        source.runtime?.activeExecutionId ??
        defaults.runtime?.activeExecutionId ??
        null,

      running:
        source.runtime?.running ??
        defaults.runtime?.running ??
        false,
    },
  };
}

function normalizeWorkspace(appConfig) {
  const next = clone(appConfig || {});
  const metadata = Object.fromEntries(
    Object.entries(next.metadata || {}).map(([key, value]) => [key, normalizeMetadataRecord(value)])
  );
  const permissions = Object.fromEntries(
    Object.entries(next.permissions || {}).map(([key, value]) => [key, normalizePermissionsRecord(value)])
  );

  return {
    ...next,
    workspace: clone(next.workspace || {}),
    layout: {
      ...(next.layout || {}),
      sections: clone(next.layout?.sections || []),
    },
    fileTree: clone(next.fileTree || {}),
    fileContents: clone(next.fileContents || {}),
    metadata,
    permissions,
    tabs: {
      activeTabId: next.tabs?.activeTabId ?? null,
      openTabs: clone(next.tabs?.openTabs || []),
    },
    search: {
      recentFiles: clone(next.search?.recentFiles || []),
      searchIndex: clone(next.search?.searchIndex || []),
      // Search overlay state (not persisted, but normalised so always present)
      isOpen:             next.search?.isOpen             ?? false,
      mode:               next.search?.mode               ?? "file",
      // Command palette state
      commandPaletteOpen: next.search?.commandPaletteOpen ?? false,
    },
    settings: clone(next.settings || {}),
    componentRegistry: clone(next.componentRegistry || {}),
    actionRegistry: clone(next.actionRegistry || {}),
    history: {
      undoStack: clone(next.history?.undoStack || []),
      redoStack: clone(next.history?.redoStack || []),
    },
    problems: {
      ...(next.problems || {}),
      entities: clone(next.problems?.entities || {}),
    },
    runtime: {
      ...(next.runtime || {}),

      testCasesByFile: clone(
        next.runtime?.testCasesByFile || {}
      ),

      executions: clone(
        next.runtime?.executions || []
      ),

      console: {
        ...(next.runtime?.console || {}),
        logs: clone(
          next.runtime?.console?.logs || []
        ),
      },

      lastTestRun: clone(
        next.runtime?.lastTestRun || null
      ),

      activeExecutionId:
        next.runtime?.activeExecutionId ?? null,

      running:
        next.runtime?.running ?? false,
    },
  };
}

export function createHistorySnapshot(appConfig) {
  const copy = clone(appConfig);
  if (copy?.history) delete copy.history;
  return copy;
}

function cloneTabs(tabs) {
  return {
    activeTabId: tabs?.activeTabId ?? null,
    openTabs: clone(tabs?.openTabs || []),
  };
}

function cloneHistory(history) {
  return {
    undoStack: clone(history?.undoStack || []),
    redoStack: clone(history?.redoStack || []),
  };
}

function buildSearchIndex(fileTree) {
  return Object.values(fileTree || {})
    .filter((node) => node && node.id && node.parentId !== null)
    .map((node) => ({
      id: node.id,
      fileId: node.id,
      name: node.name,
      path: node.path,
      type: node.type,
    }));
}

function collectSubtreeIds(fileTree, nodeId, ids = []) {
  const node = fileTree?.[nodeId];
  if (!node) return ids;

  ids.push(nodeId);
  for (const childId of ensureArray(node.children)) {
    collectSubtreeIds(fileTree, childId, ids);
  }

  return ids;
}

function isDescendantNode(fileTree, nodeId, maybeDescendantId) {
  if (!nodeId || !maybeDescendantId) return false;
  if (nodeId === maybeDescendantId) return true;

  const node = fileTree?.[nodeId];
  if (!node || node.type !== "folder") return false;

  return ensureArray(node.children).some((childId) => isDescendantNode(fileTree, childId, maybeDescendantId));
}

function updateDescendantPaths(fileTree, nodeId) {
  const node = fileTree?.[nodeId];
  if (!node || node.type !== "folder") return;

  for (const childId of ensureArray(node.children)) {
    const child = fileTree[childId];
    if (!child) continue;
    child.path = generatePath(node.path, child.name);
    if (child.type === "folder") updateDescendantPaths(fileTree, childId);
  }
}

function touchMetadata(next, nodeId, updates = {}) {
  const node = next.fileTree?.[nodeId];
  if (!node?.metadataId) return;

  const current = normalizeMetadataRecord(next.metadata?.[node.metadataId]);
  next.metadata[node.metadataId] = {
    ...current,
    ...updates,
    updatedAt: updates.updatedAt ?? Date.now(),
  };
}

function getBaseNameParts(name) {
  const extension = getFileExtension(name);
  if (!extension) return { stem: name, extension: "" };
  return {
    stem: name.slice(0, -(extension.length + 1)),
    extension,
  };
}

function buildDuplicateName(appConfig, parentId, originalName) {
  const { stem, extension } = getBaseNameParts(originalName);
  const suffix = extension ? `.${extension}` : "";
  let candidate = `${stem} copy${suffix}`;
  let counter = 2;

  while (isDuplicateName(appConfig, parentId, candidate)) {
    candidate = `${stem} copy ${counter}${suffix}`;
    counter += 1;
  }

  return candidate;
}

function buildMoveName(appConfig, parentId, nodeId, name) {
  if (!isDuplicateName(appConfig, parentId, name, nodeId)) return name;

  const { stem, extension } = getBaseNameParts(name);
  const suffix = extension ? `.${extension}` : "";
  let candidate = `${stem} moved${suffix}`;
  let counter = 2;

  while (isDuplicateName(appConfig, parentId, candidate, nodeId)) {
    candidate = `${stem} moved ${counter}${suffix}`;
    counter += 1;
  }

  return candidate;
}

function appendConsoleLogs(next, entries = []) {
  next.runtime.console = next.runtime.console || { logs: [] };
  next.runtime.console.logs = [...ensureArray(next.runtime.console.logs), ...entries];
}

function appendExecution(next, execution) {
  next.runtime.executions = [execution, ...ensureArray(next.runtime.executions)];
}

function createNodeBase(appConfig, parentId, name, type) {
  const parent = appConfig.fileTree[parentId];
  const id = generateId(type);
  const metadataId = generateId("meta");
  const permissionId = generateId("perm");
  const path = generatePath(parent?.path || "/", name);

  const node = {
    id,
    name,
    type,
    path,
    parentId,
    metadataId,
    permissionId,
  };

  if (type === "folder") {
    node.expanded = true;
    node.children = [];
  } else {
    node.extension = getFileExtension(name);
    node.contentId = generateId("content");
  }

  return { id, node, metadataId, permissionId };
}

function cloneSubtree(next, sourceNodeId, targetParentId, nextName = null) {
  const sourceNode = next.fileTree[sourceNodeId];
  if (!sourceNode) return null;

  const { id, node, metadataId, permissionId } = createNodeBase(
    next,
    targetParentId,
    nextName || sourceNode.name,
    sourceNode.type
  );

  next.fileTree[id] = node;
  next.metadata[metadataId] = normalizeMetadataRecord({
    ...next.metadata[sourceNode.metadataId],
    id: metadataId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  next.permissions[permissionId] = normalizePermissionsRecord({
    ...next.permissions[sourceNode.permissionId],
    id: permissionId,
  });

  if (sourceNode.type === "file") {
    const originalContent = next.fileContents[sourceNode.contentId];
    next.fileContents[node.contentId] = {
      ...clone(originalContent || {}),
      id: node.contentId,
      fileId: id,
      language: getLanguageForName(node.name),
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    next.runtime.testCasesByFile =
      next.runtime.testCasesByFile || {};

    next.runtime.testCasesByFile[id] =
      clone(
        next.runtime.testCasesByFile[sourceNodeId] || []
      );
  } else {
    for (const childId of ensureArray(sourceNode.children)) {
      const duplicatedChildId = cloneSubtree(next, childId, id);
      if (duplicatedChildId) {
        next.fileTree[id].children = [...ensureArray(next.fileTree[id].children), duplicatedChildId];
      }
    }
  }

  return id;
}

export function hydrateWorkspace(source, defaults = {}) {
  const parsed = safeParseWorkspace(source);
  const merged = mergeWorkspace(defaults, parsed || {});
  return updateSearchIndex(normalizeWorkspace(merged));
}

export function createMetadata(overrides = {}) {
  return normalizeMetadataRecord(overrides);
}

export function createPermissions(overrides = {}) {
  return normalizePermissionsRecord(overrides);
}

function pushSnapshot(appConfig, action) {
  const next = normalizeWorkspace(appConfig);
  next.history.undoStack.push({
    action,
    snapshot: createHistorySnapshot(appConfig),
    timestamp: Date.now(),
  });
  next.history.redoStack = [];
  return next;
}

export function commitHistorySnapshot(appConfig, snapshot, action) {
  if (!snapshot) return appConfig;

  const next = normalizeWorkspace(appConfig);
  next.history.undoStack.push({
    action: clone(action || { type: "COMMIT_HISTORY_SNAPSHOT" }),
    snapshot: clone(snapshot),
    timestamp: Date.now(),
  });
  next.history.redoStack = [];
  return next;
}

export function createLayout(appConfig) {
  const sections = appConfig?.layout?.sections || [];

  return Object.fromEntries(
    sections.map((section) => [
      section.id,
      {
        id: section.id,
        type: section.type,
        visible: section.visible !== false,
        title: section.title,
        colStart: section.position.colStart,
        colEnd: section.position.colEnd,
        rowStart: section.position.rowStart,
        rowEnd: section.position.rowEnd,
        props: section.props || {},
        events: section.events || {},
        component: getComponentByType(appConfig?.componentRegistry, section.type),
      },
    ])
  );
}

export function resolveLayout(appConfigOrLayout) {
  if (!appConfigOrLayout) return {};
  if (appConfigOrLayout.sections) return createLayout({ layout: appConfigOrLayout });
  if (appConfigOrLayout.layout?.sections) return createLayout(appConfigOrLayout);
  return {};
}

function denormalizeTreeNode(fileTree, fileContents, nodeId) {
  const node = fileTree?.[nodeId];
  if (!node) return null;

  if (node.type === "file") {
    const contentRecord = fileContents?.[node.contentId];
    return {
      id: node.id,
      name: node.name,
      type: "file",
      path: node.path,
      extension: node.extension,
      content: contentRecord ? contentRecord.content : "",
    };
  }

  return {
    id: node.id,
    name: node.name,
    type: "folder",
    path: node.path,
    expanded: Boolean(node.expanded),
    children: ensureArray(node.children)
      .map((childId) => denormalizeTreeNode(fileTree, fileContents, childId))
      .filter(Boolean),
  };
}

export function createTree(appConfig) {
  return denormalizeTreeNode(appConfig?.fileTree, appConfig?.fileContents, appConfig?.workspace?.rootNodeId);
}

export function createComponentConfig(appConfig) {
  const registry = appConfig?.componentRegistry || {};

  return Object.fromEntries(
    Object.entries(registry).map(([name, config]) => [
      name,
      {
        name,
        type: config?.type || name,
        version: config?.version || "1.0.0",
        props: config?.props || {},
        events: config?.events || {},
      },
    ])
  );
}

export function resolveComponentRegistry(componentRegistry, availableComponents) {
  return Object.fromEntries(
    Object.entries(componentRegistry || {}).map(([name, config]) => {
      const componentType = config?.type || name;
      return [name, availableComponents?.[componentType] || availableComponents?.[name] || null];
    })
  );
}

export function getComponentByType(componentRegistry, type) {
  return componentRegistry?.[type] || null;
}

export function getNodeById(fileTree, id) {
  return fileTree?.[id] || null;
}

export function getRootNodeId(appConfig) {
  return appConfig?.workspace?.rootNodeId || null;
}

export function getRootNode(appConfig) {
  return getNodeById(appConfig?.fileTree, getRootNodeId(appConfig));
}

export function isRootNode(appConfig, nodeId) {
  return nodeId === getRootNodeId(appConfig);
}

export function getNodePermissions(appConfig, nodeId) {
  const node = appConfig?.fileTree?.[nodeId];
  if (!node?.permissionId) return normalizePermissionsRecord();
  return normalizePermissionsRecord(appConfig?.permissions?.[node.permissionId]);
}

export function canReadNode(appConfig, nodeId) {
  return getNodePermissions(appConfig, nodeId).read;
}

export function canWriteNode(appConfig, nodeId) {
  const permissions = getNodePermissions(appConfig, nodeId);
  const node = appConfig?.fileTree?.[nodeId];
  return permissions.write && !appConfig?.metadata?.[node?.metadataId]?.isReadonly;
}

export function canRenameNode(appConfig, nodeId) {
  return getNodePermissions(appConfig, nodeId).rename;
}

export function canDeleteNode(appConfig, nodeId) {
  return getNodePermissions(appConfig, nodeId).delete;
}

export function canMoveNode(appConfig, nodeId) {
  return getNodePermissions(appConfig, nodeId).move;
}

export function canExecuteNode(appConfig, nodeId) {
  return getNodePermissions(appConfig, nodeId).execute;
}

export function isDuplicateName(appConfig, parentId, name, excludeId = null) {
  const parent = appConfig?.fileTree?.[parentId];
  if (!parent || !Array.isArray(parent.children)) return false;

  return parent.children.some((childId) => {
    if (childId === excludeId) return false;
    const child = appConfig.fileTree[childId];
    return child && child.name === name;
  });
}

export function loadContent(appConfig, contentId) {
  return appConfig?.fileContents?.[contentId]?.content || "";
}

export function updateContent(appConfig, contentId, nextContent) {
  const next = normalizeWorkspace(appConfig);
  const record = next.fileContents[contentId];
  if (!record) return appConfig;

  const content = String(nextContent);
  next.fileContents[contentId] = {
    ...record,
    content,
    size: content.length,
    updatedAt: Date.now(),
  };
  return next;
}

export function searchFiles(appConfig, query) {
  const needle = normalizeText(query).toLowerCase();
  const index = appConfig?.search?.searchIndex || [];

  if (!needle) return clone(index);

  return index
    .filter((entry) => {
      const name = String(entry.name || "").toLowerCase();
      const path = String(entry.path || "").toLowerCase();
      return name.includes(needle) || path.includes(needle);
    })
    .map((entry) => ({
      ...entry,
      matchType: "name",
      preview: entry.path,
    }));
}

export function searchContent(appConfig, query) {
  const needle = normalizeText(query).toLowerCase();
  if (!needle) return [];

  const results = [];

  for (const node of Object.values(appConfig?.fileTree || {})) {
    if (!node || node.type !== "file" || !node.contentId) continue;

    const contentRecord = appConfig?.fileContents?.[node.contentId];
    const content = String(contentRecord?.content || "");
    if (!content) continue;

    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(needle)) {
        results.push({
          id: `${node.id}_line_${index + 1}`,
          fileId: node.id,
          name: node.name,
          path: node.path,
          type: node.type,
          lineNumber: index + 1,
          lineText: line.trim() || "(blank line)",
          matchType: "content",
          preview: `${node.name}:${index + 1} ${line.trim()}`,
        });
      }
    });
  }

  return results;
}

export function searchWorkspace(appConfig, query) {
  return [...searchFiles(appConfig, query), ...searchContent(appConfig, query)];
}

export function updateSearchIndex(appConfig) {
  const next = normalizeWorkspace(appConfig);
  next.search.searchIndex = buildSearchIndex(next.fileTree);
  return next;
}

export function openTab(appConfig, fileId, options = {}) {
  const next = normalizeWorkspace(appConfig);
  const tabs = cloneTabs(next.tabs);
  const existing = tabs.openTabs.find((tab) => tab.fileId === fileId);

  if (existing) {
    existing.pinned = Boolean(options.pinned ?? existing.pinned);
    existing.dirty = Boolean(options.dirty ?? existing.dirty);
  } else {
    tabs.openTabs.push({
      fileId,
      pinned: Boolean(options.pinned ?? false),
      dirty: Boolean(options.dirty ?? false),
    });
  }

  tabs.activeTabId = fileId;
  next.tabs = tabs;
  touchMetadata(next, fileId, { lastOpenedAt: Date.now() });
  return next;
}

export function closeTab(appConfig, fileId) {
  const next = normalizeWorkspace(appConfig);
  const tabs = cloneTabs(next.tabs);
  tabs.openTabs = tabs.openTabs.filter((tab) => tab.fileId !== fileId);

  if (tabs.activeTabId === fileId) {
    tabs.activeTabId = tabs.openTabs[0]?.fileId || null;
  }

  next.tabs = tabs;
  return next;
}

export function switchTab(appConfig, fileId) {
  const next = normalizeWorkspace(appConfig);
  const tabs = cloneTabs(next.tabs);

  if (tabs.openTabs.some((tab) => tab.fileId === fileId)) {
    tabs.activeTabId = fileId;
    touchMetadata(next, fileId, { lastOpenedAt: Date.now() });
  }

  next.tabs = tabs;
  return next;
}

export function saveFile(appConfig, fileId) {
  const next = normalizeWorkspace(appConfig);
  const tab = next.tabs.openTabs.find((item) => item.fileId === fileId);
  if (!tab) return appConfig;

  tab.dirty = false;
  touchMetadata(next, fileId, { updatedAt: Date.now() });
  appendConsoleLogs(next, [buildConsoleLog("info", `Saved ${next.fileTree[fileId]?.name || fileId}`)]);
  return next;
}

export function getOpenTabs(appConfig) {
  const openTabs = ensureArray(appConfig?.tabs?.openTabs);
  return openTabs.filter((tab) => appConfig?.fileTree?.[tab.fileId]);
}

export function getActiveFile(appConfig) {
  const activeId = appConfig?.tabs?.activeTabId;
  if (!activeId) return null;

  return appConfig?.fileTree?.[activeId] || null;
}

export function getActiveFileId(appConfig) {
  return getActiveFile(appConfig)?.id || null;
}

export function getActiveContent(appConfig) {
  const file = getActiveFile(appConfig);
  if (!file?.contentId) return "";

  return appConfig?.fileContents?.[file.contentId]?.content || "";
}

export function getActiveTab(appConfig) {
  const activeId = getActiveFileId(appConfig);
  if (!activeId) return null;
  return getOpenTabs(appConfig).find((tab) => tab.fileId === activeId) || null;
}

export function hasUnsavedChanges(appConfig) {
  return getOpenTabs(appConfig).some((tab) => tab.dirty);
}

export function getCurrentProblem(appConfig) {
  const currentProblemId = appConfig?.problems?.currentProblem;
  if (!currentProblemId) return null;
  return appConfig?.problems?.entities?.[currentProblemId] || null;
}

export function getCurrentTestCases(appConfig, fileId = null) {
  const activeFileId = fileId || getActiveFileId(appConfig);

  return ensureArray(
    appConfig?.runtime?.testCasesByFile?.[activeFileId]
  );
}

export function getConsoleLogs(appConfig) {
  return ensureArray(appConfig?.runtime?.console?.logs);
}

export function getExecutions(appConfig) {
  return ensureArray(appConfig?.runtime?.executions);
}

export function getLatestTestRun(appConfig) {
  return appConfig?.runtime?.lastTestRun || null;
}

export function canUndo(appConfig) {
  return ensureArray(appConfig?.history?.undoStack).length > 0;
}

export function canRedo(appConfig) {
  return ensureArray(appConfig?.history?.redoStack).length > 0;
}

export function pushUndoAction(appConfig, action) {
  const next = normalizeWorkspace(appConfig);
  next.history.undoStack.push({
    ...clone(action),
    snapshot: createHistorySnapshot(appConfig),
  });
  next.history.redoStack = [];
  return next;
}

export function undo(appConfig) {
  const next = normalizeWorkspace(appConfig);
  const history = cloneHistory(next.history);
  const action = history.undoStack.pop() || null;

  if (!action?.snapshot) {
    next.history = history;
    return next;
  }

  history.redoStack.push({
    ...clone(action),
    snapshot: createHistorySnapshot(appConfig),
  });

  const restored = normalizeWorkspace(action.snapshot);
  restored.history = history;
  return restored;
}

export function redo(appConfig) {
  const next = normalizeWorkspace(appConfig);
  const history = cloneHistory(next.history);
  const action = history.redoStack.pop() || null;

  if (!action?.snapshot) {
    next.history = history;
    return next;
  }

  history.undoStack.push({
    ...clone(action),
    snapshot: createHistorySnapshot(appConfig),
  });

  const restored = normalizeWorkspace(action.snapshot);
  restored.history = history;
  return restored;
}

export function runJavaScript(sourceCode) {
  try {
    const output = [];
    const consoleProxy = {
      log: (...args) => output.push(args.map(formatConsoleValue).join(" ")),
      warn: (...args) => output.push(args.map(formatConsoleValue).join(" ")),
      error: (...args) => output.push(args.map(formatConsoleValue).join(" ")),
    };

    const fn = new Function("console", sourceCode);
    fn(consoleProxy);

    return {
      success: true,
      output,
    };
  } catch (error) {
    return {
      success: false,
      output: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function createTestExecutor(sourceCode) {
  return (input, testCase) => {
    const consoleProxy = {
      log: () => { },
      warn: () => { },
      error: () => { },
    };

    // Parse the input: if it's a raw string, try JSON.parse so "[2,3]" becomes [2,3]
    let parsedInput = input;
    if (typeof input === "string") {
      try {
        parsedInput = JSON.parse(input);
      } catch {
        // not valid JSON — keep as raw string
        parsedInput = input;
      }
    }

    const fn = new Function(
      "input",
      "testCase",
      "console",
      `
${sourceCode}
if (typeof solve === "function") return solve(input);
if (typeof solution === "function") return solution(input);
if (typeof main === "function") return main(input, testCase);
throw new Error("Define solve(input), solution(input), or main(input, testCase) to run tests.");
`
    );

    return fn(parsedInput, testCase, consoleProxy);
  };
}

export function runTests(testCases = [], executeCodeFn) {
  const cases = Array.isArray(testCases) ? testCases : [];

  if (typeof executeCodeFn !== "function") {
    return {
      passed: 0,
      failed: cases.length,
      results: cases.map((testCase) => ({
        testCase,
        passed: false,
        error: "No executor provided",
      })),
    };
  }

  const results = cases.map((testCase) => {
    try {
      const actual = executeCodeFn(testCase.input, testCase);
      const passed = compareOutput(actual, testCase.expected);
      return { testCase, actual, expected: testCase.expected, passed };
    } catch (error) {
      return {
        testCase,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return {
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results,
  };
}

export function runActiveFile(appConfig, fileId = null) {
  const activeFileId = fileId || getActiveFileId(appConfig);
  const node = appConfig?.fileTree?.[activeFileId];
  if (!node || node.type !== "file") return appConfig;

  const next = normalizeWorkspace(appConfig);
  const start = performance.now();

  if (!canExecuteNode(next, activeFileId)) {
    appendConsoleLogs(next, [buildConsoleLog("error", `${node.name} does not have execute permission.`)]);
    appendExecution(
      next,
      buildExecutionEntry({
        fileId: activeFileId,
        status: "Blocked",
        mode: "run",
        duration: "0ms",
        error: "Execute permission denied",
        summary: "Execute permission denied",
      })
    );
    return next;
  }

  const result = runJavaScript(loadContent(next, node.contentId));
  const duration = `${Math.max(1, Math.round(performance.now() - start))}ms`;
  const logs = result.success
    ? result.output.length
      ? result.output.map((message) => buildConsoleLog("info", message))
      : [buildConsoleLog("info", `${node.name} ran successfully with no console output.`)]
    : [buildConsoleLog("error", result.error || `Failed to run ${node.name}`)];

  appendConsoleLogs(next, logs);
  appendExecution(
    next,
    buildExecutionEntry({
      fileId: activeFileId,
      status: result.success ? "Passed" : "Failed",
      mode: "run",
      duration,
      summary: result.success ? `Ran ${node.name}` : result.error || `Failed to run ${node.name}`,
      error: result.success ? null : result.error || "Runtime error",
    })
  );
  touchMetadata(next, activeFileId, { lastExecutedAt: Date.now() });
  return next;
}

export function runCurrentTests(appConfig, fileId = null) {
  const activeFileId = fileId || getActiveFileId(appConfig);
  const node = appConfig?.fileTree?.[activeFileId];
  if (!node || node.type !== "file" || !node.contentId) return appConfig;

  const next = normalizeWorkspace(appConfig);
  const start = performance.now();
  const testCases =
    getCurrentTestCases(next, activeFileId);

  if (!canExecuteNode(next, activeFileId)) {
    const errorMessage = `${node.name} does not have execute permission.`;
    appendConsoleLogs(next, [buildConsoleLog("error", errorMessage)]);
    next.runtime.lastTestRun = {
      fileId: activeFileId,
      status: "Failed",
      passed: 0,
      failed: testCases.length,
      total: testCases.length,
      duration: "0ms",
      results: [],
      error: errorMessage,
    };
    return next;
  }

  const executor = createTestExecutor(loadContent(next, node.contentId));
  const result = runTests(testCases, executor);
  const duration = `${Math.max(1, Math.round(performance.now() - start))}ms`;
  const status = result.failed === 0 ? "Passed" : "Failed";

  next.runtime.lastTestRun = {
    fileId: activeFileId,
    status,
    passed: result.passed,
    failed: result.failed,
    total: testCases.length,
    duration,
    results: result.results,
    error: result.results.find((item) => item.error)?.error || null,
  };

  appendConsoleLogs(next, [
    buildConsoleLog(
      status === "Passed" ? "info" : "error",
      `${node.name}: ${result.passed}/${testCases.length} tests passed`
    ),
  ]);
  appendExecution(
    next,
    buildExecutionEntry({
      fileId: activeFileId,
      status,
      mode: "tests",
      duration,
      passed: result.passed,
      total: testCases.length,
      summary: `${result.passed}/${testCases.length} tests passed`,
      error: next.runtime.lastTestRun.error,
    })
  );
  touchMetadata(next, activeFileId, { lastExecutedAt: Date.now() });
  return next;
}

export function executeCode(sourceCode, runner) {
  if (typeof runner === "function") return runner(sourceCode);
  return { ok: false, output: null, error: "No execution runtime provided" };
}

export function compareOutput(actual, expected) {
  // Direct string comparison (both converted to trimmed strings)
  if (String(actual).trim() === String(expected).trim()) return true;

  // Try parsing both as JSON to compare structurally (e.g. "5" and 5)
  try {
    const parsedActual = typeof actual === "string" ? JSON.parse(actual) : actual;
    const parsedExpected = typeof expected === "string" ? JSON.parse(expected) : expected;
    if (JSON.stringify(parsedActual) === JSON.stringify(parsedExpected)) return true;
  } catch {
    // ignore parse errors
  }

  return false;
}

export function sectionStyle(section) {
  return {
    gridColumn: `${section.colStart} / ${section.colEnd}`,
    gridRow: `${section.rowStart} / ${section.rowEnd}`,
    minHeight: 0,
  };
}

export function addFolder(appConfig, parentId, name) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) return appConfig;

  const parent = appConfig?.fileTree?.[parentId];
  if (!parent || parent.type !== "folder") return appConfig;
  if (!canWriteNode(appConfig, parentId)) return appConfig;
  if (isDuplicateName(appConfig, parentId, normalizedName)) return appConfig;

  const next = pushSnapshot(appConfig, { type: ACTIONS.ADD_FOLDER, parentId, name: normalizedName });
  const { id, node, metadataId, permissionId } = createNodeBase(next, parentId, normalizedName, "folder");

  next.fileTree[parentId] = {
    ...next.fileTree[parentId],
    children: [...ensureArray(next.fileTree[parentId].children), id],
  };
  next.fileTree[id] = node;
  next.metadata[metadataId] = createMetadata({ id: metadataId, extension: "" });
  next.permissions[permissionId] = createPermissions({ id: permissionId });

  return updateSearchIndex(next);
}

export function addFile(appConfig, parentId, name) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) return appConfig;

  const parent = appConfig?.fileTree?.[parentId];
  if (!parent || parent.type !== "folder") return appConfig;
  if (!canWriteNode(appConfig, parentId)) return appConfig;
  if (isDuplicateName(appConfig, parentId, normalizedName)) return appConfig;

  const next = pushSnapshot(appConfig, { type: ACTIONS.ADD_FILE, parentId, name: normalizedName });
  const { id, node, metadataId, permissionId } = createNodeBase(next, parentId, normalizedName, "file");
  const now = Date.now();

  next.fileTree[parentId] = {
    ...next.fileTree[parentId],
    children: [...ensureArray(next.fileTree[parentId].children), id],
  };
  next.fileTree[id] = node;
  next.metadata[metadataId] = createMetadata({ id: metadataId, extension: getFileExtension(normalizedName) });
  next.permissions[permissionId] = createPermissions({ id: permissionId, execute: true });
  next.fileContents[node.contentId] = {
    id: node.contentId,
    fileId: id,
    language: getLanguageForName(normalizedName),
    size: 0,
    content: "",
    createdAt: now,
    updatedAt: now,
  };
  next.runtime.testCasesByFile =
    next.runtime.testCasesByFile || {};

  next.runtime.testCasesByFile[id] = [];

  return updateSearchIndex(next);
}

export function renameNode(appConfig, nodeId, newName) {
  const normalizedName = normalizeText(newName);
  if (!normalizedName) return appConfig;

  const node = appConfig?.fileTree?.[nodeId];
  if (!node || !canRenameNode(appConfig, nodeId)) return appConfig;

  const parentId = node.parentId;
  if (parentId && isDuplicateName(appConfig, parentId, normalizedName, nodeId)) return appConfig;

  const next = pushSnapshot(appConfig, {
    type: ACTIONS.RENAME_NODE,
    nodeId,
    oldName: node.name,
    newName: normalizedName,
  });
  const renamed = next.fileTree[nodeId];
  const parentPath = renamed.parentId ? next.fileTree[renamed.parentId].path : "/";
  const now = Date.now();

  renamed.name = normalizedName;
  renamed.path = generatePath(parentPath, normalizedName);

  if (renamed.type === "file") {
    renamed.extension = getFileExtension(normalizedName);
    if (renamed.contentId && next.fileContents[renamed.contentId]) {
      next.fileContents[renamed.contentId] = {
        ...next.fileContents[renamed.contentId],
        language: getLanguageForName(normalizedName),
        updatedAt: now,
      };
    }
  } else {
    updateDescendantPaths(next.fileTree, nodeId);
  }

  touchMetadata(next, nodeId, { updatedAt: now });
  return updateSearchIndex(next);
}

export function moveNode(appConfig, nodeId, nextParentId, nextName = null) {
  const node = appConfig?.fileTree?.[nodeId];
  const nextParent = appConfig?.fileTree?.[nextParentId];
  if (!node || !nextParent || nextParent.type !== "folder") return appConfig;
  if (!canMoveNode(appConfig, nodeId) || !canWriteNode(appConfig, nextParentId)) return appConfig;
  if (node.parentId === null) return appConfig;
  if (isDescendantNode(appConfig.fileTree, nodeId, nextParentId)) return appConfig;

  const effectiveName = normalizeText(nextName || node.name);
  if (!effectiveName) return appConfig;

  const safeName =
    nextParentId === node.parentId ? effectiveName : buildMoveName(appConfig, nextParentId, nodeId, effectiveName);

  const next = pushSnapshot(appConfig, {
    type: ACTIONS.MOVE_NODE,
    nodeId,
    oldParentId: node.parentId,
    nextParentId,
    oldName: node.name,
    newName: safeName,
  });

  const moving = next.fileTree[nodeId];
  const oldParent = moving.parentId ? next.fileTree[moving.parentId] : null;
  const now = Date.now();

  if (oldParent && Array.isArray(oldParent.children)) {
    next.fileTree[oldParent.id] = {
      ...oldParent,
      children: oldParent.children.filter((childId) => childId !== nodeId),
    };
  }

  next.fileTree[nextParentId] = {
    ...nextParent,
    children: [...ensureArray(nextParent.children), nodeId],
  };

  moving.parentId = nextParentId;
  moving.name = safeName;
  moving.path = generatePath(nextParent.path, safeName);

  if (moving.type === "folder") updateDescendantPaths(next.fileTree, nodeId);
  touchMetadata(next, nodeId, { updatedAt: now });
  return updateSearchIndex(next);
}

export function duplicateNode(appConfig, nodeId, targetParentId = null) {
  const node = appConfig?.fileTree?.[nodeId];
  if (!node || node.parentId === null) return appConfig;

  const parentId = targetParentId || node.parentId;
  const parent = appConfig?.fileTree?.[parentId];
  if (!parent || parent.type !== "folder" || !canWriteNode(appConfig, parentId)) return appConfig;

  const next = pushSnapshot(appConfig, {
    type: ACTIONS.DUPLICATE_NODE,
    nodeId,
    targetParentId: parentId,
  });

  const duplicateName = buildDuplicateName(next, parentId, node.name);
  const duplicatedId = cloneSubtree(next, nodeId, parentId, duplicateName);
  if (!duplicatedId) return appConfig;

  next.fileTree[parentId] = {
    ...next.fileTree[parentId],
    children: [...ensureArray(next.fileTree[parentId].children), duplicatedId],
  };

  return updateSearchIndex(next);
}

export function deleteNode(appConfig, nodeId) {
  const node = appConfig?.fileTree?.[nodeId];
  if (!node || node.parentId === null || !canDeleteNode(appConfig, nodeId)) return appConfig;

  const next = pushSnapshot(appConfig, { type: ACTIONS.DELETE_NODE, nodeId, parentId: node.parentId });
  const idsToRemove = collectSubtreeIds(next.fileTree, nodeId);
  const parent = next.fileTree[node.parentId];

  if (parent && Array.isArray(parent.children)) {
    next.fileTree[parent.id] = {
      ...parent,
      children: parent.children.filter((childId) => childId !== nodeId),
    };
  }

  for (const id of idsToRemove) {
    const current = next.fileTree[id];
    if (!current) continue;
    if (current.contentId) delete next.fileContents[current.contentId];
    if (current.metadataId) delete next.metadata[current.metadataId];
    if (current.permissionId) delete next.permissions[current.permissionId];
    if (next.runtime?.testCasesByFile?.[id]) {
      delete next.runtime.testCasesByFile[id];
    }
    delete next.fileTree[id];
  }

  next.tabs.openTabs = ensureArray(next.tabs.openTabs).filter((tab) => !idsToRemove.includes(tab.fileId));
  if (idsToRemove.includes(next.tabs.activeTabId)) {
    next.tabs.activeTabId = next.tabs.openTabs[0]?.fileId || null;
  }

  return updateSearchIndex(next);
}

export function toggleFolderExpanded(appConfig, nodeId) {
  const node = appConfig?.fileTree?.[nodeId];
  if (!node || node.type !== "folder") return appConfig;

  const next = pushSnapshot(appConfig, {
    type: ACTIONS.TOGGLE_FOLDER,
    nodeId,
    expanded: !node.expanded,
  });
  next.fileTree[nodeId] = {
    ...next.fileTree[nodeId],
    expanded: !node.expanded,
  };
  return next;
}

export function updateFileContent(appConfig, fileId, nextContent, options = {}) {
  const node = appConfig?.fileTree?.[fileId];
  if (!node || node.type !== "file" || !node.contentId) return appConfig;
  if (!canWriteNode(appConfig, fileId)) return appConfig;

  const currentContent = appConfig?.fileContents?.[node.contentId]?.content || "";
  const content = String(nextContent);
  if (currentContent === content) return appConfig;

  const next = options.recordHistory === false
    ? normalizeWorkspace(appConfig)
    : pushSnapshot(appConfig, { type: ACTIONS.UPDATE_FILE_CONTENT, fileId });

  next.fileContents[node.contentId] = {
    ...next.fileContents[node.contentId],
    content,
    size: content.length,
    updatedAt: Date.now(),
  };

  touchMetadata(next, fileId, {
    size: content.length,
    lastEditedAt: Date.now(),
  });

  const tab = next.tabs.openTabs.find((item) => item.fileId === fileId);
  if (tab) tab.dirty = true;

  return next;
}

export function addTestCase(appConfig, fileId) {
  const targetFileId = fileId || getActiveFileId(appConfig);
  if (!targetFileId) return appConfig;

  const next = normalizeWorkspace(appConfig);
  next.runtime.testCasesByFile = next.runtime.testCasesByFile || {};

  const existing = ensureArray(next.runtime.testCasesByFile[targetFileId]);
  next.runtime.testCasesByFile[targetFileId] = [
    ...existing,
    {
      id: generateId("tc"),
      input: "",
      expected: "",
      hidden: false,
    },
  ];

  return next;
}

export function updateTestCase(appConfig, fileId, testCaseId, updates) {
  const targetFileId = fileId || getActiveFileId(appConfig);
  if (!targetFileId || !testCaseId) return appConfig;

  const next = normalizeWorkspace(appConfig);
  next.runtime.testCasesByFile = next.runtime.testCasesByFile || {};

  const existing = ensureArray(next.runtime.testCasesByFile[targetFileId]);
  next.runtime.testCasesByFile[targetFileId] = existing.map((tc) =>
    tc.id === testCaseId ? { ...tc, ...updates } : tc
  );

  return next;
}

export function deleteTestCase(appConfig, fileId, testCaseId) {
  const targetFileId = fileId || getActiveFileId(appConfig);
  if (!targetFileId || !testCaseId) return appConfig;

  const next = normalizeWorkspace(appConfig);
  next.runtime.testCasesByFile = next.runtime.testCasesByFile || {};

  const existing = ensureArray(next.runtime.testCasesByFile[targetFileId]);
  next.runtime.testCasesByFile[targetFileId] = existing.filter(
    (tc) => tc.id !== testCaseId
  );

  return next;
}

export function changeLayout(appConfig, layoutId) {
  const next = normalizeWorkspace(appConfig);
  const updatedSections = applyLayoutPreset(next.layout?.sections || [], layoutId);
  next.layout = {
    ...next.layout,
    sections: updatedSections,
    activePresetId: layoutId,
  };
  return next;
}

export function dispatchWorkspaceAction(appConfig, action) {
  if (!action?.type) return appConfig;

  switch (action.type) {
    case ACTIONS.ADD_FOLDER:
      return addFolder(appConfig, action.parentId, action.name);
    case ACTIONS.ADD_FILE:
      return addFile(appConfig, action.parentId, action.name);
    case ACTIONS.CHANGE_LAYOUT:
      return changeLayout(appConfig, action.layoutId);
    case ACTIONS.RENAME_NODE:
      return renameNode(appConfig, action.nodeId, action.newName);
    case ACTIONS.DELETE_NODE:
      return deleteNode(appConfig, action.nodeId);
    case ACTIONS.DUPLICATE_NODE:
      return duplicateNode(appConfig, action.nodeId, action.targetParentId);
    case ACTIONS.MOVE_NODE:
      return moveNode(appConfig, action.nodeId, action.nextParentId, action.nextName);
    case ACTIONS.TOGGLE_FOLDER:
      return toggleFolderExpanded(appConfig, action.nodeId);
    case ACTIONS.OPEN_FILE:
      return openTab(appConfig, action.fileId, action.options);
    case ACTIONS.CLOSE_TAB:
      return closeTab(appConfig, action.fileId);
    case ACTIONS.SWITCH_TAB:
      return switchTab(appConfig, action.fileId);
    case ACTIONS.SAVE_FILE:
      return saveFile(appConfig, action.fileId || getActiveFileId(appConfig));
    case ACTIONS.RUN_ACTIVE_FILE:
      return runActiveFile(appConfig, action.fileId || getActiveFileId(appConfig));
    case ACTIONS.RUN_TESTS:
      return runCurrentTests(appConfig, action.fileId || getActiveFileId(appConfig));
    case ACTIONS.UPDATE_FILE_CONTENT:
      return updateFileContent(appConfig, action.fileId, action.content, {
        recordHistory: action.recordHistory,
      });
    case ACTIONS.ADD_TEST_CASE:
      return addTestCase(appConfig, action.fileId);
    case ACTIONS.UPDATE_TEST_CASE:
      return updateTestCase(appConfig, action.fileId, action.testCaseId, action.updates);
    case ACTIONS.DELETE_TEST_CASE:
      return deleteTestCase(appConfig, action.fileId, action.testCaseId);
    case ACTIONS.UNDO:
      return undo(appConfig);
    case ACTIONS.REDO:
      return redo(appConfig);

    // ── Search overlay ────────────────────────────────────────────────────────
    case ACTIONS.OPEN_QUICK_OPEN: {
      const next = normalizeWorkspace(appConfig);
      next.search = { ...next.search, isOpen: true, mode: "file" };
      return next;
    }
    case ACTIONS.OPEN_CONTENT_SEARCH: {
      const next = normalizeWorkspace(appConfig);
      next.search = { ...next.search, isOpen: true, mode: "content" };
      return next;
    }
    case ACTIONS.CLOSE_SEARCH: {
      const next = normalizeWorkspace(appConfig);
      next.search = { ...next.search, isOpen: false };
      return next;
    }

    // ── Command palette ───────────────────────────────────────────────────────
    case ACTIONS.OPEN_COMMAND_PALETTE: {
      const next = normalizeWorkspace(appConfig);
      next.search = { ...next.search, commandPaletteOpen: true };
      return next;
    }
    case ACTIONS.CLOSE_COMMAND_PALETTE: {
      const next = normalizeWorkspace(appConfig);
      next.search = { ...next.search, commandPaletteOpen: false };
      return next;
    }

    default:
      return appConfig;
  }
}

export default {
  ACTIONS,
  clone,
  generateId,
  hydrateWorkspace,
  createMetadata,
  createPermissions,
  createHistorySnapshot,
  commitHistorySnapshot,
  createLayout,
  resolveLayout,
  createTree,
  createComponentConfig,
  resolveComponentRegistry,
  getComponentByType,
  getNodeById,
  getRootNodeId,
  getRootNode,
  isRootNode,
  getNodePermissions,
  canReadNode,
  canWriteNode,
  canRenameNode,
  canDeleteNode,
  canMoveNode,
  canExecuteNode,
  isDuplicateName,
  loadContent,
  updateContent,
  searchFiles,
  searchContent,
  searchWorkspace,
  updateSearchIndex,
  openTab,
  closeTab,
  switchTab,
  saveFile,
  getOpenTabs,
  getActiveFile,
  getActiveFileId,
  getActiveContent,
  getActiveTab,
  hasUnsavedChanges,
  getCurrentProblem,
  getCurrentTestCases,
  getConsoleLogs,
  getExecutions,
  getLatestTestRun,
  canUndo,
  canRedo,
  pushUndoAction,
  undo,
  redo,
  runJavaScript,
  runTests,
  runActiveFile,
  runCurrentTests,
  executeCode,
  compareOutput,
  addFolder,
  addFile,
  renameNode,
  moveNode,
  duplicateNode,
  deleteNode,
  toggleFolderExpanded,
  updateFileContent,
  addTestCase,
  updateTestCase,
  deleteTestCase,
  dispatchWorkspaceAction,
  sectionStyle,
};
