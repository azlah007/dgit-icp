import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as dgit_idl } from "../../../declarations/dgit_repo";

let dgit;

export const initAgent = async () => {
  if (window.ic?.plug) {
    const connected = await window.ic.plug.requestConnect();
    if (connected) {
      const agent = new HttpAgent({ host: "https://icp0.io" });
      dgit = Actor.createActor(dgit_idl, {
        agent,
        canisterId: process.env.CANISTER_ID_DGIT_REPO
      });
      return true;
    }
  }
  alert("Please install Plug wallet and connect.");
  return false;
};

export { dgit };
