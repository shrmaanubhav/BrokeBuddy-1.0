import React, { useEffect, useState } from "react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BankEmailModal = ({
  isOpen,
  initialValue,
  title,
  placeholder,
  onClose,
  onSave,
  isSaving,
}) => {
  const [email, setEmail] = useState(initialValue || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(initialValue || "");
    setError("");
  }, [initialValue, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter the sender email.");
      return;
    }

    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    await onSave(trimmed);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title || "Bank Sender Email"}</h2>
          <button onClick={onClose} className="modal-close-btn">
            &times;
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Bank Transaction Sender Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder || "alerts@hdfcbank.net"}
            />
            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Email"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankEmailModal;
