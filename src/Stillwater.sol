// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IStillwaterRenderer} from "./IStillwaterRenderer.sol";

/// Stillwater. One print per eligible key. date() takes no nonce.
/// Treasury is the constructor owner and does not move.
/// A hall key becomes eligible when it mints. Until then it cannot receive.
/// Authorization is msg.sender. There is no trusted forwarder and no ERC-2771.
/// 7702 delegation is the owner's key, not a protocol bug.
/// setMailbox parks the print in a vault. The contract moves it. Title stays.
/// While the vault holds it, only that key may send it home to the title.
contract Stillwater is ERC721, Ownable, ReentrancyGuard {
    uint256 public constant SUPPLY = 512;

    uint256 public immutable price;
    bytes32 public immutable merkleRoot;
    address public immutable treasury;
    string public walkBase;

    address public renderer;
    uint256 public nextId;
    uint256 public mintedCount;

    mapping(address => bool) public minted;
    mapping(address => bool) public eligible;
    mapping(uint256 => address) public minter;
    mapping(uint256 => address) public titleHolder;
    mapping(uint256 => address) public mailboxOf;
    /// How many parked prints this vault holds. Mint reverts while it is nonzero.
    mapping(address => uint256) private _parkedAt;
    mapping(uint256 => uint256) public datedBlock;
    mapping(uint256 => address) public datedBy;

    error BadPrice();
    error SoldOut();
    error AlreadyMinted();
    error BadProof();
    error NotTitle();
    error AlreadyDated();
    error Hook();
    error NoBurn();
    error ApprovalsOff();
    error RendererSet();
    error WithdrawFailed();

    /// @param root_ The one merkle root. There is no setter and no second root.
    /// @param treasury_ Mint ETH is paid here. This address is the owner and does not move.
    /// @param name_ Token name.
    /// @param symbol_ Token symbol.
    /// @param walkBase_ Walk URL used until a renderer is set.
    constructor(
        bytes32 root_,
        address treasury_,
        string memory name_,
        string memory symbol_,
        string memory walkBase_
    ) ERC721(name_, symbol_) Ownable(treasury_) {
        merkleRoot = root_;
        treasury = treasury_;
        walkBase = walkBase_;
        price = block.chainid == 1 ? 0.00420 ether : 0;
    }

    function mint(bytes32[] calldata proof) external payable nonReentrant {
        if (msg.value != price) revert BadPrice();
        if (mintedCount >= SUPPLY) revert SoldOut();
        if (minted[msg.sender]) revert AlreadyMinted();
        if (!MerkleProof.verify(proof, merkleRoot, _leaf(msg.sender))) revert BadProof();
        if (_parkedAt[msg.sender] != 0) revert Hook();

        minted[msg.sender] = true;
        eligible[msg.sender] = true;
        uint256 id = ++nextId;
        mintedCount = id;
        minter[id] = msg.sender;
        titleHolder[id] = msg.sender;
        _safeMint(msg.sender, id);
    }

    /// Shutter. Title holder only, once. The block number is the clock.
    function date(uint256 id) external {
        if (msg.sender != titleHolder[id] || ownerOf(id) != msg.sender) revert NotTitle();
        if (datedBlock[id] != 0) revert AlreadyDated();
        datedBlock[id] = block.number;
        datedBy[id] = msg.sender;
    }

    /// Title parks this print in a vault. Caller is the title and the holder.
    /// The contract moves the print. Title does not change. The zero address is not a vault.
    function setMailbox(uint256 id, address vault) external {
        address title = titleHolder[id];
        if (msg.sender != title || ownerOf(id) != title) revert NotTitle();
        if (vault == address(0) || vault == title) revert Hook();
        mailboxOf[id] = vault;
        _parkedAt[vault] += 1;
        _update(vault, id, address(0));
    }

    /// One shot. The zero address is not a renderer.
    function setRenderer(address r) external onlyOwner {
        if (renderer != address(0) || r == address(0)) revert RendererSet();
        renderer = r;
    }

    function withdraw() external nonReentrant {
        if (msg.sender != treasury) revert WithdrawFailed();
        uint256 bal = address(this).balance;
        (bool ok,) = treasury.call{value: bal}("");
        if (!ok) revert WithdrawFailed();
    }

    function approve(address, uint256) public pure override {
        revert ApprovalsOff();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert ApprovalsOff();
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        ownerOf(id);
        return string.concat("data:application/json;base64,", Base64.encode(bytes(_json(id))));
    }

    function _json(uint256 id) internal view returns (string memory) {
        return string.concat(_head(id), _tail(id));
    }

    function _head(uint256 id) internal view returns (string memory) {
        string memory sid = Strings.toString(id);
        string memory image;
        string memory anim;
        if (renderer != address(0)) {
            image = IStillwaterRenderer(renderer).render(id);
            anim = IStillwaterRenderer(renderer).renderAnim(id);
        } else {
            image = string.concat(walkBase, "?id=", sid, "&still=1");
            anim = string.concat(walkBase, "?id=", sid);
        }
        return string.concat(
            '{"name":"Stillwater ',
            sid,
            '","description":"Stillwater is the print. The Walk is where you see it move until it does not.","image":"',
            image,
            '","animation_url":"',
            anim,
            '","attributes":[{"trait_type":"family","value":"',
            familyOf(minter[id]),
            '"},'
        );
    }

    function _tail(uint256 id) internal view returns (string memory) {
        bool shut = datedBlock[id] != 0;
        return string.concat(
            '{"trait_type":"state","value":"',
            shut ? "dated" : "open",
            '"}',
            shut ? string.concat(',{"trait_type":"datedBlock","value":', Strings.toString(datedBlock[id]), "}") : "",
            '],"extra":{"id":',
            Strings.toString(id),
            ',"minter":"',
            Strings.toHexString(minter[id]),
            '","datedBlock":',
            Strings.toString(datedBlock[id]),
            ',"datedBy":"',
            Strings.toHexString(datedBy[id]),
            '","isDated":',
            shut ? "true" : "false",
            "}}"
        );
    }

    /// Family is the first byte of keccak256(address) mod 3. Same rule as the plate.
    function familyOf(address key) public pure returns (string memory) {
        uint8 band = uint8(keccak256(abi.encodePacked(key))[0]) % 3;
        if (band == 0) return "Ice";
        if (band == 1) return "Pewter";
        return "Ash";
    }

    function leaf(address key) external pure returns (bytes32) {
        return _leaf(key);
    }

    function _leaf(address key) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(key))));
    }

    function _update(address to, uint256 id, address auth) internal override returns (address) {
        address from = _ownerOf(id);
        if (from == address(0)) {
            if (to == address(0)) revert NoBurn();
            return super._update(to, id, auth);
        }
        if (to == address(0)) revert NoBurn();

        address title = titleHolder[id];
        address box = mailboxOf[id];
        // Parked: the vault key is the only signer, and home is the only destination.
        if (from == box && box != address(0)) {
            if (msg.sender != box || to != title) revert Hook();
            _parkedAt[box] -= 1;
            mailboxOf[id] = address(0);
        } else if (from == title && msg.sender == title) {
            bool toBox = box != address(0) && to == box;
            bool toHall = eligible[to];
            if (!toBox && !toHall) revert Hook();
            if (toHall && to != box) {
                titleHolder[id] = to;
                mailboxOf[id] = address(0);
            }
        } else {
            revert Hook();
        }
        return super._update(to, id, auth);
    }
}
