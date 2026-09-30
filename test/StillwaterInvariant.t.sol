// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Stillwater} from "../src/Stillwater.sol";

contract StillwaterHandler is Test {
    Stillwater public still;
    address public owner = address(0xA11CE);
    address[] public keys;
    bytes32[][] internal proofs;
    mapping(address => uint256) public mints;
    mapping(uint256 => uint256) public dateCount;
    mapping(uint256 => uint256) public firstDated;
    uint256 public rendererSets;
    bool public mailboxMinted;
    bool public dateRewritten;

    constructor() {
        keys.push(address(0xB0B));
        keys.push(address(0xB1B));
        keys.push(address(0xB2B));
        keys.push(address(0xB3B));
        bytes32[4] memory leaves;
        uint256 i;
        for (i = 0; i < 4; i++) {
            leaves[i] = keccak256(bytes.concat(keccak256(abi.encode(keys[i]))));
        }
        bytes32 left = _pair(leaves[0], leaves[1]);
        bytes32 right = _pair(leaves[2], leaves[3]);
        bytes32 root = _pair(left, right);
        still = new Stillwater(root, owner, "Stillwater", "STILL", "https://walk.test/");
        proofs.push(_proof(leaves[1], right));
        proofs.push(_proof(leaves[0], right));
        proofs.push(_proof(leaves[3], left));
        proofs.push(_proof(leaves[2], left));
        vm.deal(address(this), 50 ether);
        for (i = 0; i < 4; i++) vm.deal(keys[i], 5 ether);
        vm.roll(20);
    }

    function keyCount() external view returns (uint256) {
        return keys.length;
    }

    function mint(uint256 pick) external {
        pick = pick % keys.length;
        address key = keys[pick];
        if (still.minted(key)) return;
        vm.prank(key);
        try still.mint{value: still.price()}(proofs[pick]) {
            mints[key] += 1;
        } catch {}
    }

    function date(uint256 pick) external {
        pick = pick % keys.length;
        address key = keys[pick];
        if (!still.minted(key)) return;
        uint256 id = _idOf(key);
        if (id == 0) return;
        uint256 before = still.datedBlock(id);
        vm.prank(key);
        try still.date(id) {
            if (before != 0) dateRewritten = true;
            dateCount[id] += 1;
            if (firstDated[id] == 0) firstDated[id] = still.datedBlock(id);
            else if (still.datedBlock(id) != firstDated[id]) dateRewritten = true;
        } catch {}
    }

    function pokeRenderer(uint160 salt) external {
        address r = address(salt == 0 ? 1 : salt);
        vm.prank(owner);
        try still.setRenderer(r) {
            rendererSets += 1;
        } catch {}
    }

    function mailboxMint(uint256 pick) external {
        address box = address(uint160(0xD000 + (pick % 5)));
        vm.deal(box, 1 ether);
        vm.prank(box);
        try still.mint{value: still.price()}(proofs[pick % keys.length]) {
            mailboxMinted = true;
        } catch {}
    }

    function _idOf(address key) internal view returns (uint256) {
        uint256 id = 1;
        while (id <= still.nextId()) {
            if (still.minter(id) == key) return id;
            id += 1;
        }
        return 0;
    }

    function _pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function _proof(bytes32 sibling, bytes32 side) internal pure returns (bytes32[] memory proof) {
        proof = new bytes32[](2);
        proof[0] = sibling;
        proof[1] = side;
    }
}

contract StillwaterInvariantTest is Test {
    StillwaterHandler internal handler;

    function setUp() public {
        handler = new StillwaterHandler();
        targetContract(address(handler));
    }

    function invariant_mintedAtMostOnce() public view {
        uint256 n = handler.keyCount();
        uint256 i;
        for (i = 0; i < n; i++) {
            assertLe(handler.mints(handler.keys(i)), 1);
        }
    }

    function invariant_datedOnce() public view {
        assertFalse(handler.dateRewritten());
        uint256 id;
        for (id = 1; id <= 4; id++) {
            assertLe(handler.dateCount(id), 1);
            uint256 seen = handler.firstDated(id);
            if (seen != 0) assertEq(handler.still().datedBlock(id), seen);
        }
    }

    function invariant_rendererOnce() public view {
        assertLe(handler.rendererSets(), 1);
        if (handler.rendererSets() == 0) assertEq(handler.still().renderer(), address(0));
        if (handler.rendererSets() == 1) assertTrue(handler.still().renderer() != address(0));
    }

    function invariant_mailboxNeverMints() public view {
        assertFalse(handler.mailboxMinted());
    }
}
