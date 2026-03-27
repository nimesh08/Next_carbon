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

interface Certificate {
  id: string;
  user_id: string;
  property_id: string;
  amount: number;
  nft_token_id: number | null;
  tx_hash: string | null;
  certificate_uri: string | null;
  created_at: string;
  property_data: {
    name: string;
    image: string | null;
    type: string;
  } | null;
}

function CertificateGallery() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchCertificates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("retirement_certificates")
        .select("*, property_data(name, image, type)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCertificates(data as Certificate[]);
      }
      setLoading(false);
    };

    fetchCertificates();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-gray-500">Loading certificates...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-full px-4 mx-auto gap-6">
      <div className="text-left">
        <h2 className="text-2xl font-bold">Retirement Certificates</h2>
        <p className="text-gray-500">
          Your carbon credit retirement NFT certificates
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            No retirement certificates yet. Offset VCC credits to receive NFT certificates.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm opacity-80">Carbon Retirement</p>
                    <p className="text-3xl font-bold mt-1">{cert.amount} VCC</p>
                  </div>
                  <Badge className="bg-white/20 text-white border-0">NFT</Badge>
                </div>
                <p className="mt-3 text-sm opacity-90">
                  {cert.property_data?.name ?? "Unknown Project"}
                </p>
              </div>
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span>{cert.property_data?.type ?? "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span>{new Date(cert.created_at).toLocaleDateString()}</span>
                </div>
                {cert.tx_hash && (
                  <div className="pt-2">
                    <a
                      href={`https://amoy.polygonscan.com/tx/${cert.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline truncate block"
                    >
                      View on PolygonScan
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CertificateGallery;
