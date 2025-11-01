import JSZip from "jszip";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

export class ExportService {
  static async exportAsZip(files: FileNode[], projectName: string = "project"): Promise<void> {
    try {
      console.log('??? Starting ZIP export...', { fileCount: files.length, projectName });
      
      if (!files || files.length === 0) {
        throw new Error("No files to export. Please generate some files first.");
      }

      const zip = new JSZip();
      let fileCount = 0;

      const addToZip = (node: FileNode, path: string = "") => {
        const fullPath = path ? `${path}/${node.name}` : node.name;

        if (node.type === "file") {
          if (node.content !== undefined && node.content !== null) {
            console.log(`?? Adding file: ${fullPath} (${node.content.length} bytes)`);
            zip.file(fullPath, node.content);
            fileCount++;
          } else {
            console.warn(`?? Skipping file with no content: ${fullPath}`);
          }
        } else if (node.type === "folder" && node.children) {
          console.log(`?? Processing folder: ${fullPath}`);
          // Create empty folder if it has no children
          if (node.children.length === 0) {
            zip.folder(fullPath);
          }
          node.children.forEach((child) => addToZip(child, fullPath));
        }
      };

      files.forEach((file) => addToZip(file));

      if (fileCount === 0) {
        throw new Error("No valid files found to export. All files appear to be empty.");
      }

      console.log(`? Added ${fileCount} files to ZIP, generating archive...`);

      // Generate ZIP with compression and progress updates
      const blob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      }, (metadata) => {
        console.log(`?? Generating ZIP: ${metadata.percent.toFixed(1)}%`);
      });

      console.log(`? ZIP generated successfully (${(blob.size / 1024).toFixed(2)} KB)`);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}-${Date.now()}.zip`;
      a.style.display = 'none';
      
      // Add to DOM, click, and cleanup
      document.body.appendChild(a);
      
      // Force click after a small delay to ensure browser recognizes it
      setTimeout(() => {
        console.log('?? Triggering download...');
        a.click();
        
        // Cleanup after download starts
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('? ZIP export completed successfully!');
        }, 100);
      }, 10);

    } catch (error) {
      console.error('? ZIP export failed:', error);
      throw new Error(`Failed to export ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
