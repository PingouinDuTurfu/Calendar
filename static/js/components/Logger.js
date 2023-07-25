const TYPE_LOG = {
    "LOG": 0,
    "ERROR": 1,
    "WARNING": 2
}

class Logger {
    constructor() {
        this.display = false;
        this.logs = [];
    }

    log(...args) {
        if(this.display)
            this.writeLogsInConsole(TYPE_LOG.LOG, ...args);
        this.#save(TYPE_LOG.LOG, ...args);
    }

    warn(...args) {
        if(this.display)
            this.writeLogsInConsole(TYPE_LOG.WARNING, ...args);
        this.#save(TYPE_LOG.WARNING, ...args);
    }

    error(...args) {
        if(this.display)
            this.writeLogsInConsole(TYPE_LOG.ERROR, ...args);
        this.#save(TYPE_LOG.ERROR, args);
    }

    #save(type, ...args) {
        this.logs.push({type: type, content: args});
    }

    displayLogs() {
        this.enable();
        this.logs.forEach(l => {
            this.writeLogsInConsole(l.type, l.content);
        });
    }

    writeLogsInConsole(type, ...args) {
        switch (type) {
            case TYPE_LOG.ERROR:
                console.error(this.getTimestamp() + " -", ...args);
                break;
            case TYPE_LOG.WARNING:
                console.warn(this.getTimestamp() + " -", ...args);
                break;
            default:
                console.log(this.getTimestamp() + " -", ...args);
        }
    }

    enable() {
        this.display = true;
    }

    disable() {
        this.display = false;
    }

    getTimestamp() {
        const date = new Date();
        return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    }
}

export const logger = new Logger();
export { TYPE_LOG };