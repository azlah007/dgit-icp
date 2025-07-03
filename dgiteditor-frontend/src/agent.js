import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as dgit_idl, canisterId as dgit_canisterId } from "../../declarations/dgit_repo";

const agent = new HttpAgent();
const dgit = Actor.createActor(dgit_idl, { agent, canisterId: dgit_canisterId });

// Expose to window so all components can use it
window.dgit = dgit;
