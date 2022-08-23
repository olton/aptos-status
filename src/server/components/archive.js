import {query} from "./postgres.js";

export const getGasUsage = async () => {
    const sql = `
        select
            split_part(function, '::', 2) || '::' || split_part(function, '::', 3) as func,
            sum(gas) as gas_sum,
            avg(gas) as gas_avg,
            max(gas) as gas_max,
            min(gas) as gas_min
        from gas_used g
        where function is not null
        group by split_part(function, '::', 2) || '::' || split_part(function, '::', 3)
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
        select * from counters
        where counter_type != 'total'
        and counter_type != 'success'
        and counter_type != 'failed'
    `

    return (await query(sql)).rows
}
export const getTransactionsByResult = async () => {
    const sql = `
        select * from counters
        where counter_type = 'total'
        or counter_type = 'success'
        or counter_type = 'failed'
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
                    t.timestamp at time zone 'utc' as timestamp
                from transactions t
                where version > 0
                order by version desc limit 100000)
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

export const TRANSACTION_TYPE_USER = 'user'
export const TRANSACTION_TYPE_META = 'meta'
export const TRANSACTION_TYPE_CHECK = 'state'

export const gaugeTransactionsPerMinuteByType = async (type = TRANSACTION_TYPE_USER, limit = 60) => {
    const sql = `
        with trans as (select
                    t.version,
                    t.timestamp at time zone 'utc' as timestamp
                from transactions t
                where version > 0
                and t.type = $1 
                order by t.version desc limit 100000)
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
export const cacheGaugeTransactionsPerMinuteCheck = async (limit = 61) => {
    try {
        cache.gaugeTransPerMinuteCheck = await gaugeTransactionsPerMinuteByType(TRANSACTION_TYPE_CHECK, limit)
    } finally {
        setTimeout(cacheGaugeTransactionsPerMinuteCheck, 60000, limit)
    }
}

export const currentRound = async () => {
    const sql = `
        select
            coalesce(version, 0) as version,
            coalesce(epoch, 0) as epoch,
            coalesce(round, 0) as current_round
        from meta_transactions mt
                 left join transactions t on t.id = mt.id
        order by t.timestamp desc limit 1
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
        from meta_transactions
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
        from meta_transactions t
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
        from meta_transactions t
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
                       date_trunc('second', t2.timestamp) as timestamp,
            count(hash) as hashes_count
        from user_transactions ut
            left join transactions t2 on ut.id = t2.id
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

export const avgUserGasUsage = async () => {
    const sql = `
        select
            avg (gas_used) used,
            avg(ut.gas_unit_price) unit_price,
            avg(ut.max_gas_amount) max
        from transactions t
            left join user_transactions ut on t.id = ut.id
        where type = 'user'
            limit 10000
    `

    return (await query(sql)).rows[0]
}

export const cacheUserGasUsage = async () => {
    try {
        cache.userGasUsage = await avgUserGasUsage()
    } finally {
        setTimeout(cacheUserGasUsage, 1000)
    }
}

export const avgGasUsed = async (data) => {
    const sql = `
        select
            date_trunc('minute', ut.timestamp) as minute,
    avg(gas_used)::int as count
        from transactions t
            left join user_transactions ut on t.id = ut.id
        where type = 'user'
        group by 1
        order by 1 desc
            limit 61
    `

    return (await query(sql)).rows
}

export const cacheAvgGasUsed = async () => {
    try {
        cache.avgGasUsed = await avgGasUsed()
    } finally {
        setTimeout(cacheAvgGasUsed, 1000)
    }
}

export const totalMint = async () => {
    const sql = `
        with paids as (
            select
                (replace(arguments[1]::text, '"', '')) as paid
            from payloads pl
            where function like '0x1::%::mint')
        select sum(paid::bigint)
        from paids
        where paid is not null
          and paid ~ '^[0-9.]+$'
    `

    return (await query(sql)).rows[0].mint
}

export const cacheTotalMint = async () => {
    try {
        cache.totalMint = await totalMint()
    } finally {
        setTimeout(cacheTotalMint, 10000)
    }
}

export const avgMint = async () => {
    const sql = `
        with paids as (
            select
                (replace(arguments[1]::text, '"', '')) as paid
            from payloads pl
            where function like '0x1::%::mint')
        select avg(paid::bigint)
        from paids
        where paid is not null
          and paid ~ '^[0-9.]+$'
    `

    return (await query(sql)).rows[0].mint
}

export const cacheAvgMint = async () => {
    try {
        cache.avgMint = await avgMint()
    } finally {
        setTimeout(cacheAvgMint, 10000)
    }
}