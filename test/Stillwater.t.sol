// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Stillwater} from "../src/Stillwater.sol";
import {IStillwaterRenderer} from "../src/IStillwaterRenderer.sol";
contract FakeRenderer is IStillwaterRenderer {
    function render(uint256) external pure returns (string memory) {
        return "data:image/svg+xml,still";
    }

    function renderAnim(uint256) external pure returns (string memory) {
        return "https://walk.test/move";
    }
}

contract ReenterMint {
    Stillwater public still;
    bool public reentered;

    function bind(Stillwater still_) external {
        still = still_;
    }

    function attack() external payable {
        bytes32[] memory empty = new bytes32[](0);
        still.mint{value: msg.value}(empty);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        bytes32[] memory empty = new bytes32[](0);
        try still.mint{value: 0.00420 ether}(empty) {
            reentered = true;
        } catch {}
        return this.onERC721Received.selector;
    }
}

contract ReenterWithdraw {
    Stillwater public still;
    uint256 public calls;

    constructor(Stillwater still_) {
        still = still_;
    }

    function hit() external {
        still.withdraw();
    }

    receive() external payable {
        calls += 1;
        if (calls == 1 && address(still).balance > 0) {
            try still.withdraw() {} catch {}
        }
    }
}

contract StillwaterTest is Test {
    Stillwater internal still;
    address internal treasury = address(0xA11CE);
    address internal alice = address(0xBEEF);
    address internal bob = address(0xCAFE);
    address internal carol = address(0xF00D);
    bytes32[] internal proofAlice;
    bytes32[] internal proofBob;

    function setUp() public {
        bytes32 leafA = _leaf(alice);
        bytes32 leafB = _leaf(bob);
        bytes32 root = _pair(leafA, leafB);
        vm.chainId(1);
        still = new Stillwater(root, treasury, "Stillwater", "STILL", "https://walk.test/");
        proofAlice.push(leafB);
        proofBob.push(leafA);
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
        vm.deal(carol, 1 ether);
        vm.roll(10);
    }

    function test_mintInTree() public {
        assertEq(proofAlice.length, 1);
        assertEq(still.leaf(alice), _leaf(alice));
        assertEq(still.merkleRoot(), _pair(_leaf(alice), proofAlice[0]));
        uint256 id = _mintAs(alice, proofAlice);
        assertEq(id, 1);
        assertEq(still.ownerOf(id), alice);
        assertEq(still.minter(id), alice);
        assertTrue(still.minted(alice));
        assertEq(still.familyOf(alice), _familyName(alice));
    }

    function test_mintOutOfTreeReverts() public {
        uint256 cost = still.price();
        vm.prank(carol);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint{value: cost}(proofAlice);
    }

    function test_secondMintSameKeyReverts() public {
        _mintAs(alice, proofAlice);
        uint256 cost = still.price();
        vm.prank(alice);
        vm.expectRevert(Stillwater.AlreadyMinted.selector);
        still.mint{value: cost}(proofAlice);
    }

    function test_dateOnce() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        still.date(id);
        assertEq(still.datedBlock(id), block.number);
        assertEq(still.datedBy(id), alice);
        string memory json = _json(id);
        assertTrue(_has(json, '"value":"dated"'));
        assertTrue(_has(json, '"datedBlock":10'));
    }

    function test_dateTwiceReverts() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        still.date(id);
        vm.roll(11);
        vm.prank(alice);
        vm.expectRevert(Stillwater.AlreadyDated.selector);
        still.date(id);
        assertEq(still.datedBlock(id), 10);
    }

    function test_nonOwnerCannotDate() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(bob);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.date(id);
    }

    function test_dateHasNoNonceArgument() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        (bool ok,) = address(still).call(abi.encodeWithSignature("date(uint256,uint256)", id, 99));
        assertFalse(ok);
        assertEq(still.datedBlock(id), 0);
    }

    function test_strangerTransferReverts() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(carol);
        vm.expectRevert();
        still.transferFrom(alice, carol, id);
    }

    function test_approvalsOff() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        vm.expectRevert(Stillwater.ApprovalsOff.selector);
        still.approve(carol, id);
    }

    function test_approvalsStillOff() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        vm.expectRevert(Stillwater.ApprovalsOff.selector);
        still.approve(carol, id);
        vm.prank(alice);
        vm.expectRevert(Stillwater.ApprovalsOff.selector);
        still.setApprovalForAll(carol, true);
        assertEq(still.getApproved(id), address(0));
        assertFalse(still.isApprovedForAll(alice, carol));

        vm.prank(alice);
        still.setMailbox(id, carol);
        vm.prank(carol);
        vm.expectRevert(Stillwater.ApprovalsOff.selector);
        still.approve(bob, id);
        vm.prank(carol);
        vm.expectRevert(Stillwater.ApprovalsOff.selector);
        still.setApprovalForAll(bob, true);
        assertFalse(still.isApprovedForAll(carol, bob));
    }

    function test_noForwarderConstants() public view {
        bytes4 trusted = bytes4(keccak256("trustedForwarder()"));
        bytes4 isTrusted = bytes4(keccak256("isTrustedForwarder(address)"));
        bytes memory code = address(still).code;
        assertFalse(_contains(code, abi.encodePacked(trusted)));
        assertFalse(_contains(code, abi.encodePacked(isTrusted)));
        (bool ok,) = address(still).staticcall(abi.encodePacked(trusted));
        assertFalse(ok);
        (ok,) = address(still).staticcall(abi.encodeWithSelector(isTrusted, alice));
        assertFalse(ok);
        (ok,) = address(still).staticcall(abi.encodeWithSignature("_msgSender()"));
        assertFalse(ok);
    }

    function test_twoMintsDifferentMaps() public {
        uint256 a = _mintAs(alice, proofAlice);
        uint256 b = _mintAs(bob, proofBob);
        string memory beforeA = still.tokenURI(a);
        string memory beforeB = still.tokenURI(b);
        assertTrue(keccak256(bytes(beforeA)) != keccak256(bytes(beforeB)));
        vm.prank(alice);
        still.setMailbox(a, carol);
        vm.prank(bob);
        still.setMailbox(b, carol);
        assertEq(still.ownerOf(a), carol);
        assertEq(still.ownerOf(b), carol);
        assertEq(still.mailboxOf(a), carol);
        assertEq(still.mailboxOf(b), carol);
        assertEq(still.minter(a), alice);
        assertEq(still.minter(b), bob);
        assertTrue(still.minter(a) != still.minter(b));
        assertEq(still.titleHolder(a), alice);
        assertEq(still.titleHolder(b), bob);
        assertEq(still.tokenURI(a), beforeA);
        assertEq(still.tokenURI(b), beforeB);
        assertEq(still.familyOf(still.minter(a)), _familyName(alice));
        assertEq(still.familyOf(still.minter(b)), _familyName(bob));
        assertTrue(_has(_json(a), _familyName(alice)));
        assertTrue(_has(_json(b), _familyName(bob)));
    }

    function test_parkOnlyFromTitleOwner() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(carol);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.setMailbox(id, carol);
        vm.prank(bob);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.setMailbox(id, carol);
        vm.prank(alice);
        vm.expectRevert(Stillwater.Hook.selector);
        still.setMailbox(id, address(0));
        vm.prank(alice);
        vm.expectRevert(Stillwater.Hook.selector);
        still.setMailbox(id, alice);
        vm.prank(alice);
        still.setMailbox(id, carol);
        assertEq(still.ownerOf(id), carol);
        assertEq(still.titleHolder(id), alice);
        vm.prank(carol);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.setMailbox(id, bob);
        vm.prank(alice);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.setMailbox(id, bob);
        assertEq(still.mailboxOf(id), carol);
        assertEq(still.ownerOf(id), carol);
    }

    function test_titleCannotPull() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        still.setMailbox(id, carol);
        vm.prank(alice);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(carol, alice, id);
        vm.prank(alice);
        vm.expectRevert(Stillwater.Hook.selector);
        still.safeTransferFrom(carol, alice, id);
        (bool pulled,) = address(still).call(abi.encodeWithSignature("retrieve(uint256)", id));
        assertFalse(pulled);
        assertEq(still.ownerOf(id), carol);
        assertEq(still.titleHolder(id), alice);
    }

    function test_mailboxOnlyToTitle() public {
        uint256 id = _mintAs(alice, proofAlice);
        _mintAs(bob, proofBob);
        address stranger = address(0x1111);
        vm.prank(alice);
        still.setMailbox(id, carol);
        vm.prank(carol);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(carol, stranger, id);
        vm.prank(carol);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(carol, bob, id);
        vm.prank(carol);
        still.transferFrom(carol, alice, id);
        assertEq(still.ownerOf(id), alice);
        assertEq(still.titleHolder(id), alice);
        assertEq(still.mailboxOf(id), address(0));
        vm.prank(alice);
        still.setMailbox(id, carol);
        assertEq(still.ownerOf(id), carol);
        assertEq(still.titleHolder(id), alice);
        vm.prank(carol);
        still.transferFrom(carol, alice, id);
        vm.prank(alice);
        still.setMailbox(id, bob);
        assertEq(still.ownerOf(id), bob);
        assertEq(still.titleHolder(id), alice);
        assertEq(still.minter(id), alice);
    }

    function test_hostileMailboxCannotSell() public {
        uint256 id = _mintAs(alice, proofAlice);
        _mintAs(bob, proofBob);
        vm.prank(alice);
        still.setMailbox(id, carol);
        vm.prank(carol);
        vm.expectRevert(Stillwater.ApprovalsOff.selector);
        still.approve(bob, id);
        vm.prank(carol);
        vm.expectRevert(Stillwater.ApprovalsOff.selector);
        still.setApprovalForAll(bob, true);
        vm.prank(carol);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(carol, bob, id);
        vm.prank(carol);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.setMailbox(id, bob);
        assertEq(still.ownerOf(id), carol);
        assertEq(still.titleHolder(id), alice);
        assertFalse(still.isApprovedForAll(carol, bob));
        assertEq(still.getApproved(id), address(0));
    }

    function test_dateWhileParkedReverts() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        still.setMailbox(id, carol);
        vm.prank(alice);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.date(id);
        vm.prank(carol);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.date(id);
        assertEq(still.datedBlock(id), 0);
        assertEq(still.datedBy(id), address(0));
    }

    function test_mailboxCannotMint() public {
        bytes32 leafA = _leaf(alice);
        bytes32 leafC = _leaf(carol);
        Stillwater fresh = new Stillwater(_pair(leafA, leafC), treasury, "Stillwater", "STILL", "https://walk.test/");
        bytes32[] memory proofA = new bytes32[](1);
        proofA[0] = leafC;
        bytes32[] memory proofC = new bytes32[](1);
        proofC[0] = leafA;
        vm.deal(carol, 1 ether);
        vm.startPrank(alice);
        fresh.mint{value: fresh.price()}(proofA);
        fresh.setMailbox(1, carol);
        vm.stopPrank();
        assertEq(fresh.ownerOf(1), carol);
        uint256 cost = fresh.price();
        vm.prank(carol);
        vm.expectRevert(Stillwater.Hook.selector);
        fresh.mint{value: cost}(proofC);
        assertEq(fresh.mintedCount(), 1);
        assertFalse(fresh.minted(carol));
        vm.prank(carol);
        fresh.transferFrom(carol, alice, 1);
        vm.prank(carol);
        fresh.mint{value: cost}(proofC);
        assertEq(fresh.minter(1), alice);
        assertEq(fresh.minter(2), carol);
        assertTrue(fresh.minter(1) != fresh.minter(2));
    }

    function test_mailboxRoundTripAndStranger() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        still.setMailbox(id, carol);
        assertEq(still.ownerOf(id), carol);
        assertEq(still.titleHolder(id), alice);

        vm.prank(carol);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(carol, bob, id);

        vm.prank(carol);
        still.transferFrom(carol, alice, id);
        assertEq(still.ownerOf(id), alice);
        assertEq(still.mailboxOf(id), address(0));
    }

    function test_titleCanPassToMintedHall() public {
        _mintAs(alice, proofAlice);
        uint256 bobId = _mintAs(bob, proofBob);
        vm.prank(alice);
        still.transferFrom(alice, bob, 1);
        assertEq(still.ownerOf(1), bob);
        assertEq(still.titleHolder(1), bob);
        assertEq(still.mailboxOf(1), address(0));
        assertEq(still.ownerOf(bobId), bob);
    }

    function test_claimMarksWithoutMint() public {
        vm.prank(carol);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.claim(proofAlice);
        vm.prank(bob);
        still.claim(proofBob);
        assertTrue(still.claimed(bob));
        assertFalse(still.minted(bob));
        assertEq(still.balanceOf(bob), 0);
        assertEq(still.nextId(), 0);
        assertEq(still.mintedCount(), 0);
        assertEq(still.leaf(bob), _leaf(bob));
        vm.prank(bob);
        still.claim(proofBob);
        assertFalse(still.minted(bob));
        uint256 bobBefore = bob.balance;
        vm.deal(address(this), 1 ether);
        vm.prank(bob);
        (bool paid,) = address(still).call{value: 1}(abi.encodeWithSignature("claim(bytes32[])", proofBob));
        assertFalse(paid);
        assertEq(bob.balance, bobBefore);
        assertEq(address(still).balance, 0);
    }

    function test_minterSendsToClaimedUnminted() public {
        uint256 id = _mintAs(alice, proofAlice);
        string memory before = still.tokenURI(id);
        assertTrue(still.claimed(alice));
        vm.prank(bob);
        still.claim(proofBob);
        assertTrue(still.claimed(bob));
        assertFalse(still.minted(bob));
        vm.prank(alice);
        still.transferFrom(alice, bob, id);
        assertEq(still.ownerOf(id), bob);
        assertEq(still.titleHolder(id), bob);
        assertEq(still.minter(id), alice);
        assertEq(still.mailboxOf(id), address(0));
        assertEq(still.tokenURI(id), before);
        assertEq(still.familyOf(still.minter(id)), _familyName(alice));
        assertFalse(still.minted(bob));
        uint256 bobId = _mintAs(bob, proofBob);
        assertEq(bobId, 2);
        assertEq(still.minter(id), alice);
        assertEq(still.minter(bobId), bob);
        assertEq(still.ownerOf(id), bob);
        assertEq(still.tokenURI(id), before);
    }

    function test_unclaimedToReverts() public {
        uint256 id = _mintAs(alice, proofAlice);
        address stranger = address(0x1111);
        vm.prank(alice);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(alice, bob, id);
        vm.prank(alice);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(alice, stranger, id);
        assertEq(still.ownerOf(id), alice);
        assertEq(still.titleHolder(id), alice);
        assertEq(still.minter(id), alice);
        assertFalse(still.claimed(bob));
        assertFalse(still.claimed(stranger));
    }

    function test_vaultCannotSendToClaimedBuyer() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(bob);
        still.claim(proofBob);
        assertFalse(still.minted(bob));
        vm.prank(alice);
        still.setMailbox(id, carol);
        vm.prank(carol);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(carol, bob, id);
        assertEq(still.ownerOf(id), carol);
        assertEq(still.titleHolder(id), alice);
        assertEq(still.minter(id), alice);
        assertEq(still.mailboxOf(id), carol);
        vm.prank(alice);
        vm.expectRevert(Stillwater.Hook.selector);
        still.transferFrom(carol, alice, id);
    }

    function test_oneMintPerKeyStillHolds() public {
        vm.prank(alice);
        still.claim(proofAlice);
        assertTrue(still.claimed(alice));
        assertFalse(still.minted(alice));
        uint256 id = _mintAs(alice, proofAlice);
        assertEq(id, 1);
        assertTrue(still.minted(alice));
        assertTrue(still.claimed(alice));
        assertEq(still.minter(id), alice);
        uint256 cost = still.price();
        vm.prank(alice);
        vm.expectRevert(Stillwater.AlreadyMinted.selector);
        still.mint{value: cost}(proofAlice);
        assertEq(still.mintedCount(), 1);
        assertEq(still.balanceOf(alice), 1);
    }

    function test_mailboxCannotMintDateOrSetRenderer() public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        still.setMailbox(id, carol);
        assertEq(still.ownerOf(id), carol);

        uint256 cost = still.price();
        vm.prank(carol);
        vm.expectRevert(Stillwater.BadProof.selector);
        still.mint{value: cost}(proofAlice);

        vm.prank(carol);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.date(id);

        vm.prank(carol);
        vm.expectRevert(Stillwater.NotTitle.selector);
        still.setMailbox(id, bob);

        vm.prank(carol);
        vm.expectRevert();
        still.setRenderer(address(0x1234));
    }

    function test_setRendererOnce() public {
        FakeRenderer r = new FakeRenderer();
        vm.prank(treasury);
        still.setRenderer(address(r));
        vm.prank(treasury);
        vm.expectRevert(Stillwater.RendererSet.selector);
        still.setRenderer(address(0x1234));
        vm.prank(alice);
        vm.expectRevert();
        still.setRenderer(address(0x1234));
        uint256 id = _mintAs(alice, proofAlice);
        string memory json = _json(id);
        assertTrue(_has(json, "data:image/svg+xml,still"));
        assertTrue(_has(json, "https://walk.test/move"));
    }

    function test_proceedsOnlyTreasury() public {
        uint256 id = _mintAs(alice, proofAlice);
        assertEq(id, 1);
        assertEq(address(still).balance, 0.00420 ether);
        vm.prank(alice);
        vm.expectRevert(Stillwater.WithdrawFailed.selector);
        still.withdraw();
        uint256 before = treasury.balance;
        vm.prank(treasury);
        still.withdraw();
        assertEq(treasury.balance - before, 0.00420 ether);
        assertEq(address(still).balance, 0);
    }

    function test_tokenURIOpenThenDated() public {
        uint256 id = _mintAs(alice, proofAlice);
        string memory openJson = _json(id);
        assertTrue(_has(openJson, '"value":"open"'));
        assertTrue(_has(openJson, "https://walk.test/?id=1"));
        vm.prank(alice);
        still.date(id);
        string memory shut = _json(id);
        assertTrue(_has(shut, '"value":"dated"'));
        assertFalse(_has(shut, '"value":"open"'));
        assertTrue(_has(shut, '"datedBlock":10'));
    }

    function test_reenterMintDoesNotDouble() public {
        ReenterMint attacker = new ReenterMint();
        Stillwater fresh = new Stillwater(_leaf(address(attacker)), treasury, "Stillwater", "STILL", "https://walk.test/");
        attacker.bind(fresh);
        vm.deal(address(attacker), 1 ether);
        attacker.attack{value: 0.00420 ether}();
        assertFalse(attacker.reentered());
        assertEq(fresh.balanceOf(address(attacker)), 1);
    }

    function testFuzz_dateNotOverwritten(uint96 rollBy) public {
        uint256 id = _mintAs(alice, proofAlice);
        vm.prank(alice);
        still.date(id);
        uint256 locked = still.datedBlock(id);
        vm.roll(block.number + (uint256(rollBy) % 5000) + 1);
        vm.prank(alice);
        vm.expectRevert(Stillwater.AlreadyDated.selector);
        still.date(id);
        assertEq(still.datedBlock(id), locked);
        assertEq(still.datedBy(id), alice);
    }

    function _mintAs(address key, bytes32[] memory proof) internal returns (uint256) {
        vm.startPrank(key);
        still.mint{value: still.price()}(proof);
        vm.stopPrank();
        return still.nextId();
    }

    function _leaf(address key) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(key))));
    }

    function _pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function _familyName(address key) internal pure returns (string memory) {
        uint8 band = uint8(keccak256(abi.encodePacked(key))[0]) % 3;
        if (band == 0) return "Ice";
        if (band == 1) return "Pewter";
        return "Ash";
    }

    function _json(uint256 id) internal view returns (string memory) {
        string memory uri = still.tokenURI(id);
        bytes memory raw = bytes(uri);
        uint256 start = 29;
        bytes memory body = new bytes(raw.length - start);
        for (uint256 i = 0; i < body.length; i++) {
            body[i] = raw[start + i];
        }
        return string(_b64(body));
    }

    function _contains(bytes memory hay, bytes memory needle) internal pure returns (bool) {
        if (needle.length == 0 || hay.length < needle.length) return false;
        for (uint256 i = 0; i <= hay.length - needle.length; i++) {
            bool ok = true;
            for (uint256 j = 0; j < needle.length; j++) {
                if (hay[i + j] != needle[j]) {
                    ok = false;
                    break;
                }
            }
            if (ok) return true;
        }
        return false;
    }

    function _has(string memory hay, string memory needle) internal pure returns (bool) {
        bytes memory h = bytes(hay);
        bytes memory n = bytes(needle);
        if (n.length == 0 || h.length < n.length) return false;
        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool ok = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    ok = false;
                    break;
                }
            }
            if (ok) return true;
        }
        return false;
    }

    function _b64(bytes memory data) internal pure returns (bytes memory) {
        bytes memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        uint256 pad = len % 4 == 0 ? 0 : 4 - (len % 4);
        uint256 full = len + pad;
        bytes memory tmp = new bytes(full);
        for (uint256 i = 0; i < len; i++) tmp[i] = data[i];
        uint256 outLen = (full / 4) * 3 - pad;
        bytes memory out = new bytes(outLen);
        uint256 j;
        for (uint256 i = 0; i < full; i += 4) {
            uint256 a = _ix(table, tmp[i]);
            uint256 b = _ix(table, tmp[i + 1]);
            uint256 c = _ix(table, tmp[i + 2]);
            uint256 d = _ix(table, tmp[i + 3]);
            uint256 n = (a << 18) | (b << 12) | (c << 6) | d;
            if (j < outLen) out[j++] = bytes1(uint8(n >> 16));
            if (j < outLen) out[j++] = bytes1(uint8(n >> 8));
            if (j < outLen) out[j++] = bytes1(uint8(n));
        }
        return out;
    }

    function _ix(bytes memory table, bytes1 c) internal pure returns (uint256) {
        if (c == "=") return 0;
        for (uint256 i = 0; i < table.length; i++) {
            if (table[i] == c) return i;
        }
        return 0;
    }
}
