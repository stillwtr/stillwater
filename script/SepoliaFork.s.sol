// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Stillwater} from "../src/Stillwater.sol";
import {SepoliaRoot} from "./SepoliaRoot.sol";

/// Fork of live Sepolia. Proves the deployed bytecode against the temporary root.
/// Does not broadcast. Set STILL to the deployed address.
contract SepoliaFork is Script {
    address internal constant STRANGER = 0x000000000000000000000000000000000000bEEF;
    address internal constant VAULT = 0x000000000000000000000000000000000000F00D;

    function run() external {
        require(block.chainid == 11155111, "sepolia fork");
        Stillwater still = Stillwater(vm.envAddress("STILL"));
        bytes32 root = SepoliaRoot.root();
        require(still.merkleRoot() == root, "merkleRoot");
        require(still.price() == 0, "price");
        require(still.treasury() == SepoliaRoot.TREASURY, "treasury");
        require(still.owner() == SepoliaRoot.TREASURY, "owner");

        bytes32[] memory proof = SepoliaRoot.proofTreasury();
        vm.prank(SepoliaRoot.TREASURY);
        still.mint(proof);
        require(still.ownerOf(1) == SepoliaRoot.TREASURY, "mint");
        require(still.minter(1) == SepoliaRoot.TREASURY, "minter");

        vm.prank(STRANGER);
        _reverts(address(still), abi.encodeCall(Stillwater.mint, (proof)), Stillwater.BadProof.selector);

        vm.prank(SepoliaRoot.TREASURY);
        still.date(1);
        require(still.datedBy(1) == SepoliaRoot.TREASURY, "dated");
        vm.prank(SepoliaRoot.TREASURY);
        _reverts(address(still), abi.encodeCall(Stillwater.date, (1)), Stillwater.AlreadyDated.selector);

        vm.prank(SepoliaRoot.TREASURY);
        still.setMailbox(1, VAULT);
        require(still.ownerOf(1) == VAULT, "parked");
        require(still.titleHolder(1) == SepoliaRoot.TREASURY, "title");

        vm.prank(SepoliaRoot.TREASURY);
        _reverts(
            address(still),
            abi.encodeWithSignature("transferFrom(address,address,uint256)", VAULT, SepoliaRoot.TREASURY, 1),
            Stillwater.Hook.selector
        );

        vm.prank(VAULT);
        _reverts(
            address(still),
            abi.encodeWithSignature("transferFrom(address,address,uint256)", VAULT, STRANGER, 1),
            Stillwater.Hook.selector
        );

        vm.prank(VAULT);
        still.transferFrom(VAULT, SepoliaRoot.TREASURY, 1);
        require(still.ownerOf(1) == SepoliaRoot.TREASURY, "home");
        require(still.merkleRoot() == root, "root stays");

        console2.log("SEPOLIA_FORK_OK");
        console2.log("block", block.number);
        console2.log("still", address(still));
    }

    function _reverts(address target, bytes memory data, bytes4 sel) internal {
        (bool ok, bytes memory ret) = target.call(data);
        require(!ok, "expected revert");
        require(ret.length >= 4 && bytes4(ret) == sel, "wrong revert");
    }
}
