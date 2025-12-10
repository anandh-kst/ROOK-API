import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicFolder = path.join(projectRoot, "public");
const imagesFolder = path.join(publicFolder, "images");
const deviceImages = path.join(imagesFolder, "devices");
const dataImages = path.join(imagesFolder, "data");

export default {
  deviceImages,
  dataImages,
};
