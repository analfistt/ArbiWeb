import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, LogOut, Users, Search, CheckCircle, XCircle, DollarSign, ArrowLeftRight, Plus } from "lucide-react";
import { AdjustBalanceDialog } from "@/components/adjust-balance-dialog";
import { CreatePositionDialog } from "@/components/create-position-dialog";
import { ClosePositionDialog } from "@/components/close-position-dialog";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { logout, token } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [createPositionDialogOpen, setCreatePositionDialogOpen] = useState(false);
  const [closePositionDialogOpen, setClosePositionDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch all transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch all arbitrage positions
  const { data: positions, isLoading: isPositionsLoading } = useQuery({
    queryKey: ["/api/admin/positions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/positions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch positions");
      return response.json();
    },
    enabled: !!token,
  });

  // Approve withdrawal mutation
  const approveMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      if (!transactionId) {
        throw new Error("Transaction ID is required");
      }
      await apiRequest("POST", `/api/admin/transactions/${transactionId}/approve`, {}, token || "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Withdrawal approved",
        description: "The withdrawal has been processed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve withdrawal",
        variant: "destructive",
      });
    },
  });

  // Reject withdrawal mutation
  const rejectMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      if (!transactionId) {
        throw new Error("Transaction ID is required");
      }
      await apiRequest("POST", `/api/admin/transactions/${transactionId}/reject`, {}, token || "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Withdrawal rejected",
        description: "The withdrawal has been rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleAdjustBalance = (user: any) => {
    setSelectedUser(user);
    setAdjustDialogOpen(true);
  };

  const handleOpenCloseDialog = (position: any) => {
    setSelectedPosition(position);
    setClosePositionDialogOpen(true);
  };

  const filteredUsers = users?.filter((user: any) => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const pendingWithdrawals = transactions?.filter((tx: any) => 
    tx.type === "withdrawal" && tx.status === "pending"
  ).length || 0;

  const totalPlatformBalance = users?.reduce((sum: number, u: any) => sum + (u.balance ?? 0), 0) || 0;

  const openPositions = positions?.filter((pos: any) => pos.status === "open").length || 0;

  if (isUsersLoading || isTransactionsLoading || isPositionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl">ArbiTradeX Admin</span>
            </div>
          </div>
        </nav>
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b">
        <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl">ArbiTradeX Admin</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="px-3 py-1">
              Administrator
            </Badge>
            <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold tabular-nums" data-testid="text-total-users">
                {users?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Withdrawals</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold tabular-nums" data-testid="text-pending-withdrawals">
                {pendingWithdrawals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold tabular-nums" data-testid="text-platform-balance">
                ${totalPlatformBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              <DollarSign className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="positions" data-testid="tab-positions">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Positions ({openPositions})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="font-display text-2xl">All Users</CardTitle>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Realized P/L</TableHead>
                        <TableHead className="text-right">Unrealized P/L</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: any) => {
                        const balance = user.balance ?? 0;
                        const realizedPL = user.realizedPL ?? 0;
                        const unrealizedPL = user.unrealizedPL ?? 0;
                        
                        return (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell className="font-medium">{user.email || '-'}</TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">
                              ${balance.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              <span className={realizedPL >= 0 ? "text-green-600" : "text-red-600"}>
                                {realizedPL >= 0 ? "+" : ""}${realizedPL.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              <span className={unrealizedPL >= 0 ? "text-green-600" : "text-red-600"}>
                                {unrealizedPL >= 0 ? "+" : ""}${unrealizedPL.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">{user.status || 'active'}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAdjustBalance(user)}
                                data-testid={`button-adjust-${user.id}`}
                              >
                                Adjust Balance
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.map((tx: any) => {
                        const amountUsd = tx.amountUsd ?? 0;
                        const createdAt = tx.createdAt ? new Date(tx.createdAt) : null;
                        
                        return (
                          <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                            <TableCell className="font-medium">{tx.email || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={tx.type === "deposit" ? "default" : "secondary"}>
                                {tx.type || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">
                              ${amountUsd.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  tx.status === "completed" ? "default" :
                                  tx.status === "pending" ? "secondary" : "destructive"
                                }
                              >
                                {tx.status || 'unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {tx.destinationAddress || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {createdAt ? createdAt.toLocaleDateString() : '-'}
                            </TableCell>
                          <TableCell className="text-right">
                            {tx.type === "withdrawal" && tx.status === "pending" && tx.id && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    if (tx.id) {
                                      approveMutation.mutate(tx.id);
                                    }
                                  }}
                                  disabled={approveMutation.isPending}
                                  data-testid={`button-approve-${tx.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (tx.id) {
                                      rejectMutation.mutate(tx.id);
                                    }
                                  }}
                                  disabled={rejectMutation.isPending}
                                  data-testid={`button-reject-${tx.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="font-display text-2xl">Arbitrage Positions</CardTitle>
                  <Button
                    onClick={() => setCreatePositionDialogOpen(true)}
                    data-testid="button-create-position"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Position
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Exchanges</TableHead>
                        <TableHead className="text-right">Entry Price</TableHead>
                        <TableHead className="text-right">Exit Price</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Notional</TableHead>
                        <TableHead className="text-right">P&L</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions?.map((pos: any) => {
                        const entryPrice = Number(pos.entryPrice) || 0;
                        const quantity = Number(pos.quantity) || 0;
                        const notionalValueUsd = Number(pos.notionalValueUsd) || 0;
                        const finalPnlPercent = Number(pos.finalPnlPercent) || 0;
                        
                        return (
                        <TableRow key={pos.id} data-testid={`row-position-${pos.id}`}>
                          <TableCell className="font-medium">{pos.userEmail}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{pos.assetSymbol}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {pos.entryExchange} → {pos.exitExchange}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            ${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {pos.exitPrice !== null 
                              ? `$${Number(pos.exitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {quantity.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            ${notionalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            {pos.finalPnlUsd !== null ? (
                              <div className="space-y-1">
                                <div className={`font-semibold tabular-nums ${pos.finalPnlUsd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {pos.finalPnlUsd >= 0 ? '+' : ''}${Number(pos.finalPnlUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className={`text-xs tabular-nums ${finalPnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({finalPnlPercent >= 0 ? '+' : ''}{finalPnlPercent.toFixed(2)}%)
                                </div>
                                {pos.overridePnlUsd !== null && (
                                  <Badge variant="outline" className="text-xs">
                                    Override
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pos.status === "open" ? "default" : "secondary"}>
                              {pos.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(pos.openedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {pos.status === "open" && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleOpenCloseDialog(pos)}
                                data-testid={`button-close-${pos.id}`}
                              >
                                Close
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        );
                      })}
                      {positions?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                            No positions found. Create one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AdjustBalanceDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        user={selectedUser}
      />

      <CreatePositionDialog
        open={createPositionDialogOpen}
        onOpenChange={setCreatePositionDialogOpen}
      />

      <ClosePositionDialog
        open={closePositionDialogOpen}
        onOpenChange={setClosePositionDialogOpen}
        position={selectedPosition}
      />
    </div>
  );
}
