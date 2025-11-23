import { useState } from "react";
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
  onOpenChange: (open: boolean) => void;
}

export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"amount" | "payment">("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("btc");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateDeposit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    // Mock payment address generation - will be replaced with NowPayments API
    const mockAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
    setPaymentAddress(mockAddress);
    setStep("payment");
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(paymentAddress);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Payment address copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("amount");
    setAmount("");
    setPaymentAddress("");
    onOpenChange(false);
  };

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
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-deposit-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit-currency">Pay with</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="deposit-currency" data-testid="select-currency">
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                    <SelectItem value="usdt">Tether (USDT)</SelectItem>
                    <SelectItem value="usdc">USD Coin (USDC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateDeposit}
                data-testid="button-create-deposit"
              >
                Generate Payment Address
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Send Payment</DialogTitle>
              <DialogDescription>
                Send exactly ${amount} worth of {currency.toUpperCase()} to the address below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Label>Payment Address</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={paymentAddress}
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
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Important:</strong> Send only {currency.toUpperCase()} to this address. 
                      Sending any other cryptocurrency may result in permanent loss of funds.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Your deposit will be credited to your account after 3 blockchain confirmations. 
                  This usually takes 15-30 minutes.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleClose} data-testid="button-close-deposit">
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
