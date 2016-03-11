
// This function gets stringified so it needs to not use anything outside it's scope.
function bootstrap(target, settings, initHandlers){
    var originalAdd = target.addEventListener.bind(target),
        originalRemove = target.removeEventListener.bind(target),
        messageListeners = [],
        secretMessage = function(type, data){
            target.postMessage(settings.secret + ':' + type + ':' + data);
        },
        internalHandlers = initHandlers(target, settings, secretMessage);

    function handleInternal(data){
        var info = data.match(/^(\w+):(.*)$/);
        if(info && info[1] in internalHandlers){
            internalHandlers[info[1]](info[2]);
        }
    }

    originalAdd('message', function(message){
        var context = this,
            args = arguments,
            data = message.data,
            internal = data.match(new RegExp('^' + settings.secret + ':(.*)$'));

        if(internal){
            return handleInternal(internal[1]);
        }

        messageListeners.forEach(function(lisener){
            lisener.apply(context, args);
        });
    });

    target.addEventListener = function(type, callback){
        if(type !== 'message'){
            originalAdd.apply(this, arguments);
        }

        messageListeners.push(callback);
    };

    target.removeEventListener = function(type, callback){
        if(type !== 'message'){
            originalRemove.apply(this, arguments);
        }

        var index = messageListeners.indexOf(callback);
        if(~index){
            messageListeners.splice(index, 1);
        }
    };
}

function workerScriptHandlers(target, settings, secretMessage){
    var originalImport = importScripts,
        handlers = {};

    target._events = {};
    target.addEventListener = function(name, callback){
        if(!this._events[name]){
            this._events[name] = [];
        }
        this._events[name].push(callback);
    };
    target.removeEventListener = function(name, callback){
        if(!this._events[name]){
            return;
        }
        var index = this._events[name].indexOf(callback);
        if(~index){
            this._events[name].splice(index, 1);
        }
    };
    target.emit = function(name){
        var args = arguments;
        if(!this._events[name]){
            return;
        }
        this._events[name].forEach(function(callback){
            callback.apply(null, Array.prototype.slice.call(args, 1));
        });
    };

    target.hostLocation = settings.location;

    target.importScripts = function(path){
        return originalImport(settings.host + path);
    };

    handlers.load = function(data){
        target.importScripts(data);
    };

    handlers.loadscript = function(data){
        originalImport(data);
    };

    var storageRequests = {
        id: 0
    };
    target.localStorage = {
        get: function(key, callback){
            var id = storageRequests.id++;
            secretMessage('local', JSON.stringify([id, 'get', key]));
            storageRequests[id] = callback;
        },
        set: function(key, value, callback){
            var id = storageRequests.id++;
            secretMessage('local', JSON.stringify([id, 'set', key, value]));
            storageRequests[id] = callback;
        },
        remove: function(key, callback){
            var id = storageRequests.id++;
            secretMessage('local', JSON.stringify([id, 'remove', key]));
            storageRequests[id] = callback;
        },
        getAll: function(callback){
            var id = storageRequests.id++;
            secretMessage('local', JSON.stringify([id, 'getAll']));
            storageRequests[id] = callback;
        }
    };
    handlers.local = function(data){
        var args = JSON.parse(data),
            id = args[0];

        if(storageRequests[id]){
            storageRequests[id].apply(null, args.slice(1));
        }
        delete storageRequests[id];
    };

    handlers.event = function(data){
        var args = JSON.parse(data),
            name = args[0];
            value = args[1];

        target.emit(name, value);
    };

    return handlers;
}

function workUp(makeWorker){
    if(!makeWorker){
        makeWorker = function(path){
            return new Worker(path);
        };
    }

    var secret = Math.random();

    var settings = {
            secret: secret,
            host: location.protocol + '//' + location.host + '/',
            location: location
        },
        workerScript = '(' + bootstrap.toString() + ')(self, ' + [
            JSON.stringify(settings),
            workerScriptHandlers.toString()
        ] + ')';

    var blob;
    try {
        blob = new Blob([workerScript], {type: 'application/javascript'});
    } catch (e) { // Backwards-compatibility
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(workerScript);
        blob = blob.getBlob();
    }

    var worker = makeWorker(URL.createObjectURL(blob));

    worker.loadFile = function(path){
        worker.postMessage(secret + ':load:' + path);
    };
    worker.loadScript = function(string){
        worker.postMessage(secret + ':loadscript:' + string);
    };

    bootstrap(worker, settings, function(target, settings, secretMessage){
        var handlers = {};

        function addLocalEvent(name){
            global.addEventListener(name, function(data){
                secretMessage('event', JSON.stringify([name, data]));
            });
        }

        addLocalEvent('hashchange');
        addLocalEvent('popstate');
        addLocalEvent('load');

        handlers.local = function(data){
            var args = JSON.parse(data),
                id = args[0],
                type = args[1],
                key = args[2],
                value = args[3],
                result;

            if(type === 'set'){
                localStorage.setItem(key, value);
            }else if(type === 'get'){
                result = localStorage.getItem(key);
            }else if(type === 'remove'){
                localStorage.removeItem(key);
            }else if(type === 'getAll'){
                result = {};
                for(var key in localStorage){
                    resul[key] = localStorage[key];
                }
            }

            secretMessage('local', JSON.stringify([id, result]));
        };

        return handlers;
    });

    return worker;
}

module.exports = workUp;