import "bootstrap/dist/css/bootstrap.min.css";
import CommonSection from "../components/ui/Common-section/CommonSection";
import Button from "react-bootstrap/Button";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
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
  filterNFTs,
  getSales,
} from "../helper_functions/MyTokensUtils";

const NEAR_IN_YOCTO = 1000000000000000000000000;
const GAS_FEE = `100000000000000`;

function Mytokens() {
  const [nftMetadatas, setnftMetadatas] = useState([]);
  const [nftContracts, setnftContracts] = useState([]);
  const [sellModal, setsellModal] = useState(false);
  const [price, setprice] = useState("");
  const [currNFT, setcurrNFT] = useState({});
  const [startTime, setstartTime] = useState();
  const [endTime, setendTime] = useState();
  const [activeTab, setactiveTab] = useState("sellTab");
  const [sellBtn, setsellBtn] = useState(false);

  useEffect(() => {
    let data = getSessionNfts();
    if (data.length > 0) {
      setnftMetadatas(data);
    }

    const contracts = JSON.parse(localStorage.getItem("nftContracts"));
    setnftContracts(contracts || []);
  }, []);

  useEffect(() => {
    async function fetchContractNFTs() {
      const helpers = await initContract();
      fetchNFTs(helpers.nft_contract.contractId);
    }

    fetchContractNFTs();
  }, []);

  useEffect(() => {
    async function isOnSale() {
      const sales = await getSales();
      const isPresent = sales.some((sale) => sale.token_id == currNFT.id);
      if (isPresent) {
        setsellBtn(false);
        console.log("present");
      } else {
        setsellBtn(true);
        console.log("not p");
      }
    }
    isOnSale()
  }, [currNFT]);

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
      let nfts = await contract.nft_tokens_for_owner({
        account_id: helpers.accountId,
        from_index: "0",
        limit: 20,
      });
      storeContract(contract.contractId);

      nfts = assignContract(nfts, contract.contractId);
      const filterdNFTs = filterNFTs([...nftMetadatas, ...nfts]);

      sessionStorage.setItem("nfts", JSON.stringify([...filterdNFTs]));
      setnftMetadatas([...filterdNFTs]);
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
            <Tabs activeKey={activeTab} onSelect={(k) => setactiveTab(k)}>
              <Tab
                style={{ margin: "1rem" }}
                eventKey="sellTab"
                title="Sell NFT"
              >
                <Form>
                  <Form.Control
                    value={price}
                    onChange={(e) => setprice(e.target.value)}
                    placeholder="Price"
                  />
                </Form>
              </Tab>

              <Tab eventKey="auctionTab" title="Auction NFT">
                <Form>
                  <Form.Control
                    style={{ marginBottom: "1rem" }}
                    value={price}
                    onChange={(e) => setprice(e.target.value)}
                    placeholder="Start Price"
                  />
                  <label htmlFor="start">Start time</label>
                  <Form.Control
                    id="start"
                    style={{ marginBottom: "1rem" }}
                    type="datetime-local"
                    onChange={(e) => setstartTime(e.target.value)}
                    placeholder="Set start time"
                  />
                  <label htmlFor="end">End time</label>
                  <Form.Control
                    id="end"
                    style={{ marginBottom: "1rem" }}
                    type="datetime-local"
                    onChange={(e) => setendTime(e.target.value)}
                    placeholder="Set end time"
                  />
                </Form>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <Button
              disabled={sellBtn}
              onClick={() => removeSale(currNFT.contract, currNFT.id)}
            >
              Remove this Sale
            </Button>
            <Button
              onClick={() => {
                activeTab == "sellTab"
                  ? sellNFT(currNFT.id, currNFT.contract, price)
                  : auctionNFT(
                      startTime,
                      endTime,
                      currNFT.contract,
                      currNFT.id
                    );
              }}
            >
              {activeTab == "sellTab" ? "Sell" : "Auction"}
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
              <Button type="submit" id="button-addon2">
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
                    maxWidth: "15vw",
                    minHeight: "15vh",
                    margin: "1rem",
                    cursor: "pointer",
                  }}
                  onClick={async () => {
                    setsellModal(true);
                    setcurrNFT({
                      id: nft.token_id,
                      contract: nft.contractId,
                    });
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
