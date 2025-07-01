import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "@/lib/ic/declarations/dgit_repo_backend/dgit-repo-backend.did.js";
//import canisterIds from "@/lib/ic/canister_ids";

//const canisterId = canisterIds["dgit-repo-backend"].local;
const canisterId = "uxrrr-q7777-77774-qaaaq-cai";
const agent = new HttpAgent({ host: "http://localhost:4943" });
agent.fetchRootKey().catch(() => {
  console.warn("Unable to fetch root key, running in production?");
});

export const dgitRepoBackend = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});
