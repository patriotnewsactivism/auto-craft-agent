import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { useState } from 'react';

interface FileDiff {
  path: string;
  oldContent: string;
  newContent: string;
  status: 'modified' | 'added' | 'deleted';
}

interface DiffViewerProps {
  diffs: FileDiff[];
  onAccept: (diffs: FileDiff[]) => void;
  onReject: () => void;
}

export function DiffViewer({ diffs, onAccept, onReject }: DiffViewerProps) {
  const [selectedDiffs, setSelectedDiffs] = useState<Set<string>>(
    new Set(diffs.map(d => d.path))
  );
  const [splitView, setSplitView] = useState(true);

  function toggleDiff(path: string) {
    const newSelected = new Set(selectedDiffs);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedDiffs(newSelected);
  }

  function acceptSelected() {
    const acceptedDiffs = diffs.filter(d => selectedDiffs.has(d.path));
    onAccept(acceptedDiffs);
  }

  function getStatusColor(status: FileDiff['status']) {
    switch (status) {
      case 'added':
        return 'text-green-600';
      case 'modified':
        return 'text-yellow-600';
      case 'deleted':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  function getStatusBadge(status: FileDiff['status']) {
    switch (status) {
      case 'added':
        return 'Added';
      case 'modified':
        return 'Modified';
      case 'deleted':
        return 'Deleted';
      default:
        return '';
    }
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 p-3">
        <div>
          <h3 className="font-semibold text-sm">AI Generated Changes</h3>
          <p className="text-xs text-muted-foreground">
            {selectedDiffs.size} of {diffs.length} files selected
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSplitView(!splitView)}
          >
            {splitView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="ml-2">{splitView ? 'Split' : 'Unified'}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
          >
            <X className="h-4 w-4 mr-2" />
            Reject All
          </Button>
          <Button
            size="sm"
            onClick={acceptSelected}
            disabled={selectedDiffs.size === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Accept {selectedDiffs.size > 0 ? `(${selectedDiffs.size})` : ''}
          </Button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto">
        {diffs.map((diff, index) => {
          const isSelected = selectedDiffs.has(diff.path);

          return (
            <div key={index} className="border-b border-border last:border-b-0">
              {/* File Header */}
              <div
                className="flex items-center justify-between p-3 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => toggleDiff(diff.path)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDiff(diff.path)}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <p className="font-mono text-sm font-medium">{diff.path}</p>
                    <p className={`text-xs font-medium ${getStatusColor(diff.status)}`}>
                      {getStatusBadge(diff.status)}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {diff.status === 'modified' && (
                    <span>
                      {diff.oldContent.split('\n').length} → {diff.newContent.split('\n').length} lines
                    </span>
                  )}
                </div>
              </div>

              {/* Diff Content */}
              {isSelected && (
                <div className="p-4 bg-background">
                  {diff.status === 'deleted' ? (
                    <div className="p-4 text-center text-red-600">
                      <p className="font-medium">This file will be deleted</p>
                      <pre className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded text-left text-xs overflow-auto">
                        {diff.oldContent}
                      </pre>
                    </div>
                  ) : diff.status === 'added' ? (
                    <div className="p-4 text-center text-green-600">
                      <p className="font-medium">This file will be created</p>
                      <pre className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded text-left text-xs overflow-auto">
                        {diff.newContent}
                      </pre>
                    </div>
                  ) : (
                    <ReactDiffViewer
                      oldValue={diff.oldContent}
                      newValue={diff.newContent}
                      splitView={splitView}
                      compareMethod={DiffMethod.WORDS}
                      useDarkTheme={document.documentElement.classList.contains('dark')}
                      styles={{
                        variables: {
                          dark: {
                            diffViewerBackground: '#1e1e1e',
                            addedBackground: '#1a4d2e',
                            addedColor: '#e3f9e5',
                            removedBackground: '#5a1919',
                            removedColor: '#fdd8d8',
                            wordAddedBackground: '#2d6b3d',
                            wordRemovedBackground: '#7a2828',
                            codeFoldBackground: '#2a2a2a',
                          },
                          light: {
                            diffViewerBackground: '#ffffff',
                            addedBackground: '#d1f4e0',
                            addedColor: '#176f2c',
                            removedBackground: '#fccfcf',
                            removedColor: '#ab1212',
                            wordAddedBackground: '#b7efcc',
                            wordRemovedBackground: '#ffb8b8',
                          },
                        },
                        line: {
                          fontSize: '12px',
                          fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
                        },
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>Review changes carefully before accepting</span>
        <span>
          {diffs.filter(d => d.status === 'added').length} added, 
          {diffs.filter(d => d.status === 'modified').length} modified, 
          {diffs.filter(d => d.status === 'deleted').length} deleted
        </span>
      </div>
    </Card>
  );
}
