import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InspectionDetail from "./pages/InspectionDetail.jsx";
import AssetList from "./pages/AssetList.jsx";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-void">
      <Navbar />
      {/* Main content: offset by sidebar width on md+, top bar height on mobile */}
      <main className="min-h-screen pt-14 md:pl-64 md:pt-0">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Key forces re-mount animation on route change */}
          <div key={location.pathname} className="page-enter">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inspections/:id" element={<InspectionDetail />} />
              <Route path="/assets" element={<AssetList />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}
