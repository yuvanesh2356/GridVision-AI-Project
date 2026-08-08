import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InspectionDetail from "./pages/InspectionDetail.jsx";
import AssetList from "./pages/AssetList.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-void">
      {/* Navbar now renders as a fixed left sidebar on desktop and a
          slide-in drawer (behind a top bar) on mobile - see Navbar.jsx.
          It owns its own responsive layout, so App.jsx just reserves the
          content offset on md+ screens. */}
      <Navbar />
      <main className="min-h-screen pt-14 md:pl-64 md:pt-0">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inspections/:id" element={<InspectionDetail />} />
            <Route path="/assets" element={<AssetList />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
