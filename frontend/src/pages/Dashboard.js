import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

// Fix for default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapUpdater({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords[1], coords[0]], 15);
  }, [coords, map]);
  return null;
}

const CLOUD_NAME = "ddpte2a93";
const UPLOAD_PRESET = "shopinfo_unsigned";
const API_URL = process.env.REACT_APP_API_URL || (["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:5001" : "");

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home"); // "home", "products", "settings"

  // Data states
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shop Settings Form
  const [shopForm, setShopForm] = useState({
    name: "", category: "", phone: "", address: "",
    openingTime: "09:00", closingTime: "22:00"
  });
  const [coords, setCoords] = useState(null);
  const [isUpdatingShop, setIsUpdatingShop] = useState(false);

  // Product Add/Edit Form
  const [productForm, setProductForm] = useState({ name: "", price: "" });
  const [productImage, setProductImage] = useState(null);
  const [productPreview, setProductPreview] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const merchantName = localStorage.getItem("merchantName");

  useEffect(() => {
    if (!token) return navigate("/merchant");

    // Silently fix stale merchantName in localStorage by fetching fresh from backend
    const fixMerchantName = async () => {
      const currentName = localStorage.getItem("merchantName");
      if (!currentName || currentName === "undefined" || currentName === "null") {
        try {
          const res = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: token },
          });
          if (res.data?.name) {
            localStorage.setItem("merchantName", res.data.name);
          }
        } catch {
          // Ignore errors - fetchMyShop will handle auth failures
        }
      }
    };

    fixMerchantName();
    fetchMyShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyShop = async (forceRefresh = false) => {
    try {
      setLoading(true);
      // Ensure we hit the network with a unique query param to absolutely defeat browser Edge caching
      const cacheBuster = forceRefresh ? `?timestamp=${new Date().getTime()}` : "";
      
      const res = await axios.get(`${API_URL}/api/shops/merchant/my${cacheBuster}`, {
        headers: { Authorization: token },
      });
      const data = res.data;
      if (data && data._id) {
        setShop(data);
        setShopForm({
          name: data.name,
          category: data.category,
          phone: data.phone,
          address: data.address || "",
          openingTime: data.openingTime || "09:00",
          closingTime: data.closingTime || "22:00",
        });
        if (data.location?.coordinates) {
          setCoords(data.location.coordinates); // [lng, lat]
        }
        await fetchProducts(data._id);
      } else {
        setShop(null);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        localStorage.clear();
        navigate("/merchant");
      } else {
        // Log all other errors (like 500 or Network Errors) explicitly so we can see them.
        console.error("fetchMyShop Critical Error:", err);
        if (forceRefresh) alert("Could not reach the server: " + (err.response?.data || err.message));
      }
    }
    setLoading(false);
  };

  const fetchProducts = async (shopId) => {
    try {
      const res = await axios.get(`${API_URL}/api/products/${shopId}`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load products", err);
      setProducts([]);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/merchant");
  };

  // --- SHOP SETTINGS LOGIC ---
  const handleUpdateShop = async (e) => {
    e.preventDefault();
    setIsUpdatingShop(true);
    try {
      const payload = {
        ...shopForm,
        ...(coords && { location: { type: "Point", coordinates: coords } }),
      };
      const res = await axios.put(`${API_URL}/api/shops/merchant/my`, payload, {
        headers: { Authorization: token },
      });
      setShop(res.data);
      alert("Shop Profile Updated successfully!");
    } catch (err) {
      alert(err.response?.data || "Failed to update shop");
    } finally {
      setIsUpdatingShop(false);
    }
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords([pos.coords.longitude, pos.coords.latitude]),
      () => alert("Location access denied. You can proceed without it.")
    );
  };

  const handleToggleShopStatus = async () => {
    try {
      const newStatus = !shop.isManuallyClosed;
      const res = await axios.put(`${API_URL}/api/shops/merchant/my/status`, {
        isManuallyClosed: newStatus
      }, { headers: { Authorization: token } });
      setShop(res.data);
    } catch (err) {
      console.error("Status Toggle Failed", err);
      alert(err.response?.data || "Failed to update shop status. Please check if backend server is running.");
    }
  };

  // --- PRODUCT MANAGEMENT LOGIC ---
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImage(file);
      setProductPreview(URL.createObjectURL(file));
    }
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({ name: product.name, price: product.price });
    setProductPreview(product.image); // This is the URL
    setProductImage(null); // Keep null unless they pick a new file
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setProductForm({ name: "", price: "" });
    setProductPreview(null);
    setProductImage(null);
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST", body: data
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      return json.secure_url;
    } catch (err) {
      throw new Error("Cloudinary: " + err.message);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return alert("Fill out name and price.");
    if (!editingProductId && !productImage) return alert("Select an image for new product.");

    setIsUpdatingProduct(true);
    try {
      let finalImageUrl = productPreview; // existing URL if editing and not changed

      // If they uploaded a new file, push to Cloudinary
      if (productImage) {
        finalImageUrl = await uploadToCloudinary(productImage);
      }

      if (editingProductId) {
        // Edit flow
        const res = await axios.put(
          `${API_URL}/api/products/${editingProductId}`,
          { name: productForm.name, price: productForm.price, image: finalImageUrl },
          { headers: { Authorization: token } }
        );
        setProducts(products.map(p => p._id === editingProductId ? res.data : p));
        alert("Product updated!");
      } else {
        // Add flow
        const res = await axios.post(
          `${API_URL}/api/products/add`,
          { name: productForm.name, price: productForm.price, shopId: shop._id, image: finalImageUrl },
          { headers: { Authorization: token } }
        );
        setProducts([res.data, ...products]);
        alert("Product added!");
      }
      cancelEditProduct(); // clear form
    } catch (err) {
      alert(err.response?.data || err.message || "Failed to save product");
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product forever?")) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: token },
      });
      setProducts(products.filter(p => p._id !== id));
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      const newStatus = product.isAvailable === false ? true : false;
      const res = await axios.patch(`${API_URL}/api/products/${product._id}/availability`, {
        isAvailable: newStatus
      }, { headers: { Authorization: token } });
      setProducts(products.map(p => p._id === product._id ? res.data : p));
    } catch (err) {
      alert("Failed to update stock status.");
    }
  };

  // --- RENDER VIEWS ---

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 animate-spin border-t-green-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4 drop-shadow-sm">⚠️</span>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Shop Data Missing</h2>
        <p className="text-slate-500 max-w-md mt-4 text-lg font-medium">
          It looks like your browser is stuck loading an old cached version of your shop, or the network dropped.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button 
            onClick={() => fetchMyShop(true)} 
            className="px-8 py-3 bg-emerald-600 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            <span>🔄</span> Force Reload Data
          </button>
          
          <button 
            onClick={logout} 
            className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-red-500 transition-colors"
          >
            Logout completely
          </button>
        </div>
      </div>
    );
  }

  // Define tab classes
  const tabClass = (tabId) => `w-full text-left px-4 py-3 rounded-lg font-medium transition duration-200 flex items-center gap-3 ${activeTab === tabId ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 hidden md:flex">
        <div className="p-6 border-b border-gray-100">
          <div className="text-2xl font-extrabold text-green-600 tracking-tight flex items-center gap-2">
            <span>🏪</span> ShopInfo
          </div>
          <p className="text-xs text-gray-400 font-bold uppercase mt-2">Merchant Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("home")} className={tabClass("home")}>
            <span className="text-xl">📊</span> Dashboard Home
          </button>
          <button onClick={() => setActiveTab("products")} className={tabClass("products")}>
            <span className="text-xl">📦</span> Manage Products
          </button>
          <button onClick={() => setActiveTab("settings")} className={tabClass("settings")}>
            <span className="text-xl">⚙️</span> Shop Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-200 text-green-700 rounded-full flex items-center justify-center font-bold">
              {merchantName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{merchantName}</p>
              <p className="text-xs text-gray-500 font-medium">Merchant</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">

        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 z-10 shrink-0">

          {/* Mobile menu toggle & brand */}
          <div className="md:hidden flex items-center gap-2">
            <div className="text-xl font-extrabold text-green-600 tracking-tight flex items-center gap-2">
              <span>🏪</span> ShopInfo
            </div>
          </div>
          <div className="hidden md:block">
            {/* Desktop breadcrumb or title could go here if needed, leaving blank for minimalist look */}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={logout} className="text-sm font-bold text-gray-500 hover:text-red-500 transition px-3 py-1.5 rounded bg-gray-100 hover:bg-red-50">
              Logout
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEW AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* === VIEW A: DASHBOARD HOME === */}
            {activeTab === "home" && (
              <div className="animate-fade-in">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome back, {shop.name}</h2>
                <p className="text-gray-500 mb-8">Here's a quick overview of your shop's performance today.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* STAT CARD 1 */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-4">Total Products Listed</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl font-bold">
                        📦
                      </div>
                      <div>
                        <p className="text-4xl font-extrabold text-gray-800">{products.length}</p>
                        <p className="text-sm text-gray-400 font-medium">Items in inventory</p>
                      </div>
                    </div>
                  </div>

                  {/* STAT CARD 2 */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-4">Shop Status</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl font-bold">
                        🚀
                      </div>
                      <div className="flex-1">
                        <p className={`text-2xl font-extrabold uppercase ${shop.isManuallyClosed ? 'text-red-500' : 'text-green-600'}`}>
                          {shop.isManuallyClosed ? "Closed (Manual)" : "Live"}
                        </p>
                        <p className="text-sm text-gray-400 font-medium">Click to toggle shutdown</p>
                      </div>
                      <button
                        onClick={handleToggleShopStatus}
                        className={`relative inline-flex h-8 w-14 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none shadow-inner ${!shop.isManuallyClosed ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${!shop.isManuallyClosed ? 'translate-x-3' : '-translate-x-3'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CALL TO ACTION */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
                  <div className="absolute -right-10 -top-10 opacity-10 text-9xl">🛍️</div>
                  <div className="relative z-10 max-w-xl">
                    <h3 className="text-2xl font-bold mb-2">Ready to expand your catalog?</h3>
                    <p className="text-blue-100 mb-6 font-medium text-lg">Add fresh products to your shop to attract more local buyers.</p>
                    <button onClick={() => setActiveTab("products")} className="bg-white text-blue-700 font-extrabold py-3 px-8 rounded-xl hover:shadow-xl hover:-translate-y-1 transition transform flex items-center gap-2">
                      <span className="text-xl mb-0.5">+</span> Add New Product
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* === VIEW B: MANAGE PRODUCTS === */}
            {activeTab === "products" && (
              <div className="animate-fade-in space-y-8">
                <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-1">Manage Products</h2>
                    <p className="text-gray-500">Add new items or edit your existing inventory.</p>
                  </div>
                </div>

                {/* ADD/EDIT FORM */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    {editingProductId ? <span>✏️ Edit Selected Product</span> : <span>➕ Add A New Product</span>}
                  </h3>

                  <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Product Name</label>
                        <input className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 p-3 outline-none transition"
                          placeholder="e.g. Fresh Apples" required
                          value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Price (₹)</label>
                        <input className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 p-3 outline-none transition font-bold"
                          type="number" placeholder="0.00" required
                          value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Product Image</label>
                      {!productPreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                          <span className="text-gray-400 font-medium text-sm px-4 text-center">Click to upload image</span>
                          <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                        </label>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 h-32 w-full flex items-center justify-center bg-gray-100 group">
                          <img src={productPreview} alt="preview" className="object-cover h-full w-full opacity-80" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer bg-white/30 hover:bg-white/50 text-white font-bold py-1 px-4 rounded-full text-sm backdrop-blur transition border border-white/50">
                              Change File
                              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 pt-2 flex gap-3">
                      <button type="submit" disabled={isUpdatingProduct} className={`flex-1 font-bold py-3 rounded-xl transition shadow flex justify-center items-center gap-2 ${isUpdatingProduct ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'}`}>
                        {isUpdatingProduct ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Saving...</>
                        ) : (
                          editingProductId ? "Update Product" : "+ Add Product to Store"
                        )}
                      </button>
                      {editingProductId && (
                        <button type="button" onClick={cancelEditProduct} className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold py-3 rounded-xl transition">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* PRODUCT LIST */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Your Listed Products ({products.length})</h3>
                  {products.length === 0 ? (
                    <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center text-gray-500">
                      No products found. Use the form above to add your first product.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {(Array.isArray(products) ? products : []).map((p) => (
                        <div key={p._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition">
                          <div className="h-40 bg-gray-100 relative">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className={`font-bold line-clamp-2 leading-snug mb-2 ${p.isAvailable === false ? 'text-gray-400' : 'text-gray-800'}`}>{p.name}</h4>
                              <div className="flex items-center justify-between mb-4 mt-2">
                                <p className={`font-extrabold ${p.isAvailable === false ? 'text-gray-400' : 'text-green-600'}`}>₹{p.price}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-400">{p.isAvailable === false ? 'Out of Stock' : 'In Stock'}</span>
                                  <button
                                    onClick={() => handleToggleAvailability(p)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none ${p.isAvailable !== false ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                                  >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.isAvailable !== false ? 'translate-x-2' : '-translate-x-2'}`} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 border-t border-gray-100 pt-3">
                              <button onClick={() => startEditProduct(p)} className="flex-1 bg-gray-50 text-gray-600 text-sm font-bold py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteProduct(p._id)} className="flex-1 bg-red-50 text-red-600 text-sm font-bold py-1.5 rounded-lg hover:bg-red-100 border border-red-100 transition">
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === VIEW C: SHOP SETTINGS === */}
            {activeTab === "settings" && (
              <div className="animate-fade-in max-w-3xl">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-3xl font-extrabold text-gray-800 mb-1">Shop Settings</h2>
                  <p className="text-gray-500">Manage your public profile and contact information.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <form onSubmit={handleUpdateShop} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Shop Name</label>
                        <input className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 p-3 outline-none transition font-medium"
                          required value={shopForm.name} onChange={e => setShopForm({ ...shopForm, name: e.target.value })} />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                        <select className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 p-3 outline-none transition font-medium appearance-none"
                          required value={shopForm.category} onChange={e => setShopForm({ ...shopForm, category: e.target.value })}>
                          <option value="" disabled>Select Category</option>
                          {["Food", "Electronics", "Clothing", "Grocery", "Pharmacy", "Other", "Services", "Books"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Phone Number</label>
                        <input className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 p-3 outline-none transition font-medium"
                          required value={shopForm.phone} onChange={e => setShopForm({ ...shopForm, phone: e.target.value })} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Opening Time</label>
                          <input type="time" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-400 transition"
                            value={shopForm.openingTime} onChange={e => setShopForm({ ...shopForm, openingTime: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Closing Time</label>
                          <input type="time" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-400 transition"
                            value={shopForm.closingTime} onChange={e => setShopForm({ ...shopForm, closingTime: e.target.value })} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Full Address</label>
                        <textarea className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 p-3 outline-none transition min-h-[100px] font-medium"
                          required value={shopForm.address} onChange={e => setShopForm({ ...shopForm, address: e.target.value })} />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Location Coordinates</p>
                          <p className="text-xs text-gray-500 mt-0.5">{coords ? `Stored: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]` : "No precise location set"}</p>
                        </div>
                        <button type="button" onClick={getLocation} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-green-600 transition shadow-sm">
                          {coords ? 'Update GPS' : 'Detect GPS'}
                        </button>
                      </div>

                      {coords && (
                        <div className="md:col-span-2 h-64 w-full rounded-2xl overflow-hidden border border-gray-200">
                          <MapContainer center={[coords[1], coords[0]]} zoom={15} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[coords[1], coords[0]]} />
                            <MapUpdater coords={coords} />
                          </MapContainer>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                      <button type="submit" disabled={isUpdatingShop} className={`px-8 py-3 rounded-xl font-bold transition shadow-sm text-white ${isUpdatingShop ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 hover:shadow-md'}`}>
                        {isUpdatingShop ? "Updating..." : "Update Profile"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

    </div>
  );
}
