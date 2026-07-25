import { Toaster } from "react-hot-toast";

export default function AppToaster() {
    return (
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 2000,
            style: {
              background: "#1f1f1f",
              color: "#fff",
              fontSize: "0.95rem",
              borderRadius: "10px",
              padding: "10px 16px",
            },
            success: {
              duration: 2000,
              style: { background: "#16a34a", color: "#fff" },
              iconTheme: {
                primary: "#fff",
                secondary: "#16a34a",
              },
            },
            error: {
              duration: 4000,
              style: { background: "#dc2626", color: "#fff" },
              iconTheme: {
                primary: "#fff",
                secondary: "#dc2626",
              },
            },
          }}
        />
    );
}