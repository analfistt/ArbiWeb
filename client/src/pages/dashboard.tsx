import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, LogOut, User } from "lucide-react";
import { DepositDialog } from "@/components/deposit-dialog";
import { WithdrawDialog } from "@/components/withdraw-dialog";
import { PriceChart } from "@/components/price-chart";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { logout, token } = useAuth();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch arbitrage opportunities
  const { data: opportunities, isLoading: isOpportunitiesLoading } = useQuery({
    queryKey: ["/api/arbitrage-opportunities"],
    queryFn: async () => {
      const response = await fetch("/api/arbitrage-opportunities");
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl">ArbiTradeX</span>
            </div>
          </div>
        </nav>
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    totalBalance = 0,
    availableBalance = 0,
    realizedPL = 0,
    unrealizedPL = 0,
    activePositions = 0,
    positions = [],
  } = dashboardData || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl">ArbiTradeX</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" data-testid="button-profile">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold tabular-nums" data-testid="text-total-balance">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">USD Value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Realized P/L</CardTitle>
              <TrendingUp className={`h-4 w-4 ${realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-display font-bold tabular-nums ${realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-realized-pl">
                {realizedPL >= 0 ? '+' : ''}${realizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All-time profits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized P/L</CardTitle>
              <TrendingUp className={`h-4 w-4 ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-display font-bold tabular-nums ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-unrealized-pl">
                {unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Positions</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold tabular-nums" data-testid="text-active-positions">
                {activePositions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Open trades</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Portfolio & Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Portfolio Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">No positions yet</p>
                    <p className="text-sm text-muted-foreground">Make a deposit to start trading</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Entry</TableHead>
                          <TableHead className="text-right">Current Price</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="text-right">P/L USD</TableHead>
                          <TableHead className="text-right">P/L %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positions.map((position: any) => (
                          <TableRow key={position.id} data-testid={`row-position-${position.id}`}>
                            <TableCell className="font-semibold">{position.assetSymbol}</TableCell>
                            <TableCell className="text-right tabular-nums">{position.quantity}</TableCell>
                            <TableCell className="text-right tabular-nums">${position.averageEntryPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">${position.currentValueUsd.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">${position.currentValueUsd.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              <span className={position.profitLossUsd >= 0 ? "text-green-600" : "text-red-600"}>
                                {position.profitLossUsd >= 0 ? "+" : ""}${position.profitLossUsd.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={position.profitLossPercent >= 0 ? "default" : "destructive"} className="tabular-nums">
                                {position.profitLossPercent >= 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {position.profitLossPercent >= 0 ? "+" : ""}{position.profitLossPercent.toFixed(2)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Charts */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Price Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="btc" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="btc" data-testid="tab-btc">BTC</TabsTrigger>
                    <TabsTrigger value="eth" data-testid="tab-eth">ETH</TabsTrigger>
                    <TabsTrigger value="sol" data-testid="tab-sol">SOL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="btc" className="pt-4">
                    <PriceChart symbol="BTC" />
                  </TabsContent>
                  <TabsContent value="eth" className="pt-4">
                    <PriceChart symbol="ETH" />
                  </TabsContent>
                  <TabsContent value="sol" className="pt-4">
                    <PriceChart symbol="SOL" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Opportunities & Wallet */}
          <div className="space-y-8">
            {/* Arbitrage Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Live Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOpportunitiesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  opportunities?.slice(0, 5).map((opp: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg hover-elevate" data-testid={`card-opportunity-${idx}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-bold text-lg">{opp.asset}</span>
                        <Badge className="bg-green-600 text-white">
                          {opp.spread.toFixed(2)}% Spread
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Buy on {opp.buyExchange}</span>
                          <span className="font-semibold tabular-nums">${opp.buyPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sell on {opp.sellExchange}</span>
                          <span className="font-semibold tabular-nums">${opp.sellPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Wallet Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-2xl font-display font-bold tabular-nums" data-testid="text-available-balance">
                    ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    className="flex-1" 
                    onClick={() => setDepositOpen(true)}
                    data-testid="button-deposit"
                  >
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    Deposit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setWithdrawOpen(true)}
                    data-testid="button-withdraw"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </div>
  );
}
