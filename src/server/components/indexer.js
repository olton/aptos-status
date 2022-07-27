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
export const TRANSACTION_TYPE_STATE = 'state_checkpoint_transaction'

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

export const currentRound = async () => {
    const sql = `
        select
            coalesce(version, 0) as version,
            coalesce(epoch, 0) as epoch,
            coalesce(round, 0) as current_round
        from block_metadata_transactions bt
        left join transactions t on bt.hash = t.hash
        order by timestamp desc limit 1
    `

    return (await query(sql)).rows[0]
}

export const cacheCurrentRound = async () => {
    try {
        cache.currentRound = await currentRound()
    } finally {
        setTimeout(cacheCurrentRound, 1000)
    }
}

export const roundsPerEpoch = async (limit = 10) => {
    const sql = `
        select
            epoch,
            count(round) as rounds
        from block_metadata_transactions
        group by epoch
        order by epoch desc
        limit $1
    `

    return (await query(sql, [limit])).rows
}

export const cacheRoundsPerEpoch = async () => {
    try {
        cache.roundsPerEpoch = await roundsPerEpoch()
    } finally {
        setTimeout(cacheRoundsPerEpoch, 30000)
    }
}

export const rounds = async (trunc = 'minute', limit = 60) => {
    const sql = `
        select
            date_trunc('%TRUNC%', timestamp) as timestamp,
            count(round) as rounds
        from block_metadata_transactions t
        group by 1
        order by 1 desc
        limit $1
    `.replace('%TRUNC%', trunc)

    return (await query(sql, [limit])).rows
}

export const roundsPerSecond = async (limit = 1000) => {
    const sql = `
        with t as (select
            date_trunc('second', timestamp) as timestamp,
            count(round) as rounds_count
        from block_metadata_transactions t
        group by 1
        order by 1 desc
        limit $1)
        select coalesce(avg(rounds_count), 0) as round_tps from t
    `

    return (await query(sql, [limit])).rows[0].round_tps
}

export const cacheRoundsPerSecond = async () => {
    try {
        cache.roundsPerSecond = await roundsPerSecond()
    } finally {
        setTimeout(cacheRoundsPerSecond, 1000)
    }
}

export const userTransPerSecond = async (limit = 1000) => {
    const sql = `
        with t as (select
            date_trunc('second', timestamp) as timestamp,
            count(hash) as hashes_count
        from user_transactions t
        group by 1
        order by 1 desc
        limit $1)
        select coalesce(avg(hashes_count), 0) as user_tps from t
    `

    return (await query(sql, [limit])).rows[0].user_tps
}

export const cacheUserTransPerSecond = async () => {
    try {
        cache.userTransPerSecond = await userTransPerSecond()
    } finally {
        setTimeout(cacheUserTransPerSecond, 1000)
    }
}