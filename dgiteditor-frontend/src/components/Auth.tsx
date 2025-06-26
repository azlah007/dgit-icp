// src/components/Auth.tsx

"use client";

import { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";

export default function Auth() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create();
      setAuthClient(client);
      if (await client.isAuthenticated()) {
        const identity = client.getIdentity();
        setPrincipal(identity.getPrincipal().toString());
      }
    };
    initAuth();
  }, []);

  const login = async () => {
    if (!authClient) return;
    await authClient.login({
      onSuccess: () => {
        const identity = authClient.getIdentity();
        setPrincipal(identity.getPrincipal().toString());
      },
      identityProvider: "https://identity.ic0.app/",
    });
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout();
    setPrincipal(null);
  };

  if (!principal) {
    return (
      <button
        onClick={login}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Login with Internet Identity
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <p className="text-gray-700">Logged in as: {principal}</p>
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  );
}
