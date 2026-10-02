    import { Link, useLocation, useNavigate } from "react-router-dom";
    import { useEffect, useRef, useState } from "react";
    import toast from "react-hot-toast";
    import api from "../lib/api";
    import logoImg from "../assets/logo.png";
    import BankEmailModal from "./BankEmailModal";
    import "./GlobalNavbar.css";

    const navItems = [
    { label: "Dashboard", to: "/dashboard", key: "dashboard" },
    { label: "Transactions", to: "/expenses", key: "transactions" },
    { label: "Insights", to: "/insights", key: "insights" },
    { label: "Assistant", to: "/chatbot", key: "chatbot" },
    ];

    export default function GlobalNavbar({ user, setIsAuthenticated }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isBankEmailModalOpen, setIsBankEmailModalOpen] = useState(false);
    const [bankSenderEmail, setBankSenderEmail] = useState("");
    const [isSavingBankEmail, setIsSavingBankEmail] = useState(false);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
        if (isProfileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
            setIsProfileOpen(false);
        }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileOpen]);

    const getNavClassName = (key) => {
        const pathname = location.pathname;

        if (key === "dashboard") {
        return pathname === "/dashboard" || pathname === "/" ? "global-nav-link active" : "global-nav-link";
        }

        if (key === "transactions") {
        return pathname.startsWith("/expenses") || pathname.startsWith("/transactions")
            ? "global-nav-link active"
            : "global-nav-link";
        }

        if (key === "insights") {
        return pathname.startsWith("/insights") ? "global-nav-link active" : "global-nav-link";
        }

        if (key === "chatbot") {
        return pathname.startsWith("/chatbot") ? "global-nav-link active" : "global-nav-link";
        }

        return "global-nav-link";
    };

    const clearCache = () => {
        localStorage.removeItem("transactions_cache");
        localStorage.removeItem("transactions_time");
    };

    const handleLogout = async () => {
        try {
        const res = await api.post("/api/auth/logout");
        toast.success(res.data.msg || "Logged out");
        clearCache();
        if (typeof window !== "undefined") {
            window.__BROKEBUDDY_DEV_MODE__ = false;
        }
        setIsAuthenticated(false);
        navigate("/");
        } catch (err) {
        console.error(err.response?.data?.msg || err.message);
        toast.error("Logout failed");
        }
    };

    const fetchBankSenderEmail = async () => {
        try {
        const response = await api.get("/api/user/bank-email");
        const nextEmail = response.data?.bankSenderEmail || "";
        setBankSenderEmail(nextEmail);
        return nextEmail;
        } catch (err) {
        console.error("Failed to load bank sender email:", err);
        return "";
        }
    };

    const handleOpenBankEmailModal = async () => {
        await fetchBankSenderEmail();
        setIsBankEmailModalOpen(true);
    };

    const handleSaveBankEmail = async (email) => {
        setIsSavingBankEmail(true);

        try {
        const response = await api.put("/api/user/bank-email", { bankSenderEmail: email });
        setBankSenderEmail(response.data?.bankSenderEmail || "");
        toast.success("Bank sender email updated successfully.");
        setIsBankEmailModalOpen(false);
        } catch (err) {
        console.error("Failed to save bank sender email:", err);
        toast.error(err.response?.data?.msg || err.message || "Failed to save bank sender email");
        } finally {
        setIsSavingBankEmail(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Do you want to delete your account? This action cannot be undone.")) {
        return;
        }

        try {
        await api.delete("/api/profile/account");
        toast.success("Account deleted successfully.");
        localStorage.clear();
        if (typeof window !== "undefined") {
            window.__BROKEBUDDY_DEV_MODE__ = false;
        }
        if (setIsAuthenticated) {
            setIsAuthenticated(false);
        }
        navigate("/");
        } catch (err) {
        console.error("Delete Account Error:", err.response?.data?.msg || err.message);
        toast.error(err.response?.data?.msg || err.message || "Failed to delete account");
        }
    };

    const profileLabel = (user?.name || user?.fullName || "B").trim();
    const profileInitial = profileLabel.charAt(0).toUpperCase() || "B";

    return (
        <header className="global-auth-navbar">
        <div className="global-navbar-container">
            <Link to="/dashboard" className="global-brand" aria-label="BrokeBuddy home">
            <div className="global-brand-logo-box">
                <img src={logoImg} alt="BrokeBuddy Logo" className="global-brand-logo" />
            </div>
            <span className="global-brand-title">BrokeBuddy</span>
            </Link>

            <nav className="global-navbar-links" aria-label="Main Navigation">
            {navItems.map((item) => (
                <Link key={item.key} to={item.to} className={getNavClassName(item.key)}>
                {item.label}
                </Link>
            ))}

            <div className="global-navbar-profile" ref={profileRef}>
                <button
                type="button"
                className="global-navbar-profile-toggle"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                aria-label="Open profile menu"
                >
                {profileInitial}
                </button>

                {isProfileOpen && (
                <div className="global-navbar-profile-menu">
                    <div className="global-navbar-profile-user">
                    Signed in as
                    <strong>{profileLabel || "Buddy"}</strong>
                    </div>

                    <div className="global-navbar-profile-actions">
                    <button type="button" className="global-navbar-profile-action" onClick={handleLogout}>
                        Logout
                    </button>
                    <button
                        type="button"
                        className="global-navbar-profile-action"
                        onClick={handleOpenBankEmailModal}
                    >
                        Edit Bank Sender Email
                    </button>
                    <button
                        type="button"
                        className="global-navbar-profile-action global-navbar-profile-action--danger"
                        onClick={handleDeleteAccount}
                    >
                        Delete Account
                    </button>
                    </div>
                </div>
                )}
            </div>
            </nav>
        </div>

        {isBankEmailModalOpen && (
            <BankEmailModal
            isOpen={isBankEmailModalOpen}
            initialValue={bankSenderEmail}
            title="Edit Bank Sender Email"
            placeholder="alerts@hdfcbank.net"
            onClose={() => setIsBankEmailModalOpen(false)}
            onSave={handleSaveBankEmail}
            isSaving={isSavingBankEmail}
            />
        )}
        </header>
    );
    }
