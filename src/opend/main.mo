import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import NFTActorClass "../NFT/nft";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Iter "mo:base/Iter";

actor OpenD {
  private type Listing = {
    itemOwner : Principal;
    itemPrice : Nat;
  };
  //mapOfNFTS :----(nft canister principal id,canister)
  var mapOfNFTs = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);

  //mapOfOwners :----(owner's principal id, list of nft's canister principal id) bcz signle owner can own several nft's
  var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
  //maOfListings :----- (nft id , Listing(which is a custom data type))
  var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

  public shared (msg) func mint(imgData : [Nat8], name : Text) : async Principal {
    let owner : Principal = msg.caller;
    Debug.print(debug_show (owner));
    Debug.print(debug_show (Cycles.balance()));
    Cycles.add(100_500_000_000);
    let newNFT = await NFTActorClass.NFT(name, owner, imgData); //class ka object bna diya
    Debug.print(debug_show (Cycles.balance()));
    let newNFTPrincipal = await newNFT.getCanisterId();

    mapOfNFTs.put(newNFTPrincipal, newNFT);
    addToOwnershipMap(owner, newNFTPrincipal);

    return newNFTPrincipal

  };

  private func addToOwnershipMap(owner : Principal, nftId : Principal) {
    var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(owner)) {
      case null List.nil<Principal>();
      case (?result) result;
    };
    //nft id == nft canister id
    ownedNFTs := List.push(nftId, ownedNFTs); //updating list of owners of nft
    mapOfOwners.put(owner, ownedNFTs);

  };

  public query func getOwnedNFTs(user : Principal) : async [Principal] {
    //return's array of principal id's of nft
    var userNFTs : List.List<Principal> = switch (mapOfOwners.get(user)) {
      case null List.nil<Principal>();
      case (?result) result;
    };

    return List.toArray(userNFTs);
  };

  public query func getListedNFTs() : async [Principal] {
    let ids = Iter.toArray(mapOfListings.keys());
    return ids;
  };

  //NFT id , selling price of nft
  public shared (msg) func listItem(id : Principal, price : Nat) : async Text {
    //listing for sell nfts

    var item : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
      case null return "NFT Does Not Exist.";
      case (?result) result;
    };

    let owner = await item.getOwner();

    if (Principal.equal(owner, msg.caller)) {
      let newListing : Listing = {
        itemOwner = owner;
        itemPrice = price;
      };

      mapOfListings.put(id, newListing);
      return "Success";
    } else {
      return "You don't own the NFT";
    }

    // return "Success";
  };

  public query func getOpenDCanisterID() : async Principal {
    return Principal.fromActor(OpenD);
  };

  public query func isListed(id : Principal) : async Bool {

    if (mapOfListings.get(id) == null) {
      return false;
    } else {
      return true;
    }

  };

  public query func getOriginalOwner(id : Principal) : async Principal {
    var listing : Listing = switch (mapOfListings.get(id)) {
      case null return Principal.fromText("");
      case (?result) result;
    };

    return listing.itemOwner;
  };

  public query func getSellPrice(id : Principal) : async Nat {
    var listing : Listing = switch (mapOfListings.get(id)) {
      case null return 0;
      case (?result) result;
    };

    return listing.itemPrice;
  };

  public shared (msg) func completePurchase(id : Principal, ownerId : Principal, newOwnerId : Principal) : async Text {
    var purchaseNFT : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
      case null return "NFT Does Not Exist";
      case (?result) result;
    };

    let transferResult = await purchaseNFT.transferOwnership(newOwnerId, false);

    if (transferResult == "Success") {
      mapOfListings.delete(id); //taking nft canister id
      var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(ownerId)) {
        case null List.nil<Principal>();
        case (?result) result;
      };

      ownedNFTs := List.filter(
        ownedNFTs,
        func(listItemId : Principal) : Bool {
          return listItemId != id;
        },
      );

      addToOwnershipMap(newOwnerId, id);
      return "Success";
    } else {
      return transferResult;
    }

    // return "Success";
  }

};
