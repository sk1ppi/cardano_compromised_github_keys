# Scanning github code for compromised payment keys in cardano

Sometimes people make mistakes uploading private or sensitive keys on github, in this project we will be looking for payment signing keys on github using [octokit-js](https://www.npmjs.com/package/@octokit/core#rest-api-example) for github search and [mesh-js](https://meshjs.dev/) for creating and submitting transactions.

**Guides**

- Octokit to github search REST : https://octokitnet.readthedocs.io/en/latest/search/
- Manage cardano wallets using meshjs : https://meshjs.dev/apis/appwallet
- Build and sign transactions on cardano with meshjs : https://meshjs.dev/apis/transaction
