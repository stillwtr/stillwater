# Sepolia

Chain id 11155111. Price is 0. The Walk and the mint page use this hall when the link says `chain=sepolia`.

The root is three test keys. A mainnet proof will not mint here.

- Hall: `0x81236B313E25DfCb0D70AdA9A8D5B9f1970399b4`
- Deploy: `0x58c51a7aa9cdfda2f5edb1f2a3a764be6cf4b6c198d357215886c8f9041fcaff`, block 11916797
- Treasury and owner: `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- Root: `0xa58168e3afcda5f29139c04aa6b55317cabf96c8d548ec27d0528170f96c6ea9`
- walkBase: `https://stillwtr.github.io/stillwater/art/walk.html`
- Compiler: solc 0.8.37, optimizer 200 runs, viaIR off

https://sepolia.etherscan.io/address/0x81236B313E25DfCb0D70AdA9A8D5B9f1970399b4

The three keys, sorted:

- `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- `0x63dAE8be19A773493a11AEd1996899Ec6cd55F45`
- `0xd934CC70B1b06256581527a534285f5bd6A7eDc7`

Token 1 was minted and dated by the treasury. The dated plate reads the sender's transaction count in the block before the date.

- Mint: `0x1d2374aeea44617d1544ccf9f10cc80261f53ddf331e46809a6bfe54357d5a01`, block 11916837
- Date: `0x10e03752e36e57c2fea52c302901a631b17d86530ed1e31148a3921ea932ab20`, block 11916846
- Seed: `0xc940268f5cbfab967dc0a3b1944dd81cdcc41409dab3ade00c648cdabe7ba85a`
- Palette: Ice

https://sepolia.etherscan.io/tx/0x1d2374aeea44617d1544ccf9f10cc80261f53ddf331e46809a6bfe54357d5a01

https://sepolia.etherscan.io/tx/0x10e03752e36e57c2fea52c302901a631b17d86530ed1e31148a3921ea932ab20

## Brush

StillwaterRenderer. Its constructor argument is this hall. The page is stored in the constructor. tokenURI still follows walkBase and does not call the brush. nonceProbe was left unset. setBrush can be called once. It has been called.

- Brush: `0x4d425F1FcC82aA22405A9D35C0e7311656e6CB6E`
- Deploy: `0x3004ef128d52f4b747b1755224c029097ab8f543c392e9a16625efe03a4a29d4`, block 11925031
- setBrush: `0x116b56d40f2f28fd97ab23fe834ec287a3daa4a36a2e6cd6937bdd646ace653a`, block 11925035

https://sepolia.etherscan.io/address/0x4d425F1FcC82aA22405A9D35C0e7311656e6CB6E

The hall and the brush are verified on Etherscan, with the compiler settings above. If this repository has moved on, the verified source on Etherscan is the bytecode match.

One create, gas limit 28 million, left no code. The deploy above is the one that landed.

## Older halls

These are earlier deploys. The pages use the hall at the top. Same treasury. Price 0. They are still on Sepolia.

| Address | What it was |
| --- | --- |
| `0x6B9264A5d731EDE4F65b91add5Ec7e8aE8ceC465` | The previous test hall. Same three-key root. |
| `0xd6d50260f93e3f5fDB1D8f71378BC6707e009BE5` | An earlier hall. Print 1 there stays parked. |
| `0x32362677bd7C4C911aB59b19ECCe3bf5943E8A29` | An earlier test hall. |
| `0xc81148AA098723d4CbfaAd5517032D4fdFd87662` | An earlier Walk hall. |
| `0x8DE89DFe42d1d5F5FD23910B98f8f66239bD5124` | An earlier deploy. Nothing was minted. |
| `0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34` | Older bytecode. No list, buy, or cancel. walkBase was `https://walk.test/`. |

An address with no code is not a hall.
