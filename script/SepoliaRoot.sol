// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

/// Temporary Sepolia list. Three keys. Not the walker root.
library SepoliaRoot {
    address internal constant TREASURY = 0x08d97e624214f4Ca5283b47C11030AB71Bc7304D;
    address internal constant KEY1 = 0xd934CC70B1b06256581527a534285f5bd6A7eDc7;
    address internal constant SPARE = 0x00000000000000000000000000000000000A11cE;

    function leaf(address key) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(key))));
    }

    function pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    /// Sorted spare, treasury, KEY1. The last leaf is lifted.
    function root() internal pure returns (bytes32) {
        return pair(pair(leaf(SPARE), leaf(TREASURY)), leaf(KEY1));
    }

    function proofTreasury() internal pure returns (bytes32[] memory proof) {
        proof = new bytes32[](2);
        proof[0] = leaf(SPARE);
        proof[1] = leaf(KEY1);
    }
}
