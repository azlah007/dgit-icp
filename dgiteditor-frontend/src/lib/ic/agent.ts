// agent.ts

import { HttpAgent } from "@dfinity/agent";

// Local or production switch based on environment
const isLocal = process.env.DFX_NETWORK === "local" || process.env.NODE_ENV === "development";

export const agent = new HttpAgent({
  host: isLocal ? "http://127.0.0.1:4943" : "https://icp0.io",
});

// For local development, fetch the root key to avoid certificate errors
if (isLocal) {
  agent.fetchRootKey().catch((err) => {
    console.warn("Unable to fetch root key. Is the local replica running?");
    console.error(err);
  });
}
