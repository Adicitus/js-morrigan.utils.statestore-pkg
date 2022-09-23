# StateStore
Utility to enable scoped local storage of data that should be persistent.

- Built on node-localstorage to emulate LocateStorage bahavior (https://npmjs.com/package/node-localstorage).
- 3 scopes for state storage objects:
    - simple: Store and retrieve data from the store.
    - delegate: Able to store and retrieve data, as well as generating new StateStore objects.
    - full: Store/retrieve data, generate new StateStore objects as well as having full access to the underlying lowdb DB object
- Meant to allow recursive creation of persistent state storage for components/providers to retain state information
  between restarts, without concern for the specifics of how or where the data is stored.
