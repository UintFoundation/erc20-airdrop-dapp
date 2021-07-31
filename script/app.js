App = {
  init: async () => {
    return await App.initWeb3()
  },

  initWeb3: async () => {
    try {
      const provider = await App.getProviderInstance()
      if (provider) {
        App.web3 = new Web3(provider)
      } else {
        App.web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/26c12920b2aa4d048aca189b14e80cfc"))
      }
      return App.initContracts()
    } catch (error) {
      alert("Enable to access to Metamask")
      console.log(error)
    }
  },

  getProviderInstance: async () => {
    // 1. Try getting modern provider
    const {
      ethereum
    } = window
    if (ethereum) {
      try {
        await ethereum.enable()
        return ethereum
      } catch (error) {
        throw new Error("User denied Metamask access")
      }
    }

    // 2. Try getting legacy provider
    const {
      web3
    } = window
    if (web3 && web3.currentProvider) {
      return web3.currentProvider
    }

    return null
  },

  initContracts: async () => {
    App.networkId = await App.web3.eth.net.getId()

    if (App.networkId !== 3) {
      $("#submit").attr("disabled", true)
      alert("Please switch to Binance Smart Chain");
      return
    }

    App.tokenABI = [{
      "constant": false,
      "inputs": [{
        "name": "spender",
        "type": "address"
      }, {
        "name": "value",
        "type": "uint256"
      }],
      "name": "approve",
      "outputs": [{
        "name": "",
        "type": "bool"
      }],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{
        "name": "",
        "type": "uint256"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{
        "name": "from",
        "type": "address"
      }, {
        "name": "to",
        "type": "address"
      }, {
        "name": "value",
        "type": "uint256"
      }],
      "name": "transferFrom",
      "outputs": [{
        "name": "",
        "type": "bool"
      }],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{
        "name": "who",
        "type": "address"
      }],
      "name": "balanceOf",
      "outputs": [{
        "name": "",
        "type": "uint256"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{
        "name": "",
        "type": "uint8"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{
        "name": "to",
        "type": "address"
      }, {
        "name": "value",
        "type": "uint256"
      }],
      "name": "transfer",
      "outputs": [{
        "name": "",
        "type": "bool"
      }],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{
        "name": "owner",
        "type": "address"
      }, {
        "name": "spender",
        "type": "address"
      }],
      "name": "allowance",
      "outputs": [{
        "name": "",
        "type": "uint256"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "anonymous": false,
      "inputs": [{
        "indexed": true,
        "name": "from",
        "type": "address"
      }, {
        "indexed": true,
        "name": "to",
        "type": "address"
      }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }],
      "name": "Transfer",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{
        "indexed": true,
        "name": "owner",
        "type": "address"
      }, {
        "indexed": true,
        "name": "spender",
        "type": "address"
      }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }],
      "name": "Approval",
      "type": "event"
    }],
      App.airdropABI = [{
        "constant": false,
        "inputs": [{
          "internalType": "contract IERC20",
          "name": "token",
          "type": "address"
        }, {
          "name": "addresses",
          "type": "address[]"
        }, {
          "name": "values",
          "type": "uint256[]"
        }],
        "name": "doAirdrop",
        "outputs": [{
          "name": "",
          "type": "uint256"
        }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      }, {
        "constant": true,
        "inputs": [],
        "name": "token",
        "outputs": [{
          "name": "",
          "type": "address"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }]

    App.airdropAddress = "0x2cd0e5f101114d3cccdf86ba300076140540e0a6" // BSC
    App.airdropInstance = new App.web3.eth.Contract(App.airdropABI, App.airdropAddress)

    return App.initVariables()
  },

  initVariables: async () => {
    App.account = await App.web3.eth.getAccounts().then(accounts => accounts[0])
    if (!localStorage.getItem("transactions")) {
      localStorage.setItem("transactions", JSON.stringify([]))
    }
    return App.render()
  },

  showTransactions: () => {
    const data = JSON.parse(localStorage.getItem("transactions"))
    let rows = document.createDocumentFragment()
    if (data.length !== 0) {
      $("#txTable tbody").empty()
      const {
        url
      } = App.detectNetwork()
      for (let i = 0; i < data.length; i++) {
        const txData = data[i]

        const row = document.createElement("tr")
        row.setAttribute("scope", "row")

        const index = document.createElement("th")
        index.appendChild(document.createTextNode(`${i}`))
        row.appendChild(index)

        const hash = document.createElement("td")
        const hyperlink = document.createElement("a")
        const linkText = document.createTextNode(`${txData.hash}`)
        hyperlink.appendChild(linkText)
        hyperlink.href = `${url}/tx/${txData.hash}`
        hash.appendChild(hyperlink)
        row.appendChild(hash)

        const status = document.createElement("td")
        status.appendChild(document.createTextNode(`${txData.status}`))
        row.appendChild(status)

        const users = document.createElement("td")
        users.appendChild(document.createTextNode(`${txData.users}`))
        row.appendChild(users)

        const amount = document.createElement("td")
        amount.appendChild(document.createTextNode(`${txData.amount}`))
        row.appendChild(amount)

        rows.appendChild(row)
      }
      $("#txTable tbody").append(rows)
    }
  },

  detectNetwork: () => {
    switch (App.networkId) {
      case 1:
        return {
          network: "Mainnet",
          url: "https://etherscan.io/",
          id: 1
        }
        break
      case 2:
        return {
          network: "Morden",
          url: "https://mordenexplorer.ethernode.io/",
          id: 2
        }
        break
      case 3:
        return {
          network: "Ropsten",
          url: "https://ropsten.etherscan.io/",
          id: 3
        }
        break
      case 4:
        return {
          network: "Rinkeby",
          url: "https://rinkeby.etherscan.io/",
          id: 4
        }
        break
      case 42:
        return {
          network: "Kovan",
          url: "https://kovan.etherscan.io/",
          id: 42
        }
        break
      case 56:
        return {
          network: "Binance Smart Chain",
          url: "https://bscscan.com/",
          id: 56
        }
        break
      default:
        console.log('This is an unknown network.')
    }
  },

  toWei: (amount, decimals) => {
    return (new BigNumber(amount.toString()).multipliedBy(new BigNumber('10').pow(new BigNumber(decimals.toString()))))
  },

  fromWei: (amount, decimals) => {
    return (new BigNumber(amount.toString()).div(new BigNumber('10').pow(new BigNumber(decimals.toString()))))
  },

  reloadListener: e => {
    e.returnValue = ''
  },

  alertInReload: enable => {
    if (enable) {
      window.addEventListener('beforeunload', App.reloadListener)
    } else {
      window.removeEventListener('beforeunload', App.reloadListener)
    }
  },

  render: () => {
    App.showTransactions()
  },

  startAirdrop: async () => {
    let amounts = [],
      receivers = []

    try {
      App.tokenAddress = App.web3.utils.toChecksumAddress($('#token-address').val())

      // Checking if address is valid
      if (!App.web3.utils.isAddress(App.tokenAddress)) {
        throw ('Invalid ERC20 address: \n\n' + App.tokenAddress)
      }

      App.tokenInstance = new App.web3.eth.Contract(App.tokenABI, App.tokenAddress)

      // Replacing and creating 'receivers' array
      $('#receivers').val().split(',').forEach((address, i) => {
        if (/\S/.test(address)) {
          address = address.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '')

          // Checksuming the addresses
          address = App.web3.utils.toChecksumAddress(address)

          // Checking if address is valid
          if (App.web3.utils.isAddress(address)) {
            receivers.push(address)
          } else {
            throw ('Founded wrong ETH address: \n\n' + address)
          }
        }
      })

      // Fetch decimal from contract
      let totalAmount = new BigNumber(0)
      const decimals = await App.tokenInstance.methods.decimals().call()

      // If only 1 amount for all
      if ($('#amounts').val().split(',').length < 2) {
        const globalAmount = $('#amounts').val()
        amounts = new Array(receivers.length).fill(App.toWei(globalAmount, decimals).toString())
      } else {
        // Replacing and creating 'amounts' array
        amounts = $('#amounts').val().split(',').map(value => {
          return App.toWei(value, decimals)
        })
      }

      // Calculating total sum of 'amounts' array items
      amounts = amounts.map(value => {
        totalAmount = totalAmount.plus(value)
        return value.toString()
      })

      // Checking arrays length and validities
      if (receivers.length == 0 || amounts.length == 0 || receivers.length != amounts.length) {
        throw (`Receivers/amount lengths should be equal!\nReceivers: ${receivers.length}\nAmounts: ${amounts.length}`)
      }

      const allowance = await App.tokenInstance.methods.allowance(App.account, App.airdropAddress).call()

      // If allowance tokens are not enough call approve
      if (totalAmount.gt(allowance)) {
        await App.approveTokens()
      }

      await App.doAirdrop(receivers, amounts)
    } catch (error) {
      alert(error)
    }
  },

  doAirdrop: async (receivers, amounts) => {
    const ADDRESSES_PER_TX = 300
    const batchesCount = Math.ceil(receivers.length / ADDRESSES_PER_TX)

    for (let i = 0; i < batchesCount; i++) {
      const startIndex = i * ADDRESSES_PER_TX
      const endIndex = startIndex + ADDRESSES_PER_TX
      console.log(`User Range: ${startIndex} - ${endIndex}`)

      // Divide data into small groups
      const receiverParts = receivers.slice(startIndex, endIndex)
      const amountParts = amounts.slice(startIndex, endIndex)

      await App.airdropInstance.methods.doAirdrop(App.tokenAddress, receiverParts, amountParts)
        .send({
          from: App.account
        })
        .on("transactionHash", hash => {
          App.alertInReload(true)
          const newTx = {
            hash,
            status: "Pending",
            users: receivers.length,
            amount: totalAmount
          }
          let transactions = JSON.parse(localStorage.getItem("transactions"))
          transactions.unshift(newTx)
          localStorage.setItem("transactions", JSON.stringify(transactions))
          App.showTransactions()
        })
        .on("receipt", receipt => {
          App.alertInReload(false)

          const hash = receipt.transactionHash
          const transactions = JSON.parse(localStorage.getItem("transactions"))
          const txIndex = transactions.findIndex(tx => tx.hash === hash);
          transactions[txIndex].status = "Done"

          localStorage.setItem("transactions", JSON.stringify(transactions))
          App.render()
          resolve()
        })
        .on("error", error => {
          App.alertInReload(false)
          reject("Tx was failed")
        })
    }
  },

  approveTokens: async () => {
    try {
      const maxUint = '11579208923731619542357098500868790785326998466564056403945758400791312963993'
      return await App.tokenInstance.methods.approve(App.airdropAddress, maxUint).send({
        from: App.account
      })
    } catch (error) {
      throw 'User denied transaction!'
    }
  }
}

$(window).on("load", () => {
  $.ready.then(() => {
    App.init()
  })
})