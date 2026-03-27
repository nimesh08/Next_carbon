import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RedeemTokens from "../sub-components/RedeemTokens";

interface TokenBalance {
  id: string;
  user_id: string;
  property_id: string;
  token_type: "PT" | "CIT" | "VCC";
  balance: number;
  updated_at: string;
  property_data: {
    name: string;
    image: string | null;
    token_address: string | null;
  };
}

const tokenColors: Record<string, string> = {
  PT: "bg-blue-100 text-blue-800",
  CIT: "bg-purple-100 text-purple-800",
  VCC: "bg-green-100 text-green-800",
};

const tokenLabels: Record<string, string> = {
  PT: "Project Token",
  CIT: "Carbon Index Token",
  VCC: "Verified Carbon Credit",
};

function TokenPortfolio() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const totals = balances.reduce(
    (acc, b) => {
      acc[b.token_type] = (acc[b.token_type] || 0) + b.balance;
      return acc;
    },
    {} as Record<string, number>
  );

  useEffect(() => {
    if (!user?.id) return;

    const fetchBalances = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_token_balances")
        .select("*, property_data(name, image, token_address)")
        .eq("user_id", user.id);

      if (!error && data) {
        setBalances(data as TokenBalance[]);
      }
      setLoading(false);
    };

    fetchBalances();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-gray-500">Loading token balances...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-full px-4 mx-auto gap-6">
      <div className="text-left flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Token Portfolio</h2>
          <p className="text-gray-500">Your carbon credit token balances across all projects</p>
        </div>
        <RedeemTokens onComplete={() => window.location.reload()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["PT", "CIT", "VCC"] as const).map((type) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardDescription>{tokenLabels[type]}</CardDescription>
              <CardTitle className="text-3xl">{(totals[type] ?? 0).toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={tokenColors[type]}>{type}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {balances.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            No token balances yet. Purchase shares to receive PT tokens.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Balances by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-medium text-gray-600">Project</th>
                    <th className="pb-3 font-medium text-gray-600">Token Type</th>
                    <th className="pb-3 font-medium text-gray-600 text-right">Balance</th>
                    <th className="pb-3 font-medium text-gray-600 text-right">Token Address</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="py-3">{b.property_data?.name ?? "Unknown"}</td>
                      <td className="py-3">
                        <Badge className={tokenColors[b.token_type]}>{b.token_type}</Badge>
                      </td>
                      <td className="py-3 text-right font-semibold">{b.balance.toFixed(2)}</td>
                      <td className="py-3 text-right text-xs text-gray-400 font-mono">
                        {b.property_data?.token_address
                          ? `${b.property_data.token_address.slice(0, 6)}...${b.property_data.token_address.slice(-4)}`
                          : "N/A"}
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

export default TokenPortfolio;
