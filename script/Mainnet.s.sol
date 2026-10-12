// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Stillwater} from "../src/Stillwater.sol";

/// Unsigned mainnet simulation. Do not add --broadcast until DEPLOY MAINNET.
contract MainnetDeploy is Script {
    bytes32 internal constant ROOT = 0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3;
    address internal constant TREASURY = 0x08d97e624214f4Ca5283b47C11030AB71Bc7304D;
    string internal constant WALK = "https://stillwtr.github.io/stillwater/art/walk.html";

    function run() external {
        require(block.chainid == 1, "mainnet");
        address deployer = vm.envOr("DEPLOYER", TREASURY);
        require(deployer != address(0), "deployer");

        vm.startBroadcast(deployer);
        Stillwater still = new Stillwater(ROOT, TREASURY, "Stillwater", "STILL", WALK);
        vm.stopBroadcast();

        require(still.merkleRoot() == ROOT, "merkleRoot");
        require(still.treasury() == TREASURY, "treasury");
        require(still.owner() == TREASURY, "owner");
        require(still.price() == 0.00420 ether, "price");
        require(keccak256(bytes(still.walkBase())) == keccak256(bytes(WALK)), "walk");
        console2.log("MAINNET_SIM");
        console2.log("still", address(still));
    }
}
