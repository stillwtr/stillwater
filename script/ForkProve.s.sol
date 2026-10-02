// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Stillwater} from "../src/Stillwater.sol";

/// Replays the recorded fork proof. This root is the list from before the hall clean.
contract ForkProve is Script {
    bytes32 internal constant WALKER = 0xbe0d924b59dbc07be545915c0d134d2fb2d270559d2f00320411cffee789183c;
    address internal constant KEY1 = 0xd934CC70B1b06256581527a534285f5bd6A7eDc7;
    address internal constant TREASURY = 0x08d97e624214f4Ca5283b47C11030AB71Bc7304D;
    address internal constant VAULT = 0x000000000000000000000000000000000000F00D;

    function run() external {
        require(block.chainid == 1, "mainnet fork");
        string memory picked = vm.readFile("snapshot/fork-key1.json");
        address key = vm.parseJsonAddress(picked, ".address");
        bytes32 fileRoot = vm.parseJsonBytes32(picked, ".root");
        bytes32[] memory proof = vm.parseJsonBytes32Array(picked, ".proof");
        require(key == KEY1, "key");
        require(fileRoot == WALKER, "root file");

        vm.deal(KEY1, 1 ether);
        vm.deal(TREASURY, 1 ether);
        Stillwater still = new Stillwater(WALKER, TREASURY, "Stillwater", "STILL", "https://walk.test/");
        require(still.merkleRoot() == WALKER, "merkleRoot");
        require(still.price() == 0.00420 ether, "price");
        require(still.treasury() == TREASURY, "treasury");
        uint256 cost = still.price();

        vm.prank(KEY1);
        still.mint{value: cost}(proof);
        require(still.ownerOf(1) == KEY1, "mint");
        require(still.minter(1) == KEY1, "minter");

        vm.prank(TREASURY);
        _reverts(address(still), abi.encodeCall(Stillwater.mint, (proof)), cost, Stillwater.BadProof.selector);

        vm.prank(KEY1);
        still.date(1);
        require(still.datedBy(1) == KEY1, "dated");
        vm.prank(KEY1);
        _reverts(address(still), abi.encodeCall(Stillwater.date, (1)), 0, Stillwater.AlreadyDated.selector);

        vm.prank(KEY1);
        still.setMailbox(1, VAULT);
        require(still.ownerOf(1) == VAULT, "parked");
        require(still.titleHolder(1) == KEY1, "title");

        vm.prank(KEY1);
        _reverts(
            address(still),
            abi.encodeWithSignature("transferFrom(address,address,uint256)", VAULT, KEY1, 1),
            0,
            Stillwater.Hook.selector
        );

        vm.prank(VAULT);
        _reverts(
            address(still),
            abi.encodeWithSignature("transferFrom(address,address,uint256)", VAULT, TREASURY, 1),
            0,
            Stillwater.Hook.selector
        );

        vm.prank(VAULT);
        still.transferFrom(VAULT, KEY1, 1);
        require(still.ownerOf(1) == KEY1, "home");
        require(still.merkleRoot() == WALKER, "root stays");

        console2.log("FORK_OK");
        console2.log("block", block.number);
        console2.log("still", address(still));
    }

    function _reverts(address target, bytes memory data, uint256 value, bytes4 sel) internal {
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        require(!ok, "expected revert");
        require(ret.length >= 4 && bytes4(ret) == sel, "wrong revert");
    }
}
