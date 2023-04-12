const Octokit = require("@octokit/core").Octokit;
const Meshsdk = require("@meshsdk/core");
const Blockfrost = require("@blockfrost/blockfrost-js");

// 0 testnet || 1 mainnet
const networkId = 0;

const githubKey = "GITHUB_KEY";
const blockfrostKey = "BLOCKFROST_KEY";

const blockfrostApi = new Blockfrost.BlockFrostAPI({
  projectId: blockfrostKey, // see: https://blockfrost.io
  // For a list of all options see section below
});

const blockchainProvider = new Meshsdk.BlockfrostProvider(blockfrostKey);

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
const octokit = new Octokit({ auth: githubKey });

(async () => {
  const keyList = [];
  let octoPage = 1;
  let octoItems = [];

  while (true) {
    // Query github api and search for code containing the query
    octoItems = await octokit
      .request("GET /search/code", {
        q: "paymentsigningkeyshelley_ed25519",
        per_page: 100,
        page: octoPage,
      })
      .then((response) => response.data.items);

    if (!octoItems) break;
    else octoPage += 1;

    // loop through each item in query
    for (const data of octoItems) {
      // get content of file
      const contentBase64 = await octokit
        .request("GET " + data.url)
        .then((response) => response.data.content);

      // transform file to readable string
      const contentString = Buffer.from(contentBase64, "base64").toString();

      // match any string that starts wit 5820
      const regex = /(?<!\w)5820\w+/g;
      const paymentKeys = contentString.match(regex);

      if (!paymentKeys) continue;

      for (const key of paymentKeys) {
        // load wallet using meshsdk
        const wallet = new Meshsdk.AppWallet({
          // 0 testnet
          // 1 mainnet
          networkId: networkId,
          fetcher: blockchainProvider,
          submitter: blockchainProvider,
          key: {
            type: "cli",
            // use payment key
            payment: key,
          },
        });

        const address = wallet.getPaymentAddress();

        const utxos = await blockfrostApi
          .addressesUtxos(address)
          .catch((err) => 0);

        if (utxos.length) console.log(key);
      }
    }
  }
})();
