import { AuthProvider } from "@asgardeo/auth-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const config = {
    signInRedirectURL: "http://localhost:5173",
    signOutRedirectURL: "http://localhost:5173",
    clientID: "HIecORXuQktt0tsWmdc9xZYQt3Ia",
    baseUrl: "https://api.asgardeo.io/t/hesara",
    scope: ["openid", "profile"]
};

ReactDOM.createRoot(document.getElementById("root")).render(
    <AuthProvider config={config}>
        <App />
    </AuthProvider>
);
