import { HttpAgent, Actor } from '@dfinity/agent';
import { idlFactory as dgit_idl } from './dgit-repo-backend.did.js';

// Replace this with your actual deployed canister ID
const CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';

// Detect environment: 'ic' for mainnet, 'local' for development
const isLocal = process.env.DFX_NETWORK !== 'ic';
const HOST = isLocal ? 'http://127.0.0.1:4943' : 'https://ic0.app';

// Create the agent
const agent = new HttpAgent({ host: HOST });

// Fetch root key only for local development
if (isLocal) {
  agent.fetchRootKey().catch(err => {
    console.warn('⚠️ Unable to fetch root key. Is your local replica running?');
  });
}

// Create the actor for interacting with the dgit-repo canister
export const dgit = Actor.createActor(dgit_idl, {
  agent,
  canisterId: CANISTER_ID,
});
