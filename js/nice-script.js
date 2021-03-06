var NiceScript = function(){
    function run(code) {
        try {
            if(checkSyntax(code)) {
                var handler = {
                    get(obj, prop) {
                        return Reflect.has(obj, prop.toString() + '__$') ? 
                            obj[prop.toString() + '__$'] : undefined;
                    },
                    set(obj, prop, value) {
                            Reflect.set(obj, prop+'__$', value);
                    },
                    has(obj,prop) {                        
                            return obj && Reflect.has(obj, prop.toString()+'__$');
                    }
                };
                var catchAllHandler = {
                    get(obj, prop){
                        return Reflect.get(obj,prop);
                    },
                    set() { },
                    has() {
                        return true
                    }
                };

                const _console = {};

                (function createMockConsole(_console){
                    const allowConsoleProps = ["debug", "error", "info", "log", "warn", 
                            "dir", "dirxml", "table", "trace", "group", "groupCollapsed", 
                            "groupEnd", "clear", "count", "countReset", "assert", "profile", 
                            "profileEnd", "time", "timeLog", "timeEnd", "timeStamp"];
                
                    for(const property of allowConsoleProps){
                        _console[property] = function(){
                            if (arguments.length > 1 && typeof arguments[0] === 'string') {
                                arguments[0] = arguments[0].replace(/%/g, '%%')
                            }
                            return console[property](...arguments);
                        }
                    }
                })(_console);

                var allowList = {
                    __proto__: null,
                    console__$:_console,
                    alert__$: function(){ 
                        alert("Sandboxed alert:"+arguments[0]);
                    },
                    String__$: String,
                    Number__$: Number,
                    Array__$: Array,
                    Symbol__$: Symbol,
                    Math__$: Math,
                    RegExp__$: RegExp,
                    Object__$: Object,
                    eval__$: function(code){
                        return NiceScript.run("return "+code);
                    }      
                };
                if(!Object.isFrozen(String.prototype)) {
                    Function.prototype.constructor = null;
                    Object.freeze(console);
                    Object.freeze(_console);
                    Object.freeze(Object);
                    Object.freeze(String);
                    Object.freeze(Number);
                    Object.freeze(Array);
                    Object.freeze(Symbol);
                    Object.freeze(Math);
                    Object.freeze(Function);
                    Object.freeze(RegExp);
                    Object.freeze(BigInt);
                    Object.freeze(Promise);
                    Object.freeze(console);
                    Object.freeze(BigInt.prototype);
                    Object.freeze(Object.prototype);
                    Object.freeze(String.prototype);
                    Object.freeze(Number.prototype);
                    Object.freeze(Array.prototype);
                    Object.freeze(Symbol.prototype);
                    Object.freeze(Math.prototype);
                    Object.freeze(Function.prototype);
                    Object.freeze(RegExp.prototype);
                    Object.freeze(Promise.prototype);
                    Object.defineProperty((async function () {}).constructor.prototype, 'constructor', {
                        value: null,
                        configurable: false,
                        writable: false
                    });
                    Object.defineProperty((async function* () {}).constructor.prototype, 'constructor', {
                        value: null,
                        configurable: false,
                        writable: false
                    });
                    Object.defineProperty((function* () {}).constructor.prototype, 'constructor', {
                        value: null,
                        configurable: false,
                        writable: false
                    });

                    Object.freeze((async function () {}).__proto__);
                    Object.freeze((async function* () {}).__proto__);
                    Object.freeze((function* () {}).__proto__);
                    Object.freeze((function* () {}).__proto__.prototype);
                    Object.freeze((async function* () {}).__proto__.prototype);
                }
                var proxy = new Proxy(allowList, handler);  
                var catchAllProxy = new Proxy({__proto__:null, proxy:proxy, globalThis:new Proxy(allowList, handler), window:new Proxy(allowList, handler)}, catchAllHandler);                     
                var output = Function('proxy', 'catchAllProxy', `
                    with(catchAllProxy) {     
                        with(proxy) {  
                            return (function(){                                               
                                "use strict";
                                ${code};
                            })();
                        }
                    }                    
                `)(proxy, catchAllProxy); 
                return output;                                       
            }
        } catch(e) {
            throw e;
        }
    }
    function checkSyntax(code) {
        Function(code);
        if(/\bimport\s*(?:[(]|\/[*]|\/\/|<!--|-->)/.test(code)) {
            throw new Error("Dynamic imports are blocked");
        }
        return true;
    }
    return {run: run};
}();
