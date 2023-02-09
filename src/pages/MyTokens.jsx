import "bootstrap/dist/css/bootstrap.min.css";
import CommonSection from "../components/ui/Common-section/CommonSection";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import React, { useEffect, useState } from "react";
import { initContract } from "../near/utils.js";
import "../styles/MyTokens.css";
import Modal from "react-bootstrap/Modal";
import {
  storeContract,
  getImg,
  getSessionNfts,
  assignContract,
} from "../helper_functions/MyTokensUtils";

const NEAR_IN_YOCTO = 1000000000000000000000000;
const GAS_FEE = `100000000000000`;

function Mytokens() {
  const [nftMetadatas, setnftMetadatas] = useState([]);
  const [nftContracts, setnftContracts] = useState([]);
  const [sellModal, setsellModal] = useState(false);
  const [price, setprice] = useState(0);
  const [currNFT, setcurrNFT] = useState({});
  const [startTime, setstartTime] = useState();
  const [endTime, setendTime] = useState();

  useEffect(() => {
    let data = getSessionNfts();
    if (data.length > 0) {
      setnftMetadatas(data);
    }

    const contracts = JSON.parse(localStorage.getItem("nftContracts"));
    setnftContracts(contracts || []);
  }, []);

  function handleModal(show) {
    show ? setsellModal(true) : setsellModal(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const address = e.target.address.value;
    fetchNFTs(address);
  }

  async function sellNFT(nftId, contractId, price) {
    const helpers = await initContract();
    try {
      const contract = helpers.nft_contract;
      contract.contractId = contractId;
      await contract.nft_approve(
        {
          token_id: nftId,
          account_id: helpers.marketplace_contract.contractId,
          msg: JSON.stringify({
            price: (NEAR_IN_YOCTO * price).toLocaleString("fullwide", {
              useGrouping: false,
            }),
            is_auction: false,
            start_time: null,
            end_time: null,
          }),
        },
        GAS_FEE,
        (NEAR_IN_YOCTO / 10).toLocaleString("fullwide", { useGrouping: false })
      );
    } catch (e) {
      console.log(e);
    }
  }

  async function removeSale(contractId, tokenId) {
    const { marketplace_contract } = await initContract();

    const res = await marketplace_contract.remove_sale(
      {
        nft_contract_id: contractId,
        token_id: tokenId,
      },
      GAS_FEE,
      (NEAR_IN_YOCTO / 1e24).toLocaleString("fullwide", { useGrouping: false })
    );

    console.log(res);
  }

  async function auctionNFT(start, end, contractId, id) {
    const helpers = await initContract();
    try {
      const contract = helpers.nft_contract;
      contract.contractId = contractId;
      await contract.nft_approve(
        {
          token_id: id,
          account_id: helpers.marketplace_contract.contractId,
          msg: JSON.stringify({
            price: (NEAR_IN_YOCTO * price).toLocaleString("fullwide", {
              useGrouping: false,
            }),
            is_auction: true,
            start_time: (new Date(start).getTime() * 10 ** 6).toString(),
            end_time: (new Date(end).getTime() * 10 ** 6).toString(),
          }),
        },
        GAS_FEE,
        (NEAR_IN_YOCTO / 10).toLocaleString("fullwide", { useGrouping: false })
      );
    } catch (e) {
      console.log(e);
    }
  }

  async function fetchNFTs(address) {
    const helpers = await initContract();

    try {
      const contract = helpers.nft_contract;
      contract.contractId = address;
      storeContract(contract.contractId);
      let nfts = await contract.nft_tokens_for_owner({
        account_id: helpers.accountId,
        from_index: "0",
        limit: 20,
      });

      nfts = assignContract(nfts, contract.contractId);

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

  return (
    <>
      <CommonSection title="Select collection for viewing your tokens" />
      <section>
        <Modal show={sellModal} onHide={() => handleModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Sell your NFT</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input value={price} onChange={(e) => setprice(e.target.value)} />
            <input
              id="token_auction_start_time"
              type="datetime-local"
              onChange={(e) => setstartTime(e.target.value)}
              required
            ></input>
            <input
              id="token_auction_start_time"
              type="datetime-local"
              onChange={(e) => setendTime(e.target.value)}
              required
            ></input>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => removeSale(currNFT.contract, currNFT.id)}>
              Remove Sale
            </Button>
            <Button
              onClick={() =>
                auctionNFT(startTime, endTime, currNFT.contract, currNFT.id)
              }
            >
              Auction
            </Button>
            <Button
              onClick={() => {
                sellNFT(currNFT.id, currNFT.contract, price);
              }}
            >
              Sell
            </Button>
          </Modal.Footer>
        </Modal>
        <div style={{}}>
          {nftContracts.map((contract, key) => {
            return (
              <Button
                style={{ margin: "0.75rem", marginBottom: "2rem" }}
                onClick={() => {
                  fetchNFTs(contract);
                }}
                key={key}
              >
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
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setsellModal(true);
                    setcurrNFT({ id: nft.token_id, contract: nft.contractId });
                    // auctionNFT(currNFT.id, currNFT.contract, 1);
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
