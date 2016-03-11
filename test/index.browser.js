(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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
            secretMessage('local', JSON.stringify([id, key]));
            storageRequests[id] = callback;
        },
        set: function(key, value, callback){
            var id = storageRequests.id++;
            secretMessage('local', JSON.stringify([id, key, value]));
            storageRequests[id] = callback;
        }
    };
    handlers.local = function(data){
        var args = JSON.parse(data),
            id = args[0];

        storageRequests[id].apply(null, args.slice(1));
    }

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
            host: location.protocol + '//' + location.host + '/'
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

        handlers.local = function(data){
            var args = JSON.parse(data),
                id = args[0],
                key = args[1],
                value = args[2],
                set = args.length === 3,
                result;

            if(set){
                localStorage.setItem(key, value);
            }else{
                result = localStorage.getItem(key);
            }

            secretMessage('local', JSON.stringify([id, result]));
        };

        return handlers;
    });

    return worker;
}

module.exports = workUp;
},{}],2:[function(require,module,exports){
var workup = require('../');

var worker = workup();

worker.loadFile('testWorker.js');
},{"../":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92NS4zLjAvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiaW5kZXguanMiLCJ0ZXN0L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8vIFRoaXMgZnVuY3Rpb24gZ2V0cyBzdHJpbmdpZmllZCBzbyBpdCBuZWVkcyB0byBub3QgdXNlIGFueXRoaW5nIG91dHNpZGUgaXQncyBzY29wZS5cbmZ1bmN0aW9uIGJvb3RzdHJhcCh0YXJnZXQsIHNldHRpbmdzLCBpbml0SGFuZGxlcnMpe1xuICAgIHZhciBvcmlnaW5hbEFkZCA9IHRhcmdldC5hZGRFdmVudExpc3RlbmVyLmJpbmQodGFyZ2V0KSxcbiAgICAgICAgb3JpZ2luYWxSZW1vdmUgPSB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lci5iaW5kKHRhcmdldCksXG4gICAgICAgIG1lc3NhZ2VMaXN0ZW5lcnMgPSBbXSxcbiAgICAgICAgc2VjcmV0TWVzc2FnZSA9IGZ1bmN0aW9uKHR5cGUsIGRhdGEpe1xuICAgICAgICAgICAgdGFyZ2V0LnBvc3RNZXNzYWdlKHNldHRpbmdzLnNlY3JldCArICc6JyArIHR5cGUgKyAnOicgKyBkYXRhKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW50ZXJuYWxIYW5kbGVycyA9IGluaXRIYW5kbGVycyh0YXJnZXQsIHNldHRpbmdzLCBzZWNyZXRNZXNzYWdlKTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZUludGVybmFsKGRhdGEpe1xuICAgICAgICB2YXIgaW5mbyA9IGRhdGEubWF0Y2goL14oXFx3Kyk6KC4qKSQvKTtcbiAgICAgICAgaWYoaW5mbyAmJiBpbmZvWzFdIGluIGludGVybmFsSGFuZGxlcnMpe1xuICAgICAgICAgICAgaW50ZXJuYWxIYW5kbGVyc1tpbmZvWzFdXShpbmZvWzJdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9yaWdpbmFsQWRkKCdtZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAgICBkYXRhID0gbWVzc2FnZS5kYXRhLFxuICAgICAgICAgICAgaW50ZXJuYWwgPSBkYXRhLm1hdGNoKG5ldyBSZWdFeHAoJ14nICsgc2V0dGluZ3Muc2VjcmV0ICsgJzooLiopJCcpKTtcblxuICAgICAgICBpZihpbnRlcm5hbCl7XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlSW50ZXJuYWwoaW50ZXJuYWxbMV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVzc2FnZUxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGxpc2VuZXIpe1xuICAgICAgICAgICAgbGlzZW5lci5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrKXtcbiAgICAgICAgaWYodHlwZSAhPT0gJ21lc3NhZ2UnKXtcbiAgICAgICAgICAgIG9yaWdpbmFsQWRkLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cblxuICAgICAgICBtZXNzYWdlTGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrKXtcbiAgICAgICAgaWYodHlwZSAhPT0gJ21lc3NhZ2UnKXtcbiAgICAgICAgICAgIG9yaWdpbmFsUmVtb3ZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5kZXggPSBtZXNzYWdlTGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICBpZih+aW5kZXgpe1xuICAgICAgICAgICAgbWVzc2FnZUxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gd29ya2VyU2NyaXB0SGFuZGxlcnModGFyZ2V0LCBzZXR0aW5ncywgc2VjcmV0TWVzc2FnZSl7XG4gICAgdmFyIG9yaWdpbmFsSW1wb3J0ID0gaW1wb3J0U2NyaXB0cyxcbiAgICAgICAgaGFuZGxlcnMgPSB7fTtcblxuICAgIHRhcmdldC5pbXBvcnRTY3JpcHRzID0gZnVuY3Rpb24ocGF0aCl7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbEltcG9ydChzZXR0aW5ncy5ob3N0ICsgcGF0aCk7XG4gICAgfTtcblxuICAgIGhhbmRsZXJzLmxvYWQgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgdGFyZ2V0LmltcG9ydFNjcmlwdHMoZGF0YSk7XG4gICAgfTtcblxuICAgIGhhbmRsZXJzLmxvYWRzY3JpcHQgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgb3JpZ2luYWxJbXBvcnQoZGF0YSk7XG4gICAgfTtcblxuICAgIHZhciBzdG9yYWdlUmVxdWVzdHMgPSB7XG4gICAgICAgIGlkOiAwXG4gICAgfTtcbiAgICB0YXJnZXQubG9jYWxTdG9yYWdlID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSwgY2FsbGJhY2spe1xuICAgICAgICAgICAgdmFyIGlkID0gc3RvcmFnZVJlcXVlc3RzLmlkKys7XG4gICAgICAgICAgICBzZWNyZXRNZXNzYWdlKCdsb2NhbCcsIEpTT04uc3RyaW5naWZ5KFtpZCwga2V5XSkpO1xuICAgICAgICAgICAgc3RvcmFnZVJlcXVlc3RzW2lkXSA9IGNhbGxiYWNrO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUsIGNhbGxiYWNrKXtcbiAgICAgICAgICAgIHZhciBpZCA9IHN0b3JhZ2VSZXF1ZXN0cy5pZCsrO1xuICAgICAgICAgICAgc2VjcmV0TWVzc2FnZSgnbG9jYWwnLCBKU09OLnN0cmluZ2lmeShbaWQsIGtleSwgdmFsdWVdKSk7XG4gICAgICAgICAgICBzdG9yYWdlUmVxdWVzdHNbaWRdID0gY2FsbGJhY2s7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGhhbmRsZXJzLmxvY2FsID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgIHZhciBhcmdzID0gSlNPTi5wYXJzZShkYXRhKSxcbiAgICAgICAgICAgIGlkID0gYXJnc1swXTtcblxuICAgICAgICBzdG9yYWdlUmVxdWVzdHNbaWRdLmFwcGx5KG51bGwsIGFyZ3Muc2xpY2UoMSkpO1xuICAgIH1cblxuICAgIHJldHVybiBoYW5kbGVycztcbn1cblxuZnVuY3Rpb24gd29ya1VwKG1ha2VXb3JrZXIpe1xuICAgIGlmKCFtYWtlV29ya2VyKXtcbiAgICAgICAgbWFrZVdvcmtlciA9IGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIocGF0aCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHNlY3JldCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBzZWNyZXQ6IHNlY3JldCxcbiAgICAgICAgICAgIGhvc3Q6IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmhvc3QgKyAnLydcbiAgICAgICAgfSxcbiAgICAgICAgd29ya2VyU2NyaXB0ID0gJygnICsgYm9vdHN0cmFwLnRvU3RyaW5nKCkgKyAnKShzZWxmLCAnICsgW1xuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpLFxuICAgICAgICAgICAgd29ya2VyU2NyaXB0SGFuZGxlcnMudG9TdHJpbmcoKVxuICAgICAgICBdICsgJyknO1xuXG4gICAgdmFyIGJsb2I7XG4gICAgdHJ5IHtcbiAgICAgICAgYmxvYiA9IG5ldyBCbG9iKFt3b3JrZXJTY3JpcHRdLCB7dHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnfSk7XG4gICAgfSBjYXRjaCAoZSkgeyAvLyBCYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgICB3aW5kb3cuQmxvYkJ1aWxkZXIgPSB3aW5kb3cuQmxvYkJ1aWxkZXIgfHwgd2luZG93LldlYktpdEJsb2JCdWlsZGVyIHx8IHdpbmRvdy5Nb3pCbG9iQnVpbGRlcjtcbiAgICAgICAgYmxvYiA9IG5ldyBCbG9iQnVpbGRlcigpO1xuICAgICAgICBibG9iLmFwcGVuZCh3b3JrZXJTY3JpcHQpO1xuICAgICAgICBibG9iID0gYmxvYi5nZXRCbG9iKCk7XG4gICAgfVxuXG4gICAgdmFyIHdvcmtlciA9IG1ha2VXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSk7XG5cbiAgICB3b3JrZXIubG9hZEZpbGUgPSBmdW5jdGlvbihwYXRoKXtcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHNlY3JldCArICc6bG9hZDonICsgcGF0aCk7XG4gICAgfTtcbiAgICB3b3JrZXIubG9hZFNjcmlwdCA9IGZ1bmN0aW9uKHN0cmluZyl7XG4gICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZShzZWNyZXQgKyAnOmxvYWRzY3JpcHQ6JyArIHN0cmluZyk7XG4gICAgfTtcblxuICAgIGJvb3RzdHJhcCh3b3JrZXIsIHNldHRpbmdzLCBmdW5jdGlvbih0YXJnZXQsIHNldHRpbmdzLCBzZWNyZXRNZXNzYWdlKXtcbiAgICAgICAgdmFyIGhhbmRsZXJzID0ge307XG5cbiAgICAgICAgaGFuZGxlcnMubG9jYWwgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHZhciBhcmdzID0gSlNPTi5wYXJzZShkYXRhKSxcbiAgICAgICAgICAgICAgICBpZCA9IGFyZ3NbMF0sXG4gICAgICAgICAgICAgICAga2V5ID0gYXJnc1sxXSxcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGFyZ3NbMl0sXG4gICAgICAgICAgICAgICAgc2V0ID0gYXJncy5sZW5ndGggPT09IDMsXG4gICAgICAgICAgICAgICAgcmVzdWx0O1xuXG4gICAgICAgICAgICBpZihzZXQpe1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VjcmV0TWVzc2FnZSgnbG9jYWwnLCBKU09OLnN0cmluZ2lmeShbaWQsIHJlc3VsdF0pKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gaGFuZGxlcnM7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gd29ya2VyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdvcmtVcDsiLCJ2YXIgd29ya3VwID0gcmVxdWlyZSgnLi4vJyk7XG5cbnZhciB3b3JrZXIgPSB3b3JrdXAoKTtcblxud29ya2VyLmxvYWRGaWxlKCd0ZXN0V29ya2VyLmpzJyk7Il19
