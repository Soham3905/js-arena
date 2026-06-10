import { openDB } from "idb";

const DB_NAME = "sdui_workspace_db";
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("workspace")) {
        db.createObjectStore("workspace");
      }
    },
  });
}

export async function getWorkspacePart(key) {
  const db = await initDB();
  return db.get("workspace", key);
}

export async function setWorkspacePart(key, value) {
  const db = await initDB();
  return db.put("workspace", value, key);
}
