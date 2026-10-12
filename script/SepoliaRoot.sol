// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

/// Sepolia list. Treasury, plus two keys supplied at deploy.
/// Not the walker root.
library SepoliaRoot {
    address internal constant TREASURY = 0x08d97e624214f4Ca5283b47C11030AB71Bc7304D;
    address internal constant OTHER = 0x51AB6D466422e9Fca8FaD9EF21a6e43F9F083fDA;
    /// Three-key test root. Treasury, 0x63dAE8be19A773493a11AEd1996899Ec6cd55F45,
    /// and 0xd934CC70B1b06256581527a534285f5bd6A7eDc7, sorted ascending.
    bytes32 internal constant TINY = 0xa58168e3afcda5f29139c04aa6b55317cabf96c8d548ec27d0528170f96c6ea9;

    function leaf(address key) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(key))));
    }

    function pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    /// The two leaves, sorted inside the pair.
    function root() internal pure returns (bytes32) {
        return pair(leaf(TREASURY), leaf(OTHER));
    }

    function sorted(address a, address b, address c) internal pure returns (address x, address y, address z) {
        x = a;
        y = b;
        z = c;
        if (uint160(x) > uint160(y)) (x, y) = (y, x);
        if (uint160(y) > uint160(z)) (y, z) = (z, y);
        if (uint160(x) > uint160(y)) (x, y) = (y, x);
    }

    function root3(address a, address b, address c) internal pure returns (bytes32) {
        (address x, address y, address z) = sorted(a, b, c);
        return pair(pair(leaf(x), leaf(y)), leaf(z));
    }

    function proofOf(address who, address a, address b, address c) internal pure returns (bytes32[] memory proof) {
        (address x, address y, address z) = sorted(a, b, c);
        bytes32 left = pair(leaf(x), leaf(y));
        if (who == z) {
            proof = new bytes32[](1);
            proof[0] = left;
            return proof;
        }
        proof = new bytes32[](2);
        proof[0] = who == x ? leaf(y) : leaf(x);
        proof[1] = leaf(z);
    }

    function proofTreasury() internal pure returns (bytes32[] memory proof) {
        proof = new bytes32[](1);
        proof[0] = leaf(OTHER);
    }

    function proofOther() internal pure returns (bytes32[] memory proof) {
        proof = new bytes32[](1);
        proof[0] = leaf(TREASURY);
    }
}
