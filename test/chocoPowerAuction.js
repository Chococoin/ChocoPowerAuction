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
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('crowdAmount must be zero', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 0);
    });
    it('withdrawn must be zero', async () => {
        withdrawn = await chocoPowerAuction.withdrawn({ from: accounts[4] });
        assert(withdrawn.toNumber() === 0);
    });
});

contract('Lone bidder wins', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('First lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 1000 });
        assert(bid.receipt.status);
    });
    it('Second lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[2], value: 2000});
    });
    it('Highest bid', async () => {
        highestBid = await chocoPowerAuction.highestBid( { from: accounts[3] });
        assert(highestBid.toNumber() === 2000);
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('crowdAmount must be zero', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 0);
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Balance before', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[0] });
        assert(balance.toNumber() === 3000);
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time > Fri_Nov_01_00_00_UTC_2019);
    });
    it('End auction and balance', async () => {
        await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 1000);
    });
    it('withdraw Pendings', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[1] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[1] });
        assert(withdrawPendings.toNumber() == 1000 );
    }); 
    it('Final balance', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 0);
    });
    it('Highest bidder is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder( { from: accounts[0]});
        assert(highestBidder === accounts[2]);
    });
    it('Highest bid is right', async () => {
        highestBid = await chocoPowerAuction.highestBid({ from: accounts[0] });
        assert(highestBid.toNumber() === 2000);
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
});

contract('Crowd bidders win', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('First lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 5000 });
        assert(bid.receipt.status);
    });
    it('First crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[2], value: 2500 });
    });
    it('Second crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[3], value: 2501});
    });
    it('Check pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[1]});
        assert(myPendingFunds.toNumber() === 5000)
    });
    it('Highest bid', async () => {
        highestBid = await chocoPowerAuction.highestBid({ from: accounts[3] });
        assert(highestBid.toNumber() === 5001);
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(crowdWinning);
    });
    it('crowdAmount is right', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 5001);
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Balance before', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[0] });
        assert(balance.toNumber() === 10001);
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time > Fri_Nov_01_00_00_UTC_2019);
    });
    it('End auction and balance', async () => {
        await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 5000);
    });
    it('Check pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[1]});
        assert(myPendingFunds.toNumber() === 5000)
    });
    it('withdraw Pendings', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[1] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[1] });
        assert(withdrawPendings.toNumber() == 5000 );
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(crowdWinning);
    });
    it('Final balance', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 0);
    });
    it('Highest bidder is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[0] });
        assert(highestBidder === accounts[0]);
    });
    it('Highest bid is right', async () => {
        highestBid = await chocoPowerAuction.highestBid( { from: accounts[0]});
        assert(highestBid.toNumber() === 5001)
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
});

contract('Lone bidder return to win.', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('First lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 5000 });
        assert(bid.receipt.status);
    });
    it('First crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[2], value: 2500 });
    });
    it('Second crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[3], value: 2501});
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Balance before', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[0] });
        assert(balance.toNumber() === 10001);
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time >= Fri_Nov_01_00_00_UTC_2019);
    });
    it('Lone bidder rebid and wins', async () => {
        rebid = await chocoPowerAuction.rebid(0, { from: accounts[1], value: 100 });
        assert(rebid.receipt.status);
    });
    it('last bid has close the auction', async () => {
        isClosed = await chocoPowerAuction.isClosed({ from: accounts[0] });
        assert(isClosed == true);
    });
    it('End auction and balance', async () => {
        await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 5001);
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('crowdAmount is right', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 5001);
    });
    it('Check pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[2]});
        assert(myPendingFunds.toNumber() === 2500);
    });
    it('Check pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[3]});
        assert(myPendingFunds.toNumber() === 2501);
    });
    it('withdraw Pendings', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
        assert(withdrawPendings.toNumber() == 2500 );
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('Final balance', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 2501);
    });
    it('Highest bidder is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[0] });
        assert(highestBidder === accounts[1]);
    });
    it('Highest bid is right', async () => {
        highestBid = await chocoPowerAuction.highestBid( { from: accounts[0]});
        assert(highestBid.toNumber() === 5100)
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
});

contract('Lone bidder return to win.', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('First lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 5000 });
        assert(bid.receipt.status);
    });
    it('First crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[2], value: 2500 });
    });
    it('Second crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[3], value: 2501});
    });
    it('Second lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[4], value: 5002 });
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Balance before', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[0] });
        assert(balance.toNumber() === 15003);
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time >= Fri_Nov_01_00_00_UTC_2019);
    });
    it('Last bid has not  close the auction', async () => {
        isClosed = await chocoPowerAuction.isClosed({ from: accounts[0] });
        assert(isClosed == false);
    });
    it('End auction and balance', async () => {
        await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 10001);
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('crowdAmount is right', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 5001);
    });
    it('Check pending funds accounts 2', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[2]});
        assert(myPendingFunds.toNumber() === 2500);
    });
    it('Check pending funds accounts 3', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[3]});
        assert(myPendingFunds.toNumber() === 2501);
    });
    it('withdraw Pendings', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[2] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[2] });
        assert(withdrawPendings.toNumber() == 2500 );
    });
    it('Auction is closed', async () => {
        isClosed = await chocoPowerAuction.isClosed({ from: accounts[0] });
        assert(isClosed === true);
    });
    it('Balance after withdraw', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[1] });
        assert(balance.toNumber() === 7501);
    });
    it('Highest bidder is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[0] });
        assert(highestBidder === accounts[4]);
    });
    it('Highest bid is right', async () => {
        highestBid = await chocoPowerAuction.highestBid( { from: accounts[0]});
        assert(highestBid.toNumber() === 5002)
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
});

contract('Lone bidder return to fail.', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('First lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 5000 });
        assert(bid.receipt.status);
    });
    it('First crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[2], value: 3000 });
        assert(bid.receipt.status);
    });
    it('Second crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[3], value: 3000 });
        assert(bid.receipt.status);
    });
    it('lone bidder fails rebid', async () => {
        try {
            bid = await chocoPowerAuction.rebid(0, { from: accounts[1], value: 1000 });
            assert(false);
        } catch(e) {
            assert(e.message);
        }
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Balance before', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[0] });
        assert(balance.toNumber() === 11000);
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time >= Fri_Nov_01_00_00_UTC_2019);
    });
    it('Last bid has not  close the auction', async () => {
        isClosed = await chocoPowerAuction.isClosed({ from: accounts[0] });
        assert(isClosed == false);
    });
    it('End auction and balance', async () => {
        await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 5000);
    });
    it('crowdWinning is True', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(crowdWinning);
    });
    it('crowdAmount is right', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({ from: accounts[4] });
        assert(crowdAmount.toNumber() === 6000);
    });
    it('Check pending funds accounts 1', async () => {
        try{
            myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[1]});
            assert(false);
        } catch(e) {
            assert(e.message);
         }
    });
    it('crowdWinning is true', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(crowdWinning);
    });
    it('Auction is closed', async () => {
        isClosed = await chocoPowerAuction.isClosed({ from: accounts[0] });
        assert(isClosed === true);
    });
    it('Highest bidder is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[0] });
        assert(highestBidder === accounts[0]);
    });
    it('Highest bid is right', async () => {
        highestBid = await chocoPowerAuction.highestBid( { from: accounts[0]});
        assert(highestBid.toNumber() === 6000)
    });
    it('withdraw Pendings', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[1] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[1] });
        assert(withdrawPendings.toNumber() == 5000 );
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
});

contract('Crowd bidders win', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('First lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 10000 });
        assert(bid.receipt.status);
    });
    it('First crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[2], value: 2500 });
    });
    it('Second crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[3], value: 2500});
    });
    it('Third crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[4], value: 2500});
    });
    it('Fourth crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[5], value: 2500});
    });
    it('Check pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[5]} );
        assert(myPendingFunds.toNumber() === 2500);
    });
    it('Check crowdamount', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({from: accounts[0]});
        assert(crowdAmount.toNumber() === 10000);
    });
    it('Highest bid', async () => {
        highestBid = await chocoPowerAuction.highestBid({ from: accounts[3] });
        assert(highestBid.toNumber() === 10000);
    });
    it('Highest bidder', async () => {
        highestBidder = await chocoPowerAuction.highestBidder();
        assert(highestBidder === accounts[1])
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Balance before', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[0] });
        assert(balance.toNumber() === 20000);
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time > Fri_Nov_01_00_00_UTC_2019);
    });
    it('End auction and balance', async () => {
        await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 10000);
    });
    it('Check pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[3]});
        assert(myPendingFunds.toNumber() === 2500)
    });
    it('withdraw Pendings', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[3] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[3] });
        assert(withdrawPendings.toNumber() == 2500 );
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('Final balance', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 7500);
    });
    it('Highest bidder is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[0] });
        assert(highestBidder === accounts[1]);
    });
    it('Highest bid is right', async () => {
        highestBid = await chocoPowerAuction.highestBid( { from: accounts[0]});
        assert(highestBid.toNumber() === 10000)
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
});

contract('Crowd bidders win', (accounts) => {
    it('Deploy the Smart Contract', async () => {
        chocoPowerAuction = await ChocoPowerAuction.new();
        assert(chocoPowerAuction.address !== '');
    });
    it('First lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[1], value: 10000 });
        assert(bid.receipt.status);
    });
    it('First crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[2], value: 2500 });
    });
    it('Second crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[3], value: 2500});
    });
    it('Third crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[4], value: 2500});
    });
    it('Fourth crowd bidder', async () => {
        bid = await chocoPowerAuction.bid(1, { from: accounts[5], value: 2500});
    });
    it('Second lone bidder', async () => {
        bid = await chocoPowerAuction.bid(0, { from: accounts[6], value: 20000 });
        assert(bid.receipt.status);
    });
    it('Check pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[5]} );
        assert(myPendingFunds.toNumber() === 2500);
    });
    it('Check crowdamount', async () => {
        crowdAmount = await chocoPowerAuction.crowdAmount({from: accounts[0]});
        assert(crowdAmount.toNumber() === 10000);
    });
    it('Highest bid', async () => {
        highestBid = await chocoPowerAuction.highestBid({ from: accounts[3] });
        assert(highestBid.toNumber() === 20000);
    });
    it('Highest bidder', async () => {
        highestBidder = await chocoPowerAuction.highestBidder();
        assert(highestBidder === accounts[6])
    });
    it('Set moment before end of auction', async () => {
        snapShot = await Utils.takeSnapshot();
        assert(snapShot);
    });
    it('Balance before', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[0] });
        assert(balance.toNumber() === 40000);
    });
    it('Time travel to End of Auction', async () => {
        await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
        let time = await Utils.getCurrentTime();
        assert(time > Fri_Nov_01_00_00_UTC_2019);
    });
    it('End auction and balance', async () => {
        await chocoPowerAuction.auctionEnd({ from: accounts[0] });
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 20000);
    });
    it('Check pending funds', async () => {
        myPendingFunds = await chocoPowerAuction.myPendingFunds( {from: accounts[3]});
        assert(myPendingFunds.toNumber() === 2500)
    });
    it('withdraw Pendings', async () => {
        withdrawPendings = await chocoPowerAuction.withdrawPendings.call({ from: accounts[3] });
        await chocoPowerAuction.withdrawPendings({ from: accounts[3] });
        assert(withdrawPendings.toNumber() == 2500 );
    });
    it('crowdWinning is false', async () => {
        crowdWinning = await chocoPowerAuction.crowdWinning( { from: accounts[5] });
        assert(!crowdWinning);
    });
    it('Final balance', async () => {
        balance = await chocoPowerAuction.balance({ from: accounts[1] })
        assert(balance.toNumber() === 17500);
    });
    it('Highest bidder is right', async () => {
        highestBidder = await chocoPowerAuction.highestBidder({ from: accounts[0] });
        assert(highestBidder === accounts[6]);
    });
    it('Highest bid is right', async () => {
        highestBid = await chocoPowerAuction.highestBid( { from: accounts[0]});
        assert(highestBid.toNumber() === 20000)
    });
    it('Revert to snapshot', async () => {
        await Utils.revertToSnapShot(snapShot.result);
        await Utils.advanceBlock();
        let time = await Utils.getCurrentTime();
    });
});