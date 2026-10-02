# Sepolia

Live deploy of the same `Stillwater.sol`. The constructor argument on this network is a temporary three-key root. The walker root was not written into the source. `script/ForkProve.s.sol` still passes the walker root. `script/Sepolia.s.sol` passes the temporary root. Price is 0 because the chain id is not 1.

Nothing here was committed. `.env` was not modified.

- Chain id: 11155111
- Stillwater: `0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34`
- Deploy tx: `0x471974ed88c3a1ba5c6ddb44484f9c1c8cf683d04178ed5d76aabfe66f600eb2`
- Block: 11811600
- Status: success
- Gas used: 2543581
- Deployer / treasury / owner: `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- Temporary root: `0x5f9e4e542dae379422b58b3c301884cce31ab11d5407be39a7509f5b9725e47f`
- Walker root at the time of this deploy, not used here: `0xbe0d924b59dbc07be545915c0d134d2fb2d270559d2f00320411cffee789183c`
- The hall root was cleaned after this deploy. Sepolia was not redeployed. The current root is in `snapshot/root-walkers.txt`.
- Price read back: 0
- Name / symbol: Stillwater / STILL
- walkBase: `https://walk.test/`
- solc: 0.8.37
- viaIR: false
- Token 1 is minted. `datedBlock` is 11811822. Owner and title are the deployer. `mailboxOf(1)` is zero because the vault sent the print home.
- Contract: https://sepolia.etherscan.io/address/0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34
- Transaction: https://sepolia.etherscan.io/tx/0x471974ed88c3a1ba5c6ddb44484f9c1c8cf683d04178ed5d76aabfe66f600eb2

The receipt is in `broadcast/Sepolia.s.sol/11155111/run-latest.json`. That file does not contain the private key.

## Temporary list

Three leaves. Sorted spare, then treasury, then KEY1. The last leaf is lifted.

- Spare: `0x00000000000000000000000000000000000A11cE`
- Treasury (the key you control): `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- KEY1: `0xd934CC70B1b06256581527a534285f5bd6A7eDc7`

Your mint proof is these two words, in this order:

1. `0x01cca2c51782e5d5336ee6e166d2d6d5869cd779f508a19cf29878c8994a61f1`
2. `0x734663a3e48a67de2408a70bf4244a28281a1df003bf3bbb6f627e46363e5714`

The 14-word walker proof from `snapshot/fork-key1.json` does not match this root.

## Mined

These receipts are on Sepolia. Nothing here was rebroadcast. Title `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`. Vault `0x51AB6D466422e9Fca8FaD9EF21a6e43F9F083fDA`. Etherscan lists 0 failed transactions for the title, so there is no mined hash for a second `date` or for a title `transferFrom`.

- Deploy: `0x471974ed88c3a1ba5c6ddb44484f9c1c8cf683d04178ed5d76aabfe66f600eb2` block 11811600
- Mint token 1, value 0: `0xb9044924de83591154227b48f2bd1977758de7d777e865caa6adaf597a1fe991` block 11811805
- `date(1)` once: `0x3ff6a134734763e0ba44f76699f10451ea7463fa2baa8e35141857628a180634` block 11811822. That block is `datedBlock(1)`.
- Park, `setMailbox(1, vault)` sent to the contract: `0x443554e00262ce174d08754c254270982f0141af35b8b130de9c2a395d4a7c74` block 11811865
- Vault `transferFrom(vault, title, 1)`: `0xbd13d0ac40117bcbdecfcc0ec988adf5a3143eeb872fcc8d08dd12e134391326` block 11811894
- Park again, same `setMailbox(1, vault)` to the contract: `0x6117b455fcafdf2cef793f7e5d8328b3c9e7e91fc53c140903904d363f589dc9` block 11812043
- Vault `transferFrom(vault, title, 1)` again: `0x9f0b857838f4ed20a29a2a9939413dea4af004402c7021b2543e25294d5a2a51` block 11812054

`0x0ce5c1616030c0b5a3921c472e6d63b4e031a083644306da4f49ffc480d4ea64` carried `setMailbox` calldata to the vault address itself. That call did not reach this contract.

Reads after those receipts: `ownerOf(1)`, `titleHolder(1)`, `minter(1)`, and `datedBy(1)` are the title. `datedBlock(1)` is 11811822. `mailboxOf(1)` is the zero address. `price` is 0.

## Verify

Sourcify reports an exact match of the creation code and the runtime code for `0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34` on chain 11155111. Compiler `0.8.37+commit.f401782d`, optimizer 200 runs, viaIR off, EVM osaka. The match id is 54166669.

https://repo.sourcify.dev/contracts/full_match/11155111/0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34/

No Etherscan API key is on this machine. Sourcify’s own Etherscan pass returned a rate limit, so Etherscan is not the record. The command below uses the same compiler settings. It does not flatten, and it does not pass `--via-ir`.

```bash
cd /home/copper/Documents/stillwater
forge verify-contract \
  --chain 11155111 \
  --compiler-version 0.8.37+commit.f401782d \
  --num-of-optimizations 200 \
  --constructor-args 0x5f9e4e542dae379422b58b3c301884cce31ab11d5407be39a7509f5b9725e47f00000000000000000000000008d97e624214f4ca5283b47c11030ab71bc7304d00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000a5374696c6c77617465720000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055354494c4c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001268747470733a2f2f77616c6b2e746573742f0000000000000000000000000000 \
  0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34 \
  src/Stillwater.sol:Stillwater
```

Constructor arguments, in order: root `0x5f9e4e542dae379422b58b3c301884cce31ab11d5407be39a7509f5b9725e47f`, treasury `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`, name `Stillwater`, symbol `STILL`, walk base `https://walk.test/`.

## Checks on the deployed bytecode

A fork of Sepolia at block 11811606 ran `script/SepoliaFork.s.sol` against `0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34`. It did not broadcast, so the live contract is still unminted.

- Treasury mint with the two-word proof. Token 1 owner and minter are the treasury.
- Stranger `0x000000000000000000000000000000000000bEEF` used that proof and reverted `BadProof`.
- `date(1)` once. A second `date(1)` reverted `AlreadyDated`.
- `setMailbox(1, 0x000000000000000000000000000000000000F00D)` on the fork. Owner became the vault. Title stayed the treasury.
- Title `transferFrom` back to itself reverted `Hook`.
- Vault `transferFrom` to the stranger reverted `Hook`.
- Vault `transferFrom` back to the treasury succeeded.
- `merkleRoot` was still the temporary root.

`SEPOLIA_FORK_OK`.

Separate `eth_call`s against the live contract, also with no broadcast: a mint from the treasury returns success, and a mint from the stranger reverts `BadProof` (`0x7ca55c77`).

## What you click

Use Sepolia in the wallet. This contract does not exist on mainnet. Amount is 0 ETH. Sending ETH makes `mint` revert `BadPrice`.

The contract is not verified, so Etherscan has no Write button. In MetaMask: Send, To = the contract, Amount = 0, Hex data = the calldata below. Hex data is under the transaction details. If you do not see it, turn on Settings → Advanced → Show hex data.

### 1. Mint

Calldata:

```
0xb77a147b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000201cca2c51782e5d5336ee6e166d2d6d5869cd779f508a19cf29878c8994a61f1734663a3e48a67de2408a70bf4244a28281a1df003bf3bbb6f627e46363e5714
```

Or, from `/home/copper/Documents/stillwater`, with the key already in `.env`:

```bash
set -a
source .env
set +a
STILL=0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34
cast send $STILL "mint(bytes32[])" \
  "[0x01cca2c51782e5d5336ee6e166d2d6d5869cd779f508a19cf29878c8994a61f1,0x734663a3e48a67de2408a70bf4244a28281a1df003bf3bbb6f627e46363e5714]" \
  --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY"
```

Then:

```bash
cast call $STILL "ownerOf(uint256)(address)" 1 --rpc-url "$SEPOLIA_RPC_URL"
```

That address should be `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`.

### 2. Date once

Calldata:

```
0x60c757ba0000000000000000000000000000000000000000000000000000000000000001
```

```bash
cast send $STILL "date(uint256)" 1 --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY"
```

A second date reverts `AlreadyDated` (`0x9afab451`).

### 3. Park

Pick a second account you already control. MetaMask can add one from the account menu. Copy its address. That address is the vault.

Do not park to your own address. Do not park to `0x0000000000000000000000000000000000000000`. Do not park to `0x000000000000000000000000000000000000F00D` on this live contract. You cannot sign for that address, and the title cannot pull the print back.

```bash
VAULT=0xYourSecondAccount
cast calldata "setMailbox(uint256,address)" 1 $VAULT
cast send $STILL "setMailbox(uint256,address)" 1 $VAULT \
  --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY"
```

Paste the `cast calldata` output into MetaMask if you want the click instead of `cast send`. After it confirms:

```bash
cast call $STILL "ownerOf(uint256)(address)" 1 --rpc-url "$SEPOLIA_RPC_URL"
cast call $STILL "titleHolder(uint256)(address)" 1 --rpc-url "$SEPOLIA_RPC_URL"
```

Owner is the vault. Title is still `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`.

### 4. Title pull fails

This call does not send a transaction:

```bash
cast call $STILL "transferFrom(address,address,uint256)" \
  $VAULT 0x08d97e624214f4Ca5283b47C11030AB71Bc7304D 1 \
  --from 0x08d97e624214f4Ca5283b47C11030AB71Bc7304D --rpc-url "$SEPOLIA_RPC_URL"
```

It reverts `Hook` (`0x8ea23ddf`). Sending it from the title account reverts the same way.

### 5. Unpark

Switch MetaMask to the vault account, or sign with that account's key. The title key cannot do this step.

```bash
cast calldata "transferFrom(address,address,uint256)" \
  $VAULT 0x08d97e624214f4Ca5283b47C11030AB71Bc7304D 1
```

Send that calldata from the vault, amount 0, to the contract. With a key you export yourself:

```bash
cast send $STILL "transferFrom(address,address,uint256)" \
  $VAULT 0x08d97e624214f4Ca5283b47C11030AB71Bc7304D 1 \
  --rpc-url "$SEPOLIA_RPC_URL" --private-key "$VAULT_KEY"
```

No vault key was created or stored for this deploy. After the vault sends it home, owner is the title again.

A transfer from the vault to any address other than the title reverts `Hook`.
