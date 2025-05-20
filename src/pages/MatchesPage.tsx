import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import UserMenu from "@/components/UserMenu";

interface MatchProfile {
  id: string;
  name?: string;
  age: number;
  gender: string;
  marital_status: string;
  avatar_url?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      setUserId(user.id);

      const { data: liked } = await supabase
        .from("likes")
        .select("target_user")
        .eq("source_user", user.id);

      const { data: likedMe } = await supabase
        .from("likes")
        .select("source_user")
        .eq("target_user", user.id);

      const likedIds = liked?.map((l) => l.target_user) || [];
      const likedMeIds = likedMe?.map((l) => l.source_user) || [];

      const mutualIds = likedIds.filter((id) => likedMeIds.includes(id));

      if (mutualIds.length === 0) {
        setMatches([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", mutualIds);

      if (profiles) setMatches(profiles);
    };

    fetchMatches();
  }, []);

  const startChat = (matchId: string) => {
    navigate(`/chat/${matchId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <UserMenu />
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-primary mb-4">Your Matches</h2>

        {matches.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <div key={match.id} className="bg-white p-4 rounded-2xl shadow hover:shadow-lg transition">
                <img
                  src={match.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${match.id}`}
                  alt="avatar"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
                <h3 className="text-lg font-bold text-primary mb-1">{match.name || "Anonymous"}</h3>
                <p className="text-sm text-gray-700">Age: {match.age}</p>
                <p className="text-sm text-gray-700">Gender: {match.gender}</p>
                <p className="text-sm text-gray-700 mb-3">Status: {match.marital_status}</p>
                <button
                  onClick={() => startChat(match.id)}
                  className="w-full bg-primary text-white py-2 rounded-xl hover:bg-primary-dark"
                >
                  💬 Chat
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center mt-12">No matches yet. Start liking some profiles!</p>
        )}
      </div>
    </div>
  );
}
