# workup

up-skill your workers.

## What

Adds functionality to workers to make developing apps in the a little easier.

## Usage

```
var workUp = require('workup');

var worker = workUp(createWorker, name); // both createWorker and name are optional

```

Note: `name` doesn't work at the moment and in chrome you get `#1` in your sources list.
This may get resolved in time.

### Host thread:

#### loadFile

Tell the worker to load a file.

#### loadScript

Tell the worker to load a `Blob`

### Worker thread:

#### hostLocation

`self.hostLocation` has been added. It reflects window.location in your main thread,
and setting properties on it will set them in the main thread.
This means you can put routers in the worker, and you can affect the hash from it too.

```
self.hostLocation.hash = 'foo'; // Will affect the browsers hash.
```

#### Events (`load` `hashchange` `popstate`)

Some window events are forwarded to the worker.

```
self.addEventListener('hashchange', function(){
    // will get events when the hash is changed.
});
```

#### local storage

exposes a localStorage API that is like the normal one but with error-first callbacks.
It probably wont ever error? ¯\\_(ツ)_/¯

`set(key, value, callback)` sets `key` to `value` and calls back
`get(key, callback)` gets `key` and calls back with the `value`
`remove(key, callback)` removes `key` to `value` and calls back
`getAll(callback)` gets all `key`s and calls back with them

