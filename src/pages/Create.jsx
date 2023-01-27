import { useState } from "react";
import { Container, Row, Col } from "reactstrap";
import CommonSection from "../components/ui/Common-section/CommonSection";
import PreviewMint from "../components/ui/Preview-mint/PreviewMint";
import placeholder from "../assets/images/placeholder.jpg";
import { readURL } from "../helper_functions/mint.js";
import axios from "axios";
import "../styles/create-item.css";
import { Button } from "react-bootstrap";
import { initContract } from "../near/utils";

const jwt =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3OWUyYWJjOS02NmEyLTQ5MjYtYTIxMS04YjJmMDA3MzIyMTQiLCJlbWFpbCI6ImRpdnllc2hsYWx3YW5pMTNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjY0MWE5MGZlMjI2NWRiNzYwZDE3Iiwic2NvcGVkS2V5U2VjcmV0IjoiYzgyN2FhOTM4MmMwZTg3MTBiMjg1NTc0ZDg1Yjc5N2M0MDhmMjhjYTc4OGViNDE3MWQzNDg2Y2UzOTdkZmI2OSIsImlhdCI6MTY3MjQwNTg4OX0.Ly1YIV9PvIuiVFZqtHg27f3KbisVJ1FnLL7Ujfadof8";

const Create = (props) => {
  const { mainObject } = props;
  const creator = mainObject.accountId;

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [src, setSrc] = useState(placeholder);
  const [buffer, setBuffer] = useState(0);
  const [selectedFile, setselectedFile] = useState();

  async function mintNFT(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", selectedFile);
    const metadata = JSON.stringify({
      name: "test",
    });
    formData.append("pinataMetadata", metadata);
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    let ipfsHash = "";

    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: "Infinity",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: jwt,
          },
        }
      );
      console.log(res.data);
      ipfsHash = res.data.IpfsHash;
      mint(ipfsHash);
    } catch (error) {
      console.log(error);
    }
  }

  async function mint(ipfsHash) {
    const id = Math.round(new Date().getTime() / 1000)
      .toString()
      .slice(2);
    const helpers = await initContract();
    console.log(id);
    try {
      await helpers.nft_contract.nft_mint(
        {
          token_id: id,
          metadata: {
            title: title,
            description: desc,
            media: ipfsHash,
          },
          receiver_id: helpers.accountId,
          perpetual_royalties: null,
        },
        "300000000000000",
        "100000000000000000000000"
      );
    } catch (e) {
      alert(
        "Something went wrong! " +
          "Maybe you need to sign out and back in? " +
          "Check your browser console for more info."
      );
      console.log(e);
      throw e;
    }
  }

  function handleChange(e) {
    setselectedFile(e.target.files[0]);
    readURL(e, setSrc, setBuffer);
  }

  return (
    <>
      <CommonSection title="Create Item" />
      <section>
        <Container>
          <Row>
            <Col lg="3" md="4" sm="6">
              <h5 className="mb-4 text-light">Preview Item</h5>
              <PreviewMint item={{ title, desc, src, creator }} />
            </Col>

            <Col lg="9" md="8" sm="6">
              <div className="create__item">
                <form>
                  <div className="form__input">
                    <label htmlFor="">Upload File</label>
                    <input
                      type="file"
                      className="upload__input"
                      onChange={(e) => handleChange(e)}
                      required
                    />

                    <div className="form__input">
                      <label htmlFor="">Title</label>
                      <input
                        type="text"
                        placeholder="Enter title"
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form__input">
                      <label htmlFor="">Description</label>
                      <textarea
                        name=""
                        id=""
                        rows="7"
                        placeholder="Enter description"
                        className="w-100"
                        onChange={(e) => setDesc(e.target.value)}
                        required
                      ></textarea>
                    </div>
                  </div>
                  {/* <Button onClick={uploadIPFS}>Upload to IPFS</Button> */}
                  <Button type="submit" onClick={(e) => mintNFT(e)}>
                    Mint
                  </Button>
                </form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Create;
