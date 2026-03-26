import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";

const CLOUD_NAME = "ddpte2a93";
const UPLOAD_PRESET = "shopinfo_unsigned";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function AddProduct() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({ name: "", price: "" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async () => {
    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: data }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      return json.secure_url;
    } catch (err) {
      throw new Error("Cloudinary: " + err.message);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !image) {
      alert("Please fill all fields and select an image.");
      return;
    }
    setLoading(true);
    try {
      const imageUrl = await uploadToCloudinary();
      if (!imageUrl) throw new Error("Image upload returned no URL");

      await axios.post(
        `${API_URL}/api/products/add`,
        { name: form.name, price: form.price, shopId, image: imageUrl },
        { headers: { Authorization: token } }
      );

      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data || err.message || "Failed to add product";
      alert(typeof msg === "object" ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-16 font-sans flex flex-col items-center pt-16 px-4">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 rounded-b-[3rem] shadow-xl z-0"></div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
           <Link to="/dashboard" className="text-white/80 hover:text-white font-medium flex items-center gap-2 transition bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
             ← Back to Dashboard
           </Link>
           <h1 className="text-3xl font-extrabold text-white tracking-tight text-center flex-1">Add Product</h1>
           <div className="w-[140px]"></div> {/* spacer for centering */}
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/60">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border border-indigo-100">
              🏷️
            </div>
            <h2 className="text-2xl font-bold text-gray-800">New Item</h2>
            <p className="text-gray-500 text-sm mt-1">Fill in the details to list your item in the shop.</p>
          </div>

          <div className="space-y-6">
            
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">Product Name</label>
              <input
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-lg rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 block p-4 transition-all outline-none font-medium"
                placeholder="e.g. Wireless Headphones"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">Price (₹)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-gray-400 font-bold text-lg">₹</span>
                </div>
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xl font-bold rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 block pl-10 p-4 transition-all outline-none"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">Product Image</label>
              
              {!preview ? (
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-indigo-200 border-dashed rounded-2xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-colors group">
                     <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <span className="text-4xl mb-3 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition duration-300">📸</span>
                        <p className="mb-1 text-sm text-indigo-700 font-semibold"><span className="font-bold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-indigo-400 font-medium">PNG, JPG or WEBP (MAX. 5MB)</p>
                     </div>
                     <input id="dropzone-file" type="file" accept="image/*" onChange={handleImage} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="relative group rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm">
                  <img src={preview} alt="preview" className="w-full h-56 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-6 rounded-full border border-white/50 backdrop-blur-md transition">
                      Change Image
                      <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                className={`group relative w-full overflow-hidden rounded-2xl p-[2px] focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all ${loading ? 'opacity-70 cursor-wait' : 'hover:shadow-xl hover:-translate-y-1'}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                <div className={`absolute inset-0 ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600'}`}></div>
                <div className={`relative bg-opacity-0 px-8 py-4 rounded-2xl flex items-center justify-center gap-2 ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600'}`}>
                   {loading ? (
                     <>
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                       <span className="text-white font-bold text-lg">Uploading...</span>
                     </>
                   ) : (
                     <>
                       <span className="text-white font-bold text-lg">Publish Product 🚀</span>
                     </>
                   )}
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
