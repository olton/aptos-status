import path from "path"
import { fileURLToPath } from 'url'
import fs from "fs";
import {info, error} from "./helpers/logging.js"
import {runWebServer} from "./components/webserver.js";
import {broadcast} from "./components/websocket.js";
import {createDBConnection} from "./components/postgres.js";
import {cacheLedger, initAptos} from "./components/aptos.js";
import {
    cacheCurrentRound,
    cacheGasUsage,
    cacheGaugeTransactionsPerMinuteAll, cacheGaugeTransactionsPerMinuteCheck, cacheGaugeTransactionsPerMinuteMeta,
    cacheGaugeTransactionsPerMinuteUser,
    cacheOperationsCount, cacheRoundsPerEpoch, cacheRoundsPerSecond, cacheTransactionsByResult,
    cacheTransactionsByType, cacheUserTransPerSecond
} from "./components/indexer.js";

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
    setImmediate( cacheLedger )
    setImmediate( cacheCurrentRound )
    setImmediate( cacheGasUsage )
    setImmediate( cacheOperationsCount )
    setImmediate( cacheTransactionsByResult )
    setImmediate( cacheTransactionsByType )
    setImmediate( cacheGaugeTransactionsPerMinuteAll )
    setImmediate( cacheGaugeTransactionsPerMinuteUser )
    setImmediate( cacheGaugeTransactionsPerMinuteMeta )
    setImmediate( cacheGaugeTransactionsPerMinuteCheck )
    setImmediate( cacheUserTransPerSecond )
    setImmediate( cacheRoundsPerSecond )
    setImmediate( cacheRoundsPerEpoch )
}

export const run = (configPath) => {
    info("Starting Server...")

    try {

        globalThis.ssl = config.server.ssl && (config.server.ssl.cert && config.server.ssl.key)
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