const Mesh = require("@meshsdk/core");
const Octokit = require("@octokit/core").Octokit;
const Blockfrost = require("@blockfrost/blockfrost-js");

// Blockfrost API
const blockfrost = new Blockfrost.BlockFrostAPI({
  projectId: process.env.BLOCKFROST_KEY,
});

// Mesh
const blockchainProvider = new Mesh.BlockfrostProvider(
  process.env.BLOCKFROST_KEY
);

// Create a personal access token at https://github.com/settings/tokens/new
const octokit = new Octokit({ auth: process.env.GITHUB_KEY });

(async () => {
  // GET request page
  let page = 1;

  // List of payment keys scanned
  let items = [];

  while (true) {
    // GET items in github search
    items = await octokit
      // code search
      .request("GET /search/code", {
        // any code content that has paymentsigningkeyshelley_ed25519
        q: "paymentsigningkeyshelley_ed25519",
        per_page: 100,
        // current page
        page: page,
      })
      .then((response) => response.data.items);

    // no result break the loop
    if (!items) break;
    // else assign next page
    else page += 1;

    // for each item in results
    for (const data of items) {
      // GET code content in base64
      const contentBase64 = await octokit
        .request("GET " + data.url)
        .then((response) => response.data.content);

      // Transform base64 to readable string
      const contentString = Buffer.from(contentBase64, "base64").toString();

      // match any string that starts with 5820
      // from the content
      const regex = /(?<!\w)5820\w+/g;
      const keys = contentString.match(regex);

      // no keys continue to next item
      if (!keys) continue;

      // for each key
      for (const key of keys) {
        // load wallet using meshsdk
        const wallet = new Mesh.AppWallet({
          networkId: 0, // 0 is testnet // 1 is mainnet
          fetcher: blockchainProvider,
          submitter: blockchainProvider,
          key: {
            type: "cli",
            // payment key extracted
            payment: key,
          },
        });

        // payment address of the wallet
        const address = wallet.getPaymentAddress();

        // check wallet balance using blockfrost
        const utxos = await blockfrost
          .addressesUtxos(address)
          // console log key if containing balance
          .then((utxos) => console.log(key))
          // do nothing if wallet is not used
          .catch((err) => err);
      }
    }
  }
})();
