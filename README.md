# StateStore
Utility to enable scoped local storage of data that should be persistent.

- Built on lowdb
- 3 scopes for state storage
    - simple: Store and retrieve data from the store.
    - delegate: Able to store and retrieve data, as well as generating new StateStore objects.
    - full: Store/retrieve data, generate new StateStore objects as well as having full access to the underlying lowdb DB object
- Intended to be storage-medium agnostic.

