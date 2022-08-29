import Archive from "@olton/aptos-archive-api";
import {runWebServer} from "./webserver.js";

const TRANSACTION_TYPE_USER = 'user'
const TRANSACTION_TYPE_META = 'meta'
const TRANSACTION_TYPE_STATE = 'state'
const arch = new Archive({
    "proto": "http",
    "host": "archive.aptosnet.com",
    "port": 5432,
    "user": "archive_guest",
    "password": "Ds#Kj385^Pnf",
    "database": "aptos_archive",
    "allowExitOnIdle": true,
    "max": 3000
})

export const cacheGasUsage = async () => {
    try {
        const result = await arch.gasCount()
        if (result.ok) {
            cache.gasUsage = result.payload
        }
    } finally {
        setTimeout(cacheGasUsage, 1000)
    }
}

export const cacheOperationsCount = async () => {
    try {
        const result = await arch.operationsCount()
        if (result.ok) {
            cache.operationsCount = result.payload
        }
    } finally {
        setTimeout(cacheOperationsCount, 1000)
    }
}

export const cacheTransactionsByType = async () => {
    try {
        const result = await arch.transactionsCount()
        if (result.ok) {
            cache.transactionsByType = result.payload
        }
    } finally {
        setTimeout(cacheTransactionsByType, 1000)
    }
}

export const cacheTransactionsByResult = async () => {
    try {
        const result = await arch.transactionsCount()
        if (result.ok) {
            cache.transactionsByResult = result.payload
        }
    } finally {
        setTimeout(cacheTransactionsByType, 1000)
    }
}

export const cacheGaugeTransactionsPerMinuteAll = async (limit = 61) => {
    try {
        const result = await arch.transactionsPerMinute(limit)
        if (result.ok) {
            cache.gaugeTransPerMinuteAll = result.payload
        }
    } finally {
        setTimeout(cacheGaugeTransactionsPerMinuteAll, 60000, limit)
    }
}

export const cacheGaugeTransactionsPerMinuteUser = async (limit = 61) => {
    try {
        const result = await arch.transactionsPerMinuteByType(TRANSACTION_TYPE_USER, limit)
        if (result.ok) {
            cache.gaugeTransPerMinuteUser = result.payload
        }
    } finally {
        setTimeout(cacheGaugeTransactionsPerMinuteUser, 60000, limit)
    }
}

export const cacheGaugeTransactionsPerMinuteMeta = async (limit = 61) => {
    try {
        const result = await arch.transactionsPerMinuteByType(TRANSACTION_TYPE_META, limit)
        if (result.ok) {
            cache.gaugeTransPerMinuteMeta = result.payload
        }
    } finally {
        setTimeout(cacheGaugeTransactionsPerMinuteMeta, 60000, limit)
    }
}

export const cacheGaugeTransactionsPerMinuteCheck = async (limit = 61) => {
    try {
        const result = await arch.transactionsPerMinuteByType(TRANSACTION_TYPE_STATE, limit)
        if (result.ok) {
            cache.gaugeTransPerMinuteCheck = result.payload
        }
    } finally {
        setTimeout(cacheGaugeTransactionsPerMinuteCheck, 60000, limit)
    }
}

export const cacheCurrentRound = async () => {
    try {
        const result = await arch.currentRound()
        console.log(result)
        if (result.ok) {
            cache.currentRound = result.payload

        }
    } finally {
        setTimeout(cacheCurrentRound, 1000)
    }
}

export const cacheRoundsPerEpoch = async () => {
    try {
        const result = await arch.roundsPerEpoch(10)
        if (result.ok) {
            cache.roundsPerEpoch = result.payload
        }
    } finally {
        setTimeout(cacheRoundsPerEpoch, 1000)
    }
}

export const cacheRoundsPerSecond = async () => {
    try {
        const result = await arch.roundsInTime()
        if (result.ok) {
            cache.roundsPerSecond = result.payload
        }
    } finally {
        setTimeout(cacheRoundsPerSecond, 1000)
    }
}

export const cacheUserTransPerSecond = async () => {
    try {
        const result = await arch.transactionsPerSecondByType(TRANSACTION_TYPE_USER, 1000)
        if (result.ok) {
            cache.userTransPerSecond = result.payload
        }
    } finally {
        setTimeout(cacheUserTransPerSecond, 1000)
    }
}

// export const avgUserGasUsage = async () => {
//     const sql = `
//         select
//             avg (gas_used) used,
//             avg(ut.gas_unit_price) unit_price,
//             avg(ut.max_gas_amount) max
//         from transactions t
//             left join user_transactions ut on t.id = ut.id
//         where type = 'user'
//             limit 10000
//     `
//
//     return (await query(sql)).rows[0]
// }

export const cacheUserGasUsage = async () => {
    try {
        const result = await arch.gasCount()
        if (result.ok) {
            cache.userGasUsage = result.payload
        }
    } finally {
        setTimeout(cacheUserGasUsage, 1000)
    }
}

// export const avgGasUsed = async (data) => {
//     const sql = `
//         select
//             date_trunc('minute', ut.timestamp) as minute,
//     avg(gas_used)::int as count
//         from transactions t
//             left join user_transactions ut on t.id = ut.id
//         where type = 'user'
//         group by 1
//         order by 1 desc
//             limit 61
//     `
//
//     return (await query(sql)).rows
// }

export const cacheAvgGasUsed = async () => {
    try {
        cache.avgGasUsed = {}
    } finally {
        setTimeout(cacheAvgGasUsed, 1000)
    }
}

export const cacheTotalMint = async () => {
    try {
        const result = await arch.mintCoinCount()
        if (result.ok) {
            cache.totalMint = result.payload[0].coin_total
        }
    } finally {
        setTimeout(cacheTotalMint, 10000)
    }
}


export const cacheAvgMint = async () => {
    try {
        const result = await arch.mintCoinCount()
        if (result.ok) {
            cache.avgMint = result.payload[0].coin_avg
        }
    } finally {
        setTimeout(cacheAvgMint, 10000)
    }
}
