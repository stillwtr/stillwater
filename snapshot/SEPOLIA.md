# Sepolia

This hall. Chain id 11155111. Price is 0. The bytecode has list, buy, cancel, and the hard vault. It is a test hall. The real root is the mainnet root `0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3`. That root was not the constructor argument.

- Stillwater: `0x32362677bd7C4C911aB59b19ECCe3bf5943E8A29`
- Deploy tx: `0x97ab59ab8f76837c02aecd5279410c3e675ce32b21e9f613b62e9a5e37ad320f`
- Block: 11899829
- Gas used: 19252073
- Status: success
- Deployer / treasury / owner: `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- Tiny root: `0x2207bfd56870ed440c4c36df8b3c1d99c72d31004d4b37f434957d97a672ce38`
- walkBase: `https://stillwtr.github.io/stillwater/art/walk.html`
- solc: 0.8.37
- viaIR: false

https://sepolia.etherscan.io/address/0x32362677bd7C4C911aB59b19ECCe3bf5943E8A29

https://sepolia.etherscan.io/tx/0x97ab59ab8f76837c02aecd5279410c3e675ce32b21e9f613b62e9a5e37ad320f

The tiny root is the previous two test keys plus one further test key. The Walk points here.

## Previous hall

`0xc81148AA098723d4CbfaAd5517032D4fdFd87662` is the previous Walk hall. Same bytecode shape, price 0, same treasury. Its tiny root was `0x1df0d632551c27e813e322925bf8391506813d54574df108eab5bd63f3a4d384`. Print 1 below was minted there. The Walk no longer points here.

- Deploy tx: `0x5d6ae64e48ab6fbf1a9ff31ed78ec71f99ef5e2cfc1b5b421ec8b409a1fa9e4e`
- Block: 11893987
- Gas used: 19252085
- Status: success

https://sepolia.etherscan.io/address/0xc81148AA098723d4CbfaAd5517032D4fdFd87662

https://sepolia.etherscan.io/tx/0x5d6ae64e48ab6fbf1a9ff31ed78ec71f99ef5e2cfc1b5b421ec8b409a1fa9e4e

## Print 1

Minted and listed from the title key `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`. Price paid to mint was 0. The list ask is 0.042 ether. `ownerOf(1)` and `titleHolder(1)` are the title key. `mailboxOf(1)` is zero.

- Mint: `0x4b8ac974646af600657a5ff0d0bb8044a079048424f5c7f1473bbdd453b68ccd` block 11894004
- List: `0x42e8a308b155b592361f5d7b1e5541453cb9d1ada9d799d88fe36f1a0d5d894e` block 11894005

`listedPrice(1)` is 42000000000000000. The list receipt status is success.

https://sepolia.etherscan.io/tx/0x42e8a308b155b592361f5d7b1e5541453cb9d1ada9d799d88fe36f1a0d5d894e

## Two keys

Both are on the previous hall's tiny root. The new hall's root also includes them. A stranger is any address not on that hall's root. The vault does not need a proof. Mainnet walker proofs do not apply to either test root.

- Tree key A / treasury / deployer: `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- Tree key B: `0x51AB6D466422e9Fca8FaD9EF21a6e43F9F083fDA`

The leaf is `keccak256(bytes.concat(keccak256(abi.encode(address))))`. The two proofs below rebuild the previous hall's two-key root.

Proof for A, the leaf of B: `0x0571727ce22c0cd0d97f0f4767730433a249a3ac8c78ebfce10c495f44796afc`

Proof for B, the leaf of A: `0x1acc0a9178455c62bde6d9e5e788ac9ef51b7906f721329a05d06c1d1625ad13`

## Earlier empty hall

`0x8DE89DFe42d1d5F5FD23910B98f8f66239bD5124` is an earlier deploy of the list, buy, and cancel bytecode. Same tiny root, same treasury, price 0. `nextId` stayed 0. The Walk was not pointed here.

- Deploy: `0x0cfbb19a492ccf5881c32c7075e06594265c494ed67a75dd487b6823446d8e47` block 11881617

## Earlier hall

`0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34` is the previous Walk hall. Its bytecode has no list, buy, or cancel. Leave those receipts where they are. Do not treat them as this contract. That constructor used a temporary three-key root `0x5f9e4e542dae379422b58b3c301884cce31ab11d5407be39a7509f5b9725e47f` and `https://walk.test/`.

- Deploy: `0x471974ed88c3a1ba5c6ddb44484f9c1c8cf683d04178ed5d76aabfe66f600eb2` block 11811600
- Mint token 1, value 0: `0xb9044924de83591154227b48f2bd1977758de7d777e865caa6adaf597a1fe991` block 11811805
- `date(1)` once: `0x3ff6a134734763e0ba44f76699f10451ea7463fa2baa8e35141857628a180634` block 11811822. That block is `datedBlock(1)`.
- Park, `setMailbox(1, vault)`: `0x443554e00262ce174d08754c254270982f0141af35b8b130de9c2a395d4a7c74` block 11811865
- Vault `transferFrom` home: `0xbd13d0ac40117bcbdecfcc0ec988adf5a3143eeb872fcc8d08dd12e134391326` block 11811894
- Park again: `0x6117b455fcafdf2cef793f7e5d8328b3c9e7e91fc53c140903904d363f589dc9` block 11812043
- Vault `transferFrom` home again: `0x9f0b857838f4ed20a29a2a9939413dea4af004402c7021b2543e25294d5a2a51` block 11812054

Title and vault on those receipts: `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D` and `0x51AB6D466422e9Fca8FaD9EF21a6e43F9F083fDA`. Sourcify match 54166669 is that older bytecode.

## No code

Two creates in this pass ran out of gas and left no code.

- `0xe6B178E9ad34A6f91D3C02a8F8A0726BA62ea910` tx `0xb64e5a996aaea8e2ffa79290555ef9563865478fa1cbca3c4be9235632d05c24`
- `0x7cb7922C4136327990519D962c49bd967BF7A3d8` tx `0x9d942d27bb48e5f7486a82c4addb9537bb401028bcb0a31ab369a0e4e0a39f55`

A mint at nonce 20 also ran out of gas and did not create print 1: `0x088b0c45740912fb051eef7f4dc62a77073a656201f878e1ddc934c31d6fbfe5`. The mint above is the one that landed.
