import React, { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import homeImage from "../../assets/home-img.png";
// import Item from "./Item";
import Minter from "./Minter";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Gallery from "./Gallery";
import CURRENT_USER_ID, { TOKEN_CANISTER_ID } from "../index";
import { opend } from "../../../declarations/opend";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as tokenIdleFcatory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal";

function App() {
  // const NFTID = "rrkah-fqaaa-aaaaa-aaaaq-cai";

  const localHost = "http://localhost:8081/";
  const agent = new HttpAgent({ host: localHost });

  const [userOwnedNFTS, setUserOwnedNFTS] = useState(null);
  const [listedNFTs, setListedNFTs] = useState();

  async function getNFTs() {
    const userNFTIds = await opend.getOwnedNFTs(CURRENT_USER_ID);
    console.log(userNFTIds);
    setUserOwnedNFTS(userNFTIds);

    const ListedNFTs = await opend.getListedNFTs();
    setListedNFTs(ListedNFTs);
    console.log("listed nfts", ListedNFTs);
  }

  useEffect(() => {
    getNFTs();
    loadTokenActor();
  }, []);

  const loadTokenActor = async () => {
    const tokenActor = await Actor.createActor(tokenIdleFcatory, {
      agent,
      canisterId: TOKEN_CANISTER_ID, //token canister id
    });

    const balance = await tokenActor.balanceOf(CURRENT_USER_ID);

    console.log("balance in token ", balance);

    window.localStorage.removeItem("balance");

    window.localStorage.setItem("balance", balance.toString());
  };

  return (
    <BrowserRouter forceRefresh={true}>
      <div className="App">
        <Header />
        <Switch>
          <Route exact path="/">
            <img className="bottom-space" src={homeImage} />
          </Route>
          <Route exact path="/minter">
            <Minter />
          </Route>
          <Route exact path="/collection">
            <Gallery title="My NFTS" ids={userOwnedNFTS} role="collection" />
          </Route>
          <Route exact path="/discover">
            <Gallery title="Discover" ids={listedNFTs} role="discover" />
          </Route>
        </Switch>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
