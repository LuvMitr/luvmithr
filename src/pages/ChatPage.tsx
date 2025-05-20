import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import UserMenu from "@/components/UserMenu";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface Profile {
  id: string;
  name?: string;
  avatar_url?: string;
}

export default function ChatPage() {
  const { userId: chatUserId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [receiverProfile, setReceiverProfile] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) setCurrentUserId(user.id);
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserId || !chatUserId) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${chatUserId}),and(sender_id.eq.${chatUserId},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", chatUserId!)
        .single();

      if (data) setReceiverProfile(data);
    };

    if (currentUserId) {
      fetchMessages();
      fetchProfile();

      const channel = supabase
        .channel("chat-room")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const newMessage: Message = payload.new;
            const involved = [newMessage.sender_id, newMessage.receiver_id].includes(currentUserId);
            if (involved) {
              setMessages((prev) => [...prev, newMessage]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, chatUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !currentUserId || !chatUserId) return;

    await supabase.from("messages").insert([
      {
        sender_id: currentUserId,
        receiver_id: chatUserId,
        content: message.trim(),
      },
    ]);

    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      <UserMenu />
      <div className="bg-white rounded-2xl shadow max-w-2xl w-full mx-auto flex flex-col flex-grow">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b p-4">
          <img
            src={
              receiverProfile?.avatar_url ||
              `https://api.dicebear.com/7.x/thumbs/svg?seed=${chatUserId}`
            }
            alt="Avatar"
            className="w-10 h-10 rounded-full"
          />
          <h2 className="text-lg font-bold text-primary">
            {receiverProfile?.name || "Match"}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[75%] p-3 rounded-xl ${
                msg.sender_id === currentUserId
                  ? "ml-auto bg-primary text-white rounded-br-none"
                  : "mr-auto bg-gray-200 text-gray-900 rounded-bl-none"
              }`}
            >
              {msg.content}
              <div className="text-xs mt-1 text-right opacity-60">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 border rounded-xl px-4 py-2"
          />
          <button
            onClick={handleSend}
            className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
