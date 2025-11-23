import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownUp } from "lucide-react";

const closePositionSchema = z.object({
  exitPrice: z.number().positive("Exit price must be positive"),
  overridePnlUsd: z.number().optional(),
});

type ClosePositionFormData = z.infer<typeof closePositionSchema>;

interface ClosePositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: {
    id: number;
    assetSymbol: string;
    entryExchange: string;
    exitExchange: string;
    entryPrice: number;
    quantity: number;
    notionalValueUsd: number;
  } | null;
}

export function ClosePositionDialog({ open, onOpenChange, position }: ClosePositionDialogProps) {
  const { toast } = useToast();
  const { token } = useAuth();

  const form = useForm<ClosePositionFormData>({
    resolver: zodResolver(closePositionSchema),
    defaultValues: {
      exitPrice: undefined,
      overridePnlUsd: undefined,
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (data: ClosePositionFormData) => {
      if (!position) throw new Error("No position selected");
      return await apiRequest("POST", `/api/admin/positions/${position.id}/close`, data, token || "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Position closed successfully and user balance updated",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close position",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClosePositionFormData) => {
    closeMutation.mutate(data);
  };

  const watchExitPrice = form.watch("exitPrice");
  const watchOverridePnlUsd = form.watch("overridePnlUsd");

  // Calculate P&L preview
  const rawPnlUsd = position && watchExitPrice
    ? (watchExitPrice - position.entryPrice) * position.quantity
    : 0;
  const rawPnlPercent = position && watchExitPrice
    ? ((watchExitPrice - position.entryPrice) / position.entryPrice) * 100
    : 0;
  
  const finalPnlUsd = watchOverridePnlUsd !== undefined && watchOverridePnlUsd !== null
    ? watchOverridePnlUsd
    : rawPnlUsd;
  const finalPnlPercent = watchOverridePnlUsd !== undefined && watchOverridePnlUsd !== null && position
    ? (watchOverridePnlUsd / position.notionalValueUsd) * 100
    : rawPnlPercent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Close Position</DialogTitle>
          <DialogDescription>
            {position && (
              <span>
                Closing {position.assetSymbol} position: {position.entryExchange} → {position.exitExchange}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {position && (
          <>
            <div className="p-4 rounded-md bg-muted space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry Price:</span>
                <span className="font-semibold tabular-nums">${position.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-semibold tabular-nums">{position.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notional Value:</span>
                <span className="font-semibold tabular-nums">${position.notionalValueUsd.toFixed(2)}</span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="exitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit Price (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          data-testid="input-close-exit-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Raw P&L Preview */}
                {watchExitPrice && (
                  <div className="p-4 rounded-md bg-muted space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDownUp className="h-4 w-4" />
                      <span className="font-semibold">Calculated P&L</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Raw P&L:</span>
                      <span className={`font-semibold tabular-nums ${rawPnlUsd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rawPnlUsd >= 0 ? '+' : ''}${rawPnlUsd.toFixed(2)} ({rawPnlPercent >= 0 ? '+' : ''}{rawPnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="overridePnlUsd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Override P&L (USD) - Optional</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Leave empty to use calculated P&L"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? undefined : parseFloat(value));
                          }}
                          value={field.value ?? ""}
                          data-testid="input-close-override-pnl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Final P&L Preview */}
                {watchExitPrice && watchOverridePnlUsd !== undefined && watchOverridePnlUsd !== null && (
                  <div className="p-4 rounded-md bg-primary/10 border border-primary space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-primary">Final P&L (Override Applied)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Final P&L:</span>
                      <span className={`font-semibold tabular-nums ${finalPnlUsd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {finalPnlUsd >= 0 ? '+' : ''}${finalPnlUsd.toFixed(2)} ({finalPnlPercent >= 0 ? '+' : ''}{finalPnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-cancel-close"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={closeMutation.isPending}
                    data-testid="button-confirm-close"
                  >
                    {closeMutation.isPending ? "Closing..." : "Close Position"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
