import ReactDOM from "react-dom/client";
import App from "./app/App";
import MotionWrapper from "./shared/ui/MotionProvider";
import "./styles/index.css";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

ReactDOM.createRoot(document.getElementById("root")!).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <MotionWrapper>
          <App />
        </MotionWrapper>
      </AuthProvider>
    </GoogleOAuthProvider>
  ) : (
    <AuthProvider>
      <MotionWrapper>
        <App />
      </MotionWrapper>
    </AuthProvider>
  )
);
