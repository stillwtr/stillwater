# Stillwater

The plate is a frozen pond. How busy a key has been is how much water is open. Shuttering keeps that night. Later quiet grows ice back on the live view only. The dated plate stays where it was.

Stillwater is an ERC-721. The name is Stillwater and the symbol is STILL. The supply is 512. One print per key on the list. The picture comes from that key and from how many transactions the key has sent.

Dating a print records that moment once. The live view can keep changing. The dated plate does not.

A mainnet mint costs 0.00420 ETH. On every other chain the price is 0. There are no royalties.

## Look

- The Walk: https://stillwtr.github.io/stillwater/art/walk.html
- Mint: https://stillwtr.github.io/stillwater/art/mint.html
- Mint on Sepolia: https://stillwtr.github.io/stillwater/art/mint.html?chain=sepolia
- Mainnet hall: https://etherscan.io/address/0x189739F6f054feCdeb765E9BfF9ad972a094db94
- Mainnet brush: https://etherscan.io/address/0xfE490952B4f16911a31f786E4a2Ab53C6601870D
- Sepolia hall: https://sepolia.etherscan.io/address/0x81236B313E25DfCb0D70AdA9A8D5B9f1970399b4
- Sepolia brush: https://sepolia.etherscan.io/address/0x4d425F1FcC82aA22405A9D35C0e7311656e6CB6E

The Walk paints in the browser. It reads from public nodes. If they all fail, the last plate stays up and the line says "the chain did not answer."

A link with an id opens that print. On Sepolia the link needs `chain=sepolia` and the Sepolia hall above. Older Sepolia addresses are in `snapshot/SEPOLIA.md`.

The chain holds the tokens. The brush holds the recipe and the page. This site paints. If the site is gone, read those bytes from the brush and save the page. Nothing is uploaded.

## The list

A key is on the list if it walked an art hall during the year that ended at snapshot block 26070219. A hall is an Art Blocks flagship core, a Transient Labs collection, or Verse Works. A mint counts. A transfer counts. Holding a work all year and never moving it does not. The zero address is not on the list.

Exchanges, bridges, and routers stay off. So do groups funded like a farm: ten or more keys whose first payments mostly landed on the same day, and one named factory of 453 keys whose funder never walked a hall. Smaller groups stay.

The hall contracts are in `halls.md`. The cuts are in `snapshot/SNAPSHOT.md` and `snapshot/desks.md`.

The hall stores one root:

`0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3`

That root locks 25,236 keys. The keys are in `snapshot/hall-walkers.txt`, one address per line, sorted from low to high. `snapshot/hall-proofs.bin` is that same list plus the inner nodes of the tree. `node script/hall-proofs.js` rebuilds the bin from the text file. It does not change the root.

The mint page reads the root from the hall. It uses the bin only when the top hash equals that root. For one key, the page hashes the key the way the contract does, walks the stored siblings, and checks that the result is the hall root. A file that does not match is refused. The contract checks the same proof again when someone mints or buys. The page cannot make a stranger eligible.

`snapshot/walkers.txt` is the earlier list, 21,501 keys, from before the Verse clones were added. Its root is `snapshot/root-walkers.txt`. `snapshot/root.txt` and `snapshot/stats.md` are earlier counts. They are not the live list.

The Sepolia hall uses three test keys. A mainnet proof does not mint there.

The leaf is `keccak256(bytes.concat(keccak256(abi.encode(address))))`. Pairs are sorted, then hashed. An odd node at the end of a row is carried up as it is. The root is set in the constructor. There is no way to change it.

## The print

`art/render.js` draws the plate. The contract does not store the pixels. `art/ACCEPT.md` is the drawing rule. `node art/gate.js` checks that rule.

A print moves only by mint, by buy, by `setMailbox`, or by the vault sending it home. `setMailbox` names a vault and moves the print in the same call. The owner of the title cannot pull it back. The vault can send it home, and only home. A bad vault can freeze the print or return it. It cannot sell it.

`date(uint256)` records who shuttered the print, and the block, once. The title holder may date, including while a vault holds the print. The vault may date while it holds the print. The first one wins.

`list`, `cancel`, and `buy` stay on this contract. The caller of `list` has to be both the title holder and the current holder, so a parked print cannot be listed. `buy` takes a proof. The buyer has to be on the list. Buying your own listing fails.

Approvals are off. There is no trusted forwarder. The owner set in the constructor cannot transfer that role and cannot renounce it. That address is the treasury. Mint ETH stays in the contract until the treasury withdraws it.

`tokenURI` is a data URL with JSON in it. `image` is walkBase plus `?id=` and `&still=1`. `animation_url` is walkBase plus `?id=`. `brush` is one address, set once. `tokenURI` does not call the brush. `nonceProbe` can be set once. It is still unset.

`test/REDTEAM.md` is the list of moves the contract refuses. Each one names the test that shows it.

## Addresses

| | |
| --- | --- |
| Treasury | `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D` |
| Mainnet hall | `0x189739F6f054feCdeb765E9BfF9ad972a094db94` |
| Mainnet brush | `0xfE490952B4f16911a31f786E4a2Ab53C6601870D` |
| Mainnet root | `0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3` |
| Mainnet price | 0.00420 ether |
| walkBase | `https://stillwtr.github.io/stillwater/art/walk.html` |
| Sepolia hall | `0x81236B313E25DfCb0D70AdA9A8D5B9f1970399b4` |
| Sepolia brush | `0x4d425F1FcC82aA22405A9D35C0e7311656e6CB6E` |
| Sepolia price | 0 |
| Sepolia root | three test keys |

The treasury is set in the constructor. It does not move.

The mainnet hall and brush are verified on Etherscan. The Sepolia hall and brush are verified there too. The compiler is Solidity 0.8.37, optimizer on, 200 runs, via IR off, EVM osaka. If this repository moves on, the verified source on Etherscan is the copy that matches the bytecode.

## Build

Foundry. Solidity 0.8.37, optimizer 200 runs, via IR off, EVM osaka.

```bash
forge test
node art/gate.js
node script/hall-proofs.js
```

`forge test` checks the contract. `node art/gate.js` checks the drawing. `node script/hall-proofs.js` rebuilds the proof file from the key list and stops if the root changed. The license is MIT.
