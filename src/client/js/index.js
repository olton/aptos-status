import {updateCurrentTime, withCtx, toast} from "./utils.js";
import {connect, request} from "./websocket.js";
import {
    updateGasUsage,
    updateLedger,
    updateOperationsCount,
    updateTransactionsByType,
    theme, updateTransactionsByResult
} from "./ui.js";

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    switch(channel) {
        case 'welcome': {
            requestLedger()
            requestGasUsage()
            requestOperationsCount()
            requestTransactionsByResult()
            requestTransactionsByType()
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
    }
}

const requestLedger = () => request("ledger")
const requestGasUsage = () => request("gas-usage")
const requestOperationsCount = () => request("operations-count")
const requestTransactionsByType = () => request("transactions-by-type")
const requestTransactionsByResult = () => request("transactions-by-result")

withCtx(globalThis, {
    toast,
    wsMessageController,
})

updateCurrentTime()
connect()
theme()

$(()=>{
    $("#tracked-node").html(config.tracked.replace(/(^\w+:|^)\/\//,""))

    const resize = () => {

    }

    $(window).on("resize", () => {
        resize()
    })

    resize()
})