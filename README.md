# Stillwater

The plate is a frozen pond. How busy the key has been is how much water is open. When they shutter, that night stays. Quiet after that grows ice back on the live view only.

Stillwater is an ERC-721 named Stillwater, symbol STILL. The supply is 512. One print per key on the list. The picture is drawn from that key and from how many transactions it has sent. Dating the print shutters it. The dated plate keeps that moment. The live view can keep moving. A quiet key ices over again. The dated one does not.

Mint on mainnet is 0.00420 ETH. That is about free. On every other chain it is free. No royalties. Nothing held back.

Mainnet is not deployed yet. The mint page without `chain=sepolia` is aimed at that hall. It will mint when the contract is there and the page points at the address that was created.

## Look

- The Walk: https://stillwtr.github.io/stillwater/art/walk.html
- Mint on Sepolia: https://stillwtr.github.io/stillwater/art/mint.html?chain=sepolia
- Sepolia hall: https://sepolia.etherscan.io/address/0x81236B313E25DfCb0D70AdA9A8D5B9f1970399b4
- Sepolia brush: https://sepolia.etherscan.io/address/0x4d425F1FcC82aA22405A9D35C0e7311656e6CB6E

The Walk paints in the browser. It asks public nodes, in order. If they all fail, the last plate stays and the line is "the chain did not answer."

A link with an id opens that print. On Sepolia the link needs `chain=sepolia` and this hall. Older Sepolia addresses are in `snapshot/SEPOLIA.md`.

The chain holds the tokens. The brush holds the recipe and the page. The site paints. If the site is gone, read those bytes from the brush, save the page, and paste the key and the nonce. Nothing is uploaded.

## The list

The list is for an address that walked an art hall in the year ending at snapshot block 26070219. A hall is an Art Blocks flagship core, a Transient Labs collection, or Verse Works. A mint counts. A transfer counts. Holding a work all year without moving it does not. The zero address is not on the list.

Exchanges, bridges, and routers stay off. So do desks funded as a farm: ten or more keys whose first payments mostly landed inside one day, and one 453-key factory whose funder never walked a hall. Smaller desks stay.

The contracts are named in `halls.md`. The cut is in `snapshot/SNAPSHOT.md` and `snapshot/desks.md`.

The root `script/Mainnet.s.sol` will pass is:

`0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3`

That list is 25,236 keys. The address file for it is not in the repository. The counts are in the snapshot note.

`snapshot/walkers.txt` is the earlier list, 21,501 keys, from before the Verse clones were added. Its root is `snapshot/root-walkers.txt`. `snapshot/root.txt` and `snapshot/stats.md` are earlier counts. The page builds a proof from `walkers.txt`. The Sepolia hall uses the three test keys instead, so that file will not open a mint there.

The leaf is `keccak256(bytes.concat(keccak256(abi.encode(address))))`. Pairs are sorted, then hashed. An odd node at the end of a level is lifted. The root is the one constructor argument. There is no setter and no second root.

## The print

`art/render.js` draws the plate. The contract does not store the pixels. `art/ACCEPT.md` is the drawing rule. `node art/gate.js` checks it.

A print moves only by mint, buy, setMailbox, or the vault sending it home. setMailbox names a vault and moves the print in one call. Title cannot pull. The vault sends it home. A bad vault can only freeze the print or return it.

`date(uint256)` records who shuttered it, and the block, once. Title may date, including while the vault holds the print. The vault may date while it holds the print. The first signature wins.

list, cancel, and buy stay on this contract. The caller of list must be both title and holder, so a parked print cannot be listed. buy takes a proof. The buyer must be on the list. Buying your own listing reverts.

Approvals are off. There is no trusted forwarder. The constructor owner does not transfer and does not renounce. That address is the treasury. Mint ETH stays in the contract until the treasury withdraws it.

tokenURI is data JSON. image is walkBase with `?id=` and `&still=1`. animation_url is walkBase with `?id=`. brush is a pointer, set once. tokenURI does not call it. nonceProbe can be set once. On Sepolia it was left unset.

`test/REDTEAM.md` is the list of moves the contract refuses, each next to the test that says so.

## Addresses

| | |
| --- | --- |
| Treasury | `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D` |
| Mainnet | not deployed yet |
| Mainnet price | 0.00420 ether |
| walkBase | `https://stillwtr.github.io/stillwater/art/walk.html` |
| Sepolia hall | `0x81236B313E25DfCb0D70AdA9A8D5B9f1970399b4` |
| Sepolia brush | `0x4d425F1FcC82aA22405A9D35C0e7311656e6CB6E` |
| Sepolia price | 0 |
| Sepolia root | three test keys |

The treasury is set in the constructor. It does not move. The mainnet script uses the same address.

The Sepolia hall and brush are verified on Etherscan. If this repository has moved on, that verified source is the bytecode match.

## Build

Foundry. Solidity 0.8.37, optimizer 200 runs, viaIR off.

```bash
forge test
node art/gate.js
```

`forge test` is the contract. `node art/gate.js` is the drawing. The license is MIT.
