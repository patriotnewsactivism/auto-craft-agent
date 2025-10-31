import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Eye, EyeOff, CheckCircle, Zap, Brain, Gauge, Mic } from "lucide-react";
import { getAllModels } from "@/lib/geminiModels";

interface SettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Settings = ({ open, onOpenChange }: SettingsProps) => {
  const [googleKey, setGoogleKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [githubToken, setGithubToken] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [showGoogle, setShowGoogle] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const [showSupabase, setShowSupabase] = useState(false);
  const { toast } = useToast();
  const availableModels = getAllModels();

  // Check for environment variables
  // VITE_ prefix exposes them to the client-side (browser)
  const googleKeyFromEnv = import.meta.env.VITE_GOOGLE_API_KEY;
  const githubTokenFromEnv = import.meta.env.VITE_GITHUB_TOKEN;
  const supabaseUrlFromEnv = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKeyFromEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    // Prioritize environment variables, fall back to local storage
    const savedGoogle = googleKeyFromEnv || localStorage.getItem("google_api_key");
    const savedModel = localStorage.getItem("gemini_model") || "gemini-2.5-flash";
    const savedGithub = githubTokenFromEnv || localStorage.getItem("github_token");
    const savedSupabaseUrl = supabaseUrlFromEnv || localStorage.getItem("supabase_url");
    const savedSupabaseKey = supabaseKeyFromEnv || localStorage.getItem("supabase_key");
    
    if (savedGoogle) setGoogleKey(savedGoogle);
    setSelectedModel(savedModel);
    if (savedGithub) setGithubToken(savedGithub);
    if (savedSupabaseUrl) setSupabaseUrl(savedSupabaseUrl);
    if (savedSupabaseKey) setSupabaseKey(savedSupabaseKey);
  }, [open, googleKeyFromEnv, githubTokenFromEnv, supabaseUrlFromEnv, supabaseKeyFromEnv]);

  const handleSave = () => {
    // Only save to local storage if not provided by env
    if (googleKey && !googleKeyFromEnv) {
      localStorage.setItem("google_api_key", googleKey);
    }
    localStorage.setItem("gemini_model", selectedModel);
    if (githubToken && !githubTokenFromEnv) {
      localStorage.setItem("github_token", githubToken);
    }
    if (supabaseUrl && !supabaseUrlFromEnv) {
      localStorage.setItem("supabase_url", supabaseUrl);
    }
    if (supabaseKey && !supabaseKeyFromEnv) {
      localStorage.setItem("supabase_key", supabaseKey);
    }
    toast({
      title: "Settings Saved ?",
      description: "API keys and model preferences have been securely stored in your browser and will persist across sessions.",
    });
    onOpenChange(false);
  };

  const getModelIcon = (modelId: string) => {
    if (modelId.includes('pro')) return <Brain className="h-4 w-4" />;
    if (modelId.includes('flash-lite')) return <Zap className="h-4 w-4" />;
    if (modelId.includes('audio')) return <Mic className="h-4 w-4" />;
    return <Gauge className="h-4 w-4" />;
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
            Configure your API keys for AI and GitHub integration. Your keys are saved locally in your browser and automatically persist.
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
                autoComplete="off"
                data-form-type="other"
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
            <Label htmlFor="model">Gemini Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      {getModelIcon(model.id)}
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the model that best fits your needs. Flash is recommended for most tasks.
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
                autoComplete="off"
                data-form-type="other"
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

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Supabase - Autonomous Memory</h3>
              <span className="text-xs text-muted-foreground">(Optional - Enables learning)</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">Supabase Project URL</Label>
              <Input
                id="supabaseUrl"
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder={supabaseUrlFromEnv ? "Loaded from environment" : "https://xxx.supabase.co"}
                disabled={!!supabaseUrlFromEnv}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabaseKey">Supabase Anon Key</Label>
              <div className="relative">
                <Input
                  id="supabaseKey"
                  type={showSupabase ? "text" : "password"}
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder={supabaseKeyFromEnv ? "Loaded from environment" : "eyJhbGciOi..."}
                  className="pr-10"
                  disabled={!!supabaseKeyFromEnv}
                  autoComplete="off"
                  data-form-type="other"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSupabase(!showSupabase)}
                  disabled={!!supabaseKeyFromEnv}
                >
                  {supabaseKeyFromEnv ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : showSupabase ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get from{" "}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Supabase Dashboard
                </a>{" "}
                ? Project Settings ? API
              </p>
            </div>
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

