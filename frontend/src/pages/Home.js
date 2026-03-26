import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const CATEGORIES = ["All", "Food", "Electronics", "Clothing", "Grocery", "Pharmacy", "Other", "Services", "Books"];
const CATEGORY_ICONS = {
  All: "🏪", Food: "🍽️", Electronics: "📱", Clothing: "👗",
  Grocery: "🛒", Pharmacy: "💊", Other: "📦", Services: "🔧", Books: "📚",
};

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5001" : "");

// Calculate Haversine distance with high precision formatting
// Calculate Haversine distance with high precision formatting
function getDistanceKmRaw(coords1, coords2) {
  if (!coords1 || !coords2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((coords2[1] - coords1[1]) * Math.PI) / 180;
  const dLon = ((coords2[0] - coords1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coords1[1] * Math.PI) / 180) *
      Math.cos((coords2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(coords1, coords2) {
  const dist = getDistanceKmRaw(coords1, coords2);
  if (dist === null) return null;
  if (dist < 1) {
    return Math.round(dist * 1000) + " m";
  }
  if (dist < 10) {
    return dist.toFixed(2) + " km";
  }
  return dist.toFixed(1) + " km";
}

// Logic to determine if shop is open/closed
function getTimeStatus(opening, closing, isManuallyClosed) {
  if (isManuallyClosed) return { label: "🔴 Closed (Manual)", color: "red" };
  if (!opening || !closing) return { label: "Hours Unknown", color: "gray" };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = opening.split(":").map(Number);
  const [closeH, closeM] = closing.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Handle shops that close after midnight (e.g., 10 AM to 2 AM)
  const isOpen = closeMinutes > openMinutes 
    ? (currentMinutes >= openMinutes && currentMinutes < closeMinutes)
    : (currentMinutes >= openMinutes || currentMinutes < closeMinutes);

  if (!isOpen) return { label: "🔴 Closed", color: "red" };

  // Check if closing in less than 30 mins
  const remaining = closeMinutes > openMinutes
    ? closeMinutes - currentMinutes
    : (closeMinutes + 1440) - currentMinutes;

  if (remaining > 0 && remaining <= 30) return { label: "🟠 Closing Soon", color: "orange" };

  return { label: "🟢 Open Now", color: "emerald" };
}

export default function Home() {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [userCoords, setUserCoords] = useState(null); // [lng, lat]
  const [nearbyMode, setNearbyMode] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // Unified Search: Fetch shops AND products
  const fetchResults = useCallback(async (searchTerm = "", cat = "All") => {
    setPageLoading(true);
    try {
      // 1. Fetch Shops
      const shopParams = new URLSearchParams();
      if (searchTerm) shopParams.set("search", searchTerm);
      if (cat !== "All") shopParams.set("category", cat);
      const shopRes = await axios.get(`${API_URL}/api/shops?${shopParams.toString()}`);
      
      let sData = shopRes.data;
      if (userCoords && sData.length > 0) {
        sData = sData.map(s => {
          const coords = s.location?.coordinates;
          const distVal = coords ? getDistanceKmRaw(userCoords, coords) : Infinity;
          return { ...s, distVal };
        }).sort((a, b) => a.distVal - b.distVal);
      }
      setShops(sData);

      // 2. Fetch Products (Dynamic Smart Search)
      if (searchTerm) {
        const prodRes = await axios.get(`${API_URL}/api/products/search?q=${searchTerm}`);
        let pData = prodRes.data;
        
        // Sort products by proximity if userCoords available
        if (userCoords && pData.length > 0) {
          pData = pData.map(p => {
            const coords = p.shopId?.location?.coordinates;
            const distVal = coords ? getDistanceKmRaw(userCoords, coords) : Infinity;
            return { ...p, distVal };
          }).sort((a, b) => a.distVal - b.distVal);
        }
        setProducts(pData);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Search failed", err);
    }
    setPageLoading(false);
  }, [userCoords]);

  const fetchShops = async () => {
    setPageLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/shops`);
      setShops(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch Shops Error:", err);
      setShops([]);
    } finally {
      setPageLoading(false);
    }
  };

  // Fetch nearby shops
  const fetchNearby = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude, latitude } = pos.coords;
        const coords = [longitude, latitude];
        setUserCoords(coords);
        const res = await axios.get(
          `${API_URL}/api/shops/nearby?lng=${longitude}&lat=${latitude}`
        );
        let nData = Array.isArray(res.data) ? res.data : [];
        if (nData.length > 0) {
          nData = nData.map(s => {
            const sc = s.location?.coordinates;
            const distVal = sc ? getDistanceKmRaw(coords, sc) : Infinity;
            return { ...s, distVal };
          }).sort((a, b) => a.distVal - b.distVal);
        }
        setShops(nData);
        setProducts([]); // Clear products in nearby mode
        setNearbyMode(true);
        setLocationLoading(false);
        setPageLoading(false);
      },
      () => {
        alert("Location access denied. Showing all shops instead.");
        setLocationLoading(false);
        fetchResults(search, category);
      }
    );
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { longitude, latitude } = pos.coords;
          const coords = [longitude, latitude];
          setUserCoords(coords);
          const fetchNearbyShops = async (coords) => {
            try {
              const res = await axios.get(`${API_URL}/api/shops/nearby?lng=${coords[0]}&lat=${coords[1]}`);
              setShops(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
              console.error("Fetch Nearby Error", err);
              setShops([]);
            }
          };
          await fetchNearbyShops(coords); // Call the new function
          setNearbyMode(true);
          setPageLoading(false);
        },
        () => {
          fetchResults("", "All");
        }
      );
    } else {
      fetchResults("", "All");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    setNearbyMode(false);
    fetchResults(val.trim(), category);
  };

  const handleCategory = (cat) => {
    setCategory(cat);
    setNearbyMode(false);
    fetchResults(search, cat);
  };

  const handleReset = () => {
    setNearbyMode(false);
    setSearch("");
    setCategory("All");
    fetchResults("", "All");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <span
          className="text-2xl font-extrabold text-blue-600 tracking-tight cursor-pointer flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <span>🏪</span> ShopInfo
        </span>
        <button
          onClick={() => navigate("/merchant")}
          className="text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-5 py-2 rounded-full shadow-md transition"
        >
          Merchant Portal →
        </button>
      </nav>

      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-100 text-sm font-bold px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm">
            {nearbyMode ? "📍 Showing shops closest to you" : "🌍 Discover local shops"}
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Find the Best <br className="hidden md:block" />Local Shops Near You
          </h1>
          <p className="text-blue-200 text-lg mb-8 font-medium">
            Browse hundreds of local shops and discover amazing products in your city
          </p>

          {/* SEARCH BAR */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">🔍</span>
              <input
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-800 font-medium shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 text-base"
                placeholder='Search by shop name or category...'
                value={search}
                onChange={handleSearch}
              />
            </div>
            <button
              className={`px-6 py-4 rounded-2xl font-bold text-sm shadow-xl transition whitespace-nowrap ${
                nearbyMode
                  ? "bg-green-400 text-white hover:bg-green-500"
                  : "bg-white/90 text-blue-700 hover:bg-white"
              }`}
              onClick={nearbyMode ? handleReset : fetchNearby}
              disabled={locationLoading}
            >
              {locationLoading ? "Locating..." : nearbyMode ? "✅ Near Me (Reset)" : "📍 Near Me"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* CATEGORY PILLS */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                category === cat
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span> {cat}
            </button>
          ))}
        </div>

        {/* RESULTS META */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 font-medium text-sm">
            {pageLoading ? "Loading..." : nearbyMode
              ? `📍 ${shops.length} shop${shops.length !== 1 ? "s" : ""} within 5km`
              : `${shops.length} shop${shops.length !== 1 ? "s" : ""} and ${products.length} product${products.length !== 1 ? "s" : ""} found`}
          </p>
          {(search || category !== "All" || nearbyMode) && (
            <button onClick={handleReset} className="text-xs text-blue-600 font-bold hover:underline">
              Clear Filters
            </button>
          )}
        </div>

        {/* SEARCH RESULTS (PRODUCTS) */}
        {!pageLoading && products.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 flex items-center justify-center rounded-lg text-lg">🛍️</span>
              Product Results for "{search}"
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(product => (
                <Link to={`/shop/${product.shopId?._id}`} key={product._id} className="group">
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50 border border-gray-50 relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {!product.isAvailable && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-gray-800 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h4>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-blue-600 font-black text-base">₹{product.price}</div>
                        {userCoords && product.shopId?.location?.coordinates && (
                          <span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full border border-green-100">
                            📍 {formatDistance(userCoords, product.shopId.location.coordinates)}
                          </span>
                        )}
                      </div>
                      
                      {/* Stapled Shop Information */}
                      <div className="mt-auto pt-3 border-t border-gray-50">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Available at:</div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center text-xs">🏪</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-700 truncate">{product.shopId?.name || "Unknown Shop"}</div>
                            <div className="text-[10px] text-gray-400 truncate tracking-tight">{product.shopId?.address}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SHOP GRID */}
        {pageLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (shops.length === 0 && products.length === 0) ? (
          <div className="text-center py-28 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Results Found</h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-6">Try a different search term like "charger" or "pizza".</p>
            <button onClick={handleReset} className="bg-blue-50 text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-100 transition">
              Show All Shops
            </button>
          </div>
        ) : (
          <div>
            {shops.length > 0 && (
              <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 flex items-center justify-center rounded-lg text-lg">🏪</span>
                {search ? `Shops matching "${search}"` : "Discover Shops"}
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map(shop => {
                const dist = userCoords && shop.location?.coordinates?.length === 2
                  ? formatDistance(userCoords, shop.location.coordinates)
                  : null;
                return (
                  <Link to={`/shop/${shop._id}`} key={shop._id} className="group">
                    <div className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 p-6 flex flex-col transition-all duration-300 group-hover:-translate-y-1 h-full">
                      {/* Shop Avatar & Distance Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl border border-blue-100">
                          {CATEGORY_ICONS[shop.category] || "🏪"}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {dist && (
                            <span className="bg-green-50 text-green-600 font-bold text-[10px] px-2.5 py-1 rounded-full border border-green-100 flex items-center gap-1">
                              📍 {dist}
                            </span>
                          )}
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            getTimeStatus(shop.openingTime, shop.closingTime, shop.isManuallyClosed).color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            getTimeStatus(shop.openingTime, shop.closingTime, shop.isManuallyClosed).color === 'orange' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {getTimeStatus(shop.openingTime, shop.closingTime, shop.isManuallyClosed).label}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{shop.name}</h3>
                          <span className="shrink-0 text-xs bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-full border border-blue-100">{shop.category}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>📍</span>
                            <span className="line-clamp-1">{shop.address || "Address not listed"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>📞</span>
                            <span>{shop.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">View Shop & Products →</span>
                        {dist && <span className="text-xs text-gray-400">{dist} km away</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
