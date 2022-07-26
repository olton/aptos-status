import {query} from "./postgres.js";

export const getGasUsage = async () => {
    const sql = `
        select
            payload->'function' as func,
            floor(avg(gas_used)) as gas_avg,
            max(gas_used) as gas_max,
            min(gas_used) as gas_min
        from transactions
        where gas_used > 0
        --and success = true
        and substring(payload->>'function', 1, 5) = '0x1::'
        group by payload->'function'
    `

    return (await query(sql)).rows
}

export const cacheGasUsage = async () => {
    try {
        cache.gasUsage = await getGasUsage()
    } finally {
        setTimeout(cacheGasUsage, 1000)
    }
}

export const getOperationsCount = async () => {
    const sql = `
        select
            payload->'function' as func,
            count(hash) as operations_count
        from transactions
        where substring(payload->>'function', 1, 5) = '0x1::'
        group by payload->'function'
    `

    return (await query(sql)).rows
}

export const cacheOperationsCount = async () => {
    try {
        cache.operationsCount = await getOperationsCount()
    } finally {
        setTimeout(cacheOperationsCount, 1000)
    }
}

export const getTransactionsByType = async () => {
    const sql = `
        select type as type, count(*) as count
        from transactions
        where type != 'genesis_transaction'
        group by type
    `

    return (await query(sql)).rows
}
export const getTransactionsByResult = async () => {
    const sql = `
        select iif(success, 'success_transactions', 'failed_transactions') as type, count(*) as count
        from transactions
        where type != 'genesis_transaction'
        group by success
    `

    return (await query(sql)).rows
}

export const cacheTransactionsByType = async () => {
    try {
        cache.transactionsByType = await getTransactionsByType()
    } finally {
        setTimeout(cacheTransactionsByType, 1000)
    }
}

export const cacheTransactionsByResult = async () => {
    try {
        cache.transactionsByResult = await getTransactionsByResult()
    } finally {
        setTimeout(cacheTransactionsByResult, 1000)
    }
}

export const gaugeTransactionsPerMinute = async (limit = 60) => {
    const sql = `
        with trans as (select
                    t.version,
                    coalesce(ut.timestamp, m.timestamp) at time zone 'utc' as timestamp
                from transactions t
                    left join user_transactions ut on t.hash = ut.hash
                    left join block_metadata_transactions m on t.hash = m.hash
                where version > 0
                order by t.version desc)
        select
            date_trunc('minute', tr.timestamp) as minute,
            count(tr.version)
        from trans tr
        group by 1
        order by 1 desc
        limit $1
    `

    return (await query(sql, [limit])).rows
}

export const TRANSACTION_TYPE_USER = 'user_transaction'
export const TRANSACTION_TYPE_META = 'block_metadata_transaction'

export const gaugeTransactionsPerMinuteByType = async (type = TRANSACTION_TYPE_USER, limit = 60) => {
    const sql = `
        with trans as (select
                    t.version,
                    coalesce(ut.timestamp, m.timestamp) at time zone 'utc' as timestamp
                from transactions t
                    left join user_transactions ut on t.hash = ut.hash
                    left join block_metadata_transactions m on t.hash = m.hash
                where version > 0
                and t.type = $1 
                order by t.version desc)
        select
            date_trunc('minute', tr.timestamp) as minute,
            count(tr.version)
        from trans tr
        group by 1
        order by 1 desc
        limit $2
    `

    return (await query(sql, [type, limit])).rows
}

export const cacheGaugeTransactionsPerMinuteAll = async (limit = 61) => {
    try {
        cache.gaugeTransPerMinuteAll = await gaugeTransactionsPerMinute(limit)
    } finally {
        setTimeout(cacheGaugeTransactionsPerMinuteAll, 60000, limit)
    }
}
export const cacheGaugeTransactionsPerMinuteUser = async (limit = 61) => {
    try {
        cache.gaugeTransPerMinuteUser = await gaugeTransactionsPerMinuteByType(TRANSACTION_TYPE_USER, limit)
    } finally {
        setTimeout(cacheGaugeTransactionsPerMinuteUser, 60000, limit)
    }
}
export const cacheGaugeTransactionsPerMinuteMeta = async (limit = 61) => {
    try {
        cache.gaugeTransPerMinuteMeta = await gaugeTransactionsPerMinuteByType(TRANSACTION_TYPE_META, limit)
    } finally {
        setTimeout(cacheGaugeTransactionsPerMinuteMeta, 60000, limit)
    }
}



