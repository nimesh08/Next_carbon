import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CreditProjectionProps {
  totalCredits: number;
  sharePrice: number;
  appreciation: number;
  irr: number;
  maturityPercentage: number;
  projectName: string;
}

const CreditProjection: React.FC<CreditProjectionProps> = ({
  totalCredits,
  sharePrice,
  appreciation,
  irr: _irr,
  maturityPercentage,
  projectName,
}) => {
  const projections = useMemo(() => {
    const appreciationRate = appreciation / 100;
    const years = 7;
    const timeline = [];

    for (let year = 1; year <= years; year++) {
      const projectedPrice =
        sharePrice * Math.pow(1 + appreciationRate, year);
      const totalValue = totalCredits * projectedPrice;

      timeline.push({
        year: `Yr ${year}`,
        price: parseFloat(projectedPrice.toFixed(2)),
        value: Math.round(totalValue),
        credits: totalCredits,
      });
    }

    const targetPrice = sharePrice * Math.pow(1 + appreciationRate, 5);
    const currentToTarget = ((sharePrice / targetPrice) * 100).toFixed(1);

    return {
      timeline,
      targetPrice: parseFloat(targetPrice.toFixed(2)),
      currentToTarget: parseFloat(currentToTarget),
      fiveYearValue: Math.round(totalCredits * targetPrice),
      tenYearPrice: parseFloat(
        (sharePrice * Math.pow(1 + appreciationRate, 10)).toFixed(2)
      ),
    };
  }, [totalCredits, sharePrice, appreciation]);

  const milestones = [
    {
      label: "Current",
      price: sharePrice,
      reached: true,
    },
    {
      label: "Year 3",
      price: parseFloat(
        (sharePrice * Math.pow(1 + appreciation / 100, 3)).toFixed(2)
      ),
      reached: maturityPercentage >= 40,
    },
    {
      label: "Year 5 Target",
      price: projections.targetPrice,
      reached: maturityPercentage >= 70,
    },
    {
      label: "Year 7",
      price: parseFloat(
        (sharePrice * Math.pow(1 + appreciation / 100, 7)).toFixed(2)
      ),
      reached: maturityPercentage >= 100,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        Credit Generation & Price Projection
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Projected credit value growth for {projectName}
      </p>

      {/* Target Price Progress */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-emerald-700">
            5-Year Target Price
          </span>
          <span className="text-lg font-bold text-emerald-700">
            ${projections.targetPrice.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
            style={{ width: `${projections.currentToTarget}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-emerald-600">
          <span>Current: ${sharePrice.toFixed(2)}</span>
          <span>{projections.currentToTarget}% of target</span>
        </div>
      </div>

      {/* Price Milestones */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Price Milestones
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-center border ${
                m.reached
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <p
                className={`text-xs font-medium mb-1 ${
                  m.reached ? "text-emerald-600" : "text-gray-500"
                }`}
              >
                {m.label}
              </p>
              <p
                className={`text-sm font-bold ${
                  m.reached ? "text-emerald-700" : "text-gray-700"
                }`}
              >
                ${m.price.toFixed(2)}
              </p>
              {m.reached && (
                <div className="w-4 h-4 rounded-full bg-emerald-500 mx-auto mt-1 flex items-center justify-center">
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Projected Value Chart */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          Projected Credit Value Over Time
        </p>
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projections.timeline} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "price") return [`$${value.toFixed(2)}`, "Price/Credit"];
                  return [`$${value.toLocaleString()}`, "Total Value"];
                }}
              />
              <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                {projections.timeline.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index < 3 ? "#34d399" : index < 5 ? "#10b981" : "#059669"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500 mb-0.5">Total Credits</p>
          <p className="text-sm font-bold text-gray-900">
            {totalCredits.toLocaleString()}
          </p>
        </div>
        <div className="text-center rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500 mb-0.5">5yr Projected</p>
          <p className="text-sm font-bold text-emerald-600">
            ${projections.fiveYearValue.toLocaleString()}
          </p>
        </div>
        <div className="text-center rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500 mb-0.5">Appreciation</p>
          <p className="text-sm font-bold text-emerald-600">
            {appreciation}%/yr
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditProjection;
