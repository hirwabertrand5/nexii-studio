import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import MotionWrapper from "./shared/ui/MotionProvider";
import "./styles/index.css";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={(import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ?? (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string) ?? ""}>
      <AuthProvider>
        <MotionWrapper>
          <App />
        </MotionWrapper>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
