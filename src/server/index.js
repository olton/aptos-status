import path from "path"
import { fileURLToPath } from 'url'
import fs from "fs";
import {info, error} from "./helpers/logging.js"
import {runWebServer} from "./components/webserver.js";
import {broadcast} from "./components/websocket.js";
import {createDBConnection} from "./components/postgres.js";
import {cacheHealth, cacheLedger, initAptos} from "./components/aptos.js";
import {
    cacheAvgGasUsed, cacheAvgMint,
    cacheCurrentRound,
    cacheGasUsage,
    cacheGaugeTransactionsPerMinuteAll, cacheGaugeTransactionsPerMinuteCheck, cacheGaugeTransactionsPerMinuteMeta,
    cacheGaugeTransactionsPerMinuteUser,
    cacheOperationsCount, cacheRoundsPerEpoch, cacheRoundsPerSecond, cacheTotalMint, cacheTransactionsByResult,
    cacheTransactionsByType, cacheUserGasUsage, cacheUserTransPerSecond
} from "./components/archive.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf-8'))

globalThis.rootPath = path.dirname(path.dirname(__dirname))
globalThis.serverPath = __dirname
globalThis.clientPath = rootPath + "/src/client"
globalThis.srcPath = rootPath + "/src"
globalThis.pkg = readJson(""+path.resolve(rootPath, "package.json"))
globalThis.config = readJson(""+path.resolve(serverPath, "config.json"))
globalThis.appVersion = pkg.version
globalThis.appName = `Aptos Status v${pkg.version}`

const runProcesses = () => {
    setImmediate( cacheHealth )
    setImmediate( cacheLedger )
    setImmediate( cacheCurrentRound )
    setImmediate( cacheGasUsage )
    setImmediate( cacheUserGasUsage )
    setImmediate( cacheAvgGasUsed )
    setImmediate( cacheOperationsCount )
    setImmediate( cacheTransactionsByType )
    setImmediate( cacheTransactionsByResult )
    setImmediate( cacheGaugeTransactionsPerMinuteAll )
    setImmediate( cacheGaugeTransactionsPerMinuteUser )
    setImmediate( cacheGaugeTransactionsPerMinuteMeta )
    setImmediate( cacheGaugeTransactionsPerMinuteCheck )
    setImmediate( cacheUserTransPerSecond )
    setImmediate( cacheRoundsPerSecond )
    setImmediate( cacheRoundsPerEpoch )
    setImmediate( cacheTotalMint )
    setImmediate( cacheAvgMint )
}

export const run = (configPath) => {
    info("Starting Server...")

    try {

        globalThis.cache = new Proxy({
        }, {
            set(target, p, value, receiver) {
                target[p] = value
                return true
            }
        })

        globalThis.everyone = new Proxy({
        }, {
            set(target, p, value, receiver) {
                target[p] = value

                broadcast({
                    channel: p,
                    data: value
                })

                return true
            }
        })

        initAptos()
        createDBConnection()
        runProcesses()
        runWebServer()

        info("Welcome to Server!")
    } catch (e) {
        error(e)
        error(e.stack)
        process.exit(1)
    }
}

run()