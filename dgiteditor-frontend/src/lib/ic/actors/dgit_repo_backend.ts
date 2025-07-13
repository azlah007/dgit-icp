// 🔧 FIXED: src/lib/ic/actors/dgit_repo_backend.ts

import { Actor } from "@dfinity/agent";
import { idlFactory } from "@/lib/ic/declarations/dgit_repo_backend/dgit-repo-backend.did.js";
import { agent } from "@/lib/ic/agent";
import canisterIds from "@/lib/ic/canister_ids";

// Canister ID for current network
const canisterId = canisterIds["dgit-repo-backend"].local;

export const createDgitRepoBackendActor = () => {
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};
