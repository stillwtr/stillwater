// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Stillwater} from "../src/Stillwater.sol";

/// Deploys the walker root. The 22895 list stays in its own file test.
contract SnapshotWalkersTest is Test {
    function _leaf(address key) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(key))));
    }

    function _pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function _rootOf(address[] memory keys) internal pure returns (bytes32) {
        uint256 n = keys.length;
        bytes32[] memory level = new bytes32[](n);
        for (uint256 i = 0; i < n; i++) {
            level[i] = _leaf(keys[i]);
        }
        while (n > 1) {
            uint256 m = (n + 1) / 2;
            bytes32[] memory next = new bytes32[](m);
            uint256 j;
            for (uint256 i = 0; i < n; i += 2) {
                if (i + 1 == n) next[j] = level[i];
                else next[j] = _pair(level[i], level[i + 1]);
                j++;
            }
            level = next;
            n = m;
        }
        return level[0];
    }

    function _word(string memory file) internal pure returns (bytes32) {
        bytes memory raw = bytes(file);
        bytes memory word = new bytes(66);
        for (uint256 i = 0; i < 66; i++) {
            word[i] = raw[i];
        }
        return vm.parseBytes32(string(word));
    }

    function _wired(bytes32 root_) internal returns (Stillwater) {
        return new Stillwater(root_, address(0xA11CE), "Stillwater", "STILL", "https://walk.test/");
    }

    function test_walkerListMatchesRoot() public view {
        string memory keysJson = vm.readFile("snapshot/allowlist-walkers.json");
        string[] memory hexes = vm.parseJsonStringArray(keysJson, "$");
        address[] memory keys = new address[](hexes.length);
        for (uint256 i = 0; i < hexes.length; i++) {
            keys[i] = vm.parseAddress(hexes[i]);
            if (i > 0) assertGt(uint160(keys[i]), uint160(keys[i - 1]), "unsorted");
        }
        bytes32 root = _word(vm.readFile("snapshot/root-walkers.txt"));
        assertEq(root, 0xbe0d924b59dbc07be545915c0d134d2fb2d270559d2f00320411cffee789183c);
        assertEq(root, _rootOf(keys), "root");
    }

    function test_walkerRootDeploy() public {
        bytes32 walker = 0xbe0d924b59dbc07be545915c0d134d2fb2d270559d2f00320411cffee789183c;
        assertEq(_word(vm.readFile("snapshot/root-walkers.txt")), walker);
        string memory picked = vm.readFile("snapshot/mint-check-walkers.json");
        address a = vm.parseJsonAddress(picked, ".a");
        address quiet = vm.parseJsonAddress(picked, ".nonce0");
        address b = vm.parseJsonAddress(vm.readFile("snapshot/allowlist-walkers.json"), "$[1]");
        bytes32[] memory proofA = vm.parseJsonBytes32Array(picked, ".proofA");

        vm.chainId(1);
        Stillwater still = _wired(walker);
        assertEq(still.merkleRoot(), walker);
        assertEq(still.treasury(), address(0xA11CE));
        assertEq(still.owner(), address(0xA11CE));
        assertEq(still.name(), "Stillwater");
        assertEq(still.symbol(), "STILL");
        assertEq(still.price(), 0.00420 ether);
        uint256 cost = still.price();
        address vault = address(0xF00D);
        vm.deal(a, 1 ether);
        vm.deal(b, 1 ether);
        vm.deal(quiet, 1 ether);
        vm.deal(vault, 1 ether);

        vm.prank(a);
        still.mint{value: cost}(proofA);
        assertEq(still.ownerOf(1), a);
        assertEq(still.minter(1), a);

        vm.prank(quiet);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint{value: cost}(proofA);

        vm.prank(b);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint{value: cost}(proofA);

        vm.prank(a);
        still.date(1);
        assertEq(still.datedBy(1), a);
        assertEq(still.datedBlock(1), block.number);
        vm.prank(a);
        vm.expectRevert(Stillwater.AlreadyDated.selector);
        still.date(1);

        vm.prank(a);
        still.setMailbox(1, vault);
        assertEq(still.ownerOf(1), vault);
        assertEq(still.titleHolder(1), a);
        vm.prank(a);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(vault, a, 1);
        vm.prank(a);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.date(1);
        vm.prank(vault);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(vault, b, 1);
        vm.prank(vault);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.setMailbox(1, b);
        vm.prank(vault);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint{value: cost}(proofA);
        vm.prank(vault);
        still.transferFrom(vault, a, 1);
        assertEq(still.ownerOf(1), a);

        assertEq(still.merkleRoot(), walker);
        (bool changed,) = address(still).call(abi.encodeWithSignature("setMerkleRoot(bytes32)", bytes32(uint256(1))));
        assertFalse(changed);
        (bool second,) = address(still).call(abi.encodeWithSignature("root()"));
        assertFalse(second);
        assertEq(still.merkleRoot(), walker);

        vm.chainId(31337);
        Stillwater anvil = _wired(walker);
        assertEq(anvil.price(), 0);
        assertEq(anvil.merkleRoot(), walker);
    }
}
