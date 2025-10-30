// ... existing code ...
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getGithubToken = (): string | null => {
    return import.meta.env.VITE_GITHUB_TOKEN || localStorage.getItem("github_token");
  };

  useEffect(() => {
// ... existing code ...
  }, [open]);

  useEffect(() => {
// ... existing code ...
  }, [search, repos]);

  const loadRepositories = useCallback(async () => {
    const token = getGithubToken(); // <-- Use helper
    if (!token) {
      toast({
// ... existing code ...
