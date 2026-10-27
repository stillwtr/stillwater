# Red team

These are the moves the contract refuses. The name after each one is the test that shows it. Nothing here is a way to do the move. `forge test` runs the tests.

## The ETH

A stranger calling `withdraw` is refused. `test_proceedsOnlyTreasury` expects `WithdrawFailed`. If the receiver calls `withdraw` again while it is being paid, the reentrancy guard stops that call. Mint payment stays in the contract until `treasury` withdraws it. `treasury` is set in the constructor and has no setter. The constructor owner cannot transfer that role or give it up. `test_ownerCannotTransferOrRenounce`.

## The print

A stranger calling `transferFrom` is refused. Approvals revert, so a stranger is not an approved operator. `test_strangerTransferReverts`, `test_approvalsOff`, and `test_approvalsStillOff`. There is no trusted forwarder. `test_noForwarderConstants`.

A print moves only by mint, by buy, by `setMailbox`, or by the vault sending it home. `setMailbox` names a vault and moves the print in one call. The title holder cannot pull it back. `test_titleCannotPull`. The vault sends it home, and only home. `test_mailboxOnlyToTitle`, `test_hostileMailboxCannotSell`, and `test_mailboxRoundTripAndStranger`. A plain send reverts. `test_titleCannotGiveThePrintAway` and `test_titleCannotPassByPlainSend`. A bad vault can freeze the print or return it. `test_typoParkIsPermanent`.

## Buy

`buy` takes a proof. The buyer has to be in the tree. A stranger's proof does not travel with the print. `test_strangerBuyReverts`. A key on the list buys with their own proof and becomes the title holder. `test_treeKeyBuyBecomesTitle`. Buying your own listing reverts. `test_selfBuyReverts`. Paying too little reverts, and paying too much reverts. `test_shortPaymentReverts` and `test_overPaymentReverts`. A parked print cannot be bought. `test_buyWhileParkedReverts`.

## List

The caller has to be both the title holder and the current holder. A vault cannot list the parked print. The title holder cannot list it while it is parked. `test_vaultCannotListParkedPrint` and `test_titleCannotListWhileParked`. Someone who holds one parked print can still list a different print they hold as title. `test_holderOfParkedPrintListsTheirOwn`. A stranger's list reverts. `test_strangerListReverts`. Parking clears the price. Sending the print home does not put the price back. `test_parkClearsListAndUnparkDoesNotRestore` and `test_hallTransferClearsListAndReturnDoesNotRestore`.

## Date

`date` takes a token id and nothing else. `test_dateHasNoNonceArgument` and `test_dateOnce`. A second `date` does not overwrite the block. `test_dateTwiceReverts` and `testFuzz_dateNotOverwritten`. The title holder may date while the vault holds the print. The vault may date while it holds the print. The first one wins. `test_titleDatesWhileVaultHolds`, `test_vaultDatesWhileItHolds`, and `test_strangerCannotDateWhileVaultHolds`.

## The picture

`setBrush` stores one address, once. `tokenURI` does not call it. `image` and `animation_url` follow `walkBase`. `test_setBrushOnce`. `walkBase` has no setter. `test_walkBaseHasNoSetter`. `setNonceProbe` can be called once and does not move a print. It is still unset. `test_setNonceProbeOnce`. A dated plate does not call the probe. `test_datedPlateIgnoresProbe`.

## Resale

`buy` clears the price, moves the print, then pays the seller. A contract seller that tries to `list` the sold print, move another print, or `buy` again during that payment does not get a second sale. `test_reentrancyOnBuyDoesNotResell` and `test_listThenBuy`.

## The vault

A vault that holds a print may mint. It cannot rename the mailbox or set the brush. `test_vaultMayMintWhileHolding`, `test_mailboxCannotMintOrSetBrush`, and `test_parkOnlyFromTitleOwner`. Two prints may sit in one vault and keep each minter. `test_twoMintsDifferentMaps`. `invariant_mailboxNeverMints` keeps trying from addresses that are not in the tree.
