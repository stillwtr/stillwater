// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Stillwater} from "../src/Stillwater.sol";
import {SepoliaRoot} from "./SepoliaRoot.sol";

/// Sepolia only. Passes the temporary three-key root. The walker root stays on the fork script.
contract SepoliaDeploy is Script {
    bytes32 internal constant WALKER = 0xbe0d924b59dbc07be545915c0d134d2fb2d270559d2f00320411cffee789183c;

    function run() external {
        require(block.chainid == 11155111, "sepolia");
        bytes32 root = SepoliaRoot.root();
        require(root != WALKER, "temp root");
        bytes32[] memory proof = SepoliaRoot.proofTreasury();
        uint256 pk = _pk();
        require(vm.addr(pk) == SepoliaRoot.TREASURY, "deployer");

        console2.log("proof0");
        console2.logBytes32(proof[0]);
        console2.log("proof1");
        console2.logBytes32(proof[1]);

        vm.startBroadcast(pk);
        Stillwater still = new Stillwater(root, SepoliaRoot.TREASURY, "Stillwater", "STILL", "https://walk.test/");
        vm.stopBroadcast();

        require(still.merkleRoot() == root, "merkleRoot");
        require(still.price() == 0, "price");
        require(still.treasury() == SepoliaRoot.TREASURY, "treasury");
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
