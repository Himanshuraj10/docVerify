// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocumentVerification
 * @notice Tamper-resistant EVM smart contract ledger for cryptographic document proofs.
 * @dev Preserves data privacy: strictly stores SHA-256 digests, verification IDs, and statuses.
 * NEVER stores raw document files, OCR text, or sensitive personal data.
 */
contract DocumentVerification {
    address public immutable owner;

    struct VerificationProof {
        string verificationId;
        string documentHash;     // SHA-256 hex digest
        string result;           // VERIFIED, SUSPICIOUS, REJECTED
        uint256 timestamp;
        string issuerId;         // Authorized issuer authority identifier
        string recordVersion;
        bool exists;
    }

    // Mapping from verificationId to VerificationProof
    mapping(string => VerificationProof) private verifications;

    // Mapping from documentHash to array of verification IDs
    mapping(string => string[]) private hashToVerifications;

    event VerificationRegistered(
        string indexed verificationId,
        string indexed documentHash,
        string result,
        uint256 timestamp,
        string issuerId
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Only contract owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Registers an immutable cryptographic verification record.
     */
    function registerVerification(
        string calldata _verificationId,
        string calldata _documentHash,
        string calldata _result,
        string calldata _issuerId,
        string calldata _recordVersion
    ) external {
        require(bytes(_verificationId).length > 0, "Verification ID cannot be empty");
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty");
        require(!verifications[_verificationId].exists, "Verification record already exists");

        verifications[_verificationId] = VerificationProof({
            verificationId: _verificationId,
            documentHash: _documentHash,
            result: _result,
            timestamp: block.timestamp,
            issuerId: _issuerId,
            recordVersion: _recordVersion,
            exists: true
        });

        hashToVerifications[_documentHash].push(_verificationId);

        emit VerificationRegistered(
            _verificationId,
            _documentHash,
            _result,
            block.timestamp,
            _issuerId
        );
    }

    /**
     * @notice Retrieves verified record by verification ID.
     */
    function getVerification(string calldata _verificationId)
        external
        view
        returns (
            string memory verificationId,
            string memory documentHash,
            string memory result,
            uint256 timestamp,
            string memory issuerId,
            string memory recordVersion
        )
    {
        require(verifications[_verificationId].exists, "Verification record does not exist");
        VerificationProof memory p = verifications[_verificationId];
        return (
            p.verificationId,
            p.documentHash,
            p.result,
            p.timestamp,
            p.issuerId,
            p.recordVersion
        );
    }

    /**
     * @notice Checks if a document hash has been previously verified.
     */
    function isDocumentVerified(string calldata _documentHash)
        external
        view
        returns (bool verified, uint256 count)
    {
        string[] memory records = hashToVerifications[_documentHash];
        return (records.length > 0, records.length);
    }
}
