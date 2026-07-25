import { HashRouter as Router } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import AppRoutes from "./AppRoutes";
import AppToaster from "./AppToaster";

function App() {
  const { loading, isAuthenticated, setIsAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Verifying session...
      </div>
    );
  }

  return (
    <Router>
      <AppToaster />

      <AppRoutes
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
      />
    </Router>
  );
}

export default App;