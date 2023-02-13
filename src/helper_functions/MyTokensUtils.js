export function getSessionNfts() {
    const data = JSON.parse(sessionStorage.getItem("nfts"));
    if (data) {
        return data;
    } else {
        return [];
    }
}

export function storeContract(address) {
    let contracts = JSON.parse(localStorage.getItem("nftContracts"));
    if (contracts == null) contracts = [];
    const isAlreadyPresent = contracts.some((contract) => {
        return contract === address;
    });

    if (isAlreadyPresent) return;
    contracts.push(address);
    localStorage.setItem("nftContracts", JSON.stringify(contracts));
}

export function filterNFTs(nfts) {
    let filterdNFTs = [];
    let pushed = [];

    nfts.forEach((nft) => {
        if (!pushed.includes(nft.token_id)) {
            filterdNFTs.push(nft);
        }
        pushed.push(nft.token_id);
    });

    return filterdNFTs;
}

export function checkIPFSHash(hash) {
    return hash.startsWith("Qm");
}

export function getImg(url) {
    if (checkIPFSHash(url)) {
        return `https://gateway.pinata.cloud/ipfs/${url}`;
    } else {
        return url;
    }
}

export function assignContract(nfts, address) {
    nfts.forEach((nft) => {
        nft.contractId = address;
    });
    return nfts;
}