import React from "react";
import { BarChart3 } from "lucide-react";
import "./Insights.css";

export default function Insights() {
  return (
    <div className="insights-page">
      <main className="insights-content">
        <div className="insights-icon">
          <BarChart3 size={32} strokeWidth={1.8} />
        </div>

        <h1>Insights</h1>

        <h2>Coming Soon</h2>

        <p>
          We're working on smarter ways to help you understand your spending.
        </p>
      </main>
    </div>
  );
}