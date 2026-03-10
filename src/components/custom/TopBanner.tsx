import React from "react";
import { useNavigate } from "react-router-dom";
import { ShimmerButton } from "../ui/shimmer-button";

const TopBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full py-3 text-center text-white bg-gradient-to-r from-gray-700 via-gray-900 to-black">
      <div className="flex flex-col items-center justify-center px-4 md:flex-row gap-y-2 md:gap-x-4 md:px-6 lg:px-8">
        <p className="text-sm font- md:text-md lg:text-lg">
          Signup for our waitlist and get early access to invest in the
          properties.
        </p>
        <ShimmerButton
          className="mt-2 px-6 py-1 border hover:cursor-pointer border-white/30 shadow-2xl md:mt-0"
          onClick={() => {
            navigate("/waitlist");
          }}
        >
          <span className="text-xs font-medium leading-none tracking-tight text-center text-white whitespace-pre-wrap md:text-sm lg:text-base dark:from-white dark:to-slate-900/10">
            Join Waitlist
          </span>
        </ShimmerButton>
      </div>
    </div>
  );
};

export default TopBanner;
