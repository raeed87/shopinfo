import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Map icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_URL = process.env.REACT_APP_API_URL || (["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:5001" : "");

const CATEGORY_ICONS = {
  Food: "🍽️", Electronics: "📱", Clothing: "👗",
  Grocery: "🛒", Pharmacy: "💊", Other: "📦", Services: "🔧", Books: "📚",
};

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

  // Handle shops that close after midnight
  const isOpen = closeMinutes > openMinutes 
    ? (currentMinutes >= openMinutes && currentMinutes < closeMinutes)
    : (currentMinutes >= openMinutes || currentMinutes < closeMinutes);

  if (!isOpen) return { label: "🔴 Closed", color: "red" };

  const remaining = closeMinutes > openMinutes
    ? closeMinutes - currentMinutes
    : (closeMinutes + 1440) - currentMinutes;

  if (remaining > 0 && remaining <= 30) return { label: "🟠 Closing Soon", color: "orange" };

  return { label: "🟢 Open Now", color: "emerald" };
}

function ShopDetails() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/shops/${id}`),
      axios.get(`${API_URL}/api/products/${id}`),
    ]).then(([shopRes, productsRes]) => {
      setShop(shopRes.data);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-gray-500 font-medium">Loading shop details...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Shop Not Found</h2>
        <button onClick={() => navigate("/home")} className="mt-4 text-blue-600 font-bold hover:underline">
          ← Back to Shops
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <span className="text-2xl font-extrabold text-blue-600 tracking-tight cursor-pointer" onClick={() => navigate("/")}>
          🏪 ShopInfo
        </span>
        <button
          onClick={() => navigate("/home")}
          className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition bg-gray-100 hover:bg-blue-50 px-4 py-2 rounded-full"
        >
          ← All Shops
        </button>
      </nav>

      {/* HERO BANNER */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-900 text-white overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Shop Icon */}
            <div className="w-24 h-24 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-3xl flex items-center justify-center text-5xl shadow-xl shrink-0">
              {CATEGORY_ICONS[shop.category] || "🏪"}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-white/20 text-white font-bold text-xs px-3 py-1 rounded-full border border-white/30">
                  {shop.category}
                </span>
                <span className={`font-bold text-xs px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  getTimeStatus(shop.openingTime, shop.closingTime, shop.isManuallyClosed).color === 'emerald' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' :
                  getTimeStatus(shop.openingTime, shop.closingTime, shop.isManuallyClosed).color === 'orange' ? 'bg-orange-500/20 text-orange-200 border-orange-400/30' :
                  'bg-red-500/20 text-red-200 border-red-400/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    getTimeStatus(shop.openingTime, shop.closingTime, shop.isManuallyClosed).color === 'emerald' ? 'bg-emerald-400' :
                    getTimeStatus(shop.openingTime, shop.closingTime, shop.isManuallyClosed).color === 'orange' ? 'bg-orange-400' :
                    'bg-red-400'
                  }`}></span> 
                  {getTimeStatus(shop.openingTime, shop.closingTime, shop.isManuallyClosed).label}
                </span>
              </div>

              <h1 className="text-4xl font-extrabold mb-4 leading-tight">{shop.name}</h1>

              <div className="flex flex-wrap gap-4 text-sm font-medium mb-6">
                <div className="flex items-center gap-2 text-blue-100">
                  <span>📍</span>
                  <span>{shop.address || "Address not provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <span>📞</span>
                  <span>{shop.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                  <span>⏰</span>
                  <span>{shop.openingTime || "09:00"} - {shop.closingTime || "22:00"}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={`tel:${shop.phone}`}
                  className="inline-flex items-center gap-2 bg-white text-blue-700 font-extrabold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  📞 Call Now
                </a>
                {shop.location?.coordinates?.length === 2 && (
                  <a
                    href={`https://www.google.com/maps?q=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/25 transition-all duration-200 backdrop-blur"
                  >
                    🗺️ Get Directions
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAP SECTION */}
      {shop.location?.coordinates?.length === 2 && (
        <div className="bg-white border-b border-gray-100 py-12">
           <div className="max-w-5xl mx-auto px-6">
              <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4">
                 <div>
                    <h2 className="text-2xl font-black text-gray-800">Store Location</h2>
                    <p className="text-gray-500 font-medium">Find us on the map</p>
                 </div>
                 <a
                    href={`https://www.google.com/maps?q=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`}
                    target="_blank" rel="noreferrer"
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                 >
                   Open in Google Maps ↗
                 </a>
              </div>
              <div className="h-[300px] md:h-[400px] w-full rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-4 border-white transition-transform duration-500 hover:scale-[1.01]">
                <MapContainer center={[shop.location.coordinates[1], shop.location.coordinates[0]]} zoom={15} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[shop.location.coordinates[1], shop.location.coordinates[0]]}>
                    <Popup>
                      <div className="font-bold text-blue-600">{shop.name}</div>
                      <div className="text-xs text-gray-500">{shop.address}</div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
           </div>
        </div>
      )}

      {/* PRODUCTS SECTION */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800">Product Catalog</h2>
            <p className="text-gray-500 mt-1">{products.length} item{products.length !== 1 ? "s" : ""} available</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 border-dashed py-24 text-center shadow-sm">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Products Listed Yet</h3>
            <p className="text-gray-400 max-w-xs mx-auto text-sm">This shop hasn't added products yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(Array.isArray(products) ? products : []).map(product => (
              <div key={product._id} className={`group bg-white rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 overflow-hidden flex flex-col ${product.isAvailable === false ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:-translate-y-1'}`}>
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${product.isAvailable !== false ? 'group-hover:scale-105' : ''}`}
                    onError={e => { e.target.src = "https://via.placeholder.com/300x200?text=No+Image"; }}
                  />
                  {product.isAvailable !== false && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  {product.isAvailable === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                       <span className="bg-white/90 text-gray-800 font-extrabold px-4 py-2 rounded-xl shadow-lg backdrop-blur text-sm tracking-wide">OUT OF STOCK</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between">
                  <h4 className="font-bold text-gray-800 text-base leading-snug mb-3 line-clamp-2">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className={`font-extrabold text-xl ${product.isAvailable === false ? 'text-gray-500' : 'text-green-600'}`}>₹{product.price}</span>
                    {product.isAvailable !== false ? (
                      <span className="text-xs text-green-700 font-bold bg-green-100/50 px-2 py-1 rounded-md uppercase tracking-wide border border-green-200">In Stock</span>
                    ) : (
                      <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-md uppercase tracking-wide">Sold Out</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default ShopDetails;
