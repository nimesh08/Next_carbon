import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface InvestmentCalculatorProps {
  sharePrice: number;
  irr: number;
  arr: number;
  appreciation: number;
  roi: number;
  totalShares: number;
  availableShares: number;
}

const InvestmentCalculator: React.FC<InvestmentCalculatorProps> = ({
  sharePrice,
  irr,
  arr,
  appreciation,
  roi: _roi,
  totalShares: _totalShares,
  availableShares,
}) => {
  const maxInvestment = Math.min(availableShares * sharePrice, 50000);
  const [investmentAmount, setInvestmentAmount] = useState(
    Math.min(1000, maxInvestment)
  );
  const [timeHorizon, setTimeHorizon] = useState(5);

  const calculations = useMemo(() => {
    const shares = investmentAmount / sharePrice;
    const annualReturn = irr / 100;
    const annualYield = arr / 100;
    const appreciationRate = appreciation / 100;

    const chartData = [];
    let cumulativeValue = investmentAmount;

    for (let year = 0; year <= timeHorizon; year++) {
      const projectedValue =
        investmentAmount * Math.pow(1 + annualReturn, year);
      const yieldEarned = investmentAmount * annualYield * year;
      const creditAppreciation =
        investmentAmount * Math.pow(1 + appreciationRate, year) -
        investmentAmount;

      cumulativeValue = projectedValue;

      chartData.push({
        year: `Year ${year}`,
        value: Math.round(projectedValue),
        yield: Math.round(yieldEarned),
        appreciation: Math.round(creditAppreciation),
      });
    }

    const totalReturn = cumulativeValue - investmentAmount;
    const totalYield = investmentAmount * annualYield * timeHorizon;
    const totalAppreciation =
      investmentAmount * Math.pow(1 + appreciationRate, timeHorizon) -
      investmentAmount;

    return {
      shares: shares.toFixed(1),
      projectedValue: Math.round(cumulativeValue),
      totalReturn: Math.round(totalReturn),
      returnPercentage: ((totalReturn / investmentAmount) * 100).toFixed(1),
      annualYieldTotal: Math.round(totalYield),
      totalAppreciation: Math.round(totalAppreciation),
      chartData,
    };
  }, [investmentAmount, timeHorizon, sharePrice, irr, arr, appreciation]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        Investment Calculator
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Simulate your returns based on project metrics
      </p>

      <div className="space-y-5">
        {/* Investment Amount Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Investment Amount
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">$</span>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => {
                  const v = Math.max(
                    100,
                    Math.min(maxInvestment, Number(e.target.value) || 100)
                  );
                  setInvestmentAmount(v);
                }}
                className="w-20 text-right text-sm font-semibold bg-gray-50 border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={maxInvestment}
            step={100}
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>$100</span>
            <span>${maxInvestment.toLocaleString()}</span>
          </div>
        </div>

        {/* Time Horizon Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Time Horizon
            </label>
            <span className="text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-3 py-1">
              {timeHorizon} {timeHorizon === 1 ? "year" : "years"}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 yr</span>
            <span>10 yrs</span>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 sm:p-4">
            <p className="text-xs text-emerald-600 font-medium mb-0.5">
              Projected Value
            </p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700">
              ${calculations.projectedValue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 sm:p-4">
            <p className="text-xs text-blue-600 font-medium mb-0.5">
              Total Return
            </p>
            <p className="text-lg sm:text-xl font-bold text-blue-700">
              +${calculations.totalReturn.toLocaleString()}
            </p>
            <p className="text-xs text-blue-500">
              +{calculations.returnPercentage}%
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 sm:p-4">
            <p className="text-xs text-purple-600 font-medium mb-0.5">
              Annual Yield
            </p>
            <p className="text-lg sm:text-xl font-bold text-purple-700">
              ${calculations.annualYieldTotal.toLocaleString()}
            </p>
            <p className="text-xs text-purple-500">over {timeHorizon}yr</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 sm:p-4">
            <p className="text-xs text-amber-600 font-medium mb-0.5">
              Credit Appreciation
            </p>
            <p className="text-lg sm:text-xl font-bold text-amber-700">
              +${calculations.totalAppreciation.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Shares Info */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">You would get</p>
            <p className="text-sm font-bold text-gray-900">
              {calculations.shares} shares
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">At price</p>
            <p className="text-sm font-bold text-gray-900">
              ${sharePrice.toFixed(2)}/share
            </p>
          </div>
        </div>

        {/* Growth Chart */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Projected Growth
          </p>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calculations.chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Value",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        * Projections are estimates based on current IRR ({irr}%), ARR ({arr}%),
        and appreciation ({appreciation}%) rates. Actual returns may vary. Past
        performance does not guarantee future results.
      </p>
    </div>
  );
};

export default InvestmentCalculator;
