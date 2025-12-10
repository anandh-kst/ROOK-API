import fs from "fs/promises";
import path from "path";
import paths from "../config/paths.js";

export async function getImageUrl(fileName) {
  const folderPath = paths.dataImages;
  const defaultUrl = "default.png";
  const extensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];
  for (const ext of extensions) {
    const fileWithExt = fileName + ext;
    const filePath = path.join(folderPath, fileWithExt);
    try {
      await fs.access(filePath);
      return `${fileWithExt}`;
    } catch {
      continue;
    }
  }
  return defaultUrl;
}
