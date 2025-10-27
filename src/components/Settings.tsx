import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";

interface SettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Settings = ({ open, onOpenChange }: SettingsProps) => {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedAnthropic = localStorage.getItem("anthropic_api_key");
    const savedGithub = localStorage.getItem("github_token");
    if (savedAnthropic) setAnthropicKey(savedAnthropic);
    if (savedGithub) setGithubToken(savedGithub);
  }, [open]);

  const handleSave = () => {
    if (anthropicKey) {
      localStorage.setItem("anthropic_api_key", anthropicKey);
    }
    if (githubToken) {
      localStorage.setItem("github_token", githubToken);
    }
    toast({
      title: "Settings Saved",
      description: "API keys have been securely stored",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            API Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your API keys for AI and GitHub integration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="anthropic">Anthropic API Key</Label>
            <div className="relative">
              <Input
                id="anthropic"
                type={showAnthropic ? "text" : "password"}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowAnthropic(!showAnthropic)}
              >
                {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub Personal Access Token</Label>
            <div className="relative">
              <Input
                id="github"
                type={showGithub ? "text" : "password"}
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowGithub(!showGithub)}
              >
                {showGithub ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Create token at{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                github.com/settings/tokens
              </a>{" "}
              (needs repo scope)
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Keys</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
