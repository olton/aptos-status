import {n2f} from "./utils.js";

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
export const updateGasUsage = (data) => {
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
}

export const updateLedger = (data) => {
    const version = $('#ledger-version')
    const chainId = $('#chain-id')
    const epochNumber = $('#epoch-number')
    const timestamp = $('#timestamp')

    const {chain_id, epoch, ledger_version, ledger_timestamp} = data.ledger

    version.html(n2f(ledger_version))
    chainId.html(n2f(chain_id))
    epochNumber.html(n2f(epoch))
    timestamp.html(datetime(ledger_timestamp/1000).format('DD-MM-YYYY HH:mm'))
}

export const updateOperationsCount = () => {

}

export const updateTransactionsByType = (data) => {
    const {transactions = []} = data
    let total = 0, success = 0, failed = 0, meta = 0, user = 0, state = 0
    for(let t of transactions) {
        total += +t.count
        if (t.type === 'success_transactions') success += +t.count
        if (t.type === 'failed_transactions') failed += +t.count
        if (t.type === 'block_metadata_transaction') meta += +t.count
        if (t.type === 'user_transaction') user += +t.count
        if (t.type === 'state_checkpoint_transaction') state += +t.count
    }
    $("#total-transactions").html(n2f(total))
    $("#success-transactions").html(n2f(success))
    $("#failed-transactions").html(n2f(failed))
    $("#metadata-transactions").html(n2f(meta))
    $("#user-transactions").html(n2f(user))
    $("#state-transactions").html(n2f(state))
}