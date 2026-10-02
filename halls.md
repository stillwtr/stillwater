# Halls

A hall is a mainnet contract whose artwork transfers can put a key on the Stillwater list. The list is activity over one year, not a balance. A transfer's from and to are kept. A mint counts, because the sender is the zero address and the receiver is the minter. An approval does not. The zero address is not a leaf. Someone who held a work all year and never moved it is absent.

The year ends at snapshot block 26070219. The window and the root are in `snapshot/SNAPSHOT.md`. The contract stores that root. It does not call these halls.

## Art Blocks flagship

| Role | Projects | Address |
| --- | --- | --- |
| Core V0 | 0–2 | `0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a` |
| Core V1 | 3–373 | `0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270` |
| Core V3 | 374–493 | `0x99a9B7c1116f9ceEB1652de04d5969CcE509B069` |
| Core V3.2 | 494–504 | `0xAB0000000000aa06f89B268D604a9c1C41524Ac6` |
| Core V3.2 Flex Onchain | 505+ | `0xAB00000000002ADE39f58F9D8278a31574fFBe77` |

These five are the flagship set. There is no flagship V2. In the Art Blocks table, V2 means Engine. Engine stays out. The Flex core stays in. It is the current flagship, not Engine Flex.

Minter contracts are not halls. The artwork transfer is on the cores above.

- `0x234B25288011081817B5cC199C3754269cCb76D2`
- `0x091dcd914fCEB1d47423e532955d1E62d1b2dAEf`
- `0x1Db80B860081AF41Bc0ceb3c877F8AcA8379F869`
- `0xAA6EBab3Bf3Ce561305bd53E4BD3B3945920B176`
- `0x0E8BD86663e3c2418900178e96E14c51B2859957`
- `0x8e9398907d036e904fff116132ff2be459592277`

## Transient Labs

Artist collections are clones. The shared implementation is not the hall. Transfers happen on the clone.

The factory is the Transient Labs Universal Deployer, `0x7c24805454F7972d36BEE9D139BD93423AA29f3f`. A clone is kept when its type is `ERC721TL`, `ERC1155TL`, `ERC7160TL`, or `ERC7160TLEditions`, and its implementation is one of the deployed contracts in `Transient-Labs/tl-creator-contracts`. `TRACE`, rendering contracts, and the blocklist registry are not halls. Deploys from before this factory are not in the list.

## Verse

verse.works does not use one contract. These two count:

- `0xec43E92046C1527586dFAF02031622C30AF9A1d6` — Verse Works
- `0xD1240d3F8e7ccDfC5592f094BEFF4a51eFAF310B` — Verse Works v0.3.0

Later projects are clones of `LondonTokenBase`. Their factory addresses are not pinned, so those clones are not in the list. The labeled deployer `0x3F50c925e19a4c145378553a2e3E1d55BF554Cf5` is a wallet, not a hall.

Left out:

- The VERSE ERC-20 at `0x249ca82617ec3dfb2589c4c17ab7ec9765350a18`
- Art Blocks Engine `GenArt721CoreV2_VerseFlex` at `0xbb5471c292065d3b01b2e81e299267221ae9a250`
- verse-xyz Hyperobject. No mainnet factory address is confirmed, and the paired token would be the wrong log.

## Also left out

Stacks, the older Transient Labs shared drop, is not a hall. The Transient auction house is not a hall. Shibaverse and any other token that is only named VERSE stay out. Marketplace conduits, Seaport, and Blur are not halls.
