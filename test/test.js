const StateStore = require('../StateStore')
const assert = require('assert')


function determineScope(store) {
    if (store.db) { return 'full' }
    if (store.getStore) {return 'delegate'}
    return 'simple'
}

describe('StateStore', () => {

    var rootStore = null

    describe("Module", () => {

        describe('setup', () => {

            it("Should return a 'root' store when setup finishes.", async () => {
                rootStore = await StateStore.setup('C:\\morrigan.server\\test\\state\\')
                assert.deepEqual(rootStore.getNamespace(), 'global')
            })
        })

        describe('getRootStore', () => {

            it("Should return the same store instance as 'setup'.", async () => {
                let store = await StateStore.getRootStore()
                assert.deepEqual(store, rootStore)
            })
        })
    })

    describe("Store", () => {
        
        var store = null
        const testValue = Math.random().toString(16).split('.')[1]

        before(async () => {
            store = await StateStore.getStore('storeTest', 'full')
        })

        it("Should allow asynchronous storage of data using the 'set' method.", async () => {
            await store.set('test', testValue)
        })

        it ("Should allow asynchronous retriveal of data using the 'get' method.", async () => {
            let v = await store.get('test')
            assert.deepEqual(v, testValue)
        })

        it ("Should allow asynchronous removal of data using the 'remove' method.", async () => {
            await store.remove('test')
            let v = await store.get('test')
            assert.deepEqual(v, null)
        })

        describe("getStore", () => {
            var delegateStore = null

            before(async () => {
                delegateStore = await rootStore.getStore('delegate', 'delegate')
            })

            it("Should create stores with scope 'simple' by default.", async () => {
                let store = await delegateStore.getStore('defaultTest')
                assert.ok(store)
                assert.deepEqual(determineScope(store), 'simple')
            })

            it("Should allow explicit creation of 'simple' stores.", async () => {
                let store = await delegateStore.getStore('simpleTest', 'simple')
                assert.ok(store)
                assert.deepEqual(determineScope(store), 'simple')
            })
            
            it("Should allow explicit creation of 'delegate' stores.", async () => {
                let store = await delegateStore.getStore('delegateTest', 'delegate')
                assert.ok(store)
                assert.deepEqual(determineScope(store), 'delegate')
            })

            it("Should allow explicit creation of 'full' stores.", async () => {
                let store = await delegateStore.getStore('fullTest', 'full')
                assert.ok(store)
                assert.deepEqual(determineScope(store), 'full')
            })

            describe("Namespaces", () => {
                it("Namespace should accept characters a-Z, 0-9, -, _ (case-insesitive)", async () => {
                    let store = await delegateStore.getStore('abcdefghijklmnopqrstuvvwxyzABCDEFGHIJKLMNOPQRSTUVVWXYZ0123456789-_')
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'simple')
                })

                it("Namespace containng invalid characters should be rejected with an exception.", async () => {

                    let namespaces = [
                        'validNamespace',
                        'valid-namespace',
                        'valid_namespace',
                        'invalid namespace', // Should fail
                        '.MaliciousNamespace', // Should fail
                        '', // Empty namespace, should fail
                    ]

                    for(var i in namespaces) {
                        let namespace = namespaces[i]
                        let store = null
                        try {
                            store = await delegateStore.getStore(namespace)
                        } catch {
                            // This is the intended behavior
                        }

                        if (!StateStore.VALID_NAMESPACE_FORMAT.test(namespace) && store) {
                            assert.fail(`Invalid namespace name accepted: ${namespace}`)
                        }
                    }
                })
            })

            describe("Namespace data", () => {

                const accessTestValue = Math.random().toString(16).split('.')[1]
                const persistTestValue = Math.random().toString(16).split('.')[1]

                it(`Two stores with the same namespace should access the same data. (nonce: ${accessTestValue})`, async () => {
                    let v1 = accessTestValue
                    let store1 = await delegateStore.getStore('accessTest', 'full')
                    let store2 = await delegateStore.getStore('accessTest', 'full')

                    await store1.set('value', v1)
                    let v2 = await store2.get('value')
                    
                    assert.equal(store1.getNamespace(), store2.getNamespace())
                    assert.notEqual(store1.db, store2.db)
                    assert.deepEqual(v1, v2)
                })

                it(`Namespace data should persist if the original store object is deleted. (nonce: ${persistTestValue})`, async () => {
                    let v1 = persistTestValue
                    let store1 = await delegateStore.getStore('accessTest', 'full')
                    await store1.set('value', v1)
                    delete store1

                    
                    let store2 = await delegateStore.getStore('accessTest', 'full')
                    let v2 = await store2.get('value')
                    assert.deepEqual(v1, v2)
                })

                describe("Datatypes should be retained when data is stored/retrieved.", () => {

                    var store = null

                    before(async () => {
                        store = await StateStore.getStore('datatypeTests')
                    })

                    it('Number', async () => {
                        let v1 = Math.random() * 1000
                        await store.set('test', v1)
                        let v2 = await store.get('test')
                        assert.strictEqual(v1, v2)
                    })

                    it('Boolean', async () => {
                        let v1 = false
                        await store.set('test', v1)
                        let v2 = await store.get('test')
                        assert.strictEqual(v1, v2)
                    })

                    it('String', async () => {
                        let v1 = Math.random().toString(16).split('.')[1]
                        await store.set('test', v1)
                        let v2 = await store.get('test')
                        assert.strictEqual(v1, v2)
                    })

                    it('Object', async () => {
                        let v1 = {
                            String: Math.random().toString(16).split('.')[1],
                            Number: Math.random() * 1000,
                            Boolean: true,
                            Object: {}
                        }
                        await store.set('test', v1)
                        let v2 = await store.get('test')
                        assert.deepEqual(v1, v2)
                    })
                })
            })
        })
    })

})