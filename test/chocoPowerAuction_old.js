const ChocoPowerAuction = artifacts.require('ChocoPowerAuction');
const Errors = require('./tools/errors.js');
const Utils = require('./tools/utils.js')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const now = Math.floor((Date.now()) / 1000);
const Fri_Nov_01_00_00_UTC_2019 = 1572566400;

var chocoPowerAuction, highestBid, highestBidder, auctionEnd,
bid, rebid, myPendingFunds, myPendingFundsType, isClosed, balance, snapShot, crowdsPot, 
crowdAmount, withdrawPendings, withdrawn, crowdWinning, chocoPowerFundingCrowd;

contract('chocoPowerAuction_v1', (accounts) => {
  it('Deploy the Smart Contract', async () => {
      chocoPowerAuction = await ChocoPowerAuction.deployed();
      assert(chocoPowerAuction.address !== '');
  });
  it('Beneficiary is sender', async () => {
      const beneficiary = await chocoPowerAuction.beneficiary()
      assert(beneficiary === accounts[0]);
  });
  it('Higgest Bid must be 0', async () => {
      highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
      assert(highestBid.toNumber() === 0);
  });
  it('Higgest Bidder must be undefined', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[1] });
      assert(highestBidder === ZERO_ADDR);
  });
  it('CrowdsPot is assigned', async () => {
      crowdsPot = await chocoPowerAuction.crowdsPot( { from: accounts[5] });
      assert(crowdsPot === accounts[0]);
  });
  it('crowdWinning is false 1/4', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
      assert(!crowdWinning);
  });
  it('crowdAmount must be zero 1/2', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
      assert(crowdAmount.toNumber() === 0);
  });
  it('withdrawn must be zero 1/3', async () => {
      withdrawn = await chocoPowerAuction.withdrawn({ from: accounts[4] });
      assert(withdrawn.toNumber() === 0);
  });
  it('Receiving properly a lone bid', async () => {
      await chocoPowerAuction.bid(0, {from: accounts[1], value: 10000000000});
      highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
      assert(highestBid.toNumber() === 10000000000);
  })
  it('Set properly the highest bidder', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[2] });
      assert(highestBidder === accounts[1]);
  });
  it('Receiving a new highest lone bid', async () => {
      await chocoPowerAuction.bid(0, {from: accounts[2], value: 20000000000});
      highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[0] });
      assert(highestBid.toNumber() === 20000000000);
  });
  it('Set properly new highest lone bidder', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[0] });
      assert(highestBidder === accounts[2]);
  });
  it('Set properly Pending returns', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds.call({ from: accounts[1] });
      assert(myPendingFunds.toNumber() === 10000000000);
  });
  it('Overcame bidder unable to make a lone bid', async () => {
      try {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 30000000000 });
        assert(false);
      } catch(e) {
        assert(e.message == Errors[1]);
      }
  });
  it('Overcame bidder make a lone rebid', async () => {
      rebid = await chocoPowerAuction.rebid(0, { from: accounts[1], value: 10000000001 });
      assert(rebid.receipt.status);
  });
  it('Check pendings funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 20000000000);
  });
  it('New bidder unable to lone bid with lower amount', async () => {
      try{
        bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 20000000000 });
        assert(false);
      } catch(e) {
        assert(e.message == Errors[2]);
      }
  });
  it('New bidder unable to lone bid with equal amount', async () => {
      try{
        bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 20000000001 });
        assert(false);
      } catch(e) {
        assert(e.message == Errors[2]);
      }
  });
  it('No bidder has not pending funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[3] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Highest bidder has not change', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[0] });
      assert(highestBidder === accounts[1]);
  });
  it('Highest bidder has not pending funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[1] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Lower lone bidder withdraw pendings funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
      await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
      assert(withdrawPendings.toNumber() == myPendingFunds.toNumber());
  });
  it('Balance of contract is right 1', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 20000000001);
  });
  it('Exit bidder has not pendings funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Higher bidder cannot make a new highest lone bid', async () => {
      try {
        myPendingFunds = await chocoPowerAuction.bid(0, { from: accounts[1], value:20000000002 });
        assert(false);
      } catch(e) {
        assert(e.message === Errors[3]);
      }
  });
  it('Not bidder user unable to use rebid function', async () => {
      try {
        rebid = await chocoPowerAuction.rebid(0, { from: accounts[4], value: 50000000000 });
        assert(false);
      } catch(e) {
        assert(e.message === Errors[9]);
      }
  });
  it('crowdAmount must be zero 2/2', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
      assert(crowdAmount.toNumber() === 0);
  });
  it('crowdWinning is false 2/4', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5]});
      assert(!crowdWinning);
  });
  it('First crow bider enter to play', async () => {
      bid = await chocoPowerAuction.bid(1, { from: accounts[5], value: 20000000000 });
      assert(bid.receipt.status);
  });
  it('crowdAmount has change properly', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
      assert(crowdAmount.toNumber() === 20000000000);
  });
  it('crowdWinning is false 3/4', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5]});
      assert(!crowdWinning);
  });
  it('Admin cannot withdraw and close until close date is reached', async () => {
      try {
        auctionEnd = await chocoPowerAuction.auctionEnd();
        assert(false);
      } catch(e) {
        assert(e.message === Errors[5]);
      }
  });
  it('Auction remains open', async () => {
      isClosed = await chocoPowerAuction.isClosed.call();
      assert(!isClosed);
  });
  it('Ex nuovo lone bidder reenter', async () => {
      bid = await chocoPowerAuction.bid(0, { from: accounts[2], value: 40000000000 });
      assert(bid.receipt.status);
  });
  it('Overcame lone bidder withdraw funds', async () => {
      bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 50000000000 });
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
      await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
      assert(withdrawPendings.toNumber() === 40000000000);
  });
  it('Balance of contract is right 2', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 90000000001);
  });
  it('New balance of exit bidder', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('New crowd bidder enters', async () => {
      bid = await chocoPowerAuction.bid(1, { from: accounts[6], value: 30000000000});
      assert(bid.receipt.status);
  });
  it('Balance of contract is right 3/', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 120000000001);
  });
  it('highbid is correct', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid.toNumber() == 50000000000);
  });
  it('crowdAmount is correct', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[7] });
      assert(crowdAmount == 50000000000);
  })
  it('crowdWinning is false 4/4', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning({ from: accounts[3] });
      assert(!crowdWinning);
  });
  it('highestBidder is correct', async () => {
      highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[1] });
      assert(highestBidder == accounts[3]);
  });
  it('Third crowd bidder enters', async () => {
      bid = await chocoPowerAuction.bid(1, { from: accounts[7], value: 20000000000});
      assert(bid.receipt.status);
  });
  it('Balance of contract is right 3/ after takeMillestone', async () => {
    balance = await chocoPowerAuction.balance();
    assert(balance.toNumber() == 140000000001);
  });
  it('crowdAmount is correct', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount();
      assert(crowdAmount.toNumber() == 70000000000);
  });
  it('highbid is correct', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid.toNumber() == 70000000000);
  });
  it('crowdWinning is true', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning({ from: accounts[3] });
      assert(crowdWinning);
  });
  it('highestBidder is correct', async () => {
      highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[1] });
      assert(highestBidder == accounts[0]);
  });
  it('Crowd funder unable to whitdraw before end of auction', async () =>  {
      try {
        withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[7] });
        assert(false);
      } catch(e) {
          assert(e.message == Errors[10]);
      }
  });
  it('After try to withdraw crowd funder has still pending funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds( { from: accounts[7] });
      assert(myPendingFunds.toNumber() == 20000000000);
  });
  it('Crowd funder unable to bid', async () => {
      try {
        bid = await chocoPowerAuction.bid(1, { from: accounts[7], value: 50000000000 });
        assert(false);
      } catch(e) {
        assert(e.message == Errors[1]);
      }
  });
  it('Crowd funder make a rebid', async () => {
      bid = await chocoPowerAuction.rebid(1, { from: accounts[7], value: 50000000000 });
      assert(bid.receipt.status);
  });
  it('Pending funds after rebid', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[7] });
      assert(myPendingFunds.toNumber() == 70000000000 )
  });
  it('Balance of contract is right 3/ after takeMillestone', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 190000000001);
  });
  it('crowdWinning is true', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning();
      assert(crowdWinning); 
  });
  it('highbidder is beneficiary', async () => {
      highestBidder = await chocoPowerAuction.highestBidder();
      assert(highestBidder == accounts[0]);
  });
  it('highbid is right 1/2', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid.toNumber() == 120000000000);
  });
  it('Lone funder change to crowd', async () => {
      chocoPowerFundingCrowd = await chocoPowerAuction.chocoPowerFundingCrowd({ from: accounts[1] });
      assert(chocoPowerFundingCrowd);
  });
  it('Balance of contract has not change', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 190000000001);
  });
  it('highbid is right 2/3', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid.toNumber() == 140000000001);
  });
  it('lone bidder unable with equal amount', async () => {
      try {
        bid = await chocoPowerAuction.bid(0, { from: accounts[9], value: 140000000000 });
        assert(false);
      } catch(e) {
        assert(e.message == Errors[2]);
      }
  });
  it('Enter highest lone bidder', async () => {
      bid = await chocoPowerAuction.bid(0, { from: accounts[8], value: 150000000000 });
      assert(bid.receipt.status);
  });
  it('Balance of contract is right 5/ after takeMillestone', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 340000000001);
  });
  it('highbidder is set properly', async () => {
      highestBidder = await chocoPowerAuction.highestBidder();
      assert(highestBidder == accounts[8]);
  });
  it('highbid is right 3/3', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid.toNumber() == 150000000000);
  });
  it('crowdWinning is false 1/2', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning();
      assert(!crowdWinning); 
  });
  it('Pending funds of highest bidder is zero',  async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[8] });
      assert(myPendingFunds.toNumber() == 0);
  });
  it('Enter highest lone bidder', async () => {
      bid = await chocoPowerAuction.bid(0, { from: accounts[9], value: 160000000000 });
      assert(bid.receipt.status);
  });
  it('Balance of contract is right 6/ after takeMillestone', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 500000000001);
  });
  it('Pending funds of ex highest bidder is right',  async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[8] });
      assert(myPendingFunds.toNumber() == 150000000000);
  });
  it('ex highestBidder fund kind is right', async () => {
      myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[8] });
      assert(myPendingFundsType == 0);
  });
  it('crowdWinning is false 2/2', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning();
      assert(!crowdWinning); 
  });
  it('Set moment before end of auction', async () => {
      snapShot = await Utils.takeSnapshot();
      assert(snapShot);
  });
  it('Beneficiary unable to take higgest bid ', async () => {
      try {
        auctionEnd = await chocoPowerAuction.auctionEnd.call({ from: accounts[0] });
        assert(false);
      } catch(e) {
        assert(e.message == Errors[11]);
      }
  });
  it('Time travel to End of Auction', async () => {
      await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
      let time = await Utils.getCurrentTime();
      assert(time > Fri_Nov_01_00_00_UTC_2019);
  });
  it('Balance of contract is right before last bid', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 500000000001);
  });
  it('Last lone bid to close the auction', async () => {
      bid = await chocoPowerAuction.bid(0, { from: accounts[4], value: 250000000000 });
      assert(bid.receipt.status);
  });
  it('Balance of contract is right after last bid', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 750000000001);
  });
  it('No more lone bids are allowed', async () => {
      try {
        bid = await chocoPowerAuction.bid(0, { from: accounts[9], value: 600000000000 });
        assert(false);
      } catch(e) {
        assert(e.message === Errors[6]);
      }
  });
  it('Last highest bidder info is right', async () => {
      highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[5]});
      assert(highestBidder === accounts[4]);
  });
  it('Auction is closed', async () => {
      isClosed = await chocoPowerAuction.isClosed({ from: accounts[5]});
      assert(isClosed);
  });
  it('Highest bidder has not pending funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[4] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Highest bidder cannot make withdraw', async () => {
      highestBidder = await chocoPowerAuction.highestBidder();
      try {
        withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: highestBidder });
        assert(false);
      } catch(e) {
        assert(e.message === Errors[13]);
      }
  });
  it('Crowd amount before all withdraws', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
      assert(crowdAmount.toNumber() == 140000000001);
  });
  it('Type of Pendings Funds 1/4', async () => {
      myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[1] });
      assert(myPendingFundsType.toNumber() == 1);
  });
  it('Type of Pendings Funds 2/4', async () => {
      myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[5] });
      assert(myPendingFundsType.toNumber() == 1);
  });
  it('Type of Pendings Funds 3/4', async () => {
      myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[6] });
      assert(myPendingFundsType.toNumber() == 1);
  });
  it('Type of Pendings Funds 4/4', async () => {
      myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[7] });
      assert(myPendingFundsType.toNumber() == 1);
  });
  it('Pendings Funds before account 7', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[7] });
      assert(myPendingFunds.toNumber() == 70000000000);
  });
  it('Crowd bidder make a withdraw 1/4', async () => {
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[1] });
      await chocoPowerAuction.withdrawPendings({ from: accounts[1] });
      assert(withdrawPendings.toNumber() == 20000000001);
  });
  it('Crowd bidder make a withdraw 2/4', async () => {
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[5] });
      await chocoPowerAuction.withdrawPendings({ from: accounts[5] });
      assert(withdrawPendings.toNumber() == 20000000000);
  });
  it('Crowd bidder make a withdraw 3/4', async () => {
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[6] });
      await chocoPowerAuction.withdrawPendings({ from: accounts[6] });
      assert(withdrawPendings.toNumber() == 30000000000);
  });
  it('Crowd bidder make a withdraw 4/4', async () => {
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[7] });
      await chocoPowerAuction.withdrawPendings({ from: accounts[7] });
      assert(withdrawPendings.toNumber() == 70000000000);
  });
  it('Pendings Funds after', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[7] });
      assert(myPendingFunds.toNumber() == 0);
  });
  it('Crowd amount after all withdraws is zero', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
      assert(crowdAmount.toNumber() == 0);
  });
  it('Beneficiary take higgest bid', async () => {
      auctionEnd = await chocoPowerAuction.auctionEnd({ from: accounts[0] });
      assert(auctionEnd.receipt.status);
  });
  it('Higgest bid ifo remains', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid == 250000000000);
  });
  it('No winner lone bidder make a withdraw', async () => {
      withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[3] });
      assert(auctionEnd.receipt.status);
  });
  it('crowdWinning is false', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
      assert(!crowdWinning);
  });
  it('higgest bid', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid);
  });
  it('Beneficiary withdraw with auctionEnd', async () => {
      auctionEnd == await chocoPowerAuction.auctionEnd( { from: accounts[0] });
      assert(auctionEnd.receipt.status);
  });
  it('Withdrawn all highestBid already', async () => {
    withdrawn = await chocoPowerAuction.withdrawn();
    assert(highestBid.toNumber() - withdrawn.toNumber() == 0);
  });
  it('Withdraw lone funder 1/2', async () => {
      withdrawn = await chocoPowerAuction.withdrawPendings({ from: accounts[8] });
      assert(auctionEnd.receipt.status);
  });
  it('Withdraw lone funder 2/2', async () => {
    withdrawn = await chocoPowerAuction.withdrawPendings({ from: accounts[9] });
    assert(auctionEnd.receipt.status);
  });
  it('Final balance', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 0);
  });
  it('Revert to snapshot', async () => {
      await Utils.revertToSnapShot(snapShot.result);
      await Utils.advanceBlock();
      let time = await Utils.getCurrentTime();
  });
});


contract('chocoPowerAuction_v2', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('Beneficiary is sender', async () => {
        const beneficiary = await chocoPowerAuction.beneficiary()
        assert(beneficiary === accounts[0]);
    });
    it('Higgest Bid must be 0', async () => {
        highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
        assert(highestBid.toNumber() === 0);
    });
    it('Higgest Bidder must be undefined', async () => {
        highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[1] });
        assert(highestBidder === ZERO_ADDR);
    });
    it('CrowdsPot is assigned', async () => {
        crowdsPot = await chocoPowerAuction.crowdsPot( { from: accounts[5] });
        assert(crowdsPot === accounts[0]);
    });
    it('crowdWinning is false 1/4', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('crowdAmount must be zero 1/2', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 0);
    });
    it('withdrawn must be zero 1/3', async () => {
        withdrawn = await chocoPowerAuction.withdrawn({ from: accounts[4] });
        assert(withdrawn.toNumber() === 0);
    });
    it('Receiving properly a lone bid', async () => {
        await chocoPowerAuction.bid(0, {from: accounts[1], value: 10000000000});
        highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
        assert(highestBid.toNumber() === 10000000000);
    })
    it('Set properly the highest bidder', async () => {
        highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[2] });
        assert(highestBidder === accounts[1]);
    });
    it('Receiving a new highest lone bid', async () => {
        await chocoPowerAuction.bid(0, {from: accounts[2], value: 20000000000});
        highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[0] });
        assert(highestBid.toNumber() === 20000000000);
    });
    it('Set properly new highest lone bidder', async () => {
        highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[0] });
        assert(highestBidder === accounts[2]);
    });
    it('Set properly Pending returns', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds.call({ from: accounts[1] });
        assert(myPendingFunds.toNumber() === 10000000000);
    });
    it('Overcame bidder unable to make a lone bid', async () => {
        try {
          bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 30000000000 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[1]);
        }
    });
    it('Overcame bidder make a lone rebid', async () => {
        rebid = await chocoPowerAuction.rebid(0, { from: accounts[1], value: 10000000001 });
        assert(rebid.receipt.status);
    });
    it('Check pendings funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
        assert(myPendingFunds.toNumber() === 20000000000);
    });
    it('New bidder unable to lone bid with lower amount', async () => {
        try{
          bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 20000000000 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[2]);
        }
    });
    it('New bidder unable to lone bid with equal amount', async () => {
        try{
          bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 20000000001 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[2]);
        }
    });
    it('No bidder has not pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[3] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('Highest bidder has not change', async () => {
        highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[0] });
        assert(highestBidder === accounts[1]);
    });
    it('Highest bidder has not pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[1] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('Lower lone bidder withdraw pendings funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
        assert(withdrawPendings.toNumber() == myPendingFunds.toNumber());
    });
    it('Balance of contract is right 1', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 20000000001);
    });
    it('Exit bidder has not pendings funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('Higher bidder cannot make a new highest lone bid', async () => {
        try {
          myPendingFunds = await chocoPowerAuction.bid(0, { from: accounts[1], value:20000000002 });
          assert(false);
        } catch(e) {
          assert(e.message === Errors[3]);
        }
    });
    it('Not bidder user unable to use rebid function', async () => {
        try {
          rebid = await chocoPowerAuction.rebid(0, { from: accounts[4], value: 50000000000 });
          assert(false);
        } catch(e) {
          assert(e.message === Errors[9]);
        }
    });
    it('crowdAmount must be zero 2/2', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 0);
    });
    it('crowdWinning is false 2/4', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5]});
        assert(!crowdWinning);
    });
    it('First crow bider enter to play', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[5], value: 20000000000 });
        assert(bid.receipt.status);
    });
    it('crowdAmount has change properly', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
        assert(crowdAmount.toNumber() === 20000000000);
    });
    it('crowdWinning is false 3/4', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5]});
        assert(!crowdWinning);
    });
    it('Admin cannot withdraw and close until close date is reached', async () => {
        try {
          auctionEnd = await chocoPowerAuction.auctionEnd();
          assert(false);
        } catch(e) {
          assert(e.message === Errors[5]);
        }
    });
    it('Auction remains open', async () => {
        isClosed = await chocoPowerAuction.isClosed.call();
        assert(!isClosed);
    });
    it('Ex nuovo lone bidder reenter', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[2], value: 40000000000 });
        assert(bid.receipt.status);
    });
    it('Overcame lone bidder withdraw funds', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 50000000000 });
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
        assert(withdrawPendings.toNumber() === 40000000000);
    });
    it('Balance of contract is right 2', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 90000000001);
    });
    it('New balance of exit bidder', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('New crowd bidder enters', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[6], value: 30000000000});
        assert(bid.receipt.status);
    });
    it('Balance of contract is right 3/', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 120000000001);
    });
    it('highbid is correct', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 50000000000);
    });
    it('crowdAmount is correct', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[7] });
        assert(crowdAmount == 50000000000);
    })
    it('crowdWinning is false 4/4', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning({ from: accounts[3] });
        assert(!crowdWinning);
    });
    it('highestBidder is correct', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[1] });
        assert(highestBidder == accounts[3]);
    });
    it('Third crowd bidder enters', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[7], value: 20000000000});
        assert(bid.receipt.status);
    });
    it('Balance of contract is right 3/ after takeMillestone', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 140000000001);
    });
    it('crowdAmount is correct', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount();
        assert(crowdAmount.toNumber() == 70000000000);
    });
    it('highbid is correct', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 70000000000);
    });
    it('Crowdamount is correct', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[2] });
        assert(crowdAmount.toNumber() == highestBid.toNumber());
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning({ from: accounts[3] });
        assert(crowdWinning);
    });
    it('highestBidder is correct', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[1] });
        assert(highestBidder == accounts[0]);
    });
    it('Crowd funder unable to whitdraw before end of auction', async () =>  {
        try {
          withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[7] });
          assert(false);
        } catch(e) {
            assert(e.message == Errors[10]);
        }
    });
    it('Beneficiary unable to whitdraw before end of auction', async () =>  {
        try {
          withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[0] });
          assert(false);
        } catch(e) {
            assert(e.message == Errors[12]);
        }
    });
    it('After try to withdraw crowd funder has still pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( { from: accounts[7] });
        assert(myPendingFunds.toNumber() == 20000000000);
    });
    it('Crowd funder unable to bid', async () => {
        try {
          bid = await chocoPowerAuction.bid(1, { from: accounts[7], value: 50000000000 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[1]);
        }
    });
    it('Crowd funder make a rebid', async () => {
        bid = await chocoPowerAuction.rebid(1, { from: accounts[7], value: 50000000000 });
        assert(bid.receipt.status);
    });
    it('Pending funds after rebid', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[7] });
        assert(myPendingFunds.toNumber() == 70000000000 )
    });
    it('Crowdamount is correct', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[2] });
        assert(crowdAmount.toNumber() + 70000000000);
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 190000000001);
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning();
        assert(crowdWinning); 
    });
    it('highbidder is beneficiary', async () => {
        highestBidder = await chocoPowerAuction.highestBidder();
        assert(highestBidder == accounts[0]);
    });
    it('highbid is right 1/2 ******************', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        console.log(highestBid.toNumber());
        assert(highestBid.toNumber() == 120000000000);
    });
    it('CrowdAmount is right*********', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount();
        console.log(crowdAmount.toNumber());
        assert(highestBid.toNumber() == 290000000001);
    });
    it('Balance of Lone funder******.*.*.*.*.*.*.*.*.*', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[1]});
        console.log(crowdAmount.toNumber());
        assert(false);
    })
    it('Lone funder change to crowd', async () => {
        chocoPowerFundingCrowd = await chocoPowerAuction.chocoPowerFundingCrowd({ from: accounts[1] });
        assert(chocoPowerFundingCrowd);
    });
    it('CrowdAmount is right*********', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount();
        console.log(crowdAmount.toNumber());
        assert(highestBid.toNumber() == 290000000001);
    });
    it('Balance of contract has not change', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 190000000001);
    });
    it('highbid is right 2/3', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 140000000001);
    });
    it('lone bidder unable with equal amount', async () => {
        try {
          bid = await chocoPowerAuction.bid(0, { from: accounts[9], value: 140000000001 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[2]);
        }
    });
    it('Enter highest lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[8], value: 150000000000 });
        assert(bid.receipt.status);
    });
    it('Higgest funder change to crowd', async () => {
        chocoPowerFundingCrowd = await chocoPowerAuction.chocoPowerFundingCrowd({ from: accounts[8] });
        assert(chocoPowerFundingCrowd);
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 340000000001);
    });
    it('highbidder is set properly', async () => {
        highestBidder = await chocoPowerAuction.highestBidder();
        assert(highestBidder == accounts[0]);
    });
    it('highbid is right 3/3', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 290000000001);
    });
    it('CrowdAmount is right', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount();
        console.log(crowdAmount.toNumber());
        assert(highestBid.toNumber() == 290000000001);
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning();
        assert(crowdWinning); 
    });
    it('Pending funds of ex highest bidder are Right',  async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[8] });
        assert(myPendingFunds.toNumber() == 150000000000);
    });
    it('Enter highest lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[9], value: 300000000000 });
        assert(bid.receipt.status);
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 640000000001);
    });
    it('ex highestBidder fund kind is right', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[8] });
        assert(myPendingFundsType == 1);
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning();
        assert(!crowdWinning); 
    });
    it('Last crowd bid before close', async () => {
        bid = await chocoPowerAuction.rebid(1, { from: accounts[7], value: 99999999999 });
        assert(bid.receipt.status);
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning();
        assert(!crowdWinning); 
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Beneficiary unable to take higgest bid ', async () => {
        try {
          auctionEnd = await chocoPowerAuction.auctionEnd.call({ from: accounts[0] });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[11]);
        }
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time > Fri_Nov_01_00_00_UTC_2019);
    });
    it('Higgest bid', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        console.log(highestBid.toNumber());
        assert(highestBid.toNumber() == 300000000000);
    });
    it('Balance of contract is right before close', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 740000000000);
    });
    it('Beneficiary take higgest bid and close auction', async () => {
          auctionEnd = await chocoPowerAuction.auctionEnd({ from: accounts[0] });
          assert(auctionEnd.receipt.status);
    });
    it('Last lone bid to close the auction', async () => {
        try {
            bid = await chocoPowerAuction.bid(0, { from: accounts[4], value: 250000000000 });
            assert(false);
        } catch(e) {
            assert(e.message == Errors[6]);
        }
    });
    it('Balance of contract is right after close', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 740000000000 - highestBid.toNumber());
    });
    it('No more lone bids are allowed', async () => {
        try {
          rebid = await chocoPowerAuction.rebid(0, { from: accounts[9], value: 600000000000});
          assert(false);
        } catch(e) {
          assert(e.message === Errors[6]);
        }
    });
    it('Last highest bidder info is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[5]});
        assert(highestBidder === accounts[9]);
    });
    it('Auction is closed', async () => {
        isClosed = await chocoPowerAuction.isClosed({ from: accounts[5]});
        assert(isClosed);
    });
    it('Highest bidder has not pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[4] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('Highest bidder cannot make withdraw', async () => {
        highestBidder = await chocoPowerAuction.highestBidder();
        try {
          withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: highestBidder });
          assert(false);
        } catch(e) {
          assert(e.message === Errors[13]);
        }
    });
    it('Crowd amount isn\'t highestBid', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
        assert(crowdAmount.toNumber() != highestBid.toNumber());
    });
    it('Type of Pendings Funds 1/4', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[1] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Type of Pendings Funds 2/4', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[5] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Type of Pendings Funds 3/4', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[6] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Type of Pendings Funds 4/4', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[7] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Pendings Funds before account 7', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[7] });
        assert(myPendingFunds.toNumber() == 169999999999);
    });
    it('Crowd bidder make a withdraw 1/4', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[1] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[1] });
        assert(withdrawPendings.toNumber() == 20000000001);
    });
    it('Crowd bidder make a withdraw 2/4', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[5] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[5] });
        assert(withdrawPendings.toNumber() == 20000000000);
    });
    it('Crowd bidder make a withdraw 3/4', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[6] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[6] });
        assert(withdrawPendings.toNumber() == 30000000000);
    });
    it('Crowd bidder make a withdraw 4/4', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[7] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[7] });
        assert(withdrawPendings.toNumber() == 169999999999);
    });
    it('Pendings Funds after withdraws', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[7] });
        assert(myPendingFunds.toNumber() == 0);
    });
    it('Crowd amount after all withdraws is zero', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
        assert(crowdAmount.toNumber() == 0);
    });
    it('Beneficiary take higgest bid', async () => {
        auctionEnd = await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        assert(auctionEnd.receipt.status);
    });
    it('Higgest bid info remains', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 300000000000);
    });
    it('No winner lone bidder make a withdraw', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[3] });
        assert(auctionEnd.receipt.status);
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('higgest bid', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid);
    });
    it('Beneficiary withdraw with auctionEnd', async () => {
        auctionEnd == await chocoPowerAuction.auctionEnd( { from: accounts[0] });
        assert(auctionEnd.receipt.status);
    });
    it('Withdrawn all highestBid already', async () => {
      withdrawn = await chocoPowerAuction.withdrawn();
      assert(highestBid.toNumber() - withdrawn.toNumber() == 0);
    });
    it('Withdraw lone funder 1/2', async () => {
        withdrawn = await chocoPowerAuction.withdrawPendings({ from: accounts[8] });
        assert(auctionEnd.receipt.status);
    });
    it('Final balance', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 0);
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
  });

 contract('chocoPowerAuction_v3', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('Beneficiary is sender', async () => {
        const beneficiary = await chocoPowerAuction.beneficiary()
        assert(beneficiary === accounts[0]);
    });
    it('Higgest Bid must be 0', async () => {
        highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
        assert(highestBid.toNumber() === 0);
    });
    it('Higgest Bidder must be undefined', async () => {
        highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[1] });
        assert(highestBidder === ZERO_ADDR);
    });
    it('CrowdsPot is assigned', async () => {
        crowdsPot = await chocoPowerAuction.crowdsPot({ from: accounts[5] });
        assert(crowdsPot === accounts[0]);
    });
    it('crowdWinning is false 1/4', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning({ from: accounts[5] });
        assert(!crowdWinning);
    });
    it('crowdAmount must be zero 1/2', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 0);
    });
    it('withdrawn must be zero 1/3', async () => {
        withdrawn = await chocoPowerAuction.withdrawn({ from: accounts[4] });
        assert(withdrawn.toNumber() === 0);
    });
    it('Receiving properly a lone bid', async () => {
        await chocoPowerAuction.bid(0, { from: accounts[1], value: 10000000000 });
        highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
        assert(highestBid.toNumber() === 10000000000);
    })
    it('Set properly the highest bidder', async () => {
        highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[2] });
        assert(highestBidder === accounts[1]);
    });
    it('Receiving a new highest lone bid', async () => {
        await chocoPowerAuction.bid(0, { from: accounts[2], value: 20000000000 });
        highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[0] });
        assert(highestBid.toNumber() === 20000000000);
    });
    it('Set properly new highest lone bidder', async () => {
        highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[0] });
        assert(highestBidder === accounts[2]);
    });
    it('Set properly Pending returns', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds.call({ from: accounts[1] });
        assert(myPendingFunds.toNumber() === 10000000000);
    });
    it('Overcame bidder unable to make a lone bid', async () => {
        try {
          bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 30000000000 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[1]);
        }
    });
    it('Overcame bidder make a lone rebid', async () => {
        rebid = await chocoPowerAuction.rebid(0, { from: accounts[1], value: 10000000001 });
        assert(rebid.receipt.status);
    });
    it('Check pendings funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
        assert(myPendingFunds.toNumber() === 20000000000);
    });
    it('Check right balance', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[3] });
        assert(balance.toNumber() == 40000000001);
    });
    it('New bidder unable to lone bid with lower amount', async () => {
        try{
          bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 20000000000 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[2]);
        }
    });
    it('New bidder unable to lone bid with equal amount', async () => {
        try{
          bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 20000000001 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[2]);
        }
    });
    it('No bidder has not pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[3] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('Highest bidder has not change', async () => {
        highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[0] });
        assert(highestBidder === accounts[1]);
    });
    it('Highest bidder has not pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[1] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('Lower lone bidder withdraw pendings funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
        assert(withdrawPendings.toNumber() == myPendingFunds.toNumber());
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 20000000001);
    });
    it('Exit bidder has not pendings funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('Higher bidder cannot make a new highest lone bid', async () => {
        try {
          myPendingFunds = await chocoPowerAuction.bid(0, { from: accounts[1], value:20000000002 });
          assert(false);
        } catch(e) {
          assert(e.message === Errors[3]);
        }
    });
    it('Not bidder user unable to use rebid function', async () => {
        try {
          rebid = await chocoPowerAuction.rebid(0, { from: accounts[4], value: 50000000000 });
          assert(false);
        } catch(e) {
          assert(e.message === Errors[9]);
        }
    });
    it('crowdAmount must be zero 2/2', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 0);
    });
    it('crowdWinning is false 2/4', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5]});
        assert(!crowdWinning);
    });
    it('First crow bider enter to play', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[5], value: 20000000000 });
        assert(bid.receipt.status);
    });
    it('crowdAmount has change properly', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
        assert(crowdAmount.toNumber() === 20000000000);
    });
    it('crowdWinning is false 3/4', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5]});
        assert(!crowdWinning);
    });
    it('Admin cannot withdraw and close until close date is reached', async () => {
        try {
          auctionEnd = await chocoPowerAuction.auctionEnd();
          assert(false);
        } catch(e) {
          assert(e.message === Errors[5]);
        }
    });
    it('Auction remains open', async () => {
        isClosed = await chocoPowerAuction.isClosed.call();
        assert(!isClosed);
    });
    it('Ex nuovo lone bidder reenter', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[2], value: 40000000000 });
        assert(bid.receipt.status);
    });
    it('Overcame lone bidder withdraw funds', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 50000000000 });
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
        assert(withdrawPendings.toNumber() === 40000000000);
    });
    it('Balance of contract is right 2', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 90000000001);
    });
    it('New balance of exit bidder', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('New crowd bidder enters', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[6], value: 30000000000 });
        assert(bid.receipt.status);
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 120000000001);
    });
    it('highbid is correct', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 50000000000);
    });
    it('crowdAmount is correct', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[7] });
        assert(crowdAmount == 50000000000);
    });
    it('crowdWinning is false 4/4', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning({ from: accounts[3] });
        assert(!crowdWinning);
    });
    it('highestBidder is correct', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[1] });
        assert(highestBidder == accounts[3]);
    });
    it('Third crowd bidder enters', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[7], value: 20000000000 });
        assert(bid.receipt.status);
    });
    it('Balance of contract is right after takeMillestone', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 140000000001);
    });
    it('highbid is correct', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 70000000000);
    });
    it('Crowd Amount is correct', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[2] });
        assert(crowdAmount.toNumber() == highestBid.toNumber());
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning({ from: accounts[3] });
        assert(crowdWinning);
    });
    it('highestBidder is correct', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[1] });
        assert(highestBidder == accounts[0]);
    });
    it('Crowd funder unable to whitdraw before end of auction', async () =>  {
        try {
          withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[7] });
          assert(false);
        } catch(e) {
            assert(e.message == Errors[10]);
        }
    });
    it('Beneficiary unable to whitdraw before end of auction', async () =>  {
        try {
          withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[0] });
          assert(false);
        } catch(e) {
            assert(e.message == Errors[12]);
        }
    });
    it('After try to withdraw crowd funder has still pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( { from: accounts[7] });
        assert(myPendingFunds.toNumber() == 20000000000);
    });
    it('Crowd funder unable to bid', async () => {
        try {
          bid = await chocoPowerAuction.bid(1, { from: accounts[7], value: 50000000000 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[1]);
        }
    });
    it('Crowd funder make a rebid', async () => {
        bid = await chocoPowerAuction.rebid(1, { from: accounts[7], value: 50000000000 });
        assert(bid.receipt.status);
    });
    it('Pending funds after rebid', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[7] });
        assert(myPendingFunds.toNumber() == 70000000000 )
    });
    it('Crowdamount is correct', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[2] });
        assert(crowdAmount.toNumber() == 120000000000);
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 190000000001);
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning();
        assert(crowdWinning); 
    });
    it('highbidder is beneficiary', async () => {
        highestBidder = await chocoPowerAuction.highestBidder();
        assert(highestBidder == accounts[0]);
    });
    it('highbid is right 1/2', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 120000000000);
    });
    it('Lone funder change to crowd', async () => {
        chocoPowerFundingCrowd = await chocoPowerAuction.chocoPowerFundingCrowd({ from: accounts[1] });
        assert(chocoPowerFundingCrowd);
    });
    it('Balance of contract has not change', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 190000000001);
    });
    it('highbid is right 2/3', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == 140000000001);
    });
    it('lone bidder unable with equal amount', async () => {
        try {
          bid = await chocoPowerAuction.bid(0, { from: accounts[9], value: 140000000001 });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[2]);
        }
    });
    it('Enter highest lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[8], value: 150000000000 });
        assert(bid.receipt.status);
    });
    it('Crowdwinner is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning();
        assert(!crowdWinning);
    });
    it('Highest funder change to crowd', async () => {
        chocoPowerFundingCrowd = await chocoPowerAuction.chocoPowerFundingCrowd({ from: accounts[8] });
        assert(chocoPowerFundingCrowd);
    });
    it('Check CrowdAmount', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount();
        assert(crowdAmount.toNumber() == 290000000001);
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 340000000001);
    });
    it('highbidder is set properly', async () => {
        highestBidder = await chocoPowerAuction.highestBidder();
        assert(highestBidder == crowdsPot);
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning();
        assert(crowdWinning); 
    });
    it('Pending funds of ex highest lone bidder are Right',  async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[8] });
        assert(myPendingFunds.toNumber() == 150000000000);
    });
    it('Enter highest crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[9], value: 300000000000 });
        assert(bid.receipt.status);
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 640000000001);
    });
    it('ex highestBidder fund kind is right', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[8] });
        assert(myPendingFundsType == 1);
    });
    it('Last crowd bid before close', async () => {
        bid = await chocoPowerAuction.rebid(1, { from: accounts[7], value: 200000000000 });
        assert(bid.receipt.status);
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Beneficiary unable to take higgest bid', async () => {
        try {
          auctionEnd = await chocoPowerAuction.auctionEnd.call({ from: accounts[0] });
          assert(false);
        } catch(e) {
          assert(e.message == Errors[11]);
        }
    });
    it('Balance of contract is right', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 840000000001);
    });
    it('Highestbid is right', async () => {
        highestBid = await chocoPowerAuction.highestBid({ from: accounts[3] });
        assert(highestBid.toNumber() == 790000000001);
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time > Fri_Nov_01_00_00_UTC_2019);
    });
    it('Balance of contract is right before close', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 840000000001);
    });
    it('Beneficiary take higgest bid and close auction', async () => {
        auctionEnd = await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        assert(auctionEnd.receipt.status);
    });
    it('Unable to make a lower lone bid', async () => {
        try {
            bid = await chocoPowerAuction.bid(0, { from: accounts[4], value: 250000000000 });
            assert(false);
        } catch(e) {
            assert(e.message == Errors[6]);
        }
    });
    it('Balance of contract is right after close', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 50000000000);
    });
    it('No more lone bids are allowed', async () => {
        try {
          rebid = await chocoPowerAuction.rebid(0, { from: accounts[9], value: 600000000000 });
          assert(false);
        } catch(e) {
          assert(e.message === Errors[6]);
        }
    });
    it('Last highest bidder info is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[5]});
        assert(highestBidder === crowdsPot);
    });
    it('Auction is closed', async () => {
        isClosed = await chocoPowerAuction.isClosed({ from: accounts[5]});
        assert(isClosed);
    });
    it('Highest bidder has not pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[4] });
        assert(myPendingFunds.toNumber() === 0);
    });
    it('Highest bidder cannot make withdraw', async () => {
        highestBidder = await chocoPowerAuction.highestBidder();
        try {
          withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: highestBidder });
          assert(false);
        } catch(e) {
          assert(e.message === Errors[13]);
        }
    });
    it('Crowd amount is highestBid', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
        assert(crowdAmount.toNumber() == highestBid.toNumber());
    });
    it('crowdWinning is True', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning({ from: accounts[1] });
        assert(crowdWinning); 
    });
    it('Type of Pendings Funds 1/6', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[1] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Type of Pendings Funds 2/6', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[5] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Type of Pendings Funds 3/6', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[6] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Type of Pendings Funds 4/6', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[7] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Type of Pendings Funds 5/6', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[8] });
        assert(myPendingFundsType.toNumber() == 1);
    });    
    it('Type of Pendings Funds 6/6', async () => {
        myPendingFundsType = await chocoPowerAuction.myPendingFundsType({ from: accounts[9] });
        assert(myPendingFundsType.toNumber() == 1);
    });
    it('Beneficiary take higgest bid', async () => {
        auctionEnd = await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        assert(auctionEnd.receipt.status);
    });
    it('Higgest bid info remains', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[1] });
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid.toNumber() == crowdAmount.toNumber());
    });
    it('No winner lone bidder make a withdraw', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[3] });
        assert(auctionEnd.receipt.status);
    });
    it('crowdWinning is True', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(crowdWinning);
    });
    it('higgest bid', async () => {
        highestBid = await chocoPowerAuction.highestBid();
        assert(highestBid);
    });
    it('Beneficiary withdraw with auctionEnd', async () => {
        auctionEnd == await chocoPowerAuction.auctionEnd( { from: accounts[0] });
        assert(auctionEnd.receipt.status);
    });
    it('Withdrawn all highestBid already', async () => {
      withdrawn = await chocoPowerAuction.withdrawn();
      assert(highestBid.toNumber() - withdrawn.toNumber() == 0);
    });
    it('No bider unable to make a withdraw', async () => {
        try {
            withdrawn = await chocoPowerAuction.withdrawPendings({ from: accounts[4] });
            assert(false);
        } catch(e) {
            assert(auctionEnd.receipt.status);
        }
    });
    it('Final balance', async () => {
        balance = await chocoPowerAuction.balance();
        assert(balance.toNumber() == 0);
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
  });
