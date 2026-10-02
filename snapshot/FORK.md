# Fork

This is the record for “constructor is the real root.” The Stillwater address below exists only on a mainnet fork. The script did not broadcast. Mainnet was not deployed.

- Fork RPC: `https://ethereum-rpc.publicnode.com`
- Fork block: 26087177
- Chain id: 1
- solc: 0.8.37
- viaIR: false
- Script: `script/ForkProve.s.sol`
- Ephemeral Stillwater: `0x5aAdFB43eF8dAF45DD80F4676345b7676f1D70e3`
- Constructor root on this fork: `0xbe0d924b59dbc07be545915c0d134d2fb2d270559d2f00320411cffee789183c`
- The hall was cleaned after this proof. The fork was not run again. The current root is in `snapshot/root-walkers.txt`.
- Treasury: `0x08d97e624214f4Ca5283b47C11030AB71Bc7304D`
- Price on this fork: 0.00420 ether
- Name / symbol: Stillwater / STILL
- walkBase: `https://walk.test/`
- Impersonated walker: `0xd934CC70B1b06256581527a534285f5bd6A7eDc7`
- Proof file: `snapshot/fork-key1.json` (index 18835 of 22200, 14 siblings). `allowlist-walkers.json` was not rewritten.

The script passed that walker root into the constructor. No private key was used. The walker and the treasury were funded on the fork with `vm.deal`, then impersonated.

## Checks

- Walker mint with the proof in `snapshot/fork-key1.json`. Token 1 owner and minter are the walker.
- Treasury is not on the walker list. It minted with that same proof and reverted `BadProof`. The call sent 0.00420 ether, so the revert is the proof check.
- `date(1)` once. `datedBy(1)` is the walker. A second `date(1)` reverted `AlreadyDated`.
- `setMailbox(1, 0x000000000000000000000000000000000000F00D)`. Owner became the vault. Title stayed the walker.
- Title `transferFrom` of the parked print back to itself reverted `Hook`.
- Vault `transferFrom` to the treasury reverted `Hook`.
- Vault `transferFrom` back to the walker succeeded. Owner is the walker again.
- `merkleRoot` was still the walker root after those calls.

`FORK_OK` at block 26087177.
