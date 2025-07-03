import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "@/lib/ic/declarations/dgit_repo_backend/dgit-repo-backend.did.js";

const agent = new HttpAgent({ host: "http://localhost:4943" });
// If using local development, fetch root key:
agent.fetchRootKey().catch(() => {
  console.warn("Unable to fetch root key, running in production?");
});

export const dgitRepoBackend = Actor.createActor(idlFactory, {
  agent,
  canisterId: "uxrrr-q7777-77774-qaaaq-cai",
});
