import { useAuthContext } from "@asgardeo/auth-react";
import React, { useState } from "react";
import "./App.css";

const API_BASE = "https://21b6303d-55a8-42a9-b60f-a7f8c63d1ab1-dev.e1-us-east-azure.choreoapis.dev/test/backend/v1.0";

function App() {
    const { state, signIn, signOut, httpRequest } = useAuthContext();

    const [response, setResponse] = useState("");
    const [form, setForm] = useState({ id: "", name: "", age: "" });
    const [lookupId, setLookupId] = useState("");

    const request = async (method, path, body) => {
        try {
            const res = await httpRequest({
                method,
                url: `${API_BASE}${path}`,
                headers: { "Content-Type": "application/json" },
                ...(body ? { data: JSON.stringify(body) } : {})
            });
            setResponse(JSON.stringify(res.data, null, 2) || "Success");
        } catch (e) {
            setResponse(e?.response?.data || e.message || "Error");
        }
    };

    const addUser = () => request("POST", "/users/addUser", {
        id: Number(form.id), name: form.name, age: Number(form.age)
    });

    const getUser = () => request("GET", `/users/getUser?id=${lookupId}`);
    const deleteUser = () => request("DELETE", `/users/deleteUser?id=${lookupId}`);

    if (state.isLoading) {
        return <div className="container"><p className="loading">Loading...</p></div>;
    }

    if (!state.isAuthenticated) {
        return (
            <div className="container">
                <div className="card">
                    <h1>Ballerina Testing</h1>
                    <p>Sign in with your Asgardeo account to continue.</p>
                    <button className="btn btn-signin" onClick={() => signIn()}>Sign In</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card wide">
                <div className="user-header">
                    <div>
                        <h1>Users API</h1>
                        {state.displayName && <p className="user-info">Signed in as <strong>{state.displayName}</strong></p>}
                    </div>
                    <button className="btn btn-signout" onClick={() => signOut()}>Sign Out</button>
                </div>

                <hr />

                <section>
                    <h2>Add / Update User</h2>
                    <div className="form-row">
                        <input placeholder="ID" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
                        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <input placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <button className="btn btn-action" onClick={addUser}>POST /addUser</button>
                        <button className="btn btn-action" onClick={() => request("PUT", "/users/updateUser", {
                            id: Number(form.id), name: form.name, age: Number(form.age)
                        })}>PUT /updateUser</button>
                    </div>
                </section>

                <hr />

                <section>
                    <h2>Get / Delete User</h2>
                    <div className="form-row">
                        <input placeholder="User ID" value={lookupId} onChange={e => setLookupId(e.target.value)} />
                        <button className="btn btn-action" onClick={getUser}>GET /getUser</button>
                        <button className="btn btn-delete" onClick={deleteUser}>DELETE /deleteUser</button>
                    </div>
                </section>

                {response && (
                    <pre className="response">{response}</pre>
                )}
            </div>
        </div>
    );
}

export default App;
