import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";

interface ProjectMaturity {
  id: string;
  name: string;
  type: string;
  status: string;
  totalShares: number;
  is_mature: boolean;
  maturity_percentage: number;
  token_address: string | null;
  weight: number;
}

interface MaturityEvent {
  id: string;
  property_id: string;
  total_rtp_burned: number;
  total_acc_minted: number;
  tx_hash: string;
  created_at: string;
}

const BACKEND = import.meta.env.VITE_BACKEND_URL;

function MaturityManagement() {
  const [projects, setProjects] = useState<ProjectMaturity[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [percentage, setPercentage] = useState("");
  const [history, setHistory] = useState<MaturityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const { data } = await axios.get(`${BACKEND}/api/admin/projects-maturity`);
      if (data.success) setProjects(data.data);
    } catch {
      toast.error("Failed to load projects");
    }
  }

  async function fetchHistory(projectId: string) {
    try {
      const { data } = await axios.get(`${BACKEND}/api/admin/maturity-history/${projectId}`);
      if (data.success) setHistory(data.data);
    } catch {
      setHistory([]);
    }
  }

  async function handleMature(projectId: string) {
    if (!percentage || Number(percentage) <= 0) {
      toast.error("Enter a valid percentage");
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const remaining = 100 - project.maturity_percentage;
    if (Number(percentage) > remaining) {
      toast.error(`Only ${remaining.toFixed(1)}% remaining to mature`);
      return;
    }

    if (!confirm(`Mature ${percentage}% of "${project.name}"? This will convert RTP tokens to ACC for all holders.`)) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND}/api/admin/mature/${projectId}`, {
        percentage: Number(percentage),
      });
      if (data.success) {
        toast.success(data.message);
        setPercentage("");
        await fetchProjects();
        await fetchHistory(projectId);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Maturity operation failed");
    } finally {
      setLoading(false);
    }
  }

  function selectProject(id: string) {
    setSelectedProject(id === selectedProject ? null : id);
    if (id !== selectedProject) {
      fetchHistory(id);
    }
  }

  return (
    <div className="flex flex-col w-full max-w-full px-4 mx-auto gap-6 pb-10">
      <div className="text-left">
        <h2 className="text-2xl font-bold">Maturity Management</h2>
        <p className="text-gray-500">
          Partially mature projects each year. This converts RTP (Right-to-Play) tokens
          into ACC (Actual Carbon Credit) tokens for all holders proportionally.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">No projects found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const isSelected = selectedProject === project.id;
            const remaining = 100 - project.maturity_percentage;
            const isFullyMature = project.maturity_percentage >= 100;

            return (
              <Card key={project.id} className={isSelected ? "ring-2 ring-black" : ""}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => selectProject(project.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>
                        {project.type} | {project.status} | {project.totalShares} total shares
                        {project.token_address && (
                          <span className="ml-2 text-xs font-mono text-gray-400">
                            {project.token_address.slice(0, 8)}...
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isFullyMature ? "text-green-600" : "text-blue-600"}`}>
                        {project.maturity_percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {isFullyMature ? "Fully Matured" : `${remaining.toFixed(1)}% remaining`}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isFullyMature
                          ? "bg-green-500"
                          : project.maturity_percentage > 0
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      }`}
                      style={{ width: `${project.maturity_percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0% (RTP)</span>
                    <span>100% (ACC)</span>
                  </div>
                </CardHeader>

                {isSelected && (
                  <CardContent className="space-y-4 border-t pt-4">
                    {!isFullyMature && (
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Percentage to mature this cycle
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max={remaining}
                            placeholder={`Enter % (max ${remaining.toFixed(1)}%)`}
                            value={percentage}
                            onChange={(e) => setPercentage(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          {[10, 20, 25, 50].map((pct) =>
                            pct <= remaining ? (
                              <Button
                                key={pct}
                                variant="outline"
                                size="sm"
                                onClick={() => setPercentage(String(pct))}
                              >
                                {pct}%
                              </Button>
                            ) : null
                          )}
                        </div>
                        <Button
                          onClick={() => handleMature(project.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {loading ? "Processing..." : "Mature"}
                        </Button>
                      </div>
                    )}

                    {isFullyMature && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <p className="text-green-700 font-medium">
                          This project is fully matured. All RTP tokens have been converted to ACC.
                        </p>
                      </div>
                    )}

                    {/* Maturity History */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Maturity History</h4>
                      {history.length === 0 ? (
                        <p className="text-sm text-gray-400">No maturity events yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {history.map((event, idx) => (
                            <div
                              key={event.id}
                              className="flex flex-col p-3 bg-gray-50 rounded-lg text-sm gap-1"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Cycle {history.length - idx}
                                  </span>
                                  <span className="text-gray-400 ml-2">
                                    {new Date(event.created_at).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-red-500 mr-3">
                                    -{event.total_rtp_burned.toFixed(2)} RTP
                                  </span>
                                  <span className="text-green-600">
                                    +{event.total_acc_minted.toFixed(2)} ACC
                                  </span>
                                </div>
                              </div>
                              {event.tx_hash && !event.tx_hash.startsWith("cycle-") && (
                                <a
                                  href={`https://amoy.polygonscan.com/tx/${event.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline truncate"
                                >
                                  View on PolygonScan: {event.tx_hash.slice(0, 20)}...
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MaturityManagement;
