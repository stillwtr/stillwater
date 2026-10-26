# Red team

These are the moves the contract refuses. The named test is the one that says so. Nothing here is a recipe. `forge test` runs them.

## The ETH

A stranger calling `withdraw` is refused. `test_proceedsOnlyTreasury` expects `WithdrawFailed`. A receiver that calls `withdraw` again during the payout is stopped by the reentrancy guard. Mint payment stays in the contract until `treasury` pulls it. `treasury` is set in the constructor and has no setter. The constructor owner cannot transfer or renounce. `test_ownerCannotTransferOrRenounce`.

## The print

A stranger calling `transferFrom` is refused. Approvals revert, so a stranger is not an operator. `test_strangerTransferReverts`, `test_approvalsOff`, and `test_approvalsStillOff`. There is no trusted forwarder. `test_noForwarderConstants`.

A print moves only by mint, by buy, by `setMailbox`, or by the vault sending it home. `setMailbox` names a vault and moves the print in one call. Title cannot pull. `test_titleCannotPull`. The vault sends it home, and only home. `test_mailboxOnlyToTitle`, `test_hostileMailboxCannotSell`, and `test_mailboxRoundTripAndStranger`. A plain send reverts. `test_titleCannotGiveThePrintAway` and `test_titleCannotPassByPlainSend`. A bad vault can freeze the print or return it. `test_typoParkIsPermanent`.

## Buy

`buy` takes a proof. The buyer has to be in the tree. A stranger's proof does not travel with the print. `test_strangerBuyReverts`. A tree key buys with their own proof and becomes title. `test_treeKeyBuyBecomesTitle`. Buying your own listing reverts. `test_selfBuyReverts`. Paying short reverts, and paying over reverts. `test_shortPaymentReverts` and `test_overPaymentReverts`. A parked print cannot be bought. `test_buyWhileParkedReverts`.

## List

The caller has to be title and holder. A vault cannot list the parked print. Title cannot list it while it is parked. `test_vaultCannotListParkedPrint` and `test_titleCannotListWhileParked`. Someone holding a parked print can still list a print they hold as title. `test_holderOfParkedPrintListsTheirOwn`. A stranger's list reverts. `test_strangerListReverts`. Parking clears the price. Sending the print home does not put the price back. `test_parkClearsListAndUnparkDoesNotRestore` and `test_hallTransferClearsListAndReturnDoesNotRestore`.

## Date

`date` takes a token id and nothing else. `test_dateHasNoNonceArgument` and `test_dateOnce`. A second `date` does not overwrite the block. `test_dateTwiceReverts` and `testFuzz_dateNotOverwritten`. Title may date while the vault holds the print. The vault may date while it holds the print. The first signature wins. `test_titleDatesWhileVaultHolds`, `test_vaultDatesWhileItHolds`, and `test_strangerCannotDateWhileVaultHolds`.

## The picture

`setBrush` stores one address, once. `tokenURI` does not call it. image and animation_url follow `walkBase`. `test_setBrushOnce`. `walkBase` has no setter. `test_walkBaseHasNoSetter`. `setNonceProbe` is once and does not move a print. It is left unset. `test_setNonceProbeOnce`. A dated plate does not call the probe. `test_datedPlateIgnoresProbe`.

## Resale

`buy` clears the price, moves the print, then pays the seller. A contract seller that tries to `list` the sold print, move another print, or `buy` again during that payment does not get a second sale. `test_reentrancyOnBuyDoesNotResell` and `test_listThenBuy`.

## The vault

A vault that holds a print may mint. It does not rename the mailbox or set the brush. `test_vaultMayMintWhileHolding`, `test_mailboxCannotMintOrSetBrush`, and `test_parkOnlyFromTitleOwner`. Two prints may sit in one vault and keep each minter. `test_twoMintsDifferentMaps`. `invariant_mailboxNeverMints` keeps trying from addresses that are not in the tree.
