# Red team

Each row is an attack that must fail. The named test is the one that says so.

Steal the ETH. A stranger calls `withdraw`. `test_proceedsOnlyTreasury` expects `WithdrawFailed`. A receiver that calls `withdraw` again during the payout is stopped by the reentrancy guard. Mint payment stays in the contract until `treasury` pulls it. `treasury` is set in the constructor and has no setter.

Steal the print. A stranger calls `transferFrom`. Approvals revert, so they are not an operator. `test_strangerTransferReverts`, `test_approvalsOff`, and `test_approvalsStillOff`. There is no trusted forwarder. `test_noForwarderConstants`. The title parks with `setMailbox` and the contract moves the print. While the mailbox holds it, the only transfer is mailbox to title, signed by the mailbox. Title cannot pull. `test_mailboxOnlyToTitle`, `test_titleCannotPull`, `test_hostileMailboxCannotSell`, and `test_mailboxRoundTripAndStranger`. `claim(proof)` marks a key with no payment and no print. Mint marks the minter claimed. Title may send only to a claimed key. An unclaimed `to` reverts. A vault cannot send a parked print to a claimed buyer. `test_claimMarksWithoutMint`, `test_minterSendsToClaimedUnminted`, `test_unclaimedToReverts`, `test_vaultCannotSendToClaimedBuyer`, and `test_oneMintPerKeyStillHolds`.

Fake a nonce. `date` takes a token id and nothing else. `test_dateHasNoNonceArgument` calls `date(uint256,uint256)` and expects the call to miss. The stored block is `block.number` from that transaction. A second `date` does not overwrite it. `test_dateTwiceReverts` and `testFuzz_dateNotOverwritten`.

Swap the renderer twice. `setRenderer` requires the slot to be empty and the new address to be nonzero. `test_setRendererOnce` does the second call and a non-owner call. The invariant `invariant_rendererOnce` counts successful sets.

Show open water after the shutter. After `date`, the JSON state is `dated` and `datedBlock` is the stored block. `test_tokenURIOpenThenDated` and `test_dateOnce`. The Walk is told to prefer that storage if a renderer ever disagrees. This contract does not take a nonce from the caller.

The mailbox does not mint, date, set the mailbox, or set the renderer. `test_mailboxCannotMint`, `test_dateWhileParkedReverts`, `test_parkOnlyFromTitleOwner`, and `test_mailboxCannotMintDateOrSetRenderer`. Two prints may sit in one vault and keep the minter's map. `test_twoMintsDifferentMaps`. `invariant_mailboxNeverMints` keeps trying from addresses that are not in the tree.
