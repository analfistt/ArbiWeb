import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, 
  Activity, BarChart3, ArrowLeftRight 
} from "lucide-react";
import { DepositDialog } from "@/components/deposit-dialog";
import { WithdrawDialog } from "@/components/withdraw-dialog";
import { TradingChart } from "@/components/trading-chart";
import { Timeframe } from "@/components/timeframe-selector";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// KPI Summary Card Component
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  testId 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: any; 
  trend?: 'up' | 'down' | 'neutral'; 
  testId?: string; 
}) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-[hsl(var(--success))]';
    if (trend === 'down') return 'text-red-600 dark:text-[hsl(var(--destructive))]';
    return 'text-foreground';
  };

  return (
    <Card className="transition-all duration-150 hover:shadow-md overflow-visible">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className={`text-3xl font-bold tabular-nums mb-1 ${getTrendColor()}`} data-testid={testId}>
          {trend && (
            <>
              {trend === 'up' && <TrendingUp className="h-5 w-5 inline mr-2" />}
              {trend === 'down' && <TrendingDown className="h-5 w-5 inline mr-2" />}
            </>
          )}
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// Opportunity Card Component
function OpportunityCard({ opportunity, index }: { opportunity: any; index: number }) {
  const spread = Number(opportunity.spread) || 0;
  const buyPrice = Number(opportunity.buyPrice) || 0;
  const sellPrice = Number(opportunity.sellPrice) || 0;

  return (
    <div 
      className="p-4 border border-border rounded-xl hover-elevate transition-all duration-150" 
      data-testid={`card-opportunity-${index}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-lg">{opportunity.asset || '-'}</span>
        <Badge className="bg-green-600 dark:bg-[hsl(var(--success))] text-white border-0 px-3">
          {spread.toFixed(2)}%
        </Badge>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Buy {opportunity.buyExchange || '-'}</span>
          <span className="font-semibold tabular-nums">${buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Sell {opportunity.sellExchange || '-'}</span>
          <span className="font-semibold tabular-nums">${sellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { logout, token } = useAuth();
  const { toast } = useToast();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'positions'>('portfolio');
  const [oppAssetFilter, setOppAssetFilter] = useState<string>('all');
  const [oppMinSpread, setOppMinSpread] = useState<string>('0');
  const [oppSearch, setOppSearch] = useState<string>('');
  
  // Lift timeframe state to dashboard level to persist across tab switches
  const [btcTimeframe, setBtcTimeframe] = useState<Timeframe>("1H");
  const [ethTimeframe, setEthTimeframe] = useState<Timeframe>("1H");
  const [solTimeframe, setSolTimeframe] = useState<Timeframe>("1H");

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

  // Fetch arbitrage positions
  const { data: arbitragePositions, isLoading: isPositionsLoading } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async () => {
      const response = await fetch("/api/positions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch positions");
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
    refetchInterval: 10000,
  });

  // Client-side opportunity filtering
  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];
    
    let filtered = opportunities;
    
    // Asset filter
    if (oppAssetFilter !== 'all') {
      filtered = filtered.filter((opp: any) => opp.asset === oppAssetFilter);
    }
    
    // Min spread filter
    const minSpread = parseFloat(oppMinSpread);
    filtered = filtered.filter((opp: any) => (Number(opp.spread) || 0) >= minSpread);
    
    // Search filter
    if (oppSearch.trim()) {
      const searchLower = oppSearch.toLowerCase();
      filtered = filtered.filter((opp: any) => 
        (opp.asset || '').toLowerCase().includes(searchLower) ||
        (opp.buyExchange || '').toLowerCase().includes(searchLower) ||
        (opp.sellExchange || '').toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [opportunities, oppAssetFilter, oppMinSpread, oppSearch]);

  // Get unique assets for filter
  const uniqueAssets = useMemo(() => {
    if (!opportunities) return [];
    const assets = new Set(opportunities.map((opp: any) => opp.asset).filter(Boolean));
    return Array.from(assets) as string[];
  }, [opportunities]);

  // WebSocket integration for live position updates
  useEffect(() => {
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const connectWebSocket = () => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
          if (ws) {
            ws.send(JSON.stringify({ type: 'auth', token }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.event === 'position_closed' && message?.data) {
              queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
              queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
              
              const data = message.data || {};
              const finalPnlUsd = Number(data.finalPnlUsd) || 0;
              const finalPnlPercent = Number(data.finalPnlPercent) || 0;
              const isProfitable = finalPnlUsd >= 0;
              const assetSymbol = String(data.assetSymbol || '');
              const entryExchange = String(data.entryExchange || '');
              const exitExchange = String(data.exitExchange || '');
              const messageText = String(data.message || '');
              
              const title = messageText || (isProfitable ? "Position Closed in Profit" : "Position Closed in Loss");
              const description = `${assetSymbol} ${entryExchange}→${exitExchange}: ${finalPnlUsd >= 0 ? '+' : ''}$${Math.abs(finalPnlUsd).toLocaleString()} (${finalPnlPercent >= 0 ? '+' : ''}${finalPnlPercent.toFixed(2)}%)`;
              
              toast({
                title,
                description,
                variant: isProfitable ? "default" : "destructive",
              });
            }
          } catch (error) {
            console.error('WebSocket message parse error:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect WebSocket (${reconnectAttempts}/${maxReconnectAttempts})...`);
            setTimeout(connectWebSocket, 3000);
          }
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [token, toast]);

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-4" />
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
      {/* Top Navigation Bar - Binance Style */}
      <TopNav />

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Row 1: KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Balance"
            value={`$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="USD Value"
            icon={Wallet}
            testId="text-total-balance"
          />
          <KPICard
            title="Realized P/L"
            value={`${realizedPL >= 0 ? '+' : ''}$${Math.abs(realizedPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="All-time profits"
            icon={BarChart3}
            trend={realizedPL >= 0 ? 'up' : 'down'}
            testId="text-realized-pl"
          />
          <KPICard
            title="Unrealized P/L"
            value={`${unrealizedPL >= 0 ? '+' : ''}$${Math.abs(unrealizedPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Current positions"
            icon={TrendingUp}
            trend={unrealizedPL >= 0 ? 'up' : 'down'}
            testId="text-unrealized-pl"
          />
          <KPICard
            title="Active Positions"
            value={`${activePositions}`}
            subtitle="Open trades"
            icon={ArrowLeftRight}
            testId="text-active-positions"
          />
        </div>

        {/* Row 2: Portfolio/Positions (left) + Live Opportunities (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 mb-8">
          {/* Left: Tabbed Portfolio & Positions */}
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="portfolio" data-testid="tab-portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="positions" data-testid="tab-positions">Arbitrage Positions</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              {activeTab === 'portfolio' && (
                positions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">No positions yet</p>
                    <p className="text-sm text-muted-foreground">Make a deposit to start trading</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Asset</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Entry</TableHead>
                          <TableHead className="text-right">Current Price</TableHead>
                          <TableHead className="text-right">Value (USD)</TableHead>
                          <TableHead className="text-right">P/L USD</TableHead>
                          <TableHead className="text-right">P/L %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positions.map((position: any) => {
                          const averageEntryPrice = Number(position.averageEntryPrice) || 0;
                          const currentValueUsd = Number(position.currentValueUsd) || 0;
                          const quantity = Number(position.quantity) || 0;
                          const currentPricePerUnit = quantity > 0 ? currentValueUsd / quantity : 0;
                          const profitLossUsd = Number(position.profitLossUsd) || 0;
                          const profitLossPercent = Number(position.profitLossPercent) || 0;
                          const isProfit = profitLossUsd >= 0;
                          
                          return (
                            <TableRow key={position.id} className="hover-elevate" data-testid={`row-position-${position.id}`}>
                              <TableCell className="font-semibold">{position.assetSymbol || '-'}</TableCell>
                              <TableCell className="text-right tabular-nums">{quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</TableCell>
                              <TableCell className="text-right tabular-nums">${averageEntryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right tabular-nums">${currentPricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right tabular-nums font-semibold">${currentValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                <span className={isProfit ? 'text-green-600 dark:text-[hsl(var(--success))]' : 'text-red-600 dark:text-[hsl(var(--destructive))]'}>
                                  {isProfit ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
                                  {isProfit ? '+' : ''}${Math.abs(profitLossUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={isProfit ? "default" : "destructive"} className="tabular-nums">
                                  {isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}

              {activeTab === 'positions' && (
                isPositionsLoading ? (
                  <div className="space-y-4 p-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : arbitragePositions && arbitragePositions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Asset</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead className="text-right">Entry</TableHead>
                          <TableHead className="text-right">Exit</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">P&L</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {arbitragePositions.map((pos: any) => {
                          const entryPrice = Number(pos.entryPrice) || 0;
                          const exitPrice = pos.exitPrice != null ? Number(pos.exitPrice) : null;
                          const quantity = Number(pos.quantity) || 0;
                          const finalPnlUsd = pos.finalPnlUsd != null ? Number(pos.finalPnlUsd) : null;
                          const finalPnlPercent = Number(pos.finalPnlPercent) || 0;
                          const isProfit = finalPnlUsd != null && finalPnlUsd >= 0;
                          
                          return (
                            <TableRow key={pos.id} className="hover-elevate" data-testid={`row-arb-position-${pos.id}`}>
                              <TableCell>
                                <Badge variant="secondary">{pos.assetSymbol || '-'}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-1">
                                  <span>{pos.entryExchange || '-'}</span>
                                  <ArrowLeftRight className="h-3 w-3" />
                                  <span>{pos.exitExchange || '-'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                ${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {exitPrice != null 
                                  ? `$${exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                              </TableCell>
                              <TableCell className="text-right">
                                {finalPnlUsd != null ? (
                                  <div className="space-y-1">
                                    <div className={`font-semibold tabular-nums ${isProfit ? 'text-green-600 dark:text-[hsl(var(--success))]' : 'text-red-600 dark:text-[hsl(var(--destructive))]'}`}>
                                      {isProfit ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
                                      {isProfit ? '+' : ''}${Math.abs(finalPnlUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className={`text-xs tabular-nums ${finalPnlPercent >= 0 ? 'text-green-600 dark:text-[hsl(var(--success))]' : 'text-red-600 dark:text-[hsl(var(--destructive))]'}`}>
                                      ({finalPnlPercent >= 0 ? '+' : ''}{finalPnlPercent.toFixed(2)}%)
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={pos.status === "open" ? "default" : "secondary"}
                                  className={pos.status === "open" ? "bg-green-600 dark:bg-[hsl(var(--success))] border-0" : ""}
                                >
                                  {pos.status || 'unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {pos.openedAt ? new Date(pos.openedAt * 1000).toLocaleDateString() : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">No arbitrage positions yet</p>
                    <p className="text-sm text-muted-foreground">Positions will appear here when created</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Right: Live Opportunities with Filters */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl font-bold">Live Opportunities</CardTitle>
              {/* Filter Controls */}
              <div className="grid grid-cols-1 gap-3 mt-4">
                <Input
                  placeholder="Search by asset or exchange..."
                  value={oppSearch}
                  onChange={(e) => setOppSearch(e.target.value)}
                  data-testid="input-opp-search"
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={oppAssetFilter} onValueChange={setOppAssetFilter}>
                    <SelectTrigger data-testid="select-asset-filter">
                      <SelectValue placeholder="All Assets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      {uniqueAssets.map((asset) => (
                        <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={oppMinSpread} onValueChange={setOppMinSpread}>
                    <SelectTrigger data-testid="select-spread-filter">
                      <SelectValue placeholder="Min Spread" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Spreads</SelectItem>
                      <SelectItem value="0.5">&gt; 0.5%</SelectItem>
                      <SelectItem value="1">&gt; 1%</SelectItem>
                      <SelectItem value="2">&gt; 2%</SelectItem>
                      <SelectItem value="3">&gt; 3%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {isOpportunitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredOpportunities.length > 0 ? (
                filteredOpportunities.slice(0, 10).map((opp: any, idx: number) => (
                  <OpportunityCard key={idx} opportunity={opp} index={idx} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No opportunities match your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Price Charts (left) + Quick Actions (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
          {/* Left: Price Charts */}
          <Card>
            <CardHeader className="pb-0">
              <Tabs defaultValue="btc" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="btc" data-testid="tab-btc">BTC</TabsTrigger>
                  <TabsTrigger value="eth" data-testid="tab-eth">ETH</TabsTrigger>
                  <TabsTrigger value="sol" data-testid="tab-sol">SOL</TabsTrigger>
                </TabsList>
                <TabsContent value="btc" className="mt-0">
                  <CardContent className="px-4 py-6">
                    <TradingChart 
                      assetSymbol="BTC" 
                      assetName="Bitcoin"
                      timeframe={btcTimeframe}
                      onTimeframeChange={setBtcTimeframe}
                    />
                  </CardContent>
                </TabsContent>
                <TabsContent value="eth" className="mt-0">
                  <CardContent className="px-4 py-6">
                    <TradingChart 
                      assetSymbol="ETH" 
                      assetName="Ethereum"
                      timeframe={ethTimeframe}
                      onTimeframeChange={setEthTimeframe}
                    />
                  </CardContent>
                </TabsContent>
                <TabsContent value="sol" className="mt-0">
                  <CardContent className="px-4 py-6">
                    <TradingChart 
                      assetSymbol="SOL" 
                      assetName="Solana"
                      timeframe={solTimeframe}
                      onTimeframeChange={setSolTimeframe}
                    />
                  </CardContent>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Right: Wallet & Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-2xl font-bold tabular-nums" data-testid="text-available-balance">
                    ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    className="w-full h-12 text-base font-semibold" 
                    onClick={() => setDepositOpen(true)}
                    data-testid="button-deposit"
                  >
                    <ArrowDownLeft className="h-5 w-5 mr-2" />
                    Deposit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base font-semibold"
                    onClick={() => setWithdrawOpen(true)}
                    data-testid="button-withdraw"
                  >
                    <ArrowUpRight className="h-5 w-5 mr-2" />
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
