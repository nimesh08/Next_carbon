import Carousel from "@/components/animata/Carousel";
import ValueParameter from "@/components/custom/ValueParameter";
import ViewHighlight from "@/components/custom/ViewHighlight";
import InvestmentCalculator from "@/components/custom/InvestmentCalculator";
import CreditProjection from "@/components/custom/CreditProjection";
import {
  faCalendarDay,
  faChevronLeft,
  faChevronRight,
  faCircleInfo,
  faCopy,
  faRulerCombined,
  faLeaf,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRazorpay } from "react-razorpay";
import axios from "axios";
import { toast } from "sonner";
import KycForm from "@/components/custom/dashboard/sub-components/KycForm";
import { useKyc } from "@/hooks/KycContext";
import Project from "@/types/type";

// Simple in-memory cache for fetched properties
const propertyCache = new Map<string, Project>();

const PropertyView: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Project | null>(null);
  const { user } = useAuth();
  const { kycStatus } = useKyc();
  const [showKycDialog, setShowKycDialog] = useState<boolean>(false);
  const [investObject, setInvestObject] = useState<{ amount: string }>({
    amount: "",
  });
  const [priceChange, setPriceChange] = useState<{
    direction: 'up' | 'down' | null;
    percentage: number | null;
  }>({ direction: null, percentage: null });
  const propertyId = window.location.pathname.split("/").pop();
  const { Razorpay } = useRazorpay();
  const currentRoute = useLocation();

  // Memoize propertyId to ensure it's stable
  const memoizedPropertyId = useMemo(() => propertyId, [propertyId]);

  useEffect(() => {
    let isCancelled = false;

    const fetchProjects = async () => {
      if (!memoizedPropertyId) return;

      if (propertyCache.has(memoizedPropertyId)) {
        if (!isCancelled) {
          setData(propertyCache.get(memoizedPropertyId) ?? null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("property_data")
          .select("*")
          .eq("id", memoizedPropertyId);

        if (error) {
          if (!isCancelled) toast.error("Error fetching property data");
          console.error(error);
          return;
        }

        if (data?.length) {
          if (!isCancelled) {
            setData(data[0] as Project);
            propertyCache.set(memoizedPropertyId, data[0]);
          }
        } else {
          if (!isCancelled) toast.error("No property found");
        }
      } catch (error) {
        if (!isCancelled) toast.error("Unexpected error occurred");
        console.error(error);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      isCancelled = true;
    };
  }, [memoizedPropertyId]);

  // Real-time subscription for property updates
  useEffect(() => {
    if (!memoizedPropertyId) return;

    const propertyChannel = supabase
      .channel(`property_${memoizedPropertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_data',
          filter: `id=eq.${memoizedPropertyId}`,
        },
        (payload) => {

          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedProperty = payload.new as Project;
            setData(updatedProperty);
            propertyCache.set(memoizedPropertyId, updatedProperty);

            // Show toast notification for price changes
            if (payload.old && (payload.old as Project).price !== updatedProperty.price) {
              const oldPrice = (payload.old as Project).price;
              const newPrice = updatedProperty.price;

              if (oldPrice && newPrice) {
                const changePercent = ((newPrice - oldPrice) / oldPrice * 100);

                // Set price change state for visual indicator
                setPriceChange({
                  direction: newPrice > oldPrice ? 'up' : 'down',
                  percentage: changePercent
                });

                // Clear the price change indicator after 3 seconds
                setTimeout(() => {
                  setPriceChange({ direction: null, percentage: null });
                }, 3000);
              }
            }

            // Show toast notification for shares changes
            if (payload.old && (payload.old as Project).available_shares !== updatedProperty.available_shares) {
              const oldShares = (payload.old as Project).available_shares;
              const newShares = updatedProperty.available_shares;

              if (oldShares !== undefined && newShares !== undefined && oldShares !== null && newShares !== null) {
                const sharesSold = oldShares - newShares;
                if (sharesSold > 0) {
                  toast.success(
                    `🎉 ${sharesSold.toLocaleString()} shares sold! ${newShares.toLocaleString()} remaining.`,
                    {
                      duration: 5000,
                      position: 'top-right',
                      style: {
                        background: '#10b981',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      },
                    }
                  );
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(propertyChannel);
    };
  }, [memoizedPropertyId]);

  async function handleBuy() {
    console.log("buy btn clicked")
    if (!user) {
      toast.error("Please login to invest");
      return;
    }

    const { data: orderData } = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/orders/create`,
      {
        userId: user.id,
        propertyId,
        shares: parseInt(investObject.amount),
      }
    );

    if (!orderData || orderData.success === false) {
      toast.error("Failed to create order");
      return;
    }

    const razorpay = new Razorpay({
      name: "Next Carbon",
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: orderData.data.amount,
      currency: orderData.data.currency,
      description: "Payment for buying property shares",
      order_id: orderData.data.id,
      handler: async (res) => {
        try {
          toast.loading("Verifying payment...", {
            id: "razorpay",
          });
          const { data } = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/orders/verify`,
            {
              orderId: res.razorpay_order_id,
              userId: user.id,
              propertyId,
              shares: parseInt(investObject.amount),
              paymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            }
          );

          if (!data || data.success === false) {
            toast.error("Payment verification failed", {
              id: "razorpay",
            });
            return;
          }

          if (data.tokenTxHash) {
            toast.success(
              <div>
                <p>Payment successful! Tokens minted.</p>
                <a
                  href={`https://amoy.polygonscan.com/tx/${data.tokenTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline text-sm"
                >
                  View token mint tx
                </a>
              </div>,
              { id: "razorpay", duration: 10000 }
            );
          } else {
            toast.success("Payment successful", {
              id: "razorpay",
            });
          }
        } catch (error) {
          console.log(error);
        }
      },
    });

    razorpay.open();
  }

  if (loading) {
    return (
      <div className="flex min-w-full justify-center py-12">
        <div className="container px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded-lg w-48" />
            <div className="h-12 bg-gray-200 rounded-lg w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="h-28 bg-gray-200 rounded-xl" />
              <div className="h-28 bg-gray-200 rounded-xl" />
              <div className="h-28 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access first item of attributes array
  const attributes = data?.attributes;
  const irrVal = parseFloat(attributes?.irr ?? "11.1");
  const arrVal = parseFloat(attributes?.arr ?? "9");
  const roiVal = data?.value_parameters?.[0]?.roi ?? 14;
  const appreciationVal = data?.value_parameters?.[0]?.appreciation ?? 8;
  const sharesCount = parseInt(investObject.amount) || 0;
  const investmentTotal = sharesCount * (data?.price ?? 0);
  const projected5yr = investmentTotal * Math.pow(1 + irrVal / 100, 5);

  return (
    <div className="flex min-w-full justify-center relative">
      <div className="container flex flex-col lg:flex-row items-start px-4 sm:px-6">
        {/* Left container */}
        <div className="py-6 text-left mb-8 lg:mb-16 w-full lg:w-[60%] lg:pr-8">
          <div className="flex flex-row items-center justify-between w-full gap-2 flex-wrap">
            <div
              className="flex flex-row items-center px-4 sm:px-6 py-2 mb-2 rounded-full gap-x-2 sm:gap-x-3 hover:cursor-pointer bg-black text-white transition-opacity hover:opacity-80"
              onClick={() => navigate("/dashboard")}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-white" size="sm" />
              <p className="text-xs sm:text-sm">Back to Dashboard</p>
            </div>
            <div
              className="flex flex-row items-center px-4 sm:px-6 py-2 mb-2 rounded-full gap-x-2 sm:gap-x-3 hover:cursor-pointer bg-black text-white transition-opacity hover:opacity-80"
              onClick={() => navigate(`${currentRoute.pathname}/status`)}
            >
              <p className="text-xs sm:text-sm">To Status</p>
              <FontAwesomeIcon icon={faChevronRight} className="text-white" size="sm" />
            </div>
          </div>

          {/* Name */}
          <h1 className="mb-1 text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">{data?.name ?? "N/A"}</h1>

          {/* Description */}
          <div className="flex flex-col">
            <p className="mt-2 mb-4 text-base sm:text-lg leading-relaxed text-gray-700">
              {data?.description ?? "No description available"}
            </p>
            <div className="flex flex-wrap justify-start py-2 mb-4 gap-3">
              <div className="flex flex-row items-center p-2.5 pl-4 bg-white border border-gray-200 rounded-xl gap-x-3 shadow-sm">
                <FontAwesomeIcon icon={faLeaf} size="lg" className="text-emerald-600" />
                <div className="flex flex-col leading-tight">
                  <p className="text-xs text-gray-500">Carbon Credits</p>
                  <p className="font-bold text-gray-900 text-sm">{data?.totalShares?.toLocaleString() ?? "N/A"}</p>
                </div>
              </div>
              <div className="flex flex-row items-center p-2.5 pl-4 bg-white border border-gray-200 rounded-xl gap-x-3 shadow-sm">
                <FontAwesomeIcon icon={faCalendarDay} size="lg" className="text-blue-600" />
                <div className="flex flex-col leading-tight">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {data?.created_at ? new Date(data.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-center p-2.5 pl-4 bg-white border border-gray-200 rounded-xl gap-x-3 shadow-sm">
                <FontAwesomeIcon icon={faRulerCombined} size="lg" className="text-purple-600" />
                <div className="flex flex-col leading-tight">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-bold text-gray-900 text-sm">{data?.type ?? "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Value Parameters */}
          <div className="flex flex-row items-center gap-x-2">
            <h2 className="mb-0 text-lg sm:text-xl font-bold">Value Parameters</h2>
            <div className="tooltip tooltip-right" data-tip="Specific measurable factors related to property value, growth, or financial performance.">
              <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400" />
            </div>
          </div>
          <div className="h-px bg-gray-200 my-3" />
          {data?.value_parameters && data.value_parameters.length > 0 ? (
            <ValueParameter parameters={data.value_parameters} />
          ) : (
            <p className="text-base text-gray-500">No value parameters available</p>
          )}

          {/* Investment Calculator */}
          <div className="mt-8">
            <InvestmentCalculator
              sharePrice={data?.price ?? 12.5}
              irr={irrVal}
              arr={arrVal}
              appreciation={appreciationVal}
              roi={roiVal}
              totalShares={data?.totalShares ?? 10000}
              availableShares={data?.available_shares ?? 0}
            />
          </div>

          {/* Credit Projection */}
          <div className="mt-6">
            <CreditProjection
              totalCredits={data?.totalShares ?? 10000}
              sharePrice={data?.price ?? 12.5}
              appreciation={appreciationVal}
              irr={irrVal}
              maturityPercentage={data?.maturity_percentage ?? 0}
              projectName={data?.name ?? "Project"}
            />
          </div>

          {/* Highlights */}
          <div className="flex flex-row items-center mt-8 gap-x-2">
            <h2 className="mb-0 text-lg sm:text-xl font-bold">Highlights</h2>
            <div className="tooltip tooltip-right" data-tip="Core, static features or amenities that define the property's attractiveness.">
              <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400" />
            </div>
          </div>
          <div className="h-px bg-gray-200 my-3" />
          {data?.Highlights && data.Highlights.length > 0 ? (
            <ViewHighlight highlights={data.Highlights} />
          ) : (
            <p className="text-base text-gray-500">No highlights available</p>
          )}

          {/* Image Gallery */}
          <h2 className="mt-8 mb-0 text-lg sm:text-xl font-bold">Image Gallery</h2>
          <div className="h-px bg-gray-200 my-3" />
          <div className="mb-6 bg-gray-100 rounded-xl overflow-hidden">
            <Carousel className="w-min-72 storybook-fix relative" />
          </div>

          {/* Documents */}
          <h2 className="mt-8 mb-0 text-lg sm:text-xl font-bold">Documents</h2>
          <div className="h-px bg-gray-200 my-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {(data?.Documents && data.Documents.length > 0
              ? data.Documents
              : ["No documents available"]
            ).map((doc, index) => (
              <div
                key={index}
                className="flex items-center p-3 px-4 text-sm bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2 shrink-0 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-700">{doc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right container */}
        <div className="w-full p-4 sm:p-6 lg:w-[40%] lg:sticky lg:top-0 flex flex-col gap-y-4 pb-20 lg:pb-6">
          <div className="flex flex-col items-start p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between w-full">
              <p className="text-xl font-bold text-gray-900">Token Metadata</p>
            </div>
            <div className="flex flex-col w-full mt-3 gap-y-1.5 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <p className="text-gray-600">Token Address</p>
                <div className="flex items-center gap-x-2">
                  <a
                    href={data?.token_address ? `https://amoy.polygonscan.com/address/${data.token_address}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[100px] sm:max-w-[120px]"
                  >
                    {data?.token_address ? `${data.token_address.slice(0, 6)}...${data.token_address.slice(-4)}` : "N/A"}
                  </a>
                  <FontAwesomeIcon
                    icon={faCopy}
                    className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    size="sm"
                    onClick={() => {
                      if (data?.token_address) {
                        navigator.clipboard.writeText(data.token_address);
                        toast.success("Token address copied!");
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <p className="text-gray-600">Owner Address</p>
                <FontAwesomeIcon
                  icon={faCopy}
                  className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText("Owner address")}
                />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <p className="text-gray-600">Current Status</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${data?.is_mature ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {data?.is_mature ? "Fully Matured" : data?.status ?? "N/A"}
                </span>
              </div>
              {(data?.maturity_percentage ?? 0) > 0 && (
                <div className="w-full py-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Maturity Progress</span>
                    <span>{(data?.maturity_percentage ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${(data?.maturity_percentage ?? 0) >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${data?.maturity_percentage ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5">
                <p className="text-gray-600">NFT Symbol</p>
                <p className="font-medium text-gray-900">{attributes?.nftSymbol ?? "Sunfar"}</p>
              </div>
            </div>
            <div className="h-px w-full bg-gray-200 my-3" />
            <div className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-gray-100 py-3 px-2">
                <p className="text-xs text-gray-500">IRR</p>
                <p className="text-lg font-bold text-gray-900">{attributes?.irr ?? "11.1%"}</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-gray-100 py-3 px-2">
                <p className="text-xs text-gray-500">ARR</p>
                <p className="text-lg font-bold text-gray-900">{attributes?.arr ?? "9%"}</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-gray-100 py-3 px-2">
                <p className="text-xs text-gray-500">Share/NFT</p>
                <p className="text-lg font-bold text-gray-900">{attributes?.sharePerNFT ? `${attributes.sharePerNFT}%` : "N/A"}</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-gray-100 py-3 px-2">
                <p className="text-xs text-gray-500">Total Shares</p>
                <p className="text-lg font-bold text-gray-900">{data?.totalShares?.toLocaleString() ?? "N/A"}</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-gray-100 py-3 px-2 col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500">Share Price</p>
                <p className="text-lg font-bold text-gray-900">${data?.price ?? "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Available Value</p>
                <p className={`text-xl font-bold transition-colors duration-300 ${priceChange.direction === 'up' ? 'text-emerald-600' : priceChange.direction === 'down' ? 'text-red-600' : 'text-gray-900'}`}>
                  {data?.price && data?.available_shares ? `$${(data.price * data.available_shares).toLocaleString("en-US")}` : "$0"}
                  <span className="text-xs font-normal ml-1 text-gray-500">USD</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-xl font-bold text-gray-900">
                  {`$${((data?.totalShares ?? 0) * (data?.price ?? 0)).toLocaleString("en-US")}`}
                  <span className="text-xs font-normal ml-1 text-gray-500">USD</span>
                </p>
              </div>
            </div>

            {/* Shares Distribution */}
            <div className="p-3 mb-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-800">Shares Distribution</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" /> Sold</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full inline-block" /> Available</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Sold: {((data?.totalShares ?? 0) - (data?.available_shares ?? 0)).toLocaleString()}</span>
                <span>Available: {(data?.available_shares ?? 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="flex h-full">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${data?.totalShares ? ((data.totalShares - (data.available_shares ?? 0)) / data.totalShares * 100) : 0}%` }} />
                  <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${data?.totalShares ? ((data.available_shares ?? 0) / data.totalShares * 100) : 0}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span className="font-semibold text-emerald-600">
                  {data?.totalShares ? (((data.totalShares - (data.available_shares ?? 0)) / data.totalShares * 100)).toFixed(1) : 0}% Sold
                </span>
                <span className="font-semibold text-blue-600">
                  {data?.totalShares ? (((data.available_shares ?? 0) / data.totalShares * 100)).toFixed(1) : 0}% Available
                </span>
              </div>
            </div>

            <div className="flex justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Share Price</p>
                <p className="text-xl font-bold text-gray-900">
                  {data?.price ? `$${data.price.toFixed(1)}` : "$0.00"}
                  <span className="text-xs font-normal text-gray-500 ml-1">USDC</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Available Shares</p>
                <p className="text-xl font-bold text-gray-900">{data?.available_shares?.toLocaleString() ?? "N/A"}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-1.5 text-sm text-gray-600">Your Balance: 0 USDC</p>
              <input
                type="text"
                placeholder="Enter amount of shares to buy"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={investObject.amount}
                onChange={(e) => setInvestObject({ ...investObject, amount: e.target.value })}
              />
            </div>

            {/* Live Investment Summary */}
            {sharesCount > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-medium text-emerald-700 mb-1">Investment Summary</p>
                <p className="text-sm text-emerald-800">
                  Buying <span className="font-bold">{sharesCount.toLocaleString()} shares</span> at ${data?.price?.toFixed(2)} = <span className="font-bold">${investmentTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Projected 5yr return: ${projected5yr.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({((projected5yr / investmentTotal - 1) * 100).toFixed(1)}% gain)
                </p>
              </div>
            )}

            {user ? (
              <>
                {loading ? (
                  <button disabled className="w-full py-2.5 text-sm font-medium text-white bg-gray-400 rounded-xl cursor-not-allowed">
                    Checking KYC status...
                  </button>
                ) : kycStatus === true ? (
                  <button
                    className="w-full py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition-colors"
                    onClick={async () => await handleBuy()}
                  >
                    Invest Now with USDC
                  </button>
                ) : kycStatus === false ? (
                  <button disabled className="w-full py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-xl cursor-not-allowed">
                    Your KYC is under process
                  </button>
                ) : (
                  <button
                    onClick={() => setShowKycDialog(true)}
                    className="w-full py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
                  >
                    Complete KYC to invest
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => setShowKycDialog(true)}
                className="w-full py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors"
              >
                Login to start investing
              </button>
            )}
          </div>
        </div>
        <KycForm open={showKycDialog} onOpenChange={setShowKycDialog} />
      </div>
    </div>
  );
};

export default PropertyView;