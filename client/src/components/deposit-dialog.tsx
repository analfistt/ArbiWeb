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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean);
}

interface DepositData {
  transactionId: number;
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  priceCurrency: string;
  status: string;
  orderId: string;
  network?: string;
  timeLimit?: string;
}

export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"amount" | "payment">("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usdt");
  const [isLoading, setIsLoading] = useState(false);
  const [depositData, setDepositData] = useState<DepositData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/deposits/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountUsd: parseFloat(amount),
          payCurrency: currency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create deposit");
      }

      const data: DepositData = await response.json();
      setDepositData(data);
      setStep("payment");
      
      toast({
        title: "Deposit address generated",
        description: `Send ${data.payAmount.toFixed(8)} ${data.payCurrency} to complete your deposit`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create deposit",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (depositData) {
      navigator.clipboard.writeText(depositData.payAddress);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Payment address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep("amount");
    setAmount("");
    setDepositData(null);
    onOpenChange(false);
  };

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("amount");
        setDepositData(null);
      }, 300);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-deposit">
        {step === "amount" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Deposit Funds</DialogTitle>
              <DialogDescription>
                Choose your deposit amount and cryptocurrency
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount (USD)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  step="0.01"
                  min="10"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-deposit-amount"
                />
                <p className="text-xs text-muted-foreground">Minimum: $10.00</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit-currency">Pay with</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="deposit-currency" data-testid="select-currency">
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdt">Tether (USDT)</SelectItem>
                    <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                    <SelectItem value="usdc">USD Coin (USDC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateDeposit}
                disabled={isLoading}
                data-testid="button-create-deposit"
              >
                {isLoading ? "Generating..." : "Generate Payment Address"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Send Payment</DialogTitle>
              <DialogDescription>
                Send exactly {depositData?.payAmount.toFixed(8)} {depositData?.payCurrency} to complete your deposit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Payment Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">${depositData?.priceAmount} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pay with</span>
                  <span className="font-semibold">{depositData?.payAmount.toFixed(8)} {depositData?.payCurrency}</span>
                </div>
                {depositData?.network && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <span className="font-semibold">{depositData.network.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Label>Payment Address</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={depositData?.payAddress || ""}
                        readOnly
                        className="font-mono text-sm"
                        data-testid="input-payment-address"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleCopyAddress}
                        data-testid="button-copy-address"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-4 p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold">Waiting for payment...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your balance will be updated automatically once the payment is confirmed.
                    </p>
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Important:</strong> Send only {depositData?.payCurrency} to this address. 
                      Sending any other cryptocurrency may result in permanent loss of funds.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Your deposit will be credited after blockchain confirmation. 
                  This usually takes 5-30 minutes depending on the network.
                </p>
              </div>

              <Button variant="outline" className="w-full" onClick={handleClose} data-testid="button-close-deposit">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
