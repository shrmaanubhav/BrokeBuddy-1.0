import "./Login.css";

const Login = () => {
  const handleGoogleLogin = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    window.location.href = `${baseUrl}/auth/google`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">⚡</div>
        <h2 className="login-title">Welcome to BrokeBuddy</h2>
        <p className="login-subtitle">
          Sign in with Google to manage your budgets and expenses.
        </p>

        <button className="login-button" onClick={handleGoogleLogin}>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
