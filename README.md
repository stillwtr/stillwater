# Stillwater

The plate is a frozen pond. How busy the key has been is how much water is open. When they shutter, that night stays. Quiet after that grows ice back on the live view only.

Stillwater is one print. It is an ERC-721 named Stillwater, symbol STILL, supply 512. A key that walked a hall during the snapshot year can mint once. The picture is drawn from that key and how many transactions it has sent. Dating the print shutters it, and the dated plate keeps that moment. The live view can keep moving. A quiet key ices over again. The dated one does not.

## See it

The Walk (`art/walk.html`) is the room. It has no wallet and no price. The bare page reads one example key live. A link with an id and a chain opens that print. Lobby (`lobby/`) is where a print is claimed, dated, listed, and bought.

## Who can mint

A hall is an Art Blocks flagship core, a Transient Labs collection, or Verse Works. In the year that ends at snapshot block 26070219, a key that sent or received one of those works is a candidate. A mint counts. A sale counts. Holding a work all year without a transfer does not. The zero address is not a leaf.

Exchanges, bridges, and routers stay off. So do desks that were funded as a farm: ten or more keys whose first payments mostly landed inside one day, and one 453-key factory whose funder never walked a hall. Smaller desks stay. The contracts are named in `halls.md`. The counts and the current root are in `snapshot/SNAPSHOT.md`.

## The print

`art/render.js` draws the plate. The contract does not store the pixels. `date(uint256)` records who shuttered it, and the block, once. The title can park the print in a vault. Only that vault can send it home. Approvals are off.

Mainnet price is 0.00420 ether. Any other chain mints for 0. Mainnet is not deployed. The Sepolia contract is `0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34`. That deploy uses a temporary three-key root, not the hall root.

## Build

Foundry. Solidity 0.8.37, optimizer 200 runs, viaIR off.

```bash
forge test
node art/gate.js
```

The leaf is `keccak256(bytes.concat(keccak256(abi.encode(address))))`. Pairs are sorted, then hashed. An odd node at the end of a level is lifted. The root is the one constructor argument. There is no setter and no second root.

Anvil, then Sepolia, then mainnet only after `DEPLOY MAINNET`.
