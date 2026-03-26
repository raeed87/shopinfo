import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500 opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

      {/* Logo / Brand */}
      <div className="relative z-10 text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-3xl border border-white/20 text-5xl mb-6 shadow-2xl backdrop-blur-lg">
          🏪
        </div>
        <h1 className="text-6xl font-extrabold text-white tracking-tight mb-3">
          Shop<span className="text-blue-400">Info</span>
        </h1>
        <p className="text-blue-200 text-xl font-medium max-w-md">
          Discover the best local shops around you or grow your business online
        </p>
      </div>

      {/* Role Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        
        {/* User Card */}
        <div
          onClick={() => navigate("/home")}
          className="group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col items-center cursor-pointer hover:bg-white/15 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center text-5xl mb-6 border border-blue-400/30">
            🛍️
          </div>
          <h2 className="relative z-10 text-2xl font-bold text-white mb-2">I'm a Shopper</h2>
          <p className="relative z-10 text-blue-200 text-center text-sm mb-7 leading-relaxed">
            Explore local shops, browse products, and find stores near you
          </p>
          <button className="relative z-10 bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-blue-500/30 hover:shadow-xl">
            Browse Shops →
          </button>
        </div>

        {/* Merchant Card */}
        <div
          onClick={() => navigate("/merchant")}
          className="group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col items-center cursor-pointer hover:bg-white/15 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center text-5xl mb-6 border border-green-400/30">
            🏪
          </div>
          <h2 className="relative z-10 text-2xl font-bold text-white mb-2">I'm a Merchant</h2>
          <p className="relative z-10 text-green-200 text-center text-sm mb-7 leading-relaxed">
            Register your shop, manage products, and reach more customers
          </p>
          <button className="relative z-10 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-green-500/30 hover:shadow-xl">
            Open My Shop →
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-white/30 text-xs mt-14 font-medium">
        ShopInfo — Connecting local communities
      </p>
    </div>
  );
}

export default Landing;
