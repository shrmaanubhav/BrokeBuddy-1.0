import React, { useState, useEffect, useRef } from "react";
import "./ChatBot.css"; 

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! Welcome to Inbox spend. How can I assist you today?", sender: "bot" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setIsTyping(true);
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: "Thank you for your message! I'm processing your request.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="chatbot-container">
      {/* Header */}
      <header className="chat-header">
        <div className="avatar">I</div>
        <div>
          <h1 className="title">Inbox spend</h1>
          <div className="status">
            <span className="status-dot"></span>
            <p className="status-text">Online</p>
          </div>
        </div>
      </header>

      {/* Message Container */}
      <main className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-row ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.sender === "bot" && <div className="bot-avatar"></div>}
            <div className={`message-bubble ${msg.sender}`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="message-row bot">
            <div className="bot-avatar"></div>
            <div className="typing-bubble">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Form */}
      <footer className="input-area">
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="message-input"
            autoComplete="off"
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!inputValue.trim()}
          >
            ➤
          </button>
        </form>
      </footer>
    </div>
  );
}
