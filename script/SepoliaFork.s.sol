// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Stillwater} from "../src/Stillwater.sol";
import {SepoliaRoot} from "./SepoliaRoot.sol";

/// Fork of live Sepolia. Proves the deployed bytecode against the three-key test root.
/// Does not broadcast. Set STILL to the deployed address.
contract SepoliaFork is Script {
    address internal constant STRANGER = 0x000000000000000000000000000000000000bEEF;
    string internal constant WALK = "https://stillwtr.github.io/stillwater/art/walk.html";

    function run() external {
        require(block.chainid == 11155111, "sepolia fork");
        Stillwater still = Stillwater(vm.envAddress("STILL"));
        address extra = vm.envAddress("SEPOLIA_EXTRA");
        bytes32 root = SepoliaRoot.root3(SepoliaRoot.TREASURY, SepoliaRoot.OTHER, extra);
        require(root == SepoliaRoot.TINY, "tiny");
        require(still.merkleRoot() == root, "merkleRoot");
        require(still.price() == 0, "price");
        require(still.treasury() == SepoliaRoot.TREASURY, "treasury");
        require(still.owner() == SepoliaRoot.TREASURY, "owner");
        require(keccak256(bytes(still.walkBase())) == keccak256(bytes(WALK)), "walk");
        require(still.nonceProbe() == address(0), "probe");

        bytes32[] memory proofA = SepoliaRoot.proofOf(SepoliaRoot.TREASURY, SepoliaRoot.TREASURY, SepoliaRoot.OTHER, extra);
        bytes32[] memory proofB = SepoliaRoot.proofOf(SepoliaRoot.OTHER, SepoliaRoot.TREASURY, SepoliaRoot.OTHER, extra);

        vm.prank(SepoliaRoot.TREASURY);
        still.mint(proofA);
        require(still.ownerOf(1) == SepoliaRoot.TREASURY, "mint A");
        require(still.minter(1) == SepoliaRoot.TREASURY, "minter A");

        vm.prank(SepoliaRoot.OTHER);
        still.mint(proofB);
        require(still.ownerOf(2) == SepoliaRoot.OTHER, "mint B");
        require(still.titleHolder(2) == SepoliaRoot.OTHER, "title B");

        vm.prank(STRANGER);
        _reverts(address(still), abi.encodeCall(Stillwater.mint, (proofA)), Stillwater.BadProof.selector);

        vm.prank(SepoliaRoot.TREASURY);
        still.date(1);
        require(still.datedBy(1) == SepoliaRoot.TREASURY, "dated");
        require(still.datedBlock(1) == block.number, "dated block");
        vm.prank(SepoliaRoot.TREASURY);
        _reverts(address(still), abi.encodeCall(Stillwater.date, (1)), Stillwater.AlreadyDated.selector);

        vm.prank(SepoliaRoot.OTHER);
        still.setMailbox(2, SepoliaRoot.TREASURY);
        require(still.ownerOf(2) == SepoliaRoot.TREASURY, "parked");
        require(still.titleHolder(2) == SepoliaRoot.OTHER, "title stays");
        require(still.mailboxOf(2) == SepoliaRoot.TREASURY, "mailbox");
        (bool accepted,) = address(still).call(abi.encodeWithSignature("accept(uint256)", 2));
        require(!accepted, "accept");

        vm.prank(SepoliaRoot.TREASURY);
        still.list(1, 0.2 ether);
        require(still.listedPrice(1) == 0.2 ether, "listed own");
        require(still.listedPrice(2) == 0, "parked not listed");

        vm.prank(SepoliaRoot.OTHER);
        _reverts(address(still), abi.encodeCall(Stillwater.list, (2, 0.2 ether)), Stillwater.NotTitle.selector);
        vm.prank(SepoliaRoot.TREASURY);
        _reverts(address(still), abi.encodeCall(Stillwater.list, (2, 0.2 ether)), Stillwater.NotTitle.selector);

        vm.prank(SepoliaRoot.OTHER);
        _reverts(
            address(still),
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)", SepoliaRoot.TREASURY, SepoliaRoot.OTHER, 2
            ),
            Stillwater.Hook.selector
        );

        vm.deal(STRANGER, 1 ether);
        vm.prank(STRANGER);
        _revertsValue(
            address(still), abi.encodeCall(Stillwater.buy, (1, proofA)), 0.2 ether, Stillwater.BadProof.selector
        );

        vm.deal(SepoliaRoot.OTHER, 1 ether);
        vm.prank(SepoliaRoot.OTHER);
        still.buy{value: 0.2 ether}(1, proofB);
        require(still.ownerOf(1) == SepoliaRoot.OTHER, "buyer");
        require(still.titleHolder(1) == SepoliaRoot.OTHER, "buyer title");
        require(still.listedPrice(1) == 0, "price cleared");

        vm.prank(SepoliaRoot.TREASURY);
        still.transferFrom(SepoliaRoot.TREASURY, SepoliaRoot.OTHER, 2);
        require(still.ownerOf(2) == SepoliaRoot.OTHER, "home");
        require(still.mailboxOf(2) == address(0), "mailbox cleared");
        require(still.titleHolder(2) == SepoliaRoot.OTHER, "title home");

        console2.log("SEPOLIA_FORK_OK");
        console2.log("block", block.number);
        console2.log("still", address(still));
    }

    function _reverts(address target, bytes memory data, bytes4 sel) internal {
        (bool ok, bytes memory ret) = target.call(data);
        require(!ok, "expected revert");
        require(ret.length >= 4 && bytes4(ret) == sel, "wrong revert");
    }

    function _revertsValue(address target, bytes memory data, uint256 value, bytes4 sel) internal {
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        require(!ok, "expected revert");
        require(ret.length >= 4 && bytes4(ret) == sel, "wrong revert");
    }
}
