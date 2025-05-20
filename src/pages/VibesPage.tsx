import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import UserMenu from "@/components/UserMenu";

interface Profile {
  id: string;
  age: number;
  gender: string;
  marital_status: string;
  name?: string;
  avatar_url?: string;
}

export default function VibesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filters, setFilters] = useState({
    gender: "",
    marital_status: "",
    minAge: "",
    maxAge: "",
  });
  const [userId, setUserId] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserId = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) setUserId(user.id);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      let query = supabase.from("profiles").select("*").neq("id", userId);

      if (filters.gender) query = query.eq("gender", filters.gender);
      if (filters.marital_status) query = query.eq("marital_status", filters.marital_status);
      if (filters.minAge) query = query.gte("age", Number(filters.minAge));
      if (filters.maxAge) query = query.lte("age", Number(filters.maxAge));

      const { data } = await query;
      if (data) setProfiles(data);
    };

    if (userId) fetchProfiles();
  }, [filters, userId]);

  const handleLike = async (targetId: string) => {
    await supabase.from("likes").insert([{ source_user: userId, target_user: targetId }]);
    setProfiles((prev) => prev.filter((p) => p.id !== targetId));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <UserMenu />
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-primary mb-4">Discover Vibes</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            name="gender"
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            className="p-2 border rounded-xl"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select
            name="marital_status"
            value={filters.marital_status}
            onChange={(e) => setFilters({ ...filters, marital_status: e.target.value })}
            className="p-2 border rounded-xl"
          >
            <option value="">All Status</option>
            <option value="single">Single</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
          <input
            type="number"
            placeholder="Min Age"
            value={filters.minAge}
            onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
            className="p-2 border rounded-xl"
          />
          <input
            type="number"
            placeholder="Max Age"
            value={filters.maxAge}
            onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
            className="p-2 border rounded-xl"
          />
        </div>

        {/* Profiles List */}
        {profiles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white p-4 rounded-2xl shadow hover:shadow-lg transition">
                <img
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${profile.id}`}
                  alt="avatar"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
                <h3 className="text-lg font-bold text-primary mb-1">{profile.name || "Anonymous"}</h3>
                <p className="text-sm text-gray-700">Age: {profile.age}</p>
                <p className="text-sm text-gray-700">Gender: {profile.gender}</p>
                <p className="text-sm text-gray-700 mb-3">Status: {profile.marital_status}</p>
                <button
                  onClick={() => handleLike(profile.id)}
                  className="w-full bg-primary text-white py-2 rounded-xl hover:bg-primary-dark"
                >
                  ❤️ Like
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center mt-12">No matches found. Try adjusting filters.</p>
        )}
      </div>
    </div>
  );
}
