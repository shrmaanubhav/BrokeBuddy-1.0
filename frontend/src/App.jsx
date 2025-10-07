import { HashRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./components/HomePage"
import ExpensesPage from "./components/ExpensesPage"
import Login from "./components/Login"
import Signup from "./components/Signup"

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

