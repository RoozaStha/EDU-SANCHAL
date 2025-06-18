import React, { createContext, useState, useContext } from "react";

const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const openChatbot = () => setIsChatbotOpen(true);
  const closeChatbot = () => setIsChatbotOpen(false);
  const toggleChatbot = () => setIsChatbotOpen(prev => !prev);

  return (
    <ChatbotContext.Provider 
      value={{ isChatbotOpen, openChatbot, closeChatbot, toggleChatbot }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => useContext(ChatbotContext);