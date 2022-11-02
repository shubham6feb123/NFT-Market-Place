import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdleFcatory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal";
import { opend } from "../../../declarations/opend";
import Button from "./Button";
import Loader from "./Loader";
import CURRENT_USER_ID, { TOKEN_CANISTER_ID } from "../index";
import PriceLabel from "./PriceLabel";

function Item(props) {
  const [name, setName] = useState();
  const [owner, setOwner] = useState("");
  const [image, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState(false);
  const [priceLabel, setPriceLabel] = useState();
  const [shouldDisplay, setShouldDisplay] = useState(true);

  const id = props.id;

  const localHost = "http://localhost:8081/";
  const agent = new HttpAgent({ host: localHost });

  //ignore when deploying on live blockchain
  agent.fetchRootKey();

  let NFTActor;
  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    });

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(
      new Blob([imageContent.buffer], { type: "image/png" })
    );

    setName(name);
    setOwner(owner.toText());
    setImage(image);
    if (props.role === "collection") {
      const nftListed = await opend.isListed(id);
      console.log("isListed : ", nftListed);
      if (nftListed) {
        setOwner("OpenD");
        setBlur({ filter: "blur(4px)" });
        setSellStatus(true);
      } else {
        setButton(<Button handleClick={sellNft} text="Sell" />);
      }
    } else if (props.role === "discover") {
      const originalOwner = await opend.getOriginalOwner(props.id); //props.id == nft canister principal id
      setOwner("OpenD");
      if (originalOwner.toText() !== CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={buyNft} text="Buy" />);
      }

      const sellPrice = await opend.getSellPrice(props.id);
      setPriceLabel(<PriceLabel price={sellPrice.toString()} />);
    }
  }

  useEffect(() => {
    loadNFT();
  }, []);

  let price;

  const sellNft = () => {
    console.log("nft sold !!");
    setPriceInput(
      <input
        placeholder="Price in Dang"
        type={"number"}
        className="price-input"
        value={price}
        onChange={(e) => (price = e.target.value)}
      />
    );
    setButton(<Button handleClick={sellItem} text="Confirm" />);
  };

  const sellItem = async () => {
    try {
      setBlur({ filter: "blur(4px)" });
      setLoaderHidden(false);
      console.log("price of item : ", price, id);
      const listingResult = await opend.listItem(id, Number.parseInt(price));
      console.log("item listed for sell : " + listingResult);

      if (listingResult == "Success") {
        let openDId = await opend.getOpenDCanisterID();
        console.log("openD canister id : ", openDId);
        let data = await NFTActor.transferOwnership(openDId, true);
        console.log("ownership tranferred : ", data);
      }
      setLoaderHidden(true);
      setButton("");
      setPriceInput("");
      setOwner("OpenD");
    } catch (error) {
      console.log(error);
    } finally {
      setLoaderHidden(true);
    }
  };

  const buyNft = async () => {
    try {
      console.log("buy nft confirmed !");
      setLoaderHidden(false);
      const tokenActor = await Actor.createActor(tokenIdleFcatory, {
        agent,
        canisterId: TOKEN_CANISTER_ID, //token canister id
      });

      const sellerId = await opend.getOriginalOwner(props.id);
      const itemPrice = await opend.getSellPrice(props.id);
      const transfer = await tokenActor.transfer(sellerId, itemPrice);
      console.log("buy confirmed ", transfer);
      if (transfer === "Success") {
        //Transfer the ownership
        const result = await opend.completePurchase(
          props.id,
          sellerId,
          CURRENT_USER_ID
        );
        alert(`NFT PURCHASED ${result}`);
        setLoaderHidden(true);
        setShouldDisplay(false);
      }
    } catch (error) {
      alert(`Error ${error}`);
      setLoaderHidden(false);
    }
  };

  return (
    <div
      style={{ display: shouldDisplay ? "inline" : "none" }}
      className="disGrid-item"
    >
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          style={blur}
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
        />
        <Loader loaderHidden={loaderHidden} />
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}
            <span className="purple-text"> {sellStatus ? " Listed" : ""}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {button}
          {priceInput}
        </div>
      </div>
    </div>
  );
}

export default Item;
