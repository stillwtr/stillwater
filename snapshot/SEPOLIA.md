# Sepolia

This hall. Chain id 11155111. Price is 0. The bytecode has list, buy, cancel, and the hard vault. It is a test hall. The real root is the mainnet root `0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3`. That root was not the constructor argument.

- Stillwater: `0x6B9264A5d731EDE4F65b91add5Ec7e8aE8ceC465`
- Deploy tx: `0x50c5fcf59654626688af02b5c983be9cc9ebd0f58e0b3cbfbbd7e9dce2707f59`
- Block: 11901405
- Gas used: 19252085
- Status: success
- Deployer / treasury / owner: `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- Tiny root: `0xa58168e3afcda5f29139c04aa6b55317cabf96c8d548ec27d0528170f96c6ea9`
- walkBase: `https://stillwtr.github.io/stillwater/art/walk.html`
- solc: 0.8.37
- viaIR: false
- nextId: 1

https://sepolia.etherscan.io/address/0x6B9264A5d731EDE4F65b91add5Ec7e8aE8ceC465

https://sepolia.etherscan.io/tx/0x50c5fcf59654626688af02b5c983be9cc9ebd0f58e0b3cbfbbd7e9dce2707f59

The tiny root is three keys, sorted ascending. The Walk points here. The mint page follows the contract in the URL.

- `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- `0x63dAE8be19A773493a11AEd1996899Ec6cd55F45`
- `0xd934CC70B1b06256581527a534285f5bd6A7eDc7`

Token 1 is minted and dated. Minter, owner, title, and dated-by are the treasury. Mailbox is unset. The dated plate is the treasury's count in the block before the date block.

- Mint tx: `0xaa5bfe3a1244c9b81711ddfa95bef6abb4dd69779c3846087ee6e9285d0b2d4b`
- Mint block: 11901540
- Mint nonce: 43
- Date tx: `0x8367701e3e7d0fac138f7e20bface4710d6a831e4c1b809d7fcba2fa5b2ed452`
- Date block: 11901569
- Date nonce: 44
- Count at block 11901568: 44
- Count at block 11901569: 45
- Seed: `c940268f5cbfab967dc0a3b1944dd81cdcc41409dab3ade00c648cdabe7ba85a`
- Palette: Ice

https://sepolia.etherscan.io/tx/0xaa5bfe3a1244c9b81711ddfa95bef6abb4dd69779c3846087ee6e9285d0b2d4b

https://sepolia.etherscan.io/tx/0x8367701e3e7d0fac138f7e20bface4710d6a831e4c1b809d7fcba2fa5b2ed452

This machine can sign only as the treasury. `0x63dAE8be19A773493a11AEd1996899Ec6cd55F45` has not minted. Token 2 is that key's print. Value is 0. `date(1)` has already been mined. After the mint is in a block, `date(2)` shutters it. The dated plate reads the minter's count in the block before the date block.

Mint `mint(bytes32[])` from `0x63dAE8be19A773493a11AEd1996899Ec6cd55F45`:

`0xb77a147b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000021acc0a9178455c62bde6d9e5e788ac9ef51b7906f721329a05d06c1d1625ad13734663a3e48a67de2408a70bf4244a28281a1df003bf3bbb6f627e46363e5714`

Then `date(2)`:

`0x60c757ba0000000000000000000000000000000000000000000000000000000000000002`

## Previous test hall

`0xd6d50260f93e3f5fDB1D8f71378BC6707e009BE5` is the previous test hall, and the pre-fix example. Same bytecode shape, price 0, same treasury. Its tiny root was `0x1d0ca95df59b56df48da6b95332d774d49f31e97718fb0dd4a03b8976f358bd3`. Print 1 there stays parked. The Walk no longer points here.

- Deploy tx: `0x39a2291607385224bee01e39938d47f14c6e2fd6374bcbb4b589f9a2fe48ec77`
- Block: 11900379
- Gas used: 19252085
- Status: success

https://sepolia.etherscan.io/address/0xd6d50260f93e3f5fDB1D8f71378BC6707e009BE5

https://sepolia.etherscan.io/tx/0x39a2291607385224bee01e39938d47f14c6e2fd6374bcbb4b589f9a2fe48ec77

## Earlier test hall

`0x32362677bd7C4C911aB59b19ECCe3bf5943E8A29` is an earlier test hall. Same bytecode shape, price 0, same treasury. Its tiny root was `0x2207bfd56870ed440c4c36df8b3c1d99c72d31004d4b37f434957d97a672ce38`. The Walk no longer points here.

- Deploy tx: `0x97ab59ab8f76837c02aecd5279410c3e675ce32b21e9f613b62e9a5e37ad320f`
- Block: 11899829
- Gas used: 19252073
- Status: success

https://sepolia.etherscan.io/address/0x32362677bd7C4C911aB59b19ECCe3bf5943E8A29

https://sepolia.etherscan.io/tx/0x97ab59ab8f76837c02aecd5279410c3e675ce32b21e9f613b62e9a5e37ad320f

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

Both are on the earlier test halls' roots. The treasury is also on this hall. A stranger is any address not on that hall's root. The vault does not need a proof. Mainnet walker proofs do not apply to these test roots.

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

Creates that ran out of gas and left no code.

- `0xe6B178E9ad34A6f91D3C02a8F8A0726BA62ea910` tx `0xb64e5a996aaea8e2ffa79290555ef9563865478fa1cbca3c4be9235632d05c24`
- `0x7cb7922C4136327990519D962c49bd967BF7A3d8` tx `0x9d942d27bb48e5f7486a82c4addb9537bb401028bcb0a31ab369a0e4e0a39f55`
- `0x2602d9C92bdc08861240524bA39fe8c8Ca4CB15c` tx `0x0fa2fdaec1274a1551df2ef2f1317842ae3c66074c41e0d2ab3d4cc44aa4a1dc`
- `0xFA4bC74f5d16a0c7DCe6AC065019337DaFBBE377` tx `0xcf4b42193e4b5d99074c25a0249e94f13f632e386a412df8c659f0caa307f487`

A mint at nonce 20 also ran out of gas and did not create print 1: `0x088b0c45740912fb051eef7f4dc62a77073a656201f878e1ddc934c31d6fbfe5`. The mint above is the one that landed.
