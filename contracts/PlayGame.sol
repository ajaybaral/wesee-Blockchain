// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PlayGame is Ownable, ReentrancyGuard {
    IERC20 public immutable gameToken;
    address public backendOperator;
    uint256 public constant TIMEOUT_DURATION = 24 hours;
    
    enum MatchStatus { PENDING, STAKED, SETTLED, REFUNDED }
    
    struct Match {
        address p1;
        address p2;
        uint256 stake;
        uint256 startTime;
        MatchStatus status;
        bool p1Staked;
        bool p2Staked;
    }
    
    mapping(bytes32 => Match) public matches;
    
    event MatchCreated(bytes32 indexed matchId, address p1, address p2, uint256 stake);
    event Staked(bytes32 indexed matchId, address player);
    event Settled(bytes32 indexed matchId, address winner, uint256 amount);
    event Refunded(bytes32 indexed matchId, address p1, address p2, uint256 amount);
    
    constructor(address _gameToken) Ownable(msg.sender) {
        gameToken = IERC20(_gameToken);
        backendOperator = msg.sender;
    }
    
    function setBackendOperator(address _backendOperator) external onlyOwner {
        backendOperator = _backendOperator;
    }
    
    function createMatch(
        bytes32 matchId,
        address p1,
        address p2,
        uint256 stake
    ) external onlyOwner {
        require(p1 != address(0) && p2 != address(0), "Invalid addresses");
        require(p1 != p2, "Players must be different");
        require(stake > 0, "Stake must be greater than 0");
        require(matches[matchId].p1 == address(0), "Match already exists");
        
        matches[matchId] = Match({
            p1: p1,
            p2: p2,
            stake: stake,
            startTime: 0,
            status: MatchStatus.PENDING,
            p1Staked: false,
            p2Staked: false
        });
        
        emit MatchCreated(matchId, p1, p2, stake);
    }
    
    function stake(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];
        require(matchData.p1 != address(0), "Match does not exist");
        require(matchData.status == MatchStatus.PENDING, "Match not in pending status");
        require(msg.sender == matchData.p1 || msg.sender == matchData.p2, "Not a player");
        
        if (msg.sender == matchData.p1) {
            require(!matchData.p1Staked, "Already staked");
            matchData.p1Staked = true;
        } else {
            require(!matchData.p2Staked, "Already staked");
            matchData.p2Staked = true;
        }
        
        // Pull GT from player
        require(
            gameToken.transferFrom(msg.sender, address(this), matchData.stake),
            "GT transfer failed"
        );
        
        emit Staked(matchId, msg.sender);
        
        // Check if both players have staked
        if (matchData.p1Staked && matchData.p2Staked) {
            matchData.status = MatchStatus.STAKED;
            matchData.startTime = block.timestamp;
        }
    }
    
    function commitResult(bytes32 matchId, address winner) external nonReentrant {
        require(msg.sender == backendOperator, "Only backend can commit result");
        
        Match storage matchData = matches[matchId];
        require(matchData.p1 != address(0), "Match does not exist");
        require(matchData.status == MatchStatus.STAKED, "Match not staked");
        require(winner == matchData.p1 || winner == matchData.p2, "Invalid winner");
        
        // Transfer 2x stake to winner
        uint256 payout = matchData.stake * 2;
        require(
            gameToken.transfer(winner, payout),
            "GT transfer failed"
        );
        
        matchData.status = MatchStatus.SETTLED;
        
        emit Settled(matchId, winner, payout);
    }
    
    function refund(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];
        require(matchData.p1 != address(0), "Match does not exist");
        require(matchData.status == MatchStatus.STAKED, "Match not staked");
        require(
            block.timestamp >= matchData.startTime + TIMEOUT_DURATION,
            "Timeout not reached"
        );
        
        // Refund stakes to both players
        if (matchData.p1Staked) {
            require(
                gameToken.transfer(matchData.p1, matchData.stake),
                "GT transfer failed"
            );
        }
        
        if (matchData.p2Staked) {
            require(
                gameToken.transfer(matchData.p2, matchData.stake),
                "GT transfer failed"
            );
        }
        
        matchData.status = MatchStatus.REFUNDED;
        
        emit Refunded(matchId, matchData.p1, matchData.p2, matchData.stake);
    }
}
