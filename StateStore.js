const fs = require('fs')
const crypto = require('crypto')

const StateStoreValidationError = require('./StateStoreValidationError')

const moduleState = {
    initialized: false
}

const scopes = {
    simple: 0,
    delegate: 1,
    full: 2
}

const mode = {
    live: 'persistent',
    memory: 'memory'
}

const namespaceFormat = /^[a-z0-9-_]+$/i

var rootStore = null

/**
 * Regular expression for valid namespace format.
 */
module.exports.VALID_NAMESPACE_FORMAT = namespaceFormat

/**
 * Simple scope, only allows getting, setting and removing of data in this store.
 */
module.exports.SCOPE_SIMPLE     = 'simple'
/**
 * Delegate scope, allows creation of new stores, in addition to what 'limited' scope allows.
 */
module.exports.SCOPE_DELEGATE   = 'delegate'
/**
 * Full scope, allows full access to the underlying lowdb DB object in addition to 'delegate' scope.
 */
module.exports.SCOPE_FULL       = 'full'

/**
 * Overall module state 'persistent'. Indicating that data should be persisted between restarts. 
 */
module.exports.MODE_LIVE        = 'persistent'
/**
 * 
 */
module.exports.MODE_TEST        = 'test'

/**
 * Generates a new state store API object that can be used to persist data.
 * @param {string} parentPath Path to the folder where the store should be created. 
 * @param {string} namespace Name for this store and. This will be profixed to the name of any subordinate stores. Should match regex /^[a-z0-9\-_]$/i
 * @param {object} options Optional settings. CUrrently only 'scope' is recognized.
 * @returns This store object.
 */
function StateStore(parentPath, namespace, options) {

    if (!moduleState.initialized) {
        throw "Uninitialized: Global StateStore settings have not been applied. Please run the exported .setup function to initialize the module."
    }

    const { Low, JSONFile, Memory } = moduleState.lowdb
    
    const storePath = `${parentPath}/${namespace}`
    const dbFile = `${storePath}/db.json`
    const state = {
        scope: 'simple'
    }
    var db = null
    
    switch(moduleState.mode) {
        case mode.memory:
            db = new Low(new Memory())
            break
        case mode.persistent:
        default:
            fs.mkdirSync(storePath, { recursive: true })
            db = new Low(new JSONFile(dbFile))
            break
    }
    
    if(fs.existsSync(dbFile)) {
        db.read()
    } else {
        db.data = {}
        db.write()
    }

    this.getNamespace = () => {
        return namespace
    }

    this.set = async (name, value) => {
        if (db.data === null) {
            await db.read()
        }

        db.data[name] = value
        await db.write()
    }

    this.get = async (name) => {
        await db.read()
        return db.data[name]
    }

    this.remove = async (name) => {
        delete db.data[name]
        await db.write()
    }
    
    if (options) {
        if (options.scope) {
            state.scope = (scopes[options.scope] > scopes[state.scope])? options.scope : state.scope 
        }
    }

    const parent = this

    let createStore = async (namespace, scope) => {

        if (!namespaceFormat.test(namespace)) {
            throw `Invalid name namespace provided (should only contain characters a-z, 0-9, - and _): ${namespace}`
        }

        return new StateStore(storePath, `${parent.getNamespace()}.${namespace}`, { scope })
    }

    switch(scopes[state.scope]) {
        case scopes.full:
            this.db = db
            this.getStore = createStore
            break
        case scopes.delegate:
            this.getStore = createStore
            break
        case scopes.simple:
        default:
            break
    }

    return this

}

/**
 * Validates the state of the module.
 * 
 * This is intended to be run after setup is complete to ensure that the
 * provider is ready.
 */
function validateModuleState() {
    let root = moduleState.rootPath

    try {
        // Try to ensure that the directory exists.
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root, { recursive: true })
        }
        // Verify that we can create files in the directory.
        let testFilePath = `${root}/_testFile`
        let testFileHandle = fs.openSync(testFilePath, 'as+')
        fs.closeSync(testFileHandle)
        // Verify that we can delete files in the directory.
        fs.rmSync(testFilePath, { maxRetries: 2, retryDelay: 500 })
        // Verify that we can create folders in the directory.
        let testDirPath = `${root}/_testDir`
        fs.mkdirSync(testDirPath, { recurse: true })
        // Verify that we can delete folders in the directory.
        fs.rmSync(testDirPath, { recursive: true, maxRetries: 2, retryDelay: 500 })
    } catch (e) {
        throw new StateStoreValidationError("Failed to validate state store root directory, see 'innerError' for details.", e)
    }

}

/**
 * 
 * @param {string} rootPath Filesystem directory under which the stores should be created.
 * @param {object} options Optional settings. Only recognizes 'mode', which can be set to 'persistent' or 'memory':
 *   - live: Persists  
 */
module.exports.setup = async (rootPath, options) => {

    moduleState.lowdb = await import('lowdb')

    moduleState.rootPath = rootPath

    if (options) {
        switch(options.mode) {
            case 'memory':
                moduleState.mode = 'memory'
                break
            case 'persistent':
            default:
                moduleState.mode = 'persistent'
                break
        }
    }

    validateModuleState()

    moduleState.initialized = true

    rootStore = new StateStore(moduleState.rootPath, 'global', { scope: module.exports.SCOPE_FULL })

    return rootStore
}

/**
 * Returns the root store object if one exists, otherwise returns null.
 * 
 * @returns The root store, if the setup method has been called. Otherwise returns null.
 */
module.exports.getRootStore = async () => {
    return rootStore
}

module.exports.getStore = async (namespace, scope) => {
    return await rootStore.getStore(namespace, scope)
}