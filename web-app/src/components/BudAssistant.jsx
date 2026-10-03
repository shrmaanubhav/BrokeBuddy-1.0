import { useState } from "react";

import askBudImage from "../assets/ask_bud.png";
import ChatBot from "../pages/Chat/Chat";

export default function BudAssistant({ currentPage, isAuthenticated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div
          className="bud-panel"
          style={{
            position: "fixed",
            right: "24px",
            bottom: "90px",
            width: "405px",
            height: "auto",
            maxHeight: "calc(100vh - 160px)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <ChatBot
            compact
            currentPage={currentPage}
            messages={messages}
            setMessages={setMessages}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close BUD" : "Ask BUD"}
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          width: "150px",
          height: "auto",
          padding: 0,
          margin: 0,
          border: "none",
          background: "transparent",
          display: "block",
          flex: "none",
          flexShrink: 0,
          zIndex: 1100,
          cursor: "pointer",
        }}
      >
        <img
          src={askBudImage}
          alt=""
          style={{
          position: "fixed",
          right: "12px",
          bottom: "24px",
          width: "150px",
          height: "auto",
          padding: 0,
          margin: 0,
          border: "none",
          background: "transparent",
          display: "block",
          flex: "none",
          flexShrink: 0,
          zIndex: 1100,
          cursor: "pointer",
        }}
        />
      </button>
    </>
  );
}