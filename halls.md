# Halls

A hall is an Ethereum mainnet contract whose artwork transfers can make a wallet eligible for Stillwater. Eligibility is activity, not a balance. In the 365 days ending at snapshot block B, an address that is `from` or `to` on a Transfer of a hall token is in the list. Someone who held a token all year and never moved it is absent, because a balance does not show up in a transfer log. Someone who sold is in. A mint counts, because `from` is the zero address and `to` is the minter. The zero address itself is not given a leaf. An approval, with no transfer, does not count.

Block B is not chosen yet. Until you paste it, and until there is an archive node, the indexer will practice on a small made-up list. It will not read mainnet for that practice run.

The Stillwater contract stores a merkle root. It does not call these halls. A proof is built off-chain from the logs, then checked against the root. A Sepolia claim can use a proof that was built from mainnet logs.

The print itself is not a file. It is the ice-field function in `art/render.js` plus, once a plate is dated, `datedBy` and `datedBlock`. The Walk projects those. v0 does not pin a bitmap. A future opcode that can read a nonce stays switched off until you say to arm it.

Marketplace conduits are not walkers. When the real index is built, `indexer/conduits.txt` will list published Seaport and, if a published list exists, Blur execution addresses. Those addresses are dropped. Addresses that are not on a published list are not invented.

## Art Blocks flagship cores

Checked 2026-09-23 against the Art Blocks contracts README and against Ethereum mainnet (`eth_getCode`, `name()`, `symbol()` on `https://ethereum.publicnode.com`). Each one answered name Art Blocks, symbol BLOCKS.

| Role | Projects | Address |
| --- | --- | --- |
| Core V0 | 0–2 | `0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a` |
| Core V1 | 3–373 | `0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270` |
| Core V3 | 374–493 | `0x99a9B7c1116f9ceEB1652de04d5969CcE509B069` |
| Core V3.2 | 494–504 | `0xAB0000000000aa06f89B268D604a9c1C41524Ac6` |
| Core V3.2 Flex Onchain | 505+ | `0xAB00000000002ADE39f58F9D8278a31574fFBe77` |

These five are the whole flagship set in that table. There is no flagship V2. In the Art Blocks table, “V2” means Engine. Engine stays out.

The Flex address stays in. Art Blocks lists it as the current flagship core, on its own row, separate from Engine Flex. Leaving it out because the word Flex appears would skip every flagship project from 505 on.

Minters are not halls. Money moved there. The artwork Transfer is on the cores above. These are not added:

- `0x234B25288011081817B5cC199C3754269cCb76D2`
- `0x091dcd914fCEB1d47423e532955d1E62d1b2dAEf`
- `0x1Db80B860081AF41Bc0ceb3c877F8AcA8379F869`
- `0xAA6EBab3Bf3Ce561305bd53E4BD3B3945920B176`
- `0x0E8BD86663e3c2418900178e96E14c51B2859957`
- `0x8e9398907d036e904fff116132ff2be459592277` (old royalty receiver, not an NFT contract)

## Transient Labs

`deployments.json` in `Transient-Labs/tl-creator-contracts` lists implementations, the shared logic, not each artist’s collection. Example: ERC721TL 4.1.0 at `0x44a46be01bf45358bbc850a1fa1e1fa390756166` has bytecode and an empty `name()`, which fits an uninitialized logic contract.

Artist collections are ERC-1167 clones. Transfers happen on the clone. Indexing the implementation would miss the collectors.

Discovery:

- Factory: Transient Labs Universal Deployer `0x7c24805454F7972d36BEE9D139BD93423AA29f3f` (bytecode present on mainnet; their docs use the same address on their other chains).
- Event: `ContractDeployed(address indexed sender, address indexed deployedContract, address indexed implementation, string cType, string version)`.
- Keep a clone when `cType` is `ERC721TL`, `ERC1155TL`, `ERC7160TL`, or `ERC7160TLEditions`, and the implementation is one of the `deployed_contract` values in `deployments.json` (every version, not only the latest).
- Leave out `TRACE` (story inscriptions), `StandardRenderingContract`, `GenArtRenderingContract`, and any blocklist registry. Those names are in the same JSON and are not the artwork.

Their docs also mention a general clone deployer and older deploys from before this factory. No address for that older path is confirmed here, so it is not invented. Real Transient Labs coverage has that gap until that factory is pointed out.

## Stacks

Out. Stacks, in this note, means an older Transient Labs shared drop product. It is not the Stacks blockchain. It is not a hall. The Transient auction house is not a hall either.

## Verse

The same activity rule: `from` or `to` on a Verse artwork transfer. That covers a collector and a seller. An approval alone does not.

verse.works does not use one NFT contract. Checked on mainnet 2026-09-23:

- `0xec43E92046C1527586dFAF02031622C30AF9A1d6` answers `name()` Verse Works.
- `0xD1240d3F8e7ccDfC5592f094BEFF4a51eFAF310B` answers `name()` Verse Works v0.3.0.

Transfers on these two count. Later projects are ERC-721 clones of `LondonTokenBase`. The factory in their verified source is `LondonTokenFactory.createCollection`, which emits `NewCollection(address)`. There is more than one implementation on mainnet, and a single factory address is not yet pinned. Those clones stay out until the factory addresses come from verified deployments. No factory address is guessed.

The labeled deployer `0x3F50c925e19a4c145378553a2e3E1d55BF554Cf5` is an ordinary wallet (no code). It is not a hall.

Left out:

- Bitcoin.com’s ERC-20 at `0x249ca82617ec3dfb2589c4c17ab7ec9765350a18`. It also answers name Verse, symbol VERSE. It is not an artwork.
- Art Blocks Engine `GenArt721CoreV2_VerseFlex` at `0xbb5471c292065d3b01b2e81e299267221ae9a250`. It answers name Verse, symbol VERSE, and its source says `GenArt721CoreV2_ENGINE_FLEX`. Engine stays out unless you add it.
- verse-xyz Hyperobject. The design is a `PairFactory` that deploys an ERC-721 plus an ERC-20 exchange. No mainnet factory address is confirmed. The ERC-20 would be the wrong log.

```solidity
// TODO: pin LondonTokenFactory addresses from verified deployments, then index
// Transfer on each NewCollection clone. Do not guess a factory.
// TODO: verse-xyz PairFactory / Hyperobject ERC-721 only, after a verified
// mainnet factory address. Do not index the paired ERC-20.
```

Shibaverse and any other token that is only named VERSE stay out.
