import React, { useState, useEffect, useRef } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import api from "../../lib/api";
import budLogo from "../../assets/bud_logo.png";
import "./Chat.css";

const quickPrompts = [
  "Analyze my spending",
  "Summarize this month",
  "Where did I spend the most?",
  "How am I doing on my budget?",
];

const pageDescriptionMap = {
  dashboard: "Your personal finance assistant",
  expenses: "Analyze your spending and patterns",
  transactions: "Review your transactions with context",
  chatbot: "Your personal finance assistant",
};

export default function ChatBot({
  currentPage = null,
  compact = false,
  messages: externalMessages,
  setMessages: setExternalMessages,
  onClose,
}) {
  const [internalMessages, setInternalMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  const messages = externalMessages ?? internalMessages;
  const setMessages = setExternalMessages ?? setInternalMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const submitQuery = async (nextQuery) => {
    const query = nextQuery.trim();

    if (!query) return;

    const userMessage = {
      id: Date.now(),
      text: query,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const payload = {
        query,
        ...(currentPage ? { context: { page: currentPage } } : {}),
      };
      const { data } = await api.post("/api/chat", payload);
      const chatResp = data?.response ?? "Sorry, I couldn't generate a response.";
      const botResponse = {
        id: Date.now() + 1,
        text: chatResp,
        sender: "bot",
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error talking to backend:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Sorry, something went wrong.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    await submitQuery(inputValue);
  };

  const handleClearConversation = () => {
    setMessages([]);
    setInputValue("");
  };

  const hasConversation = messages.length > 0;
  const pageCopy = pageDescriptionMap[currentPage] || pageDescriptionMap.dashboard;

  if (compact) {
    return (
      <div className="chatbot-container chatbot-container--compact">
        <header className="chat-header">
          <div className="avatar">
            <img src={budLogo} alt="BUD logo" className="bud-logo-image" />
          </div>
          <div className="chat-header-copy">
            <h1 className="title">BUD</h1>
            <p className="status-text">Your personal finance assistant</p>
          </div>
          {onClose && (
            <button type="button" className="chat-close-btn" onClick={onClose} aria-label="Close BUD">
              ×
            </button>
          )}
        </header>

        {!hasConversation ? (
          <div className="empty-state">
            <div className="empty-state-bud">
              <img src={budLogo} alt="BUD logo" className="bud-logo-image" />
            </div>
            <h2>Hi, I’m BUD.</h2>
            <p>{pageCopy}</p>

            <div className="quick-prompt-list">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="quick-prompt"
                  onClick={() => submitQuery(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <main className="messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-row ${msg.sender === "user" ? "user" : "bot"}`}
              >
                {msg.sender === "bot" && (
                  <div className="bot-avatar">
                    <img src={budLogo} alt="BUD logo" className="bud-logo-image" />
                  </div>
                )}
                <div className={`message-bubble ${msg.sender}`}>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-row bot">
                <div className="bot-avatar">
                  <img src={budLogo} alt="BUD logo" className="bud-logo-image" />
                </div>
                <div className="typing-bubble" aria-label="BUD is typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>
        )}

        <footer className="input-area">
          <form onSubmit={handleSendMessage} className="input-form">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Ask BUD something..."
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

  return (
    <div className={`chatbot-workspace ${isSidebarCollapsed ? "chatbot-workspace--sidebar-collapsed" : ""}`}>
      <div className="workspace-body">
        <aside className={`conversation-sidebar ${isSidebarCollapsed ? "is-collapsed" : ""}`}>

        <div className="workspace-brand">
          <div className="avatar">
            <img src={budLogo} alt="BUD logo" className="bud-logo-image" />
          </div>

          {!isSidebarCollapsed && (
            <div className="workspace-brand-copy">
              <h1 className="title">BUD</h1>
              <p className="status-text">Your personal finance assistant</p>
            </div>
          )}

          <button
            type="button"
            className="sidebar-toggle sidebar-toggle--inside"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

          <div className="sidebar-header-row">
            {!isSidebarCollapsed && <h2>Conversations</h2>}
          </div>

          {!isSidebarCollapsed && (
            <button type="button" className="sidebar-new-chat" onClick={handleClearConversation}>
              <Plus size={16} />
              <span className="sidebar-button-label">New Chat</span>
            </button>
          )}

          {!isSidebarCollapsed && hasConversation ? (
            <div className="conversation-groups">
              <div className="conversation-group">
                <p className="group-label">Today</p>
                <button type="button" className="conversation-item active">
                  Current conversation
                </button>
              </div>

              <div className="conversation-group">
                <p className="group-label">Yesterday</p>
                <button type="button" className="conversation-item muted">
                  Previous conversation
                </button>
              </div>
            </div>
          ) : null}

          {!isSidebarCollapsed && !hasConversation ? (
            <div className="sidebar-empty-state">
              <span>Your conversations will appear here.</span>
            </div>
          ) : null}

          {isSidebarCollapsed && (
            <div className="sidebar-collapsed-rail">
              <button type="button" className="sidebar-rail-button" onClick={handleClearConversation} aria-label="New Chat">
                <Plus size={18} />
              </button>
            </div>
          )}
        </aside>

        <section className="workspace-main">
          {!hasConversation ? (
            <div className="workspace-empty-state">
              <div className="workspace-empty-panel">
                <div className="empty-state-bud">
                  <img src={budLogo} alt="BUD logo" className="bud-logo-image" />
                </div>
                <h2>Hi, I’m BUD</h2>
                <p className="empty-kicker">Your personal finance assistant</p>
                <p className="empty-description">
                  Ask me about your spending, budgets, transactions, or finances.
                </p>

                <div className="quick-prompt-grid">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="workspace-prompt"
                      onClick={() => submitQuery(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <main className="messages workspace-thread">
              <div className="thread-inner">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-row ${msg.sender === "user" ? "user" : "bot"}`}
                  >
                    {msg.sender === "bot" && (
                      <div className="bot-avatar">
                        <img src={budLogo} alt="BUD logo" className="bud-logo-image" />
                      </div>
                    )}
                    <div className={`message-bubble ${msg.sender}`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="message-row bot">
                     <div className="bot-avatar">
                        <img src={budLogo} alt="BUD logo" className="bud-logo-image" />
                      </div>
                    <div className="typing-bubble" aria-label="BUD is typing">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </main>
          )}

          <footer className="input-area workspace-input-area">
            <form onSubmit={handleSendMessage} className="input-form workspace-input-form">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Ask BUD something..."
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
        </section>
      </div>
    </div>
  );
}
