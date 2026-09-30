// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Stillwater} from "../src/Stillwater.sol";

contract SnapshotJsonPath is Test {
    function test_rootArrayPath() public pure {
        string memory json = "[\"0x0000000000000000000000000000000000000001\"]";
        string[] memory xs = vm.parseJsonStringArray(json, "$");
        assertEq(xs.length, 1);
        assertEq(vm.parseAddress(xs[0]), address(1));
    }

    function test_proofKeyPath() public pure {
        string memory json =
            "{\"0x0000000000000000000000000000000000000001\":[\"0x1111111111111111111111111111111111111111111111111111111111111111\"]}";
        bytes32[] memory p = vm.parseJsonBytes32Array(json, "$['0x0000000000000000000000000000000000000001']");
        assertEq(p.length, 1);
        assertEq(p[0], bytes32(uint256(0x1111111111111111111111111111111111111111111111111111111111111111)));
    }
}

/// One allowlist key mints. The next address, and another key using the first proof, do not.
contract SnapshotTest is Test {
    mapping(address => bool) internal listed;

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

    function test_allowlistMintsAndStrangersDoNot() public {
        string memory keysJson = vm.readFile("snapshot/allowlist.json");
        string[] memory hexes = vm.parseJsonStringArray(keysJson, "$");
        address[] memory keys = new address[](hexes.length);
        for (uint256 i = 0; i < hexes.length; i++) {
            keys[i] = vm.parseAddress(hexes[i]);
            if (i > 0) assertGt(uint160(keys[i]), uint160(keys[i - 1]), "unsorted");
            listed[keys[i]] = true;
        }

        bytes32 root = _word(vm.readFile("snapshot/root.txt"));
        assertEq(root, _rootOf(keys), "root");

        uint256 mid = hexes.length / 2;
        address a = keys[0];
        address b = keys[mid];
        string memory picked = vm.readFile("snapshot/mint-check.json");
        assertEq(vm.parseJsonAddress(picked, ".a"), a);
        assertEq(vm.parseJsonAddress(picked, ".b"), b);
        bytes32[] memory proofA = vm.parseJsonBytes32Array(picked, ".proofA");
        bytes32[] memory proofB = vm.parseJsonBytes32Array(picked, ".proofB");

        address neighbor = address(uint160(a) + 1);
        while (listed[neighbor]) {
            neighbor = address(uint160(neighbor) + 1);
        }

        Stillwater still = new Stillwater(root, address(0xA11CE), "Stillwater", "STILL", "https://walk.test/");
        uint256 cost = still.price();
        vm.deal(a, 1 ether);
        vm.deal(b, 1 ether);
        vm.deal(neighbor, 1 ether);

        vm.prank(a);
        still.mint{value: cost}(proofA);
        assertEq(still.ownerOf(1), a);

        vm.prank(neighbor);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint{value: cost}(proofA);

        vm.prank(b);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint{value: cost}(proofA);

        vm.prank(b);
        still.mint{value: cost}(proofB);
        assertEq(still.ownerOf(2), b);
    }
}
