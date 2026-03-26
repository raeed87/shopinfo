import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AddShop() {
  const [form, setForm] = useState({ name: "", category: "", phone: "", address: "" });
  const [coords, setCoords] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        alert("Location captured!");
      },
      () => alert("Location access denied")
    );
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        ...(coords && { location: { type: "Point", coordinates: coords } }),
      };
      await axios.post("http://localhost:5001/api/shops/add", payload, {
        headers: { Authorization: token },
      });
      alert("Shop added!");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data || "Failed to add shop");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add Shop</h2>

      <input className="border p-2 w-full mb-2 rounded" placeholder="Shop Name"
        onChange={e => setForm({ ...form, name: e.target.value })} />
      <input className="border p-2 w-full mb-2 rounded" placeholder="Category"
        onChange={e => setForm({ ...form, category: e.target.value })} />
      <input className="border p-2 w-full mb-2 rounded" placeholder="Phone"
        onChange={e => setForm({ ...form, phone: e.target.value })} />
      <input className="border p-2 w-full mb-3 rounded" placeholder="Address"
        onChange={e => setForm({ ...form, address: e.target.value })} />

      <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded w-full mb-3 hover:bg-blue-50"
        onClick={getLocation}>
        {coords ? "✅ Location Captured" : "📍 Capture My Location"}
      </button>

      <button className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600"
        onClick={handleSubmit}>Add Shop</button>
    </div>
  );
}

export default AddShop;
