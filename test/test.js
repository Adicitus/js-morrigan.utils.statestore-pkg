const StateStore = require('../StateStore')


function determineScope(store) {
    if (store.db) { return 'full' }
    if (store.getStore) {return 'delegate'}
    return 'limited'
}

describe('StateStore', () => {

    describe("Module", () => {

        describe("getStore", () => {

            before(async () => {
                await StateStore.setup('C:\\morrigan.server\\dev\\state')
            })

            it("Should create stores with scope 'simple' by default.", (done) => {
                let p = StateStore.getStore('defaultTest').then((store) => {
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'simple')
                    console.log(p)
                }).catch(err => {
                    assert.fail(err)
                }).finally(() => { done() })
            })

            it("Should allow explicit creation of 'simple' stores.", (done) => {
                StateStore.getStore('simpleTest', 'simple').then((store) => {
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'simple')
                }).catch(err => {
                    assert.fail(err)
                }).finally(() => { done() })
            })
            
            it("Should allow explicit creation of 'delegate' stores.", (done) => {
                StateStore.getStore('delegateTest', 'delegate').then((store) => {
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'delegate')
                }).catch(err => {
                    assert.fail(err)
                }).finally(() => { done() })
            })

            it("Should allow explicit creation of 'full' stores.", (done) => {
                StateStore.getStore('fullTest', 'full').then((store) => {
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'full')
                    console.log(store)
                }).catch(err => {
                    assert.fail(err)
                }).finally(() => { done() })
            })
        })
    })

    describe("Store", () => {

        describe("getStore", () => {
            var delegateStore = null

            before(async () => {
                await StateStore.setup('C:\\morrigan.server\\dev\\state')
                delegateStore = await StateStore.getStore('delegate', 'delegate')
            })

            it("Should create stores with scope 'simple' by default.", (done) => {
                delegateStore.getStore('defaultTest').then((store) => {
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'simple')
                }).catch(err => {
                    assert.fail(err)
                }).finally(done)
            })

            it("Should allow explicit creation of 'simple' stores.", (done) => {
                delegateStore.getStore('simpleTest', { scope: 'simple' }).then((store) => {
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'simple')
                }).catch(err => {
                    assert.fail(err)
                }).finally(done)
            })
            
            it("Should allow explicit creation of 'delegate' stores.", (done) => {
                delegateStore.getStore('delegateTest', { scope: 'delegate' }).then((store) => {
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'delegate')
                }).catch(err => {
                    assert.fail(err)
                }).finally(done)
            })

            it("Should allow explicit creation of 'full' stores.", (done) => {
                delegateStore.getStore('fullTest', { scope: 'full' }).then((store) => {
                    assert.ok(store)
                    assert.deepEqual(determineScope(store), 'full')
                }).catch(err => {
                    assert.fail(err)
                }).finally(done)
            })
        })
        
        var store = null
        const testValue = Math.random().toString(16).split('.')[1]

        before(async () => {
            store = await StateStore.getStore('storeTest')
        })

        it("Should allow storage of data using the 'set' method.", (done) => {
            store.set('test', testValue).catch(() => {
                assert.fail()
            }).finally(done)
        })

        it ("Should allow the retriveal of data using the 'get' method.", (done) => {
            store.get('test').then(v => {
                assert.deepEqual(v, testValue)
            }).catch(err => {
                assert.fail(err)
            }).finally(done)
        })

        it ("Should allow the removal of data using the 'remove' method.", (done) => {
            store.remove('test').then(() => {
                store.get('test').then(v => {
                    assert.deepEqual(v, null)
                }).catch(err => {
                    assert.fail(err)
                }).finally(done)
            }).catch(err => {
                assert.fail(err)
                done()
            })
        })
    })

})