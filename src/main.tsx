import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import MotionWrapper from "./shared/ui/MotionProvider";
import "./styles/index.css";
import { AuthProvider } from "@/features/auth/context/AuthContext";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <MotionWrapper>
        <App />
      </MotionWrapper>
    </AuthProvider>
  </React.StrictMode>
);
