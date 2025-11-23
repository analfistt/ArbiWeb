import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AdjustBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export function AdjustBalanceDialog({ open, onOpenChange, user }: AdjustBalanceDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setNote("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) === 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a non-zero adjustment amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${user.id}/adjust-balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deltaBalanceUsd: parseFloat(amount),
          note,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to adjust balance");
      }

      toast({
        title: "Balance adjusted",
        description: `${user?.email}'s balance has been ${parseFloat(amount) > 0 ? 'increased' : 'decreased'}`,
      });
      
      // Refresh the users list
      const queryClient = (await import("@/lib/queryClient")).queryClient;
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to adjust balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-adjust-balance">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Adjust User Balance</DialogTitle>
          <DialogDescription>
            Make manual adjustments to {user.email}'s account balance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-display font-bold tabular-nums">
              ${user.balance?.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-amount">Adjustment Amount (USD)</Label>
            <Input
              id="adjust-amount"
              type="number"
              placeholder="Enter positive or negative amount (e.g., 500 or -250)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              data-testid="input-adjust-amount"
            />
            <p className="text-xs text-muted-foreground">
              Use positive numbers to add funds, negative to subtract
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-note">Note (Optional)</Label>
            <Textarea
              id="adjust-note"
              placeholder="Reason for adjustment..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              data-testid="input-adjust-note"
            />
          </div>
          {amount && parseFloat(amount) !== 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                New balance will be: <strong className="font-display tabular-nums">
                  ${(user.balance + parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </p>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="button-submit-adjust"
          >
            {isLoading ? "Adjusting..." : "Confirm Adjustment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
