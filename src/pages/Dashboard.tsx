/* eslint-disable @typescript-eslint/no-explicit-any */
import Sidebar from "@/components/custom/Sidebar";

export const Dashboard = ({ children }: any) => {

  return (
    <div className="flex h-screen border-t min-w-full flex-1">
      <Sidebar />
        <main className="flex py-6 sm:py-8 overflow-y-auto overflow-x-hidden justify-center w-full">
          <div className="w-full px-4 sm:px-6 md:px-8 max-w-7xl">{children}</div>
        </main>
    </div>
  );
};
