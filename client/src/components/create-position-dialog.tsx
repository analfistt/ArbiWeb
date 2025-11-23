import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createPositionSchema = z.object({
  userId: z.number({ required_error: "Please select a user" }),
  assetSymbol: z.string().min(1, "Asset is required"),
  entryExchange: z.string().min(1, "Entry exchange is required"),
  exitExchange: z.string().min(1, "Exit exchange is required"),
  entryPrice: z.number().positive("Entry price must be positive"),
  quantity: z.number().positive("Quantity must be positive"),
  details: z.string().optional(),
});

type CreatePositionFormData = z.infer<typeof createPositionSchema>;

interface CreatePositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ASSETS = ["BTC", "ETH", "SOL", "ADA", "XRP"];
const EXCHANGES = ["Binance", "Kraken", "Coinbase", "Gemini", "Bitfinex", "KuCoin"];

export function CreatePositionDialog({ open, onOpenChange }: CreatePositionDialogProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [selectedAsset, setSelectedAsset] = useState<string>("");

  const form = useForm<CreatePositionFormData>({
    resolver: zodResolver(createPositionSchema),
    defaultValues: {
      userId: undefined,
      assetSymbol: "",
      entryExchange: "",
      exitExchange: "",
      entryPrice: undefined,
      quantity: undefined,
      details: "",
    },
  });

  // Fetch users for selector
  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: !!token && open,
  });

  // Fetch current prices
  const { data: prices, isLoading: isPricesLoading, refetch: refetchPrices } = useQuery({
    queryKey: ["/api/admin/prices/current"],
    queryFn: async () => {
      const response = await fetch("/api/admin/prices/current", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch prices");
      return response.json();
    },
    enabled: !!token && open,
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePositionFormData) => {
      return await apiRequest("POST", "/api/admin/positions/create", data, token || "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/positions"] });
      toast({
        title: "Position created",
        description: "The arbitrage position has been created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create position",
        variant: "destructive",
      });
    },
  });

  const watchEntryPrice = form.watch("entryPrice");
  const watchQuantity = form.watch("quantity");

  // Calculate notional value
  const notionalValue = (watchEntryPrice && watchQuantity)
    ? watchEntryPrice * watchQuantity
    : 0;

  const useCurrentPrice = () => {
    if (selectedAsset && prices && prices[selectedAsset]) {
      form.setValue("entryPrice", prices[selectedAsset]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create Arbitrage Position</DialogTitle>
          <DialogDescription>
            Open a new arbitrage position for a user. You can override the calculated P&L.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            {/* User Selection */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-user">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.email} (${ (user.balance ?? 0).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asset Selection with Real-time Price */}
            <FormField
              control={form.control}
              name="assetSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedAsset(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-asset">
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASSETS.map((asset) => (
                          <SelectItem key={asset} value={asset}>
                            {asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAsset && (
                      <div className="flex items-center gap-2">
                        {isPricesLoading ? (
                          <Skeleton className="h-9 w-28" />
                        ) : prices && prices[selectedAsset] ? (
                          <Badge variant="secondary" className="px-3 h-9">
                            ${(prices[selectedAsset] ?? 0).toLocaleString()}
                          </Badge>
                        ) : null}
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => refetchPrices()}
                          data-testid="button-refresh-prices"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exchanges */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryExchange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Exchange</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-entry-exchange">
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXCHANGES.map((ex) => (
                          <SelectItem key={ex} value={ex}>
                            {ex}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exitExchange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Exchange</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-exit-exchange">
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXCHANGES.map((ex) => (
                          <SelectItem key={ex} value={ex}>
                            {ex}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Entry Price */}
            <FormField
              control={form.control}
              name="entryPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Price (USD)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        data-testid="input-entry-price"
                      />
                    </FormControl>
                    {selectedAsset && prices && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => useCurrentPrice()}
                        data-testid="button-use-current-price"
                      >
                        Use Current
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.00000001"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      data-testid="input-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notional Value Preview */}
            {notionalValue > 0 && (
              <div className="p-4 rounded-md bg-muted space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Notional Value:</span>
                  <span className="font-semibold tabular-nums">${notionalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Position will be created with "open" status. P&L will be calculated when admin closes the position.
                </p>
              </div>
            )}

            {/* Details/Notes */}
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details/Notes - Optional</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional notes or details"
                      {...field}
                      data-testid="input-details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-create-position"
              >
                {createMutation.isPending ? "Creating..." : "Create Position"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
