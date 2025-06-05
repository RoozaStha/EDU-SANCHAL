// AI Chatbot Integration for EDU-SANCHAL
// Updated component with fixed imports for non-shadcn setup

import { useState } from "react";
import { Input, Button } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const toggleChat = () => setOpen(!open);

 const sendMessage = async () => {
  if (!input.trim()) return;
  const userMessage = { sender: "user", text: input };
  setMessages([...messages, userMessage]);
  setInput("");

  try {
    const res = await fetch("http://localhost:5000/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    if (!res.ok) throw new Error("Failed to fetch response");

    const data = await res.json();
    const botMessage = { sender: "bot", text: data.response };
    setMessages((prev) => [...prev, botMessage]);
  } catch (error) {
    console.error("Error sending message:", error);
    const errorMessage = { sender: "bot", text: "Sorry, I couldn't process your request." };
    setMessages((prev) => [...prev, errorMessage]);
  }
};

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
      {open ? (
        <div style={{ width: 320, background: "#fff", boxShadow: "0 0 10px rgba(0,0,0,0.2)", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>Ask AI</strong>
            <Button size="small" onClick={toggleChat}><CloseIcon fontSize="small" /></Button>
          </div>
          <div style={{ height: 256, overflowY: "auto", marginBottom: 8 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', marginBottom: 4 }}>
                <span style={{ background: msg.sender === 'user' ? '#e3f2fd' : '#f0f0f0', padding: '4px 8px', borderRadius: 8 }}>{msg.text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question..."
            />
            <Button variant="contained" onClick={sendMessage}>Send</Button>
          </div>
        </div>
      ) : (
        <Button variant="contained" onClick={toggleChat} style={{ borderRadius: "50%", minWidth: 48, height: 48 }}>
          <ChatIcon />
        </Button>
      )}
    </div>
  );
}
