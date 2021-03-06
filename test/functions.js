// May 20 2017
var ethPriceUSD = 127.2;

// -----------------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------------
var accounts = [];
var accountNames = {};

addAccount(eth.accounts[0], "Account #0 - Miner");
addAccount(eth.accounts[1], "Account #1 - Token Owner");
addAccount(eth.accounts[2], "Account #2 - KYCed");
addAccount(eth.accounts[3], "Account #3 - KYCed");
addAccount(eth.accounts[4], "Account #4");
addAccount(eth.accounts[5], "Account #5");
addAccount(eth.accounts[6], "Account #6");
addAccount(eth.accounts[7], "Account #7 - Foundation");
addAccount(eth.accounts[8], "Account #8 - Advisors");
addAccount(eth.accounts[9], "Account #9 - Directors");
addAccount(eth.accounts[10], "Account #10 - Early Backers");
addAccount(eth.accounts[11], "Account #11 - Developers");

var minerAccount = eth.accounts[0];
var tokenOwnerAccount = eth.accounts[1];
var account2 = eth.accounts[2];
var account3 = eth.accounts[3];
var account4 = eth.accounts[4];
var account5 = eth.accounts[5];
var account6 = eth.accounts[6];
var foundationAccount = eth.accounts[7];
var advisorsAccount = eth.accounts[8];
var directorsAccount = eth.accounts[9];
var earlyBackersAccount = eth.accounts[10];
var developersAccount = eth.accounts[11];


var baseBlock = eth.blockNumber;

function unlockAccounts(password) {
  for (var i = 0; i < 12; i++) {
    personal.unlockAccount(eth.accounts[i], password, 100000);
  }
}

function addAccount(account, accountName) {
  accounts.push(account);
  accountNames[account] = accountName;
}


// -----------------------------------------------------------------------------
// KYC Contract
// -----------------------------------------------------------------------------
var kycContractAddress = null;
var kycContractAbi = null;

function addKYCContractAddressAndAbi(address, abi) {
  kycContractAddress = address;
  kycContractAbi = abi;
}


// -----------------------------------------------------------------------------
// Token Contract
// -----------------------------------------------------------------------------
var tokenContractAddress = null;
var tokenContractAbi = null;
var lockedTokenContractAbi = null;

function addTokenContractAddressAndAbi(address, tokenAbi, lockedTokenAbi) {
  tokenContractAddress = address;
  tokenContractAbi = tokenAbi;
  lockedTokenContractAbi = lockedTokenAbi;
}


// -----------------------------------------------------------------------------
// Account ETH and token balances
// -----------------------------------------------------------------------------
function printBalances() {
  console.log("DEBUG: tokenContractAddress: " + tokenContractAddress);
  console.log("DEBUG: tokenContractAbi: " + tokenContractAbi);
  var token = tokenContractAddress == null || tokenContractAbi == null ? null : web3.eth.contract(tokenContractAbi).at(tokenContractAddress);
  var decimals = token == null ? 0 : token.decimals();
  var lockedTokenContract = token == null || lockedTokenContractAbi == null ? null : web3.eth.contract(lockedTokenContractAbi).at(token.lockedTokens());
  var i = 0;
  console.log("RESULT:  # Account                                             EtherBalanceChange                 Token                               Locked 1Y                      Locked 2Y Name");
  accounts.forEach(function(e) {
    i++;
    var etherBalanceBaseBlock = eth.getBalance(e, baseBlock);
    var etherBalance = web3.fromWei(eth.getBalance(e).minus(etherBalanceBaseBlock), "ether");
    var tokenBalance = token == null ? new BigNumber(0) : token.balanceOf(e).shift(-decimals);
    var tokenBalance1Y = lockedTokenContract == null ? new BigNumber(0) : lockedTokenContract.balanceOfLocked1Y(e).shift(-decimals);
    var tokenBalance2Y = lockedTokenContract == null ? new BigNumber(0) : lockedTokenContract.balanceOfLocked2Y(e).shift(-decimals);
    console.log("RESULT: " + pad2(i) + " " + e  + " " + pad(etherBalance) + " " + padToken(tokenBalance, decimals) + " " + padToken(tokenBalance1Y, decimals) + " " + 
        padToken(tokenBalance2Y, decimals) + " " + accountNames[e]);
  });
}

function pad2(s) {
  var o = s.toFixed(0);
  while (o.length < 2) {
    o = " " + o;
  }
  return o;
}

function pad(s) {
  var o = s.toFixed(18);
  while (o.length < 27) {
    o = " " + o;
  }
  return o;
}

function padToken(s, decimals) {
  var o = s.toFixed(decimals);
  var l = parseInt(decimals)+12;
  while (o.length < l) {
    o = " " + o;
  }
  return o;
}


// -----------------------------------------------------------------------------
// Transaction status
// -----------------------------------------------------------------------------
function printTxData(name, txId) {
  var tx = eth.getTransaction(txId);
  var txReceipt = eth.getTransactionReceipt(txId);
  var gasPrice = tx.gasPrice;
  var gasCostETH = tx.gasPrice.mul(txReceipt.gasUsed).div(1e18);
  var gasCostUSD = gasCostETH.mul(ethPriceUSD);
  console.log("RESULT: " + name + " gas=" + tx.gas + " gasUsed=" + txReceipt.gasUsed + " costETH=" + gasCostETH +
    " costUSD=" + gasCostUSD + " @ ETH/USD=" + ethPriceUSD + " gasPrice=" + gasPrice + " block=" + 
    txReceipt.blockNumber + " txId=" + txId);
}

function assertEtherBalance(account, expectedBalance) {
  var etherBalance = web3.fromWei(eth.getBalance(account), "ether");
  if (etherBalance == expectedBalance) {
    console.log("RESULT: OK " + account + " has expected balance " + expectedBalance);
  } else {
    console.log("RESULT: FAILURE " + account + " has balance " + etherBalance + " <> expected " + expectedBalance);
  }
}

function gasEqualsGasUsed(tx) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  return (gas == gasUsed);
}

function failIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: PASS " + msg);
    return 1;
  } else {
    console.log("RESULT: FAIL " + msg);
    return 0;
  }
}

function failIfGasEqualsGasUsedOrContractAddressNull(contractAddress, tx, msg) {
  if (contractAddress == null) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    var gas = eth.getTransaction(tx).gas;
    var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
    if (gas == gasUsed) {
      console.log("RESULT: FAIL " + msg);
      return 0;
    } else {
      console.log("RESULT: PASS " + msg);
      return 1;
    }
  }
}


// -----------------------------------------------------------------------------
// KYC Contract details
// -----------------------------------------------------------------------------
var kycDetailsFromBlock = 0;
function printKYCContractDetails() {
  if (kycContractAddress != null && kycContractAbi != null) {
    var kycContract = eth.contract(kycContractAbi).at(kycContractAddress);
    console.log("RESULT: kyc.owner=" + kycContract.owner());
    console.log("RESULT: kyc.newOwner=" + kycContract.newOwner());
    var latestBlock = eth.blockNumber;
    var i;
    var kycedEvent = kycContract.KYCed({}, { fromBlock: kycDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    kycedEvent.watch(function (error, result) {
      console.log("RESULT: KYCed Event " + i++ + ": customer=" + result.args.customer + " status=" + result.args.status + " " +
        result.blockNumber);
    });
    kycedEvent.stopWatching();
    kycDetailsFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// Token Contract details
// -----------------------------------------------------------------------------
function printTokenContractStaticDetails() {
  if (tokenContractAddress != null && tokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    console.log("RESULT: token.symbol=" + contract.symbol());
    console.log("RESULT: token.name=" + contract.name());
    console.log("RESULT: token.decimals=" + contract.decimals());
    var startDate = contract.START_DATE();
    console.log("RESULT: token.START_DATE=" + startDate + " " + new Date(startDate * 1000).toUTCString());
    var endDate = contract.END_DATE();
    console.log("RESULT: token.END_DATE=" + endDate + " " + new Date(endDate * 1000).toUTCString());
  }
}

var dynamicDetailsFromBlock = 0;
function printTokenContractDynamicDetails() {
  if (tokenContractAddress != null && tokenContractAbi != null && lockedTokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    var lockedTokenContract = eth.contract(lockedTokenContractAbi).at(contract.lockedTokens());
    var decimals = contract.decimals();
    var softCapEndDate = contract.softCapEndDate();
    console.log("RESULT: token.softCapEndDate=" + softCapEndDate + " " + new Date(softCapEndDate * 1000).toUTCString());
    console.log("RESULT: token.tokensPerEther=" + contract.tokensPerEther());
    console.log("RESULT: token.totalSupply=" + contract.totalSupply().shift(-decimals));
    console.log("RESULT: lockedToken.totalSupplyLocked1Y=" + lockedTokenContract.totalSupplyLocked1Y().shift(-decimals));
    console.log("RESULT: lockedToken.totalSupplyLocked2Y=" + lockedTokenContract.totalSupplyLocked2Y().shift(-decimals));
    console.log("RESULT: lockedToken.totalSupplyLocked=" + lockedTokenContract.totalSupplyLocked().shift(-decimals));
    console.log("RESULT: token.owner=" + contract.owner());
    console.log("RESULT: token.newOwner=" + contract.newOwner());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvent = contract.OwnershipTransferred({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvent.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred Event " + i++ + ": from=" + result.args._from + " to=" + result.args._to + " " +
        result.blockNumber);
    });
    ownershipTransferredEvent.stopWatching();

    var tokensPerEtherUpdatedEvent = contract.TokensPerEtherUpdated({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    tokensPerEtherUpdatedEvent.watch(function (error, result) {
      console.log("RESULT: TokensPerEtherUpdated Event " + i++ + ": from=" + result.args.tokensPerEther + " " + result.blockNumber);
    });
    tokensPerEtherUpdatedEvent.stopWatching();

    var approvalEvent = contract.Approval({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvent.watch(function (error, result) {
      console.log("RESULT: Approval Event " + i++ + ": owner=" + result.args._owner + " spender=" + result.args._spender + " " +
        result.args._value.shift(-decimals) + " block=" + result.blockNumber);
    });
    approvalEvent.stopWatching();

    var transferEvent = contract.Transfer({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvent.watch(function (error, result) {
      console.log("RESULT: Transfer Event " + i++ + ": from=" + result.args.from + " to=" + result.args.to +
        " value=" + result.args.value.shift(-decimals) + " block=" + result.blockNumber);
    });
    transferEvent.stopWatching();
    dynamicDetailsFromBlock = latestBlock + 1;
  }
}
