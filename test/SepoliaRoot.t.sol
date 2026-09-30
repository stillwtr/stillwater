// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Test} from "forge-std/Test.sol";
import {Stillwater} from "../src/Stillwater.sol";
import {SepoliaRoot} from "../script/SepoliaRoot.sol";

/// Same checks as the fork, on the temporary Sepolia root.
contract SepoliaRootTest is Test {
    bytes32 internal constant WALKER = 0xbe0d924b59dbc07be545915c0d134d2fb2d270559d2f00320411cffee789183c;
    address internal constant VAULT = 0x000000000000000000000000000000000000F00D;
    address internal constant STRANGER = address(0xBEEF);

    function test_tempRootChecks() public {
        bytes32 root = SepoliaRoot.root();
        assertTrue(root != WALKER);
        Stillwater still = new Stillwater(root, SepoliaRoot.TREASURY, "Stillwater", "STILL", "https://walk.test/");
        assertEq(still.merkleRoot(), root);
        assertEq(still.price(), 0);
        assertEq(still.treasury(), SepoliaRoot.TREASURY);

        bytes32[] memory proof = SepoliaRoot.proofTreasury();
        vm.prank(SepoliaRoot.TREASURY);
        still.mint(proof);
        assertEq(still.ownerOf(1), SepoliaRoot.TREASURY);

        vm.prank(STRANGER);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint(proof);

        vm.prank(SepoliaRoot.TREASURY);
        still.date(1);
        assertEq(still.datedBy(1), SepoliaRoot.TREASURY);
        vm.prank(SepoliaRoot.TREASURY);
        vm.expectRevert(Stillwater.AlreadyDated.selector);
        still.date(1);

        vm.prank(SepoliaRoot.TREASURY);
        still.setMailbox(1, VAULT);
        assertEq(still.ownerOf(1), VAULT);
        assertEq(still.titleHolder(1), SepoliaRoot.TREASURY);

        vm.prank(SepoliaRoot.TREASURY);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(VAULT, SepoliaRoot.TREASURY, 1);

        vm.prank(VAULT);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(VAULT, STRANGER, 1);

        vm.prank(VAULT);
        still.transferFrom(VAULT, SepoliaRoot.TREASURY, 1);
        assertEq(still.ownerOf(1), SepoliaRoot.TREASURY);
        assertEq(still.merkleRoot(), root);
    }
}
