import { AuthProvider } from "@asgardeo/auth-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const config = {
    signInRedirectURL: import.meta.env.VITE_SIGN_IN_REDIRECT_URL || "http://localhost:5173",
    signOutRedirectURL: import.meta.env.VITE_SIGN_OUT_REDIRECT_URL || "http://localhost:5173",
    clientID: import.meta.env.VITE_CLIENT_ID || "HIecORXuQktt0tsWmdc9xZYQt3Ia",
    baseUrl: "https://api.asgardeo.io/t/hesara",
    scope: ["openid", "profile"]
};

ReactDOM.createRoot(document.getElementById("root")).render(
    <AuthProvider config={config}>
        <App />
    </AuthProvider>
);
