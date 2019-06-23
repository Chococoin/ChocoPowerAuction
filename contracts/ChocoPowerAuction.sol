pragma solidity ^0.5.8;

contract ChocoPowerAuction{
    address payable public beneficiary;
    address payable public crowdsPot;
    address public highestBidder;
    uint public highestBid;
    uint public crowdAmount;
    uint public withdrawn;
    uint millestone;
    //uint Fri_Nov_01_00_00_UTC_2019 = 1572566400;
    uint Fri_Nov_01_00_00_UTC_2019 = 600;
    uint endAuctionDay;
    bool public crowdWinning = false;
    bool open = true;

    enum Fund { lone , crowd }

    struct Funder {
        uint amount;
        Fund kind;
    }

    mapping(address => Funder) pendingReturns;

    modifier isOpen(){
        require(open == true,
        "Is too late to make a bid. The auction has ended"
        );
        _;
    }

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor() public payable {
        beneficiary = msg.sender;
        crowdsPot = msg.sender;
        crowdAmount = 0;
        //millestone = 100 ether;
        millestone = 0.1 szabo;
        // Señala la fecha de culminacion de la subasta.
        //endAuctionDay = Fri_Nov_01_00_00_UTC_2019;
        endAuctionDay = now + Fri_Nov_01_00_00_UTC_2019;
    }

    function bid(Fund _kind) public payable isOpen returns(bool){
        if(_kind == Fund.lone){
            require(msg.sender != highestBidder,
              "HighestBidder cannot make rebidding");
            require(pendingReturns[msg.sender].amount == 0,
              "You have a pending found, make rebidding");
            require(msg.value > highestBid,
              "The amount is not enough to overcome the previous bid");
              if(highestBidder != crowdsPot) {
                pendingReturns[highestBidder] = Funder({ amount: highestBid, kind: Fund.lone });
              }
              highestBid = msg.value;
              highestBidder = msg.sender;
              if(crowdWinning){
                crowdWinning = false;
              }
        }
        if(_kind == Fund.crowd){
            require(msg.sender != highestBidder,
              "You have a previos bid as lone. Use chocoPowerFundingCrowd to change type");
            require(pendingReturns[msg.sender].amount == 0,
              "You have a pending found, make rebidding");
            require(msg.value > 0,
              "You need send an amount greater than zero.");
            crowdAmount += msg.value;
            pendingReturns[msg.sender] = Funder({ amount: msg.value, kind: Fund.crowd });
            if (crowdAmount > highestBid) {
                crowdWinning = true;
                if(highestBidder != crowdsPot) {
                    pendingReturns[highestBidder] = Funder({ amount: highestBid, kind: Fund.lone });
                    highestBidder = crowdsPot;
                }
                highestBid = crowdAmount;
            }
        }
        emit HighestBidIncreased(highestBidder, highestBid);
        //takeMillestone();
        closeIt();
        return true;
    }

    function chocoPowerFundingCrowd() public returns(bool) {
        require(pendingReturns[msg.sender].kind == Fund.lone,
          "Kind of fund isn't lone");
        require(pendingReturns[msg.sender].amount > 0 || msg.sender == highestBidder,
          "Pending funds must be greater than Zero");
        pendingReturns[msg.sender].kind = Fund.crowd;
        crowdAmount += pendingReturns[msg.sender].amount;
        if(highestBidder == msg.sender){
            pendingReturns[msg.sender] = Funder({ amount: highestBid, kind: Fund.crowd });
            highestBidder = crowdsPot;
            highestBid = crowdAmount;
            crowdWinning = true;
        }
        if(highestBidder == crowdsPot) {
            highestBid += pendingReturns[msg.sender].amount;
        }
        return true;
    }

    function rebid(Fund _kind) public payable isOpen returns(bool){
        if(_kind == Fund.lone){
            require(msg.sender != highestBidder,
              "HighestBidder cannot make rebidding");
            require(pendingReturns[msg.sender].amount > 0,
              "You don't have pending founds, make a bid instead");
            require(msg.value + pendingReturns[msg.sender].amount > highestBid,
              "The amount is not enough to overcome the highestBid");
              if(highestBidder != crowdsPot) {
                pendingReturns[highestBidder] = Funder({ amount: highestBid, kind: Fund.lone });
              }
              if(crowdWinning){
                  crowdWinning == false;
              }
              highestBid = msg.value + pendingReturns[msg.sender].amount;
              highestBidder = msg.sender;
              pendingReturns[msg.sender] = Funder({ amount: 0, kind: Fund.lone });
        }
        if(_kind == Fund.crowd){
            require(msg.sender != highestBidder,
              "You have a previous bid as lone. Use chocoPowerFundingCrowd to change type");
            require(pendingReturns[msg.sender].amount > 0,
              "You don't have pending founds, make a bid instead");
            require(pendingReturns[msg.sender].kind == Fund.crowd,
              "To change modality use instead function chocoPowerFundingCrowd");
            require(msg.value > 0,
              "You need send a amount greater than zero.");
            crowdAmount += msg.value;
            pendingReturns[msg.sender] = Funder({ amount: pendingReturns[msg.sender].amount + msg.value,
                                                  kind: Fund.crowd });
            if(crowdAmount > highestBid) {
                if(highestBidder != crowdsPot) {
                    pendingReturns[highestBidder] = Funder({ amount: highestBid, kind: Fund.lone });
                    highestBidder = crowdsPot;
                    crowdWinning == true;
                }
                highestBid = crowdAmount;
            }
        }
        emit HighestBidIncreased(highestBidder, highestBid);
        //takeMillestone();
        closeIt();
        return true;
    }

    function auctionEnd() public returns(bool){
        require(msg.sender == beneficiary,
        "Only beneficiary can call this function"
        );
        require(block.timestamp > endAuctionDay,
          "Auction isn't ended yet");
        if(highestBid > withdrawn) {
          if (beneficiary.send(highestBid - withdrawn)){
              withdrawn = highestBid;
              emit AuctionEnded(highestBidder, highestBid);
          }
        }
        closeIt();
        return true;
    }

    function takeMillestone() internal {
        if(highestBid > millestone){
            uint advance = highestBid - withdrawn;
            if(advance > 250000000000) {
                if (beneficiary.send(advance)){
                  withdrawn += advance;
                }
            }
        }
    }

    function myPendingFunds() public view returns (uint){
        return pendingReturns[msg.sender].amount;
    }

    function myPendingFundsType() public view returns (Fund){
        require(pendingReturns[msg.sender].amount > 0,
        "You don't have pending funds");
        return pendingReturns[msg.sender].kind;
    }

    function closeIt() internal returns (bool) {
        if (endAuctionDay < block.timestamp) {
            open = false;
            return open;
        }
    }

    function isClosed () public view returns(bool) {
        return !open;
    }

    function withdrawPendings() public returns(uint){
        require(msg.sender != beneficiary,
          "beneficiary cannot use this function");
        require(pendingReturns[msg.sender].amount > 0,
          "You don't have any funds on this contract");
        if (open) {
            require(pendingReturns[msg.sender].kind == Fund.lone,
              "Only lone funders can retire pending funds before end of auction");
        }
        if (!open) {
            require(msg.sender != highestBidder,
              "You are the winner! The price is yours");
        }
        uint amount = pendingReturns[msg.sender].amount;
        pendingReturns[msg.sender].amount = 0;
        if (!msg.sender.send(amount)) {
            pendingReturns[msg.sender].amount = amount;
            return 0;
        }
        if (pendingReturns[msg.sender].kind == Fund.crowd && open == false){
            crowdAmount -= amount;
        }
        return amount;
    }

    function balance() public view returns (uint){
      return address(this).balance;
    }
}
