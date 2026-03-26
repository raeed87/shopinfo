import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Home from "./pages/Home";
import ShopDetails from "./pages/shopDetails";
import MerchantAuth from "./pages/MerchantAuth";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";

// Merchant navbar — only shown on merchant pages
function MerchantNavbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("merchantName");

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="bg-green-600 text-white px-6 py-4 flex items-center gap-4 shadow-md">
      <span className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>ShopInfo</span>
      <span className="text-sm opacity-75">Merchant Portal</span>
      {token && (
        <>
          <Link to="/dashboard" className="hover:underline text-sm ml-4">My Shop</Link>
          <span className="ml-auto text-sm opacity-75">👤 {name}</span>
          <button onClick={logout} className="text-sm text-red-200 hover:underline">Logout</button>
        </>
      )}
    </nav>
  );
}

// Wrapper for merchant pages with green navbar
function MerchantLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MerchantNavbar />
      {children}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing — no navbar */}
        <Route path="/" element={<Landing />} />

        {/* User side — navbar inside Home & ShopDetails */}
        <Route path="/home" element={<Home />} />
        <Route path="/shop/:id" element={<ShopDetails />} />

        {/* Merchant side — green navbar */}
        <Route path="/merchant" element={<MerchantLayout><MerchantAuth /></MerchantLayout>} />
        <Route path="/dashboard" element={<MerchantLayout><Dashboard /></MerchantLayout>} />
        <Route path="/add-product/:shopId" element={<MerchantLayout><AddProduct /></MerchantLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
