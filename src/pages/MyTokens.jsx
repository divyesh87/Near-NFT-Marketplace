import "bootstrap/dist/css/bootstrap.min.css";
import CommonSection from "../components/ui/Common-section/CommonSection";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { useEffect, useState } from "react";
import { initContract } from "../near/utils.js";
import React from "react";
import "../styles/MyTokens.css";
import { Contract } from "near-api-js";

function getSessionNfts() {
  const data = JSON.parse(sessionStorage.getItem("nfts"));
  if (data) {
    return data;
  } else {
    return [];
  }
}

function storeContract(address) {
  let contracts = JSON.parse(localStorage.getItem("nftContracts"));
  if (contracts == null) contracts = [];
  const isAlreadyPresent = contracts.some((contract) => {
    return contract == address;
  });

  if (isAlreadyPresent) return;
  contracts.push(address);
  localStorage.setItem("nftContracts", JSON.stringify(contracts));
}

function Mytokens() {
  const [nftMetadatas, setnftMetadatas] = useState([]);
  const [nftContracts, setnftContracts] = useState([]);

  useEffect(() => {
    let data = getSessionNfts();
    if (data.length > 0) {
      setnftMetadatas(data);
    }

    const contracts = JSON.parse(localStorage.getItem("nftContracts"));
    setnftContracts(contracts);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const address = e.target.address.value;
    fetchNFTs(address);
  }

  async function fetchNFTs(address) {
    const helpers = await initContract();

    try {
      const contract = new Contract(
        helpers.walletConnection.account(),
        address,
        {
          viewMethods: [
            "nft_metadata",
            "nft_total_supply",
            "nft_tokens_for_owner",
            "nft_token",
          ],
          changeMethods: [
            "nft_mint",
            "nft_transfer",
            "nft_approve",
            "nft_revoke",
          ],
        }
      );

      storeContract(contract.contractId);

      const nfts = await contract.nft_tokens_for_owner({
        account_id: helpers.accountId,
        from_index: "0",
        limit: 20,
      });

      sessionStorage.setItem(
        "nfts",
        JSON.stringify([...nftMetadatas, ...nfts])
      );
      setnftMetadatas([...nftMetadatas, ...nfts]);
    } catch (e) {
      console.log(e);
      alert("Invalid address!");
    }
  }

  function checkIPFSHash(hash) {
    return hash.startsWith("Qm");
  }

  function getImg(url) {
    if (checkIPFSHash(url)) {
      return `https://gateway.pinata.cloud/ipfs/${url}`;
    } else {
      return url;
    }
  }

  return (
    <>
      <CommonSection title="Select collection for viewing your tokens" />
      <section>
        <div style={{}}>
          {nftContracts.map((contract, key) => {
            return (
              <Button style={{margin : "0.75rem", marginBottom : "2rem"}}  onClick={() => {fetchNFTs(contract)}} key={key}>
                {contract}
              </Button>
            );
          })}
        </div>
        <div>
          <h3 style={{ color: "white" }}>Add Collection</h3>
          <form onSubmit={handleSubmit}>
            <InputGroup className="mb-3">
              <Form.Control
                placeholder="Valid contract Id"
                aria-label="Recipient's username"
                aria-describedby="basic-addon2"
                name="address"
                required
              />
              <Button variant="success" type="submit" id="button-addon2">
                SUBMIT
              </Button>
            </InputGroup>
          </form>
        </div>
        <h2 style={{ textAlign: "center" }}>
          Found "{nftMetadatas.length}" NFTs in your wallet:
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {nftMetadatas.length > 0 ? (
            nftMetadatas.map((nft, key) => {
              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: "rgba(0, 0, 255, 0.219)",
                    width: "15vw",
                    margin: "1rem",
                  }}
                >
                  <img
                    style={{ width: "80%", margin: "0.5rem" }}
                    src={getImg(nft.metadata.media)}
                    alt=""
                    key={key}
                  />
                  <h6 style={{ color: "white", wordWrap: "break-word" }}>
                    #
                    <span style={{ color: "GrayText", margin: "0.2rem" }}>
                      {nft.token_id.toUpperCase()}
                    </span>
                  </h6>
                </div>
              );
            })
          ) : (
            <h3 style={{ color: "white", textAlign: "center" }}>
              No NFTs found
            </h3>
          )}
        </div>
      </section>
    </>
  );
}

export default Mytokens;
