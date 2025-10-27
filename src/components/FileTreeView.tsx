import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

interface FileTreeViewProps {
  files: FileNode[];
  onFileSelect?: (file: FileNode) => void;
}

const TreeNode = ({ 
  node, 
  depth = 0,
  onFileSelect 
}: { 
  node: FileNode; 
  depth?: number;
  onFileSelect?: (file: FileNode) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = node.type === "folder";

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1 px-2 hover:bg-secondary/50 cursor-pointer transition-colors ${
          depth > 0 ? 'ml-' + (depth * 4) : ''
        }`}
        onClick={() => {
          if (isFolder) {
            setIsOpen(!isOpen);
          } else {
            onFileSelect?.(node);
          }
        }}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder && (
          <span className="text-muted-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        )}
        {isFolder ? (
          isOpen ? <FolderOpen className="h-4 w-4 text-accent" /> : <Folder className="h-4 w-4 text-accent" />
        ) : (
          <File className="h-4 w-4 text-primary" />
        )}
        <span className="text-sm code-font">{node.name}</span>
      </div>
      {isFolder && isOpen && node.children?.map((child, index) => (
        <TreeNode key={index} node={child} depth={depth + 1} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
};

export const FileTreeView = ({ files, onFileSelect }: FileTreeViewProps) => {
  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Folder className="h-4 w-4 text-accent" />
        Generated Files
      </h3>
      <div className="space-y-1">
        {files.map((file, index) => (
          <TreeNode key={index} node={file} onFileSelect={onFileSelect} />
        ))}
      </div>
    </Card>
  );
};
