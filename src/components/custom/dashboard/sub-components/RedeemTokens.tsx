import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";

interface TokenBalance {
  id: string;
  property_id: string;
  token_type: "RTP" | "SEC" | "ACC";
  balance: number;
  property_data: { name: string };
}

interface RedeemTokensProps {
  onComplete?: () => void;
}

function RedeemTokens({ onComplete }: RedeemTokensProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedBalanceId, setSelectedBalanceId] = useState("");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    if (!user?.id || !open) return;

    const fetchBalances = async () => {
      const { data } = await supabase
        .from("user_token_balances")
        .select("*, property_data(name)")
        .eq("user_id", user.id);
      if (data) setBalances(data as TokenBalance[]);
    };
    fetchBalances();
  }, [user?.id, open]);

  const selectedBalance = balances.find((b) => b.id === selectedBalanceId);

  async function handleRedeem() {
    if (!selectedBalance || !amount || !walletAddress) {
      toast.error("Please fill all fields");
      return;
    }

    if (parseFloat(amount) > selectedBalance.balance) {
      toast.error("Amount exceeds balance");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/tokens/redeem`,
        {
          userId: user!.id,
          propertyId: selectedBalance.property_id,
          tokenType: selectedBalance.token_type,
          amount: parseFloat(amount),
          walletAddress,
        }
      );

      if (data.success) {
        toast.success(
          <div>
            <p>{data.message}</p>
            {data.txHash && (
              <a
                href={`https://amoy.polygonscan.com/tx/${data.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline text-sm"
              >
                View on PolygonScan
              </a>
            )}
          </div>,
          { duration: 10000 }
        );
        setOpen(false);
        setAmount("");
        setWalletAddress("");
        onComplete?.();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Redeem failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Withdraw to Wallet</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem Tokens to Wallet</DialogTitle>
          <DialogDescription>
            Transfer tokens from the custodial company wallet to your personal wallet address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select onValueChange={setSelectedBalanceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select token to redeem" />
            </SelectTrigger>
            <SelectContent>
              {balances.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.property_data?.name} - {b.token_type} ({b.balance.toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder={`Amount (max: ${selectedBalance?.balance.toFixed(2) ?? 0})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            placeholder="Your wallet address (0x...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />

          <Button
            onClick={handleRedeem}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Redeem"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RedeemTokens;
