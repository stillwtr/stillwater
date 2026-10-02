# Snapshot

Window: 1 × 365 days, ending at the snapshot block. The year length is 365 × 86400 seconds, the same year the refreeze clock uses.

- Snapshot block: 26070219
- Snapshot time: 2026-09-27T17:15:23.000Z
- From block: 23455765
- From time: 2025-09-27T17:15:11.000Z
- Log RPC: mainnet.gateway.tenderly.co. ethereum-rpc.publicnode.com refuses archive getLogs without a token, and eth.drpc.org free tier will not route a year-old getLogs. Nonce reads use the same Tenderly endpoint, with dRPC as failover.
- Leaf: keccak256(bytes.concat(keccak256(abi.encode(address))))
- Addresses sorted ascending (lowercase hex). Pairs use OpenZeppelin's sorted keccak. An odd node at the end of a level is lifted, not hashed with itself.
- ERC-721 Transfer on these cores indexes the token id as the fourth topic. That topic is not an address. Only from and to are kept. ERC-1155 keeps operator, from, and to. Values under 2^128 left behind by an earlier read of that topic were removed before the root (token ids, and the burn address 0xdead).
- A published conduit list was not on disk, so none were dropped. The zero address is dropped.

## Contracts

- AB Core V0 `0x059edd72cd353df5106d2b9cc5ab83a52287ac3a` Transfer logs 23455765 … 26070219
- AB Core V1 `0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270` Transfer logs 23455765 … 26070219
- AB Core V3 `0x99a9b7c1116f9ceeb1652de04d5969cce509b069` Transfer logs 23455765 … 26070219
- AB Core V3.2 `0xab0000000000aa06f89b268d604a9c1c41524ac6` Transfer logs 23455765 … 26070219
- AB Core V3.2 Flex `0xab00000000002ade39f58f9d8278a31574ffbe77` Transfer logs 23455765 … 26070219
- Verse Works `0xec43e92046c1527586dfaf02031622c30af9a1d6` Transfer logs 23455765 … 26070219
- Verse Works v0.3.0 `0xd1240d3f8e7ccdfc5592f094beff4a51efaf310b` Transfer logs 23455765 … 26070219
- Transient Labs factory `0x7c24805454f7972d36bee9d139bd93423aa29f3f` ContractDeployed from block 15500000 through 26070219. Clones kept when cType is ERC721TL, ERC1155TL, ERC7160TL, or ERC7160TLEditions and the implementation is a deployed_contract in tl-creator-contracts deployments.json (TRACE and rendering contracts left out). ERC-721 clones use Transfer. ERC1155TL and ERC7160TLEditions also use TransferSingle and TransferBatch. Indexed operator, from, and to are kept.
- Verse Works contracts are ERC-1155. Their TransferSingle and TransferBatch logs use the same window. The ERC-721 Transfer topic does not match those events.

## Walkers

A walker has nonce >= 1 at block 26070219 and was already in allowlist.json. Nonce 0 is dropped. A contract is dropped only when it is on the deny list below. A nonempty eth_getCode is not a reason to drop.

Leaf and pair stay the ones the tests use. allowlist.json is unchanged.

### Deny list

Hall contracts are the seven cores in the section above, the Transient Labs factory, every implementation in indexer/snapshot.js, and every clone in snapshot/.tl-clones.json.

Official Art Blocks minters, from Art Blocks MINTER_SUITE.md and deployments/minters/mainnet/DEPLOYMENTS.md:

- AB legacy V0 minter `0x47e312d99c09ce61a866c83cbbbbed5a4b9d33e7`
- AB MinterFilterV0 `0x4aafce293b9b0fad169c78049a81e400f518e199`
- AB MinterFilterV1 `0x092b8f64e713d66b38522978bcf4649db14b931e`
- AB shared MinterFilter `0xa2ccfe293bc2cdd78d8166a82d1e18cd2148122b`
- AB MinterSetPriceV5 `0x0635e2f2926b306356b5b3f5cb6489107796b085`
- AB MinterSetPriceERC20V5 `0x11515ae3f510d8bfedd2b60b4a878f8a77a7b7ec`
- AB MinterSetPriceHolderV5 `0x69f04fddf0c4c32642b22e68b867282d5074a98a`
- AB MinterSetPriceMerkleV5 `0xa19bf77719a9b6e7daa3c33b3aac119af865e1c4`
- AB MinterSetPricePolyptychV5 `0xef8e3eb6f0b9cdede7ed333cbe67d5a2068d89e3`
- AB MinterSetPricePolyptychERC20V5 `0x72f4ed8aeadd991162d97506f320018c5d85c142`
- AB MinterDAExpV5 `0x7e6f7aa281133e394041b5fea1f3be7a00d7201f`
- AB MinterDALinV5 `0x7b03ec8ee63740642ca76b5fe169978f2077ca08`
- AB MinterDAExpSettlementV3 `0x6cafc1b007f16f171b34ee45fc61b378ad58f592`
- AB MinterDAExpHolderV5 `0xe7acf1aab43deb805ebd7a90f34572ef6818af02`
- AB MinterDALinHolderV5 `0x733c849d0174f009a993268ef258f7e829f62523`
- AB MinterMinPriceV0 `0xf5733268d28dde96fc32f2ba8e1267eb64120875`
- AB MinterMinPriceMerkleV0 `0x723ebf276f95e992480d009bc132c9820a39b58f`
- AB MinterRAMV0 `0xdea98cb77d90e03dbf312626402adb452ed7a4e3`
- AB MinterSEAV1 `0xe56087d37973f49fe3c154272cfd3041d7539c52`

Marketplaces and routers added by hand:

- Seaport 1.1 `0x00000000006c3852cbef3e08e8df289169ede581`
- Seaport 1.4 `0x00000000000001ad428e4906ae43d8f9852d0dd6`
- Seaport 1.5 `0x00000000000000adc04c56bf30ac9d3c0aaf14dc`
- Seaport 1.6 `0x0000000000000068f116a894984e2db1123eb395`
- Blur Exchange `0x000000000000ad05ccc4f10045630fb830b95127`
- Blur Pool `0x0000000000a39bb272e79075ade125fd351887ac`
- Blur Marketplace `0xb2ecfe4e4d61f8790bbb9de2d1259b9e2410cea5`
- delegate.xyz `0x00000000000076a84fef008cdabe6409d2fe638b`

Etherscan name-tag files from brianleect/etherscan-labels (cloned 2026-09-27), kept when the tag is a marketplace. Gem tags are kept only when the name starts with Gem:.

- gem: 9 addresses
- looksrare: 30 addresses
- nifty-gateway: 5 addresses
- opensea: 16 addresses
- rarible: 32 addresses
- sudoswap: 3 addresses
- zora: 3 addresses

Deny-list keys removed from the nonce >= 1 set: 7.

### Funder ignore list

First inbound funder is the earliest normal transfer with value above zero to the walker, at or before block 26070219, from Blockscout v2 sorted oldest first (one page, 50 rows). The internal-transfer endpoint was rate-limited, so an earlier internal funder is not seen. If that page has no paying transfer, the walker is a singleton. If the funder is on this list, the walker is also a singleton.

CEX, bridge, and router tags from the same Etherscan label scrape, plus the four Uniswap routers:

- 0x-protocol: 58
- 1inch: 34
- across-protocol: 21
- binance: 57
- binance-deposit: 1
- bitfinex: 40
- bithumb: 18
- bitmart: 5
- bitmex: 2
- bitstamp: 9
- bittrex: 4
- blockfi: 6
- bridge: 166
- celer-network: 10
- celsius-network: 24
- changenow: 3
- coinbase: 25
- coinlist: 3
- crypto-com: 21
- deribit: 10
- fiat-gateway: 22
- ftx: 13
- gate-io: 7
- gemini: 13
- hop-protocol: 34
- huobi: 85
- kraken: 18
- kucoin: 20
- multichain: 38
- nexo: 8
- okx: 26
- paraswap: 9
- poloniex: 20
- sushiswap: 3581
- synapse: 11
- uniswap: 4
- upbit: 4
- wormhole: 18
- Uniswap V2 Router `0x7a250d5630b4cf539739df2c5dacb4c659f2488d`
- Uniswap V3 Router `0xe592427a0aece92de3edee1f18e0157c05861564`
- Uniswap Universal Router `0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad`
- Uniswap Universal Router (previous) `0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b`

## Hall clean

Farm-ish desks are off the list: at least 10 keys, and a majority of first payments inside one 24-hour window. Twelve such desks, 247 keys. The 453-key factory is off as well. Its busiest day was 20 keys, so the 24-hour rule did not catch it. That funder never walked a hall and was not added. Five other parents had already walked and were already on the list. One parent had walked and was restored. Seven parents were not added. Singletons and smaller desks stay. Known exchanges, bridges, and routers stay off. Nonce 0 stays off. The allowlist is not read by the walk page.

- keys before: 22200
- keys dropped: 699
- keys after: 21501
- root: `0x6cece1d62b58afe3a6f7352024edd36e4a083d0d360d4d844ddd339dd90d6634`

## Deploy wiring

Constructor argument `merkleRoot` is this root. One immutable. No setter. No second root. Leaf unchanged. Sepolia was not redeployed.

`0x6cece1d62b58afe3a6f7352024edd36e4a083d0d360d4d844ddd339dd90d6634`

- solc: 0.8.37
- viaIR: false

