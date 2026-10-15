// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/access/AccessControl.sol";

// Implementasi sederhana dari pseudocode DiplomaRegistry (data dummy, hanya hash on-chain)
contract DiplomaRegistry is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    enum Status { NONE, ACTIVE, REVOKED }
    struct Credential { bytes32 docHash; address issuer; uint64 issuedAt; Status status; uint64 revokedAt; uint8 reasonCode; bytes32 supersededBy; }
    mapping(bytes32 => Credential) public credentials;
    mapping(bytes32 => bytes32) public hashToId;
    bool public paused;

    error NotIssuer(); error AlreadyIssued(); error ContractPaused();
    error NotFound(); error NotCredentialIssuer(); error AlreadyRevoked();
    event CredentialIssued(bytes32 indexed id, bytes32 docHash, address indexed issuer, uint64 issuedAt);
    event CredentialRevoked(bytes32 indexed id, uint8 reasonCode, address indexed issuer, uint64 revokedAt);
    event CredentialAmended(bytes32 indexed oldId, bytes32 indexed newId, bytes32 newHash);

    constructor() { _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); }
    modifier whenActive() { if (paused) revert ContractPaused(); _; }
    function addIssuer(address a) external onlyRole(DEFAULT_ADMIN_ROLE) { _grantRole(ISSUER_ROLE, a); }
    function removeIssuer(address a) external onlyRole(DEFAULT_ADMIN_ROLE) { _revokeRole(ISSUER_ROLE, a); }
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { paused = true; }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { paused = false; }

    function issue(bytes32 id, bytes32 docHash) external whenActive {
        if (!hasRole(ISSUER_ROLE, msg.sender)) revert NotIssuer();
        if (credentials[id].status != Status.NONE || hashToId[docHash] != bytes32(0)) revert AlreadyIssued();
        credentials[id] = Credential(docHash, msg.sender, uint64(block.timestamp), Status.ACTIVE, 0, 0, bytes32(0));
        hashToId[docHash] = id;
        emit CredentialIssued(id, docHash, msg.sender, uint64(block.timestamp));
    }
    function revoke(bytes32 id, uint8 reasonCode) public whenActive {
        Credential storage c = credentials[id];
        if (c.status == Status.NONE) revert NotFound();
        if (c.issuer != msg.sender) revert NotCredentialIssuer();
        if (c.status != Status.ACTIVE) revert AlreadyRevoked();
        c.status = Status.REVOKED; c.revokedAt = uint64(block.timestamp); c.reasonCode = reasonCode;
        emit CredentialRevoked(id, reasonCode, msg.sender, uint64(block.timestamp));
    }
    function amend(bytes32 oldId, bytes32 newId, bytes32 newHash) external whenActive {
        revoke(oldId, 1);
        if (credentials[newId].status != Status.NONE || hashToId[newHash] != bytes32(0)) revert AlreadyIssued();
        credentials[newId] = Credential(newHash, msg.sender, uint64(block.timestamp), Status.ACTIVE, 0, 0, bytes32(0));
        hashToId[newHash] = newId; credentials[oldId].supersededBy = newId;
        emit CredentialAmended(oldId, newId, newHash);
    }
    function verify(bytes32 id, bytes32 docHash) external view returns (bool valid, Status status, address issuer, uint64 issuedAt) {
        Credential storage c = credentials[id];
        valid = (c.status == Status.ACTIVE) && (c.docHash == docHash);
        return (valid, c.status, c.issuer, c.issuedAt);
    }
}
