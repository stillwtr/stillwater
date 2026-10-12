// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Stillwater} from "../src/Stillwater.sol";
import {SepoliaRoot} from "./SepoliaRoot.sol";

/// Sepolia only. Passes the three-key test root. The walker root is not deployed here.
contract SepoliaDeploy is Script {
    bytes32 internal constant WALKER = 0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3;
    string internal constant WALK = "https://stillwtr.github.io/stillwater/art/walk.html";

    function run() external {
        require(block.chainid == 11155111, "sepolia");
        address extra = vm.envAddress("SEPOLIA_EXTRA");
        bytes32 root = SepoliaRoot.root3(SepoliaRoot.TREASURY, SepoliaRoot.OTHER, extra);
        require(root == SepoliaRoot.TINY, "tiny");
        require(root != WALKER, "not the walker root");
        uint256 pk = _pk();
        require(vm.addr(pk) == SepoliaRoot.TREASURY, "deployer");

        vm.startBroadcast(pk);
        Stillwater still = new Stillwater(root, SepoliaRoot.TREASURY, "Stillwater", "STILL", WALK);
        vm.stopBroadcast();

        require(still.merkleRoot() == root, "merkleRoot");
        require(still.price() == 0, "price");
        require(still.treasury() == SepoliaRoot.TREASURY, "treasury");
        require(keccak256(bytes(still.walkBase())) == keccak256(bytes(WALK)), "walk");
        console2.log("SEPOLIA_OK");
        console2.log("still", address(still));
        console2.logBytes32(root);
    }

    function _pk() internal view returns (uint256) {
        string memory raw = vm.envString("PRIVATE_KEY");
        bytes memory b = bytes(raw);
        if (b.length >= 2 && b[0] == "0" && (b[1] == "x" || b[1] == "X")) return vm.parseUint(raw);
        return vm.parseUint(string.concat("0x", raw));
    }
}
