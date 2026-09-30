# Stillwater

Stillwater is the print. The Walk is where you see it move until it doesn’t.

The look page is **The Walk** (`walk/`). It has no wallet and no price. The sale page is **Lobby** (`lobby/`). That is where a plate is claimed, dated, listed, and bought. The token is named Stillwater. Its symbol is STILL. The Walk is not titled Stillwater. The Lobby is not titled The Walk.

This folder is its own project at `/home/copper/Documents/stillwater`. It is not part of Parsed Parcels. The GitHub name reserved for it is `stillwtr/stillwater`. Nothing has been pushed.

## The picture

The picture is an overhead ice field. A quiet wallet is almost all snow. A wallet that has sent many transactions has dark water opened across that snow. The drawing is a function of the address and the transaction count, in `art/render.js`. A dated plate remembers who dated it (`datedBy`) and the block (`datedBlock`). The Walk only projects that. If this page is gone, another page with the same function can still draw it. v0 does not store image files of the plates, and it does not put the pixels on the contract. A future nonce opcode stays off until you say to arm it. Plates dated before that keep `datedBy` and the block.

Nothing here is on mainnet. Later the order is Anvil (a practice chain on this computer), then Sepolia, then mainnet only after you type `DEPLOY MAINNET`. Never Rinkeby. Never Goerli.

Foundry is installed. The sample Counter contract was not created. The pictures and the Solidity come in later steps, after you say so.

## Folders

- `src/` — contracts, later
- `test/` — tests, later
- `script/` — deploy scripts, later
- `walk/` — The Walk
- `lobby/` — Lobby
- `art/` — the night-sea drawing, later
- `indexer/` — the eligibility list, later
- `halls.md` — which Ethereum contracts count as a hall
