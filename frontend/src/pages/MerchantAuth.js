import { useState } from "react";
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
  if (coords) map.setView([coords[1], coords[0]], 15);
  return null;
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function MerchantAuth() {
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    shopName: "", category: "", phone: "", address: "",
    openingTime: "09:00", closingTime: "22:00"
  });
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("merchantName", res.data.name);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data || "Login failed");
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        ...(coords && { location: { type: "Point", coordinates: coords } })
      };
      await axios.post(`${API_URL}/api/auth/signup`, payload);
      alert("Account created! Please login.");
      setTab("login");
    } catch (err) {
      alert(err.response?.data || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-100/50 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl border border-emerald-50 text-5xl mb-6 transform hover:rotate-3 transition-transform duration-300">
            🏪
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            Merchant <span className="text-emerald-600">Portal</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage and grow your digital storefront</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-10 overflow-hidden relative">
          
          {/* Custom Tabs */}
          <div className="flex mb-10 bg-slate-100/80 rounded-2xl p-1.5 border border-slate-200/50">
            <button
              className={`flex-1 py-3 rounded-[1.25rem] text-sm font-bold transition-all duration-300 ${tab === "login" ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
              onClick={() => setTab("login")}
            >
              Log In
            </button>
            <button
              className={`flex-1 py-3 rounded-[1.25rem] text-sm font-bold transition-all duration-300 ${tab === "signup" ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
              onClick={() => setTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* Form Container */}
          <div className="transition-all duration-500">
            {tab === "login" ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-emerald-500 transition-colors">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none transition-colors group-focus-within:text-emerald-400">✉️</span>
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 p-4 pl-12 outline-none transition-all placeholder:text-slate-300"
                      placeholder="name@email.com"
                      onChange={e => setForm({ ...form, email: e.target.value })} 
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-emerald-500 transition-colors">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none transition-colors group-focus-within:text-emerald-400">🔒</span>
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 p-4 pl-12 outline-none transition-all placeholder:text-slate-300"
                      placeholder="••••••••" 
                      type="password"
                      onChange={e => setForm({ ...form, password: e.target.value })} 
                    />
                  </div>
                </div>

                <button
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
                  onClick={handleLogin} disabled={loading}
                >
                  {loading ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span> : "Sign In & Manage"}
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* SECTION: MERCHANT */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 border-b border-emerald-50 pb-2">Merchant Verification</h3>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 transition" placeholder="Your Name"
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 transition" placeholder="Work Email"
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 transition" placeholder="New Password" type="password"
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>

                {/* SECTION: SHOP */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 border-b border-emerald-50 pb-2">Store Profile</h3>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 transition" placeholder="Business Name"
                    onChange={e => setForm({ ...form, shopName: e.target.value })} />
                  
                  <div className="relative">
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 appearance-none transition text-slate-500"
                      onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="">Store Category</option>
                      {["Food", "Electronics", "Clothing", "Grocery", "Pharmacy", "Other", "Services"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 font-bold">⌄</span>
                  </div>

                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 transition" placeholder="Business Contact Number"
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 transition" placeholder="Physical Address"
                    onChange={e => setForm({ ...form, address: e.target.value })} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Opens At</label>
                      <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 transition"
                        value={form.openingTime} onChange={e => setForm({ ...form, openingTime: e.target.value })} />
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Closes At</label>
                      <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-emerald-400 transition"
                        value={form.closingTime} onChange={e => setForm({ ...form, closingTime: e.target.value })} />
                    </div>
                  </div>

                  <button type="button"
                    className={`w-full p-4 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${coords ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-500"}`}
                    onClick={() => {
                      navigator.geolocation.getCurrentPosition(
                        pos => setCoords([pos.coords.longitude, pos.coords.latitude]),
                        () => alert("Location access denied")
                      );
                    }}>
                    {coords ? "✅ Location Captured" : "📍 Sync Store Location"}
                </button>

                {coords && (
                  <div className="h-40 w-full rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-inner group">
                    <MapContainer center={[coords[1], coords[0]]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[coords[1], coords[0]]} />
                      <MapUpdater coords={coords} />
                    </MapContainer>
                  </div>
                )}
                </div>

                <button
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                  onClick={handleSignup} disabled={loading}>
                  {loading ? "Creating Assets..." : "Launch My Shop"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Link */}
        <button
          className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2 w-full transition-colors"
          onClick={() => navigate("/")}
        >
          <span>←</span> Back to Main Site
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default MerchantAuth;
