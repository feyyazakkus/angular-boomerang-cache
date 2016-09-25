
/**
 * BoomerangCache Cache Angular
 *
 * Implementation of BoomerangCache library for AngularJS
 */
(function (root, boomerangApi) {

	'use strict';

	angular.module('boomerang.cache', [])
	.provider('boomerangCache', function () {
		
		this.storage = 'local';

		this.setStorageType = function (storage) {
			this.storage = storage;
			return this.storage;
		};

		this.getStorageType = function () {
			return this.storage;
		};

		var defaultOptions = {
			storage: this.storage
		}

		this.$get = function () {
			return boomerangApi(defaultOptions)
		}
	});

}(this, function (defaults) {

    'use strict';

    var api, utils, expirePrefix;

    expirePrefix = "__boomerangExpire__";

    /**
     * BoomerangCache main instance
     *
     * @param store
     * @param options
     * @constructor
     */
    function BoomerangCache(store, options) {

        this.options = options;
        this.storage = this.api[this.options.storage];

        if (typeof this.storage == 'undefined') {
            throw "Undefined factory";
        }

        if (this.storage.check()) {
            this.namespace = utils.trim(store) != '' ? utils.trim(store) : 'BoomerangCache';
        }
    }

    BoomerangCache.prototype.hasExpired = function (key) {
        var expireKey = utils.expireKey(this.namespace, key),
            expireValue = parseInt(this.storage.getItem(expireKey), 10);

        if (expireValue && expireValue < utils.currentTime()) {
            return true;
        }

        return false;
    };

    /**
     * utils
     *
     * @type {{extend}}
     */
    utils = (function() {

        return {

            extend: function() {
                for (var i = 1; i < arguments.length; i++) {
                    for (var key in arguments[i]) {
                        if (arguments[i].hasOwnProperty(key)) {
                            arguments[0][key] = arguments[i][key];
                        }
                    }
                }

                return arguments[0];
            },

            trim: function(x) {
                return x.replace(/^\s+|\s+$/gm,'');
            },

            namespaceKey: function (namespace, key) {
                return namespace + ":" + key;
            },
            
            expireKey: function (namespace, key) {
                return this.namespaceKey(namespace, expirePrefix + key);
            },

            currentTime: function () {
                return new Date().getTime();
            }
        }
    }());

    /**
     * api
     *
     * @type {{create}}
     */
    api = (function(defaults) {

        var instance;

        var defaultOptions = {
            storage: 'local'
        };

        if (defaults) {
    		defaultOptions = defaults
    	}

        return {

            create: function(store, options) {

                options = utils.extend(defaultOptions, options);

                instance = new BoomerangCache(store, options);

                return instance;
            }
        }
    }(defaults));

    BoomerangCache.prototype.api = {

        local: {

            check: function() {

                var key = '__BoomerangCache__',
                    value = 'BoomerangCache';

                try {
                    localStorage.setItem(key, value);
                    localStorage.removeItem(key);
                    return true;
                }
                catch (exc) {
                    console.log('error');
                    return false;
                }
            },

            getItem: function(key) {
                return localStorage.getItem(key);
            },

            setItem: function(key, value) {
                localStorage.removeItem(key);
                localStorage.setItem(key, value);
            },

            getAll: function(namespace) {
                var keys = Object.keys(localStorage),
                    values = {},
                    i = keys.length;

                while (i--) {
                    var keySplit = keys[i].split(':');

                    if (keySplit[0] == namespace) {
                        values[keySplit[1]] = localStorage.getItem(keys[i]);
                    }
                }

                return values;
            },

            getObject: function(key) {
                var obj = localStorage.getItem(key);
                return JSON.parse(obj);
            },

            setObject: function(key, value) {
                localStorage.removeItem(key);
                localStorage.setItem(key, JSON.stringify(value));
            },

            removeItem: function(key) {
                return localStorage.removeItem(key);
            },

            clear: function() {
                localStorage.clear();
            }
        },

        session: {

            check: function() {

                var key = '__BoomerangCache__',
                    value = 'BoomerangCache';

                try {
                    sessionStorage.setItem(key, value);
                    sessionStorage.removeItem(key);
                    return true;
                }
                catch (exc) {
                    console.log('error');
                    return false;
                }
            },

            getItem: function(key) {
                return sessionStorage.getItem(key);
            },

            setItem: function(key, value) {
                sessionStorage.removeItem(key);
                sessionStorage.setItem(key, value);
            },

            getAll: function(namespace) {
                var keys = Object.keys(sessionStorage),
                    values = {},
                    i = keys.length;

                while (i--) {
                    var keySplit = keys[i].split(':');

                    if (keySplit[0] == namespace) {
                        values[keySplit[1]] = sessionStorage.getItem(keys[i]);
                    }
                }

                return values;
            },

            getObject: function(key) {
                var obj = sessionStorage.getItem(key);
                return JSON.parse(obj);
            },

            setObject: function(key, value) {
                sessionStorage.removeItem(key);
                sessionStorage.setItem(key, JSON.stringify(value));
            },

            removeItem: function(key) {
                return sessionStorage.removeItem(key);
            },

            clear: function() {
                sessionStorage.clear();
            }
        }
    };

    /**
     * Main public API functions
     */


    /**
     * set
     *
     * @param key
     * @param value
     * @returns {*}
     */
    BoomerangCache.prototype.set = function(key, value, seconds) {

        var namespaceKey = utils.namespaceKey(this.namespace, key);
        var expireKey = utils.expireKey(this.namespace, key);

        if (seconds) {
            var s = seconds * 1000;

            this.storage.setItem(expireKey, utils.currentTime() + s);
        }
        else {
            this.storage.removeItem(expireKey);
        }

        if (typeof value === 'undefined') {
            return this.storage.removeItem(namespaceKey);
        }

        // if value is an array or object
        if (typeof value === 'object') {
            this.storage.setObject(namespaceKey, value);
            return value;
        }

        // if value is string
        this.storage.setItem(namespaceKey, value);
        return value;
    };

    /**
     * get
     *
     * @param key
     * @param defaultValue
     * @returns {*}
     */
    BoomerangCache.prototype.get = function(key, defaultValue) {

        var namespaceKey = utils.namespaceKey(this.namespace, key);

        if (this.hasExpired(key)) {
            this.storage.removeItem(namespaceKey);
            this.storage.removeItem(utils.expireKey(this.namespace, key));
            return null;
        }

        var value = this.storage.getItem(namespaceKey);

        // check if item is an object
        if (typeof value !== 'undefined' || value != null) {

            try {
                return JSON.parse(value);
            }
            catch (e) {}
        }

        return (typeof value !== 'undefined') ? value : defaultValue;
    };

    /**
     * getAll
     *
     * @returns {*}
     */
    BoomerangCache.prototype.getAll = function() {

        return this.storage.getAll(this.namespace);
    };

    /**
     * remove
     *
     * @param key
     * @returns {*}
     */
    BoomerangCache.prototype.remove = function(key) {

        key = utils.namespaceKey(this.namespace, key);
        return this.storage.removeItem(key);
    };

    /**
     * length
     *
     * @returns Number
     */
    BoomerangCache.prototype.length = function() {

        return Object.keys(this.storage.getAll(this.namespace)).length;
    };

    /**
     * clear
     */
    BoomerangCache.prototype.clear = function() {
        this.storage.clear();
    };

    /**
     * check browser support
     *
     * @returns true|false
     */
    BoomerangCache.prototype.check = function() {
        return this.storage.check();
    };

    return api;
}));