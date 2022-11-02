import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import { Principal } from "@dfinity/principal";

const CURRENT_USER_ID = Principal.fromText("2vxsx-fae");
export default CURRENT_USER_ID;
export const TOKEN_CANISTER_ID = Principal.fromText(
  "qvhpv-4qaaa-aaaaa-aaagq-cai"
); //token canister id

const init = async () => {
  ReactDOM.render(<App />, document.getElementById("root"));
};

init();
