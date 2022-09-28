const fs = require('fs')

const StateStoreValidationError = require('./StateStoreValidationError')

const moduleState = {
    initialized: false
}

const scopes = {
    simple: 0,
    delegate: 1,
    full: 2
}

const namespaceFormat = /^[a-z0-9-_]+$/i

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

    const LocalStorage = moduleState.LocalStorage
    
    const storePath = `${parentPath}/${namespace}`
    const state = {
        scope: 'simple'
    }
    var storage = new LocalStorage(storePath)

    this.getNamespace = () => {
        return namespace
    }

    this.set = async (name, value) => {
        let v = JSON.stringify(value)
        return storage.setItem(name, v)
    }

    this.get = async (name) => {
        let v = storage.getItem(name)
        return JSON.parse(v)
    }

    this.remove = async (name) => {
        return storage.removeItem(name)
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
            this.storage = storage
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
 * @param {object} options Reserved for future use, does not do anything at this point.
 * @returns Top-level store for this system. This object must be captured and stored to work with the StateStore API. 
 * @throws A general exception if called more than once.
 */
module.exports = async (rootPath, options) => {

    if (moduleState.initialized) {
        throw 'Call to .setup rejected: morrigan.utils.statestore has alraedy been initialized!'
    }

    moduleState.LocalStorage = require('node-localstorage').LocalStorage

    moduleState.rootPath = rootPath

    validateModuleState()

    moduleState.initialized = true

    return new StateStore(moduleState.rootPath, 'global', { scope: module.exports.SCOPE_FULL })
}


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
  * Full scope, allows full access to the underlying LocalStorage object in addition to 'delegate' scope.
  */
 module.exports.SCOPE_FULL       = 'full'