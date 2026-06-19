import { useAuthContext } from "@asgardeo/auth-react";
import React from "react";
import "./App.css";

function App() {
    const { state, signIn, signOut } = useAuthContext();

    if (state.isLoading) {
        return (
            <div className="container">
                <p className="loading">Loading...</p>
            </div>
        );
    }

    if (state.isAuthenticated) {
        return (
            <div className="container">
                <div className="card">
                    <h1>Welcome!</h1>
                    {state.displayName && (
                        <p className="user-info">Name: <strong>{state.displayName}</strong></p>
                    )}
                    {state.email && (
                        <p className="user-info">Email: <strong>{state.email}</strong></p>
                    )}
                    <button className="btn btn-signout" onClick={() => signOut()}>
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card">
                <h1>Ballerina Testing</h1>
                <p>Sign in with your Asgardeo account to continue.</p>
                <button className="btn btn-signin" onClick={() => signIn()}>
                    Sign In
                </button>
            </div>
        </div>
    );
}

export default App;
