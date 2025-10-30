// ... existing code ...
import { Settings as SettingsIcon, Eye, EyeOff, CheckCircle } from "lucide-react";

interface SettingsProps {
// ... existing code ...
  const [googleKey, setGoogleKey] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showGoogle, setShowGoogle] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const { toast } = useToast();

  // Check for environment variables
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
// ... existing code ...
    // Only save to local storage if not provided by env
    if (googleKey && !googleKeyFromEnv) {
      localStorage.setItem("google_api_key", googleKey);
    }
    if (githubToken && !githubTokenFromEnv) {
      localStorage.setItem("github_token", githubToken);
    }
    toast({
// ... existing code ...
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
// ... existing code ...
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="google">Google AI API Key</Label>
            <div className="relative">
              <Input
// ... existing code ...
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder={googleKeyFromEnv ? "Loaded from environment" : "AIzaSy..."}
                className="pr-10"
                disabled={!!googleKeyFromEnv}
              />
              <Button
// ... existing code ...
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
// ... existing code ...
          <div className="space-y-2">
            <Label htmlFor="github">GitHub Personal Access Token</Label>
            <div className="relative">
              <Input
// ... existing code ...
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder={githubTokenFromEnv ? "Loaded from environment" : "ghp_..."}
                className="pr-10"
                disabled={!!githubTokenFromEnv}
              />
              <Button
// ... existing code ...
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
// ... existing code ...
