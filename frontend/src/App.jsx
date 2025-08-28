import { HashRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./components/HomePage"
import ExpensesPage from "./components/ExpensesPage"

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

