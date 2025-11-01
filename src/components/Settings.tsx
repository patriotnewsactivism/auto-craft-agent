import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Eye, EyeOff, CheckCircle, Zap, Brain, Gauge, Mic, LogIn, LogOut, Github } from "lucide-react";
import { getAllModels } from "@/lib/geminiModels";
import { oauthService } from "@/lib/oauthService";
import { Separator } from "@/components/ui/separator";

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
  const [githubUser, setGithubUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();
  const availableModels = getAllModels();

  // Check for environment variables
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

    // Check GitHub authentication
    if (oauthService.isAuthenticated('github')) {
      loadGitHubUser();
    }
  }, [open, googleKeyFromEnv, githubTokenFromEnv, supabaseUrlFromEnv, supabaseKeyFromEnv]);

  const loadGitHubUser = async () => {
    try {
      const user = await oauthService.getGitHubUser();
      setGithubUser(user);
    } catch (error) {
      console.error('Failed to load GitHub user:', error);
    }
  };

  const handleGitHubLogin = async () => {
    setIsAuthenticating(true);
    try {
      await oauthService.loginWithGitHub();
      await loadGitHubUser();
      toast({
        title: "? Connected to GitHub",
        description: "You can now sync your projects directly to GitHub!",
      });
    } catch (error) {
      toast({
        title: "? GitHub Login Failed",
        description: error instanceof Error ? error.message : "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await oauthService.loginWithGoogle();
      toast({
        title: "? Connected to Google AI",
        description: "You're ready to use Gemini models!",
      });
      // Reload keys
      const token = oauthService.getToken('google');
      if (token) setGoogleKey(token.accessToken);
    } catch (error) {
      toast({
        title: "? Google Login Failed",
        description: error instanceof Error ? error.message : "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSupabaseLogin = async () => {
    setIsAuthenticating(true);
    try {
      await oauthService.loginWithSupabase();
      toast({
        title: "? Connected to Supabase",
        description: "Autonomous learning features enabled!",
      });
    } catch (error) {
      toast({
        title: "? Supabase Login Failed",
        description: error instanceof Error ? error.message : "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = (provider: 'github' | 'google' | 'supabase') => {
    oauthService.logout(provider);
    if (provider === 'github') {
      setGithubToken("");
      setGithubUser(null);
    } else if (provider === 'google') {
      setGoogleKey("");
    } else if (provider === 'supabase') {
      setSupabaseKey("");
      setSupabaseUrl("");
    }
    toast({
      title: "?? Logged out",
      description: `Disconnected from ${provider}`,
    });
  };

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
      title: "? Settings Saved",
      description: "Your configuration has been updated successfully.",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto tech-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <span className="gradient-text">Configuration</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Connect your services with one-click OAuth login. No more copying API keys!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* GitHub OAuth */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">GitHub</Label>
              </div>
              {oauthService.isAuthenticated('github') && githubUser && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <img src={githubUser.avatar_url} alt={githubUser.login} className="w-6 h-6 rounded-full" />
                  <span>{githubUser.login}</span>
                </div>
              )}
            </div>
            
            {!oauthService.isAuthenticated('github') && !githubTokenFromEnv ? (
              <>
                <Button 
                  onClick={handleGitHubLogin} 
                  disabled={isAuthenticating}
                  className="w-full bg-primary hover:bg-primary/90 glow-border"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {isAuthenticating ? "Connecting..." : "Login with GitHub"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or use token</span>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type={showGithub ? "text" : "password"}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_..."
                    className="pr-10 bg-input border-border"
                    autoComplete="off"
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
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Connected</span>
                </div>
                {!githubTokenFromEnv && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleLogout('github')}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Google AI OAuth */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 text-primary">??</div>
              <Label className="text-base font-semibold">Google AI (Gemini)</Label>
            </div>
            
            {!oauthService.isAuthenticated('google') && !googleKeyFromEnv ? (
              <>
                <Button 
                  onClick={handleGoogleLogin} 
                  disabled={isAuthenticating}
                  className="w-full bg-primary hover:bg-primary/90 glow-border"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {isAuthenticating ? "Connecting..." : "Login with Google"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or use API key</span>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type={showGoogle ? "text" : "password"}
                    value={googleKey}
                    onChange={(e) => setGoogleKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="pr-10 bg-input border-border"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowGoogle(!showGoogle)}
                  >
                    {showGoogle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Connected</span>
                </div>
                {!googleKeyFromEnv && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleLogout('google')}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                )}
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="model" className="text-sm">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        {getModelIcon(model.id)}
                        <div className="text-left">
                          <div className="font-medium text-sm">{model.name}</div>
                          <div className="text-xs text-muted-foreground hidden sm:block">{model.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Supabase OAuth */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 text-accent">??</div>
                <Label className="text-base font-semibold">Supabase</Label>
              </div>
              <span className="text-xs text-muted-foreground bg-accent/10 px-2 py-1 rounded">Optional</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enable autonomous learning and project memory
            </p>
            
            {!oauthService.isAuthenticated('supabase') && !supabaseKeyFromEnv ? (
              <>
                <Button 
                  onClick={handleSupabaseLogin} 
                  disabled={isAuthenticating || !supabaseUrl}
                  variant="outline"
                  className="w-full border-accent/30 hover:bg-accent/10"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {isAuthenticating ? "Connecting..." : "Login with Supabase"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xxx.supabase.co"
                    className="bg-input border-border"
                    autoComplete="off"
                  />
                  <div className="relative">
                    <Input
                      type={showSupabase ? "text" : "password"}
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      placeholder="eyJhbGciOi..."
                      className="pr-10 bg-input border-border"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSupabase(!showSupabase)}
                    >
                      {showSupabase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent/20 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span className="text-sm">Connected</span>
                </div>
                {!supabaseKeyFromEnv && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleLogout('supabase')}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto border-border">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto bg-primary hover:bg-primary/90 glow-border">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
