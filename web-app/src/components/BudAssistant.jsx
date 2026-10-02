import { useState } from "react";

import ChatBot from "../pages/Chat/Chat";

export default function BudAssistant({ currentPage, isAuthenticated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bud-assistant">
      {isOpen && (
        <div className="bud-panel">
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
        className="bud-button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close BUD" : "Open BUD"}
      >
        BUD
      </button>
    </div>
  );
}
