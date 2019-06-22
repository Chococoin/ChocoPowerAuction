const ChocoPowerAuction = artifacts.require('ChocoPowerAuction');
const Errors = require('./tools/errors.js');
const Utils = require('./tools/utils.js')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const now = Math.floor((Date.now()) / 1000);
const Fri_Nov_01_00_00_UTC_2019 = 1572566400;

var chocoPowerAuction, chocoPowerAuction2, highestBid, highestBidder, auctionEnd,
bid, rebid, myPendingFunds, isClosed, balance, snapShot, crowdsPot, crowdAmount,
withdrawPendings, withdrawn, crowdWinning, chocoPowerFundingCrowd;

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
      crowdsPot = await chocoPowerAuction.crowdsPot( { from: accounts[5]});
      assert(crowdsPot === accounts[0]);
  });
  it('crowdWinning is false 1/4', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5]});
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
      await chocoPowerAuction.bid(0, {from: accounts[1], value: 100000000000});
      highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
      assert(highestBid.toNumber() === 100000000000);
  })
  it('Set properly the highest bidder', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[2] });
      assert(highestBidder === accounts[1]);
  });
  it('Receiving a new highest lone bid', async () => {
      await chocoPowerAuction.bid(0, {from: accounts[2], value: 200000000000});
      highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[0] });
      assert(highestBid.toNumber() === 200000000000);
  });
  it('Set properly new highest lone bidder', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[0] });
      assert(highestBidder === accounts[2]);
  });
  it('Set properly Pending returns', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds.call({ from: accounts[1] });
      assert(myPendingFunds.toNumber() === 100000000000);
  });
  it('Overcame bidder unable to make a lone bid', async () => {
      try {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 300000000000 });
      } catch(e) {
        assert(e.message == Errors[1]);
      }
  });
  it('Overcame bidder make a lone rebid', async () => {
      rebid = await chocoPowerAuction.rebid(0, { from: accounts[1], value: 100000000001 });
      assert(rebid.receipt.status);
  });
  it('Check pendings funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 200000000000);
  });
  it('New bidder unable to lone bid with lower amount', async () => {
      try{
        bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 200000000000 });
      } catch(e) {
        assert(e.message == Errors[2]);
      }
  });
  it('New bidder unable to lone bid with equal amount', async () => {
      try{
        bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 200000000001 });
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
      assert(balance.toNumber() == 200000000001);
  });
  it('Exit bidder has not pendings funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Higher bidder cannot make a new highest lone bid', async () => {
      try {
        myPendingFunds = await chocoPowerAuction.bid(0, { from: accounts[1], value:200000000002 });
      } catch(e) {
        assert(e.message === Errors[3]);
      }
  });
  it('Not bidder user unable to use rebid function', async () => {
      try {
        rebid = await chocoPowerAuction.rebid(0, { from: accounts[4], value: 500000000000 });
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
      bid = await chocoPowerAuction.bid(1, { from: accounts[5], value: 200000000000 });
      assert(bid.receipt.status);
  });
  it('crowdAmount has change properly', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[0] });
      assert(crowdAmount.toNumber() === 200000000000);
  });
  it('crowdWinning is false 3/4', async () => {
      crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5]});
      assert(!crowdWinning);
  });
  it('Admin cannot withdraw and close until close date is reached', async () => {
      try {
        auctionEnd = await chocoPowerAuction.auctionEnd();
      } catch(e) {
        assert(e.message === Errors[5]);
      }
  });
  it('Auction remains open', async () => {
      isClosed = await chocoPowerAuction.isClosed.call();
      assert(!isClosed);
  });
  it('Ex nuovo lone bidder reenter', async () => {
      bid = await chocoPowerAuction.bid(0, { from: accounts[2], value: 400000000000 });
      assert(bid.receipt.status);
  });
  it('Overcame lone bidder withdraw funds', async () => {
      bid = await chocoPowerAuction.bid(0, { from: accounts[3], value: 500000000000 });
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
      await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
      assert(withdrawPendings.toNumber() === 400000000000);
  });
  it('Balance of contract is right 2', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 900000000001);
  });
  it('New balance of exit bidder', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('New crowd bidder enters', async () => {
      bid = await chocoPowerAuction.bid(1, { from: accounts[6], value: 300000000000});
      assert(bid.receipt.status);
  });
  it('Balance of contract is right 3/', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 1200000000001);
  });
  it('highbid is correct', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid.toNumber() == 500000000000);
  });
  it('crowdAmount is correct', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[7] });
      assert(crowdAmount == 500000000000);
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
      bid = await chocoPowerAuction.bid(1, { from: accounts[7], value: 200000000000});
      assert(bid.receipt.status);
  });
  it('crowdAmount is correct', async () => {
      crowdAmount = await chocoPowerAuction.crowdAmount();
      assert(crowdAmount.toNumber() == 700000000000);
  });
  it('highbid is correct', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid.toNumber() == 700000000000);
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
      } catch(e) {
          assert(e.message == Errors[10]);
      }
  });
  it('After try to withdraw crowd funder has still pending funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds( { from: accounts[7] });
      assert(myPendingFunds.toNumber() == 200000000000);
  });
  it('Crowd funder unable to bid', async () => {
      try {
        bid = await chocoPowerAuction.bid(1, { from: accounts[7], value: 500000000000 });
      } catch(e) {
        assert(e.message == Errors[1]);
      }
  });
  it('Crowd funder make a rebid', async () => {
      bid = await chocoPowerAuction.rebid(1, { from: accounts[7], value: 500000000000 });
      assert(bid.receipt.status);
  });
  it('Balance of contract is right 3/ after takeMillestone', async () => {
      balance = await chocoPowerAuction.balance();
      assert(balance.toNumber() == 700000000001);
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
      assert(highestBid.toNumber() == 1200000000000);
  });
  it('Lone funder change to crowd', async () => {
      chocoPowerFundingCrowd = await chocoPowerAuction.chocoPowerFundingCrowd({ from: accounts[1] });
      assert(chocoPowerFundingCrowd);
  });
  it('highbid is right 2/2', async () => {
      highestBid = await chocoPowerAuction.highestBid();
      assert(highestBid.toNumber() == 1400000000001);
  });
  it('Set moment before end of auction', async () => {
      snapShot = await Utils.takeSnapshot();
      assert(snapShot);
  });
  it('Beneficiary unable to take higgest bid ', async () => {
      try {
        auctionEnd = await chocoPowerAuction.auctionEnd.call({ from: accounts[0] });
      } catch(e) {
        assert(e.message == Errors[11]);
      }
  });
  it('After End of Auction', async () => {
      await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
      let time = await Utils.getCurrentTime();
      assert(time > Fri_Nov_01_00_00_UTC_2019);
  });
  it('Last lone bid to close the auction', async () => {
      bid = await chocoPowerAuction.bid(0, { from: accounts[4], value: 5000000000000000000 });
      assert(bid.receipt.status);
  });
  it('No more lone bids are allowed', async () => {
      try {
        bid = await chocoPowerAuction.bid(0, { from: accounts[5], value: 6000000000000000000});
      } catch(e) {
        assert(e.message === Errors[6]);
      }
  });
  it('Last highest bidder info remain', async () => {
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
      try {
        withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[4] });
      } catch(e) {
        assert(e.message === Errors[7]);
      }
  });
  it('Crowd bidder unable to make a withdraw', async () => {
      try {
        withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[1] });
      } catch(e) {
          assert(e.message === Errors[10]);
      }
  });
  it('Beneficiary take higgest bid', async () => {
      auctionEnd = await chocoPowerAuction.auctionEnd({ from: accounts[0] });
      assert(auctionEnd.receipt.status);
  });
  it('No winner lone bidder make a withdraw', async () => {
      withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[3] });
      assert(auctionEnd.receipt.status);
  });
  it('Revert to snapshot', async () => {
      await Utils.revertToSnapShot(snapShot.result);
      await Utils.advanceBlock();
      let time = await Utils.getCurrentTime();
  });
});

contract('chocoPowerAuction_v2', (accounts) => {
  it('Deploy the Smart Contract', async () => {
      chocoPowerAuction2 = await ChocoPowerAuction.new();
      assert(chocoPowerAuction2.address !== '');
  });
  it('Beneficiary is sender', async () => {
      const beneficiary = await chocoPowerAuction2.beneficiary()
      assert(beneficiary == accounts[0]);
  });
  it('Higgest Bid must be 0', async () => {
      highestBid = await chocoPowerAuction2.highestBid.call({ from: accounts[2] });
      assert(highestBid.toNumber() === 0);
  });
  it('Higgest Bidder must be undefined', async () => {
      highestBidder = await chocoPowerAuction2.highestBidder.call({ from: accounts[1] });
      assert(highestBidder === ZERO_ADDR);
  });
  it('New instance is open', async () => {
      isClosed = await chocoPowerAuction2.isClosed();
      assert(!isClosed);
  });
  it('Receiving properly a lone bid', async () => {
      var newBid = 5 * Math.pow(10, 18);
      bid = await chocoPowerAuction2.bid(0, { from: accounts[1], value: newBid });
      assert(bid);
  })
  it('Set properly the highest bidder', async () => {
      highestBidder = await chocoPowerAuction2.highestBidder.call({ from: accounts[2] });
      assert(highestBidder === accounts[1]);
  });
  it('Receiving a new highest lone bid', async () => {
      bid = await chocoPowerAuction2.bid(0, {from: accounts[2], value: 6 * Math.pow(10, 18)});
      assert(bid);
  });
  it('Set properly new highest bidder', async () => {
      highestBidder = await chocoPowerAuction2.highestBidder.call({ from: accounts[0] });
      assert(highestBidder === accounts[2]);
  });
  it('Set properly Pending returns', async () => {
      myPendingFunds = await chocoPowerAuction2.myPendingFunds.call({ from: accounts[1] });
      assert(myPendingFunds);
  });
  it('Overcame bidder unable to make a lone bid', async () => {
      try {
       bid = await chocoPowerAuction2.bid(0, { from: accounts[1], value: 2 * Math.pow(10, 18) });
      } catch(e) {
        assert(e.message == Errors[1]);
      }
  });
  it('Overcame bidder make a lone rebid', async () => {
      rebid = await chocoPowerAuction2.rebid(0, { from: accounts[1], value: 2 * Math.pow(10, 18) });
      assert(rebid.receipt.status);
  });
  it('Lower bidder withdraw pendings funds', async () => {
      withdrawPendings = await chocoPowerAuction2.withdrawPendings({ from: accounts[2] });
      assert(withdrawPendings.receipt.status);
  });
  it('Ex nuovo lone bidder reenter', async () => {
      bid = await chocoPowerAuction2.bid(0, { from: accounts[2], value: 8 * Math.pow(10, 18)  });
      assert(bid.receipt.status);
  });
  it('Set moment before end of auction', async () => {
      snapShot = await Utils.takeSnapshot();
      assert(snapShot);
  }); 
  it('After End of Auction', async () => {
      await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
      let time = await Utils.getCurrentTime();
      assert(time > Fri_Nov_01_00_00_UTC_2019);
  });
  it('Not beneficiary unable to ends the auction', async () => {
      try {
        auctionEnd = await chocoPowerAuction2.auctionEnd({ from: accounts[3] });
      } catch(e) {
        assert(e.message === Errors[8]);
      }
  });
  it('Beneficiary ends the auction', async () => {
      auctionEnd = await chocoPowerAuction2.auctionEnd.call({ from: accounts[0] });
      await chocoPowerAuction2.auctionEnd({ from: accounts[0]});
      assert(auctionEnd);
  });
  it('Auction is closed', async () => {
      isClosed = await chocoPowerAuction2.isClosed({ from: accounts[5]});
      assert(isClosed);
  });
  it('Last highest bidder info remain', async () => {
      highestBidder = await chocoPowerAuction2.highestBidder({ from: accounts[5]});
      assert(highestBidder === accounts[2]);
  });
  it('No winner bidder make a withdraw', async () => {
      withdrawPendings = await chocoPowerAuction2.withdrawPendings({ from: accounts[1] });
      assert(withdrawPendings.receipt.status);
  });
  it('Revert to snapshot', async () => {
      await Utils.revertToSnapShot(snapShot.result);
      let time = await Utils.getCurrentTime();
  });
})
