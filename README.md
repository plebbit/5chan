<img src="https://github.com/plebeius-eth/assets/blob/main/5chan-logo.jpg" width="378" height="123">

_Telegram group for this repo https://t.me/fivechandev_

# 5chan

5chan is a serverless, adminless, decentralized and open-source 4chan alternative, where anyone can create and cryptographically own unlimited boards. All boards are selfhosted by their owners, who run [plebbit nodes](https://github.com/plebbit/plebbit-cli) that users connect to, peer-to-peer. All data is text-only, including links to load media/embeds.

- web version: https://5chan.app, also available using Brave/IPFS Companion on https://5chan.eth

### Downloads
- desktop version (full p2p plebbit node, seeds automatically): available for Mac/Windows/Linux, [download link in the release page](https://github.com/plebbit/5chan/releases/latest)
- mobile version: available for Android, [download link in the release page](https://github.com/plebbit/5chan/releases/latest)

## How to create a board
In the plebbit protocol, a 5chan board is called a _subplebbit_. To run a subplebbit, you can choose between two options:

1. If you prefer to use a **GUI**, download the desktop version of the Seedit client, available for Windows, MacOS and Linux: [latest release](https://github.com/plebbit/seedit/releases/latest). Create a subplebbit using using the familiar old.reddit-like UI, and modify its settings to your liking. The app runs an IPFS node, meaning you have to keep it running to have your board online.
2. If you prefer to use a **command line interface**, install plebbit-cli, available for Windows, MacOS and Linux: [latest release](https://github.com/plebbit/plebbit-cli/releases/latest). Follow the instructions in the readme of the repo. When running the daemon for the first time, it will output WebUI links you can use to manage your subplebbit with the ease of the GUI.

Peers can connect to your subplebbit using any plebbit client, such as 5chan or Seedit. They only need the subplebbit's address, which is not stored in any central database, as plebbit is a pure peer-to-peer protocol.

### How to add a board to the boards list
The boards list on 5chan is plebbit's [lists](https://github.com/plebbit/lists) repository, specifically the [5chan-multisub.json](https://github.com/plebbit/lists/blob/master/5chan-multisub.json) file. You can open a pull request in that repo to add your subplebbit to the list, or contact devs via telegram [@plebbit](https://t.me/plebbit). In the future, this process will be automated by submitting proposals to a plebbit DAO, using the [plebbit token](https://etherscan.io/token/0xea81dab2e0ecbc6b5c4172de4c22b6ef6e55bd8f).

## To run locally

1. Install Node v22 (Download from https://nodejs.org)
2. Install Yarn: `npm install -g yarn`
3. `yarn install --frozen-lockfile` to install 5chan dependencies
4. `yarn start` to run the web client

### Scripts:

- Web client: `yarn start`
- Electron client (must start web client first): `yarn electron`
- Electron client and don't delete data: `yarn electron:no-delete-data`
- Web client and electron client: `yarn electron:start`
- Web client and electron client and don't delete data: `yarn electron:start:no-delete-data`

### Build:

The linux/windows/mac/android build scripts are in https://github.com/plebbit/5chan/blob/master/.github/workflows/release.yml
