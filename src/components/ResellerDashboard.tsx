import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Copy, 
  Share2, 
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { resellerService, type ResellerProfile, type ResellerStats } from "@/lib/resellerService";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const ResellerDashboard = () => {
  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [stats, setStats] = useState<ResellerStats | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadResellerData();
  }, []);

  const loadResellerData = async () => {
    // In a real app, get userId from auth
    const userId = localStorage.getItem('user_id') || 'demo_user';
    
    const resellerProfile = await resellerService.getResellerProfile(userId);
    
    if (resellerProfile) {
      setProfile(resellerProfile);
      const resellerStats = await resellerService.getResellerStats(resellerProfile.id);
      setStats(resellerStats);
    }
  };

  const handleRegister = async () => {
    if (!name || !email) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    try {
      const userId = localStorage.getItem('user_id') || 'demo_user';
      localStorage.setItem('user_id', userId);

      const newProfile = await resellerService.registerReseller({
        userId,
        email,
        name
      });

      setProfile(newProfile);
      toast({
        title: "🎉 Welcome to the Reseller Program!",
        description: `Your unique code: ${newProfile.resellerCode}. Start earning 40% on every sale!`
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const copyReferralLink = () => {
    if (!profile) return;
    
    const link = resellerService.getResellerLink(profile.resellerCode);
    navigator.clipboard.writeText(link);
    
    toast({
      title: "✅ Copied!",
      description: "Referral link copied to clipboard"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="tech-card border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl sm:text-4xl">
                <span className="gradient-text">Reseller Program</span>
              </CardTitle>
              <CardDescription className="text-base sm:text-lg mt-4">
                Earn a flat <span className="text-primary font-bold text-xl">40% commission</span> on every sale!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-3xl font-bold text-primary">40%</div>
                  <div className="text-sm text-muted-foreground mt-1">Commission Rate</div>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="text-3xl font-bold text-accent">∞</div>
                  <div className="text-sm text-muted-foreground mt-1">Unlimited Earnings</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-3xl font-bold text-primary">$0</div>
                  <div className="text-sm text-muted-foreground mt-1">Sign Up Fee</div>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Why Join?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Flat 40% commission - no tiers, no complications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Recurring revenue on all subscription renewals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Real-time dashboard with detailed analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Fast payouts - get paid within 7 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Dedicated reseller support team</span>
                  </li>
                </ul>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Get Started</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1 bg-input border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="mt-1 bg-input border-border"
                    />
                  </div>
                  <Button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full bg-primary hover:bg-primary/90 glow-border text-lg py-6"
                  >
                    {isRegistering ? "Registering..." : "Join Reseller Program"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
              Reseller Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile.name}!
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 w-fit">
            40% Commission Rate
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="tech-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {formatCurrency(stats?.totalEarnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time revenue
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-accent">
                {formatCurrency(stats?.monthlyEarnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current month
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payout
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {formatCurrency(stats?.pendingPayouts || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available to withdraw
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Customers
              </CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {stats?.activeSubscriptions || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {stats?.totalReferrals || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="tech-card border-primary/20 glow-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link to earn 40% commission on every sale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                readOnly
                value={resellerService.getResellerLink(profile.resellerCode)}
                className="flex-1 bg-input border-border font-mono text-sm"
              />
              <Button
                onClick={copyReferralLink}
                className="bg-primary hover:bg-primary/90"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="font-mono">
                Code: {profile.resellerCode}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary/30">
                40% on all sales
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Additional Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="tech-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-accent" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Sale Value</span>
                <span className="font-semibold">{formatCurrency(stats?.averageSaleValue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your Commission (40%)</span>
                <span className="font-semibold text-primary">
                  {formatCurrency((stats?.averageSaleValue || 0) * 0.4)}
                </span>
              </div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Referrals</span>
                <span className="font-semibold">{stats?.totalReferrals || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                <span className="font-semibold text-accent">{stats?.activeSubscriptions || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between border-primary/30 hover:bg-primary/10"
                disabled={(stats?.pendingPayouts || 0) < 50}
              >
                <span>Request Payout</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              {(stats?.pendingPayouts || 0) < 50 && (
                <p className="text-xs text-muted-foreground text-center">
                  Minimum payout: $50.00
                </p>
              )}
              <Button
                variant="outline"
                className="w-full justify-between border-accent/30 hover:bg-accent/10"
              >
                <span>View All Sales</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
              >
                <span>Update Payment Method</span>
                <CreditCard className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
