import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface PtBalance {
  id: string;
  property_id: string;
  balance: number;
  property_data: { name: string; token_address: string | null };
}

interface PoolDeposit {
  id: string;
  property_id: string;
  amount: number;
  cit_received: number;
  created_at: string;
  withdrawn: boolean;
}

function Pool() {
  const { user } = useAuth();
  const [ptBalances, setPtBalances] = useState<PtBalance[]>([]);
  const [deposits, setDeposits] = useState<PoolDeposit[]>([]);
  const [citTotal, setCitTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [depositProjectId, setDepositProjectId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [claimAmount, setClaimAmount] = useState("");

  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!user?.id) return;
    fetchData();
  }, [user?.id]);

  async function fetchData() {
    const { data: pt } = await supabase
      .from("user_token_balances")
      .select("*, property_data(name, token_address)")
      .eq("user_id", user!.id)
      .eq("token_type", "PT");

    if (pt) setPtBalances(pt as PtBalance[]);

    const { data: cit } = await supabase
      .from("user_token_balances")
      .select("balance")
      .eq("user_id", user!.id)
      .eq("token_type", "CIT");

    setCitTotal((cit ?? []).reduce((s: number, b: any) => s + b.balance, 0));

    const { data: deps } = await supabase
      .from("pool_deposits")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (deps) setDeposits(deps);
  }

  async function handleDeposit() {
    if (!depositProjectId || !depositAmount) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND}/api/pool/deposit`, {
        userId: user!.id,
        propertyId: depositProjectId,
        amount: parseFloat(depositAmount),
      });
      if (data.success) {
        toast.success(data.message);
        setDepositAmount("");
        await fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Deposit failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!withdrawAmount) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND}/api/pool/withdraw`, {
        userId: user!.id,
        citAmount: parseFloat(withdrawAmount),
      });
      if (data.success) {
        toast.success(data.message);
        setWithdrawAmount("");
        await fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Withdraw failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim() {
    if (!claimAmount) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND}/api/pool/claim`, {
        userId: user!.id,
        citAmount: parseFloat(claimAmount),
      });
      if (data.success) {
        toast.success(data.message);
        setClaimAmount("");
        await fetchData();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Claim failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full max-w-full px-4 mx-auto gap-6">
      <div className="text-left">
        <h2 className="text-2xl font-bold">Carbon Credit Pool</h2>
        <p className="text-gray-500">
          Deposit Project Tokens (PT) to receive diversified CIT index tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{citTotal.toFixed(2)}</CardTitle>
            <CardDescription>Your CIT Balance</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{ptBalances.length}</CardTitle>
            <CardDescription>Projects with PT tokens</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deposit PT to Pool</CardTitle>
          <CardDescription>
            Select a project and amount of PT tokens to deposit. You receive 1:1 CIT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={setDepositProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {ptBalances.map((b) => (
                <SelectItem key={b.property_id} value={b.property_id}>
                  {b.property_data?.name} ({b.balance.toFixed(2)} PT)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Amount to deposit"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <Button onClick={handleDeposit} disabled={loading} className="w-full">
            {loading ? "Processing..." : "Deposit to Pool"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw from Pool</CardTitle>
          <CardDescription>Burn CIT tokens to reclaim proportional project tokens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder={`CIT to burn (max: ${citTotal.toFixed(2)})`}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <Button onClick={handleWithdraw} disabled={loading} className="w-full" variant="outline">
            {loading ? "Processing..." : "Withdraw"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claim VCC (First-Come-First-Serve)</CardTitle>
          <CardDescription>
            After project maturity, burn CIT to claim VCC tokens. 1 CIT = 1 VCC, only if VCC is available in pool.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder={`CIT to exchange for VCC (max: ${citTotal.toFixed(2)})`}
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
          />
          <Button onClick={handleClaim} disabled={loading} className="w-full" variant="secondary">
            {loading ? "Processing..." : "Claim VCC"}
          </Button>
        </CardContent>
      </Card>

      {deposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deposit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-medium text-gray-600">Date</th>
                    <th className="pb-3 font-medium text-gray-600 text-right">PT Deposited</th>
                    <th className="pb-3 font-medium text-gray-600 text-right">CIT Received</th>
                    <th className="pb-3 font-medium text-gray-600 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-3">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="py-3 text-right">{d.amount}</td>
                      <td className="py-3 text-right">{d.cit_received}</td>
                      <td className="py-3 text-right">
                        {d.withdrawn ? (
                          <span className="text-gray-400">Withdrawn</span>
                        ) : (
                          <span className="text-green-600">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Pool;
