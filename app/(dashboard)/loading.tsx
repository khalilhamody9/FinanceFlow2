"use client";

import { useEffect, useState } from "react";

export default function DashboardLoading() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    setLogoUrl(window.localStorage.getItem("financeflow-organization-logo"));
  }, []);

  return (
    <div dir="rtl" className="fixed inset-0 z-[100] grid place-items-center bg-[#F6F8FC]">
      <style>{`
        @keyframes ff-logo-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 18px 50px rgba(6,27,60,.14); }
          50% { transform: scale(1.055); box-shadow: 0 24px 65px rgba(201,155,45,.24); }
        }
        @keyframes ff-loader-spin { to { transform: rotate(360deg); } }
        .ff-loading-logo { animation: ff-logo-pulse 1.5s ease-in-out infinite; }
        .ff-loading-ring { animation: ff-loader-spin 1.1s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ff-loading-logo, .ff-loading-ring { animation: none; }
        }
      `}</style>

      <div className="flex flex-col items-center gap-6">
        <div className="relative grid h-44 w-44 place-items-center">
          <span className="ff-loading-ring absolute inset-0 rounded-full border-2 border-[#E8EDF5] border-t-[#C99B2D]" />
          <div className="ff-loading-logo grid h-32 w-32 place-items-center overflow-hidden rounded-[2rem] border border-[#C99B2D]/50 bg-white p-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="לוגו המשרד" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-bold tracking-wider text-[#C99B2D]">FF</span>
            )}
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#0B2348]">טוען את נתוני המשרד</p>
          <p className="mt-1 text-xs text-[#94A0B3]">רק רגע...</p>
        </div>
      </div>
    </div>
  );
}
