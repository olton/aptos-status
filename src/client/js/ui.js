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
export const updateGasUsage = () => {}
export const updateLatestTransactions = () => {}
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
export const updateOperationsCount = () => {}
export const updateTransactionsByType = () => {}