import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import session from "express-session"
import {websocket} from "./websocket.js"
import {info} from "../helpers/logging.js";
import favicon from "serve-favicon"

const app = express()

const route = () => {
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
        resave: false,
        saveUninitialized: false,
        secret: 'Russian warship - Fuck You!',
        cookie: {
            maxAge: 24 * 3600000,
            secure: 'auto'
        }
    }))


    app.use(express.static(path.join(srcPath, 'client')))

    app.use('/css', express.static(path.join(clientPath, 'css')))
    app.use('/js', express.static(path.join(clientPath, 'js')))
    app.use('/vendor', express.static(path.join(clientPath, 'vendor')))
    app.use('/images', express.static(path.join(clientPath, 'images')))


    if (fs.existsSync(path.resolve(clientPath, 'favicon.ico')))
        app.use(favicon(path.join(srcPath, 'client', 'favicon.ico')))

    app.locals.pretty = true
    app.set('views', path.resolve(srcPath, 'client'))
    app.set('view engine', 'pug')

    const clientConfig = JSON.stringify({
        "server": {
            "host": config.client.host,
            "port": config.client.port,
            "secure": !!config.client.secure
        },
        "theme": config.client.theme,
        "tracked": config.aptos.api
    })
    const dateFormat = JSON.stringify(config['date-format'])

    app.get('/', async (req, res) => {
        res.render('index', {
            title: appName,
            appVersion,
            clientConfig,
            dateFormat,
        })
    })
}

export const runWebServer = () => {
    let httpWebserver, httpsWebserver

    httpWebserver = http.createServer({}, app)

    route()

    const runInfo = `Aptos Explorer Server running on http://${config.server.host}:${config.server.port}`

    httpWebserver.listen(config.server.port, () => {
        info(runInfo)
    })

    websocket(httpWebserver)
}
