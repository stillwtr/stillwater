// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// The renderer draws. It does not decide datedBlock or datedBy.
interface IStillwaterRenderer {
    function render(uint256 id) external view returns (string memory);
    function renderAnim(uint256 id) external view returns (string memory);
}
