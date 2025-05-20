import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import UserMenu from "@/components/UserMenu";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    age: "",
    gender: "",
    marital_status: "",
  });

  const fetchProfile = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile({
        age: data.age || "",
        gender: data.gender || "",
        marital_status: data.marital_status || "",
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    await supabase
      .from("profiles")
      .upsert({ id: user.id, ...profile })
      .then(() => navigate("/vibes"))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <UserMenu />
      <div className="bg-white shadow-xl p-6 rounded-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-primary mb-4 text-center">Complete Your Profile</h2>
        <div className="space-y-4">
          <input
            type="number"
            name="age"
            value={profile.age}
            onChange={handleChange}
            placeholder="Age"
            className="w-full p-3 border rounded-xl"
          />
          <select
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select
            name="marital_status"
            value={profile.marital_status}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          >
            <option value="">Marital Status</option>
            <option value="single">Single</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-primary text-white py-2 rounded-xl hover:bg-primary-dark"
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}
