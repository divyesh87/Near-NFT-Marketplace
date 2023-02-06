import { Contract } from "near-api-js";

async function getSales(walletConnection, marketplace_contract, index = 0, limit = 12) {
	try {

		let sales = await marketplace_contract.get_sales({ from_index: index.toString(), limit });

		let tokens = await getTokens(sales, walletConnection);

		return { sales, tokens };

	}
	catch (e) {
		alert(
			'Something went wrong! ' +
			'Maybe you need to sign out and back in? ' +
			'Check your browser console for more info.'
		)
		throw e
	}
}

async function getAuctions(walletConnection, marketplace_contract, index = 0, limit = 12) {
	try {
		// let limit = 12;	// Should be dependant on index while implementing pagination

		let auctions = await marketplace_contract.get_auctions({ 'from_index': index.toString(), limit });

		let tokens = await getTokens(auctions, walletConnection);

		return { auctions, tokens };
	}
	catch (e) {
		alert(
			'Something went wrong! ' +
			'Maybe you need to sign out and back in? ' +
			'Check your browser console for more info.'
		)
		throw e
	}
}

async function getTokens(collection, walletConnection) { // collection can be sales or auctions

	let tokens = [];
	let token_ids = collection.map(sale => sale.token_id);
	let contracts = collection.map(sale => sale.nft_contract_id);

	for (let i = 0; i < token_ids.length; i++) {
		let contract = await new Contract(walletConnection.account(), contracts[i], {
			viewMethods: ['nft_metadata', 'nft_total_supply', 'nft_tokens_for_owner', 'nft_token'],
			changeMethods: ['nft_mint', 'nft_transfer', 'nft_approve', 'nft_revoke'],
		})
		let token = await contract.nft_token({ 'token_id': token_ids[i] })
		const contract_metadata = await contract.nft_metadata();
		const base_uri = contract_metadata.base_uri;
		Object.assign(token, { base_uri });
		tokens.push(token);
	}

	return tokens
}

async function getSaleFromId(walletConnection, marketplace_contract, nft_contract_id, token_id) {
	try {
		const delimiter = "."
		const indexer = nft_contract_id + delimiter + token_id
		let sale = await marketplace_contract.get_sale({ nft_contract_token: indexer });

		if (sale === null) {
			return null;
		}

		let contract_id = sale.nft_contract_id;

		let contract = await new Contract(walletConnection.account(), contract_id, {
			viewMethods: ['nft_metadata', 'nft_total_supply', 'nft_tokens_for_owner', 'nft_token'],
			changeMethods: ['nft_mint', 'nft_transfer', 'nft_approve', 'nft_revoke'],
		})
		let token = await contract.nft_token({ 'token_id': token_id })
		const contract_metadata = await contract.nft_metadata();
		const base_uri = contract_metadata.base_uri;
		Object.assign(token, { base_uri });

		return { sale, token };

	}
	catch (e) {
		alert(
			'Something went wrong! ' +
			'Maybe you need to sign out and back in? ' +
			'Check your browser console for more info.'
		)
		throw e
	}
}

async function buy(walletConnection, marketplace_contract, accountId, token_id, sale) {

	if (!walletConnection.isSignedIn()) {
		alert('Please Sign In!')
		return;
	}

	if (accountId === sale.owner_id) {
		alert('Cant buy your own token!');
		return;
	}

	//Fixed the bn.js issue by converting number to string instead of exponential form.
	let price = sale.price.toLocaleString('fullwide', { useGrouping: false });

	try {
		await marketplace_contract.offer({
			"nft_contract_id": sale.nft_contract_id,
			"token_id": token_id
		},
			"300000000000000",
			price);
	}
	catch (e) {
		alert(
			'Something went wrong! ' +
			'Maybe you need to sign out and back in? ' +
			'Check your browser console for more info.'
		)
		throw e
	}
}

export { buy, getSales, getAuctions, getSaleFromId }