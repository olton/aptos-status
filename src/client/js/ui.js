import {delay, n2f} from "./utils.js";

let typerWelcome = false, typerCounter = false, typerGasUsage = false

export const theme = () => {
    const lightLogo = `/images/aptos_word_light.svg`
    const darkLogo = `/images/aptos_word.svg`
    let darkMode = $('html').hasClass('dark-mode') || $.dark

    const storedDarkMode = Metro.storage.getItem("darkMode")
    if (typeof storedDarkMode !== "undefined") {
        darkMode = storedDarkMode
    }
    if (darkMode) {
        $("html").addClass("dark-mode")
        $(".aptos-logo img").attr("src", lightLogo)
    }

    $(".light-mode-switch, .dark-mode-switch").on("click", () => {
        darkMode = !darkMode
        Metro.storage.setItem("darkMode", darkMode)
        if (darkMode) {
            $("html").addClass("dark-mode")
            $(".aptos-logo img").attr("src", lightLogo)
        } else {
            $("html").removeClass("dark-mode")
            $(".aptos-logo img").attr("src", darkLogo)
        }
    })
}

export const updateCurrentRound = data => {
    if (!data.round) return
    $("#current-round").html(n2f(data.round.current_round))
}

export const updateUserTransPerSecond = data => {
    const {tps = 0} = data
    $("#user-tps").html(Number(tps).toFixed(4))
}

export const updateRoundsPerSecond = data => {
    if (!data.tps) return
    const {tps = 0} = data
    $("#round-tps").html(Number(tps).toFixed(4))
}

export const updateGasUsage = (data) => {
    // console.log(data)
    if (!typerGasUsage && data["gas"]) {
        setTimeout(async () => {
            await typeGasUsage(data.gas)
        })
        typerGasUsage = true
    }

    const {gas = []} = data
    const avg = [], max = [], min = []
    for(let g of gas) {
        avg.push(+g.gas_avg)
        max.push(+g.gas_max)
        min.push(+g.gas_min)
    }
    const average = avg.length ? avg.reduce((a, b) => a + b, 0) / avg.length : 0
    const minimum = min.length ? min.reduce((a, b) => a + b, 0) / min.length : 0
    const maximum = max.length ? max.reduce((a, b) => a + b, 0) / max.length : 0

    $("#gas_avg").html(n2f(average || 0))
    $("#gas_max").html(n2f(maximum || 0))
    $("#gas_min").html(n2f(minimum || 0))

    const minMin = Math.min(...min)
    const minMax = Math.max(...min)
    $("#gas_min_range").html(`${minMin} ... ${minMax}`)

    const maxMin = Math.min(...max)
    const maxMax = Math.max(...max)
    $("#gas_max_range").html(`${maxMin} ... ${maxMax}`)

    const avgMin = Math.min(...avg)
    const avgMax = Math.max(...avg)

    $("#gas_avg_range").html(`${avgMin} ... ${avgMax}`)
}

export const updateHealth = data => {
    const {health: {payload}} = data
    const message = payload.message

    $("#health")
        .html(
            message.toLowerCase().trim() === 'aptos-node:ok' ?
                '<span class="mif-checkmark fg-green">' :
                '<span class="mif-blocked fg-red">')
}

export const updateLedger = (data) => {
    if (!data.ledger) return

    const version = $('#ledger-version')
    const chainId = $('#chain-id')
    const epochNumber = $('#epoch-number')
    const timestamp = $('#timestamp')

    const ledger = data.ledger.payload
    const {chain_id, epoch, ledger_version, ledger_timestamp} = ledger

    version.html(n2f(ledger_version))
    chainId.html(n2f(chain_id))
    epochNumber.html(n2f(epoch))
    timestamp.html(datetime(ledger_timestamp/1000).format('DD-MM-YYYY HH:mm'))

    globalThis.ledgerVersion = +ledger_version
}


const typeWelcome = async () => {
    const container = $(".animated-text-left2 > div").clear()

    const welcome = [
        "Welcome to Status Monitor!", "System initialization in progress...",
        "Collect information about system in progress...",
        "Collect information about transactions in progress...",
        "Collect information about accounts in progress...",
        "System configuration complete!"
    ]

    let i = 0
    for(let str of welcome) {
        let line = $("<div>")
        container.append(line)
        container[0].scrollTop = container[0].scrollHeight + 100;
        for(let char of str) {
            line[0].innerHTML += char
            await delay(40)
        }
        if (i !== 0 && i < welcome.length - 1) {
            await delay(1000)
            line[0].innerHTML += "&nbsp;<span class='fg-green'>&check;</spanc>"
        }
        i++
    }

    setTimeout(()=>{
        typerWelcome = false
    }, 10000)
}

const typeOperations = async (data) => {
    const container = $(".animated-text-right2 > div").clear()

    for(let op of [{func: "Counters collected!", operations_count: data.length}].concat(data)) {
        const str = op.func
        const val = op.operations_count

        let line = $("<div>")
        container.append(line.html(`&nbsp;`))
        container[0].scrollTop = container[0].scrollHeight + 100;
        for(let char of str) {
            line[0].innerHTML += char
            await delay(40)
        }

        await delay(200)
        line[0].innerHTML += "&nbsp;<span class='fg-green'>"+n2f(val)+"</spanc>"

    }

    setTimeout(()=>{
        typerCounter = false
    }, 10000)
}

const typeGasUsage = async (data) => {
    const container = $(".animated-text-left > div").clear()

    for(let gas of [{func: "Gas usage statistics collected...", gas_avg: data.length}].concat(data)) {
        const str = gas.func
        const val = gas.gas_avg

        let line = $("<div>")
        container.append(line.html(`&nbsp;`))
        container[0].scrollTop = container[0].scrollHeight + 100;
        for(let char of str) {
            line[0].innerHTML += char
            await delay(40)
        }

        await delay(200)
        line[0].innerHTML += "&nbsp;<span class='fg-green'>"+n2f(val)+"</spanc>"
    }

    setTimeout(()=>{
        typerGasUsage = false
    }, 10000)
}

export const updateOperationsCount = (data) => {
    if (!typerWelcome) {
        setTimeout(async () => {
            await typeWelcome()
        })
        typerWelcome = true
    }

    if (!typerCounter && data["operations"]) {
        setTimeout(async () => {
            await typeOperations(data.operations)
        })
        typerCounter = true
    }
}

export const updateTransactionsByType = (data) => {
    const {transactions = []} = data
    let meta = 0, user = 0, state = 0, gen = 0

    for(let t of transactions) {
        if (t.counter_type === 'meta') meta += +t.counter_value
        if (t.counter_type === 'user') user += +t.counter_value
        if (t.counter_type === 'state') state += +t.counter_value
        if (t.counter_type === 'genesis') gen += +t.counter_value
    }

    $("#metadata-transactions").html(n2f(meta))
    $("#user-transactions").html(n2f(user))
    $("#state-transactions").html(n2f(state))
    $("#genesis-transactions").html(n2f(gen))

    if (
        globalThis.graph.transactions.meta !== meta ||
        globalThis.graph.transactions.user !== user ||
        globalThis.graph.transactions.state !== state
    ) {
        globalThis.graph.transactions.meta = meta
        globalThis.graph.transactions.user = user
        globalThis.graph.transactions.state = state
        drawTransDetailDonut([meta, user, state])
    }
}

export const updateTransactionsByResult = (data) => {
    const {transactions = []} = data
    let success = 0, failed = 0, total = 0

    for(let t of transactions) {
        if (t.counter_type === 'success') success += +t.counter_value
        if (t.counter_type === 'failed') failed += +t.counter_value
        if (t.counter_type === 'total') total += +t.counter_value
    }

    $("#total-transactions").html(n2f(total))
    $("#success-transactions").html(n2f(success))
    $("#failed-transactions").html(n2f(failed))
    $("#unknown-transactions").html(n2f(0))

    if (
        globalThis.graph.transactions.success !== success ||
        globalThis.graph.transactions.failed !== failed
    ) {
        globalThis.graph.transactions.success = success
        globalThis.graph.transactions.failed = failed
        drawTransTotalDonut([success, failed])
    }

    const catchup = $("#catchup-status")
    const synced = globalThis.ledgerVersion - (success + failed) <= 100
    if (synced) {
        catchup.hide()
    } else {
        catchup.show()
    }
}

export const updateUserGasUsage = (data) => {
    if (!data || !data.gas) return
    const {used = 0, unit_price = 0, max = 0} = data.gas
    $("#avg_gas_used").html(n2f(+used))
    $("#avg_gas_unit_price").html(n2f(+unit_price))
    $("#avg_gas_max_amount").html(n2f(+max))
}

export const updateRoundsPerEpoch = data => {
    const {round = []} = data
    const target = $("#table-rounds-per-epoch").clear()
    const epoch = [], rounds = []

    for(let r of round) {
        // console.log(r)
        epoch.push(r.epoch)
        rounds.push(r.rounds)
    }

    let tr

    tr = $("<tr>").appendTo(target)
    $("<td>").html(`<span class="text-bold text-small">EPOCH</span>`).appendTo(tr)
    for(let i = 0; i < epoch.length; i++) {
        $("<td>").addClass('text-center').html(epoch[i]).appendTo(tr)
    }

    tr = $("<tr>").appendTo(target)
    $("<td>").html(`<span class="text-bold text-small">ROUNDS</span>`).appendTo(tr)
    for(let i = 0; i < epoch.length; i++) {
        $("<td>").addClass('text-center').html(rounds[i]).appendTo(tr)
    }
}

const donutConfig = {
    background: "transparent",
    backStyle: "transparent",
    fillStyle: "#8f8",
    backWidth: 50,
    valueWidth: 30,
    height: 160,
    legend: false,
    padding: 1,
    label: false,
    border: false
}

export const drawTransTotalDonut = (data) => {
    $("#trans-graph-total").clear()
    chart.donut("#trans-graph-total", [...data], {
        ...donutConfig,
        boundaries: {
            min: 0,
            max: data[0] + data[1],
        },
        colors: ['#60a917', '#a20025'],
    })
}
export const drawTransDetailDonut = (data) => {
    $("#trans-graph-detail").clear()
    chart.donut("#trans-graph-detail", [...data], {
        ...donutConfig,
        boundaries: {
            min: 0,
            max: data[0] + data[1] + data[2],
        },
        colors: ['#bc5d04', '#6ca6f1', '#fff000'],
    })
}

export const updateMint = (data, target) => {
    if (!data.mint) return
    $(`#mint-${target}`).html(n2f(Math.round(+data.mint)))
}

