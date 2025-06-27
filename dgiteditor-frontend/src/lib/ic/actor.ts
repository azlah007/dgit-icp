import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "@/lib/ic/declarations/dgit_repo_backend/dgit-repo-backend.did.js";
import { canisterIds } from "@/lib/ic/canister_ids";
import { canisterIds } from "@/lib/ic/canister_ids.json";

const canisterId = canisterIds["dgit-repo-backend"].local;

const agent = new HttpAgent({ host: "http://localhost:4943" });
agent.fetchRootKey().catch(() => {
  console.warn("Unable to fetch root key, running in production?");
});

export const dgitRepoBackend = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});
