import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password);
    } catch (error) {
      // Error is handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Top Nav */}
      <nav className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl">ArbiTradeX</span>
            </div>
          </Link>
          <Link href="/login">
            <Button variant="outline" data-testid="button-sign-in">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Centered Signup Card - Binance Style */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-border">
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-3xl font-display font-bold tracking-tight">
              Create an account
            </CardTitle>
            <CardDescription className="text-base">
              Start profiting from crypto arbitrage today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11"
                  data-testid="input-confirm-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
                <a className="text-primary hover:text-primary/90 font-medium transition-colors" data-testid="link-sign-in">
                  Sign in
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
