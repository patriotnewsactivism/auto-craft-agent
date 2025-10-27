import JSZip from "jszip";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

export class ExportService {
  static async exportAsZip(files: FileNode[], projectName: string = "project") {
    const zip = new JSZip();

    const addToZip = (node: FileNode, path: string = "") => {
      const fullPath = path ? `${path}/${node.name}` : node.name;

      if (node.type === "file" && node.content) {
        zip.file(fullPath, node.content);
      } else if (node.type === "folder" && node.children) {
        node.children.forEach((child) => addToZip(child, fullPath));
      }
    };

    files.forEach((file) => addToZip(file));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static flattenFileTree(files: FileNode[]): Array<{ path: string; content: string }> {
    const result: Array<{ path: string; content: string }> = [];

    const traverse = (node: FileNode, path: string = "") => {
      const fullPath = path ? `${path}/${node.name}` : node.name;

      if (node.type === "file" && node.content) {
        result.push({ path: fullPath, content: node.content });
      } else if (node.type === "folder" && node.children) {
        node.children.forEach((child) => traverse(child, fullPath));
      }
    };

    files.forEach((file) => traverse(file));
    return result;
  }
}
