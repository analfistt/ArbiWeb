import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, BarChart3, Lock, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { SiBinance, SiCoinbase } from "react-icons/si";
import heroImage from "@assets/generated_images/crypto_trading_hero_background.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl">ArbiTradeX</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-features">Features</a>
            <a href="#exchanges" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-exchanges">Exchanges</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-how-it-works">How It Works</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-sign-in">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="button-sign-up">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
            Turn Crypto Markets Into
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Guaranteed Profits
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-12">
            Find arbitrage opportunities across multiple exchanges in real-time. 
            Our automated engine scans markets 24/7 to deliver consistent returns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6 h-auto backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20" data-testid="button-hero-get-started">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto backdrop-blur-md bg-white/5 hover:bg-white/10 border-white/20 text-white" data-testid="button-hero-sign-in">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start profiting from crypto arbitrage in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="font-display font-bold text-2xl text-primary">1</span>
                </div>
                <h3 className="font-display font-semibold text-2xl mb-3">Deposit Crypto or USD</h3>
                <p className="text-muted-foreground">
                  Fund your account with cryptocurrency or USD. We support multiple payment methods including NowPayments integration.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="font-display font-bold text-2xl text-primary">2</span>
                </div>
                <h3 className="font-display font-semibold text-2xl mb-3">System Finds Opportunities</h3>
                <p className="text-muted-foreground">
                  Our engine continuously scans price differences across Binance, Kraken, Coinbase, and more exchanges.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="font-display font-bold text-2xl text-primary">3</span>
                </div>
                <h3 className="font-display font-semibold text-2xl mb-3">Track Your Profits</h3>
                <p className="text-muted-foreground">
                  Watch your portfolio grow in real-time with detailed analytics, charts, and P/L tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Supported Exchanges */}
      <section id="exchanges" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">Supported Exchanges</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We monitor arbitrage opportunities across the world's leading cryptocurrency exchanges
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { name: "Binance", icon: SiBinance },
              { name: "Coinbase", icon: SiCoinbase },
              { name: "Kraken", icon: RefreshCw },
              { name: "Gemini", icon: Shield },
              { name: "Bitfinex", icon: TrendingUp },
              { name: "KuCoin", icon: BarChart3 },
            ].map((exchange) => (
              <Card key={exchange.name} className="hover-elevate">
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-3">
                  <exchange.icon className="h-12 w-12 text-muted-foreground" />
                  <span className="font-semibold text-lg">{exchange.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="features" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">Why ArbiTradeX</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The most advanced crypto arbitrage platform with enterprise-grade features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover-elevate">
              <CardContent className="p-8 flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl mb-2">Real-Time Market Data</h3>
                  <p className="text-muted-foreground">
                    Live price feeds from CoinGecko API ensure you never miss a profitable opportunity.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-8 flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl mb-2">Automated Arbitrage Engine</h3>
                  <p className="text-muted-foreground">
                    Our sophisticated algorithm identifies and executes profitable trades automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-8 flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl mb-2">Simple Dashboard</h3>
                  <p className="text-muted-foreground">
                    Track your portfolio, profits, and performance with beautiful charts and analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="p-8 flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl mb-2">Secure Platform</h3>
                  <p className="text-muted-foreground">
                    Bank-grade security with encrypted data, secure authentication, and protected transactions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Start Profiting from Arbitrage Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of traders already making consistent profits with automated arbitrage
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto" data-testid="button-cta-sign-up">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="font-display font-bold text-xl">ArbiTradeX</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The most advanced crypto arbitrage trading platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground">Features</a>
                <a href="#exchanges" className="block text-sm text-muted-foreground hover:text-foreground">Exchanges</a>
                <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground">How It Works</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Risk Disclosure</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 ArbiTradeX. All rights reserved. Cryptocurrency trading involves risk.
          </div>
        </div>
      </footer>
    </div>
  );
}
