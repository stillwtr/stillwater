// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Test} from "forge-std/Test.sol";
import {Stillwater} from "../src/Stillwater.sol";
import {SepoliaRoot} from "../script/SepoliaRoot.sol";

/// Same checks as the fork, on the temporary Sepolia root.
contract SepoliaRootTest is Test {
    bytes32 internal constant WALKER = 0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3;
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

    function test_twoKeysMintBuyAndList() public {
        bytes32 root = SepoliaRoot.root();
        assertTrue(root != WALKER);
        Stillwater still = new Stillwater(root, SepoliaRoot.TREASURY, "Stillwater", "STILL", "https://walk.test/");
        assertEq(still.price(), 0);

        bytes32[] memory proofA = SepoliaRoot.proofTreasury();
        bytes32[] memory proofB = SepoliaRoot.proofOther();
        vm.prank(SepoliaRoot.TREASURY);
        still.mint(proofA);
        vm.prank(SepoliaRoot.OTHER);
        still.mint(proofB);

        vm.prank(STRANGER);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint(proofA);

        vm.prank(SepoliaRoot.TREASURY);
        still.date(1);
        vm.prank(SepoliaRoot.TREASURY);
        vm.expectRevert(Stillwater.AlreadyDated.selector);
        still.date(1);

        vm.prank(SepoliaRoot.OTHER);
        still.setMailbox(2, SepoliaRoot.TREASURY);
        assertEq(still.ownerOf(2), SepoliaRoot.TREASURY);
        assertEq(still.titleHolder(2), SepoliaRoot.OTHER);
        (bool accepted,) = address(still).call(abi.encodeWithSignature("accept(uint256)", 2));
        assertFalse(accepted);

        vm.prank(SepoliaRoot.TREASURY);
        still.list(1, 0.2 ether);
        assertEq(still.listedPrice(1), 0.2 ether);

        vm.prank(SepoliaRoot.OTHER);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.list(2, 0.2 ether);

        vm.prank(SepoliaRoot.OTHER);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(SepoliaRoot.TREASURY, SepoliaRoot.OTHER, 2);

        vm.deal(STRANGER, 1 ether);
        vm.prank(STRANGER);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.buy{value: 0.2 ether}(1, proofA);

        vm.deal(SepoliaRoot.OTHER, 1 ether);
        vm.prank(SepoliaRoot.OTHER);
        still.buy{value: 0.2 ether}(1, proofB);
        assertEq(still.ownerOf(1), SepoliaRoot.OTHER);
        assertEq(still.titleHolder(1), SepoliaRoot.OTHER);

        vm.prank(SepoliaRoot.TREASURY);
        still.transferFrom(SepoliaRoot.TREASURY, SepoliaRoot.OTHER, 2);
        assertEq(still.ownerOf(2), SepoliaRoot.OTHER);
        assertEq(still.mailboxOf(2), address(0));
    }

    function test_threeKeyRootMatchesVector() public {
        bytes32 root = SepoliaRoot.root3(SepoliaRoot.TREASURY, SepoliaRoot.OTHER, VAULT);
        assertEq(root, 0x7414d6e27ed0c9b75507a436d74b7ccb5fc446caf569cd0814de9b3a0aa787d7);
        assertTrue(root != WALKER);
        assertTrue(SepoliaRoot.TINY != WALKER);
        Stillwater still = new Stillwater(root, SepoliaRoot.TREASURY, "Stillwater", "STILL", "https://walk.test/");
        bytes32[] memory proof = SepoliaRoot.proofOf(SepoliaRoot.TREASURY, SepoliaRoot.TREASURY, SepoliaRoot.OTHER, VAULT);
        vm.prank(SepoliaRoot.TREASURY);
        still.mint(proof);
        assertEq(still.ownerOf(1), SepoliaRoot.TREASURY);
        assertEq(still.price(), 0);
    }
}
