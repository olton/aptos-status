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
    const {tps = []} = data
    const arr = []
    for (let i of tps) {
        arr.push(i.count)
    }
    const sum = arr.reduce((a, b) => +a + +b, 0)
    const average = sum / arr.length;
    $("#user-tps").html(Number(average).toFixed(0))
}

export const updateRoundsPerSecond = data => {
    if (!data.tps) return
    const {tps = []} = data
    const arr = []
    for (let i of tps) {
        arr.push(i.rounds)
    }
    const sum = arr.reduce((a, b) => +a + +b, 0)
    const average = sum / arr.length;
    $("#round-tps").html(Number(average).toFixed(0))
}

export const updateGasUsage = (data) => {
    if (!typerGasUsage && data["gas"]) {
        setTimeout(async () => {
            await typeGasUsage(data.gas)
        })
        typerGasUsage = true
    }
}

export const updateHealth = data => {
    const message = data.health.payload.message

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


export const updateWelcome=()=>{
    if (!typerWelcome ) {
        setTimeout(async () => {
            await typeWelcome()
        })
        typerWelcome = true
    }
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
        updateWelcome()
    }, 10000)
}

const typeOperations = async (data) => {
    const container = $(".animated-text-right2 > div").clear()

    for(let op of [{function: "Counters collected!", count: data.operations.length}].concat(data.operations)) {
        const str = op.function
        const val = op.count

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


export const updateOperationsCount = (data) => {
    if (!typerCounter && data["operations"]) {
        setTimeout(async () => {
            await typeOperations(data)
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
    const {coin_total = 0, coin_max = 0, coin_avg = 0, unit_price = 1} = data.gas[0]
    $("#avg_gas_used").html(n2f(+coin_avg))
    $("#avg_gas_unit_price").html(n2f(+unit_price))
    $("#avg_gas_max_amount").html(n2f(+coin_max))
    $("#total_gas_amount").html(n2f(+coin_total))
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

