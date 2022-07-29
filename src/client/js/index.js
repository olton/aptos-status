import {updateCurrentTime, withCtx, toast} from "./utils.js";
import {connect, request} from "./websocket.js";
import {
    updateGasUsage,
    updateLedger,
    updateOperationsCount,
    updateTransactionsByType,
    theme,
    updateTransactionsByResult,
    updateCurrentRound,
    updateUserTransPerSecond,
    updateRoundsPerSecond,
    updateUserGasUsage, updateRoundsPerEpoch
} from "./ui.js";
import {drawGaugeTransactionsPerMinute, drawRoundsPerEpochBars} from "./gauges.js";

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    switch(channel) {
        case 'welcome': {
            requestLedger()
            requestCurrentRound()
            requestRoundsPerEpoch()
            requestRoundsPerSecond()
            requestGasUsage()
            requestAvgGasUsed()
            requestUserGasUsage()
            requestOperationsCount()
            requestTransactionsByResult()
            requestTransactionsByType()
            requestGaugeTransactionsPerMinuteAll()
            requestGaugeTransactionsPerMinuteUser()
            requestGaugeTransactionsPerMinuteMeta()
            requestGaugeTransactionsPerMinuteCheck()
            requestUserTransPerSecond()
            break
        }

        case 'ledger': {
            try {
                updateLedger(data)
            } finally {
                setTimeout(requestLedger, 1000)
            }
            break
        }

        case 'gas-usage': {
            try {
                updateGasUsage(data)
            } finally {
                setTimeout(requestGasUsage, 1000)
            }
            break
        }

        case 'operations-count': {
            try {
                updateOperationsCount(data)
            } finally {
                setTimeout(requestOperationsCount, 1000)
            }
            break
        }

        case 'transactions-by-type': {
            try {
                updateTransactionsByType(data)
            } finally {
                setTimeout(requestTransactionsByType, 1000)
            }
            break
        }

        case 'transactions-by-result': {
            try {
                updateTransactionsByResult(data)
            } finally {
                setTimeout(requestTransactionsByResult, 1000)
            }
            break
        }

        case 'gauge-transactions-per-minute-all': {
            try {
                drawGaugeTransactionsPerMinute('#gauge-transactions-per-minute-all', data.all, '#5a74ec')
            } finally {
                setTimeout(requestGaugeTransactionsPerMinuteAll, data.all ? 60000 : 1000)
            }
            break
        }
        case 'gauge-transactions-per-minute-user': {
            try {
                drawGaugeTransactionsPerMinute('#gauge-transactions-per-minute-user', data.user, '#38800b')
            } finally {
                setTimeout(requestGaugeTransactionsPerMinuteUser, data.all ? 60000 : 1000)
            }
            break
        }
        case 'gauge-transactions-per-minute-meta': {
            try {
                drawGaugeTransactionsPerMinute('#gauge-transactions-per-minute-meta', data.meta, '#d06714')
            } finally {
                setTimeout(requestGaugeTransactionsPerMinuteMeta, data.all ? 60000 : 1000)
            }
            break
        }
        case 'gauge-transactions-per-minute-check': {
            try {
                drawGaugeTransactionsPerMinute('#gauge-transactions-per-minute-check', data.meta, '#d536e7')
            } finally {
                setTimeout(requestGaugeTransactionsPerMinuteCheck, data.all ? 60000 : 1000)
            }
            break
        }

        case 'current-round': {
            try {
                updateCurrentRound(data)
            } finally {
                setTimeout(requestCurrentRound, 1000)
            }
            break
        }

        case 'user-trans-per-second': {
            try {
                updateUserTransPerSecond(data)
            } finally {
                setTimeout(requestUserTransPerSecond, 1000)
            }
            break
        }

        case 'rounds-per-second': {
            try {
                updateRoundsPerSecond(data)
            } finally {
                setTimeout(requestRoundsPerSecond, 1000)
            }
            break
        }

        case 'rounds-per-epoch': {
            try {
                updateRoundsPerEpoch(data)
                drawRoundsPerEpochBars(data)
            } finally {
                setTimeout(requestRoundsPerEpoch, 1000)
            }
            break
        }

        case 'user-gas-usage': {
            try {
                updateUserGasUsage(data)
            } finally {
                setTimeout(requestUserGasUsage, 1000)
            }
            break
        }

        case 'avg-gas-used': {
            try {
                drawGaugeTransactionsPerMinute('#gas_used_graph', data.gas, '#5dd8ff')
            } finally {
                setTimeout(requestAvgGasUsed, 1000)
            }
            break
        }
    }
}

const requestLedger = () => request("ledger")
const requestGasUsage = () => request("gas-usage")
const requestUserGasUsage = () => request("user-gas-usage")
const requestAvgGasUsed = () => request("avg-gas-used")
const requestOperationsCount = () => request("operations-count")
const requestTransactionsByType = () => request("transactions-by-type")
const requestTransactionsByResult = () => request("transactions-by-result")
const requestGaugeTransactionsPerMinuteAll = () => request("gauge-transactions-per-minute-all")
const requestGaugeTransactionsPerMinuteUser = () => request("gauge-transactions-per-minute-user")
const requestGaugeTransactionsPerMinuteMeta = () => request("gauge-transactions-per-minute-meta")
const requestGaugeTransactionsPerMinuteCheck = () => request("gauge-transactions-per-minute-check")
const requestCurrentRound = () => request("current-round")
const requestRoundsPerEpoch = () => request("rounds-per-epoch")
const requestRoundsPerSecond = () => request("rounds-per-second")
const requestUserTransPerSecond = () => request("user-trans-per-second")

withCtx(globalThis, {
    toast,
    wsMessageController,
})

updateCurrentTime()
connect()
theme()

$(()=>{
    globalThis.ledgerVersion = 0

    $("#tracked-node").html(config.tracked.replace(/(^\w+:|^)\/\//,""))

    const resize = () => {

    }

    $(window).on("resize", () => {
        resize()
    })

    resize()
})