import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Eye, EyeOff, CheckCircle } from "lucide-react";

interface SettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Settings = ({ open, onOpenChange }: SettingsProps) => {
  const [googleKey, setGoogleKey] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showGoogle, setShowGoogle] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const { toast } = useToast();

  // Check for environment variables
  // VITE_ prefix exposes them to the client-side (browser)
  const googleKeyFromEnv = import.meta.env.VITE_GOOGLE_API_KEY;
  const githubTokenFromEnv = import.meta.env.VITE_GITHUB_TOKEN;

  useEffect(() => {
    // Prioritize environment variables, fall back to local storage
    const savedGoogle = googleKeyFromEnv || localStorage.getItem("google_api_key");
    const savedGithub = githubTokenFromEnv || localStorage.getItem("github_token");
    
    if (savedGoogle) setGoogleKey(savedGoogle);
    if (savedGithub) setGithubToken(savedGithub);
  }, [open, googleKeyFromEnv, githubTokenFromEnv]);

  const handleSave = () => {
    // Only save to local storage if not provided by env
    if (googleKey && !googleKeyFromEnv) {
      localStorage.setItem("google_api_key", googleKey);
    }
    if (githubToken && !githubTokenFromEnv) {
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
            <Label htmlFor="google">Google AI API Key</Label>
            <div className="relative">
              <Input
                id="google"
                type={showGoogle ? "text" : "password"}
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder={googleKeyFromEnv ? "Loaded from environment" : "AIzaSy..."}
                className="pr-10"
                disabled={!!googleKeyFromEnv}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowGoogle(!showGoogle)}
                disabled={!!googleKeyFromEnv}
              >
                {googleKeyFromEnv ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : showGoogle ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
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
                placeholder={githubTokenFromEnv ? "Loaded from environment" : "ghp_..."}
                className="pr-10"
                disabled={!!githubTokenFromEnv}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowGithub(!showGithub)}
                disabled={!!githubTokenFromEnv}
              >
                {githubTokenFromEnv ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : showGithub ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
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

