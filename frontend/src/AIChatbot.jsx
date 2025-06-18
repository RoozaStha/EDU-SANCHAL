import { useState } from "react";
import { useChatbot } from "./context/ChatbotContext";
import { Input, Button } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";

export default function AIChatbot() {
  const { isChatbotOpen, closeChatbot, toggleChatbot } = useChatbot();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

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
      const errorMessage = {
        sender: "bot",
        text: "Sorry, I couldn't process your request. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
      {isChatbotOpen ? (
        <div
          style={{
            width: 320,
            background: "#fff",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <strong>Ask AI</strong>
            <Button size="small" onClick={closeChatbot}>
              <CloseIcon fontSize="small" />
            </Button>
          </div>
          <div
            style={{
              height: 256,
              overflowY: "auto",
              marginBottom: 8,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    background:
                      msg.sender === "user" ? "#e3f2fd" : "#f0f0f0",
                    padding: "8px 12px",
                    borderRadius: 12,
                    maxWidth: "80%",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#777",
                  padding: 16,
                  fontStyle: "italic",
                }}
              >
                Ask me anything about attendance, leave requests, or school policies!
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question..."
              autoFocus
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              disabled={!input.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="contained"
          onClick={toggleChatbot}
          style={{
            borderRadius: "50%",
            minWidth: 48,
            height: 48,
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
          aria-label="Open chatbot"
        >
          <ChatIcon />
        </Button>
      )}
    </div>
  );
}