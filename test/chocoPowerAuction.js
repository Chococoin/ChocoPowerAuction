const chocoPowerAuction = artifacts.require('ChocoPowerAuction');
const Errors = require('./tools/errors.js');
const Utils = require('./tools/utils.js')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const now = Math.floor((Date.now()) / 1000);
const Fri_Nov_01_00_00_UTC_2019 = 1572566400;

var chocoPowerAuction, chocoPowerAuction2, highestBid, highestBidder, auctionEnd,
bid, rebid, myPendingFunds, isClosed, balance, snapShot;

contract('chocoPowerAuction_v1', (accounts) => {
  it('Deploy the Smart Contract', async () => {
      chocoPowerAuction = await chocoPowerAuction.deployed();
      assert(chocoPowerAuction.address !== '');
  });
  it('Beneficiary is sender', async () => {
      const beneficiary = await chocoPowerAuction.beneficiary()
      assert(beneficiary == accounts[0]);
  });
  it('Higgest Bid must be 0', async () => {
      highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
      assert(highestBid.toNumber() === 0);
  });
  it('Higgest Bidder must be undefined', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[1] });
      assert(highestBidder === ZERO_ADDR);
  });
  it('Receiving properly a bid', async () => {
      await chocoPowerAuction.bid({from: accounts[1], value: 100000000000});
      highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[2] });
      assert(highestBid.toNumber() === 100000000000);
  })
  it('Set properly the highest bidder', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[2] });
      assert(highestBidder === accounts[1]);
  });
  it('Receiving a new highest bid', async () => {
      await chocoPowerAuction.bid({from: accounts[2], value: 200000000000});
      highestBid = await chocoPowerAuction.highestBid.call({ from: accounts[0] });
      assert(highestBid.toNumber() === 200000000000);
  });
  it('Set properly new highest bidder', async () => {
      highestBidder = await chocoPowerAuction.highestBidder.call({ from: accounts[0] });
      assert(highestBidder === accounts[2]);
  });
  it('Set properly Pending returns', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds.call({ from: accounts[1] });
      assert(myPendingFunds.toNumber() === 100000000000);
  });
  it('Overcame bidder unable to make a bid', async () => {
    try {
    bid = await chocoPowerAuction.bid({ from: accounts[1], value: 300000000000 });
    } catch(e) {
      assert(e.message == Errors[1]);
    }
  });
  it('Overcame bidder make a rebid', async () => {
      rebid = await chocoPowerAuction.rebid({ from: accounts[1], value: 100000000001 });
      assert(rebid.receipt.status);
  });
  it('Check pendings funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 200000000000);
  });
  it('New bidder unable to bid with lower amount', async () => {
    try{
      bid = await chocoPowerAuction.bid({ from: accounts[3], value: 200000000000 });
    } catch(e) {
        assert(e.message == Errors[2]);
    }
  });
  it('New bidder unable to bid with equal amount', async () => {
    try{
      bid = await chocoPowerAuction.bid({ from: accounts[3], value: 200000000001 });
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
  it('Lower bidder withdraw pendings funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
      await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
      assert(withdrawPendings.toNumber() == myPendingFunds.toNumber());
  });
  it('Exit bidder has not pendings funds', async () => {
      myPendingFunds = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Higher bidder cannot make a new highest bid', async () => {
    try {
        myPendingFunds = await chocoPowerAuction.bid({ from: accounts[1], value:200000000002 });
    } catch(e) {
        assert(e.message === Errors[3]);
    }
  });
  it('Not bidder user unable to rebidding', async () => {
    try {
      rebid = await chocoPowerAuction.rebid({ from: accounts[4], value: 500000000000 });
    } catch(e) {
        assert(e.message === Errors[4]);
    }
  });
  it('Admin cannot withdraw and close before end', async () => {
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
  it('Ex nuovo bidder reenter', async () => {
      bid = await chocoPowerAuction.bid({ from: accounts[2], value: 400000000000 });
      assert(bid.receipt.status);
  });
  it('Overcame bidder withdraw funds', async () => {
      bid = await chocoPowerAuction.bid({ from: accounts[3], value: 500000000000 });
      withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
      assert(withdrawPendings.toNumber() === 400000000000);
  });
  it('New balance of exit bidder', async () => {
      withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
      balance = await chocoPowerAuction.myPendingFunds({ from: accounts[2] });
      assert(balance.toNumber() === 0);
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
  it('Last bid to close the auction', async () => {
      bid = await chocoPowerAuction.bid({ from: accounts[4], value: 5000000000000000000 });
      assert(bid.receipt.status);
  });
  it('No more bids are allowed', async () => {
    try {
      bid = await chocoPowerAuction.bid({ from: accounts[5], value: 6000000000000000000});
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
  it('No winner bidder make a withdraw 1/2', async () => {
      withdrawPendings = await chocoPowerAuction.withdrawPendings({ from: accounts[1] });
      assert(withdrawPendings.receipt.status);
  });
  it('Benificiary take higgest bid 1/2', async () => {
      auctionEnd = await chocoPowerAuction.auctionEnd.call({ from: accounts[0] });
      assert(auctionEnd);
  });
  it('Benificiary take higgest bid 2/2', async () => {
      auctionEnd = await chocoPowerAuction.auctionEnd({ from: accounts[0] });
      assert(auctionEnd.receipt.status);
  });
  it('No winner bidder make a withdraw 2/2', async () => {
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
      chocoPowerAuction2 = await chocoPowerAuction.new();
      assert(chocoPowerAuction.address !== '');
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
  it('Receiving properly a bid', async () => {
      var newBid = 5 * Math.pow(10, 18);
      bid = await chocoPowerAuction2.bid({ from: accounts[1], value: newBid });
      assert(bid);
  })
  it('Set properly the highest bidder', async () => {
      highestBidder = await chocoPowerAuction2.highestBidder.call({ from: accounts[2] });
      assert(highestBidder === accounts[1]);
  });
  it('Receiving a new highest bid', async () => {
      bid = await chocoPowerAuction2.bid({from: accounts[2], value: 6 * Math.pow(10, 18)});
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
  it('Overcame bidder unable to make a bid', async () => {
    try {
    bid = await chocoPowerAuction2.bid({ from: accounts[1], value: 2 * Math.pow(10, 18) });
    } catch(e) {
      assert(e.message == Errors[1]);
    }
  });
  it('Overcame bidder make a rebid', async () => {
      rebid = await chocoPowerAuction2.rebid({ from: accounts[1], value: 2 * Math.pow(10, 18) });
      assert(rebid.receipt.status);
  });
  it('Lower bidder withdraw pendings funds', async () => {
      withdrawPendings = await chocoPowerAuction2.withdrawPendings({ from: accounts[2] });
      assert(withdrawPendings.receipt.status);
  });
  it('Ex nuovo bidder reenter', async () => {
      bid = await chocoPowerAuction2.bid({ from: accounts[2], value: 8 * Math.pow(10, 18)  });
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
});