class mPromise {
    static PANDING = "pending";
    static FULFILLED = "fulfilled";
    static REJECTED = "rejected";
    
    constructor(executor) {
        this.PromiseState = mPromise.PANDING;
        this.PromiseResult = null;
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];
        try{
            executor(this.resolve.bind(this), this.reject.bind(this));
        }catch(error){
            this.reject(error);
        }
        
    }
    then(onFulfilled, onRejected) {
        //onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
        //onRejected = typeof onRejected === "function" ? onRejected : reason =>{ throw reason };
        let promise2 =  new mPromise((resolve, reject) => {
            if( this.PromiseState === mPromise.FULFILLED) {
                setTimeout(() => {
                    try{
                        if(typeof onFulfilled !== "function") {
                            resolve(this.PromiseResult);
                        }else{                            
                            let x = onFulfilled(this.PromiseResult);
                            resolvePromise(promise2, x, resolve, reject);
                        }
                    }catch(error){
                        reject(error);
                    }
                });
            }else if(this.PromiseState === mPromise.REJECTED) {
                setTimeout(() => {
                    try{
                        if(typeof onRejected !== "function") {
                            reject(this.PromiseResult);
                        }else{                            
                            let x = onRejected(this.PromiseResult);
                            resolvePromise(promise2, x, resolve, reject);
                        }
                    }catch(error){
                        reject(error);
                    }    
                });
            }else if(this.PromiseState === mPromise.PANDING) {
                this.onFulfilledCallbacks.push((value)=> {
                    setTimeout(() => {
                        try{
                            if(typeof onFulfilled !== "function") {
                                resolve(this.PromiseResult);
                            }else{                            
                                let x = onFulfilled(this.PromiseResult);
                                resolvePromise(promise2, x, resolve, reject);
                            }
                        }catch(error){
                            reject(error);
                        }
                    })
                });
                this.onRejectedCallbacks.push((reason)=> {
                    setTimeout(() => {
                        try{
                            if(typeof onRejected !== "function") {
                                reject(this.PromiseResult);
                            }else{                            
                                let x = onRejected(this.PromiseResult);
                                resolvePromise(promise2, x, resolve, reject);
                            }
                        }catch(error){
                            reject(error);
                        }
                    })
                });
            }
        })
        return promise2;
    }
    resolve(value) {
        if( this.PromiseState === mPromise.PANDING) {
            this.PromiseState = mPromise.FULFILLED;
            this.PromiseResult = value;
            this.onFulfilledCallbacks.forEach(onFulfilled => {
                onFulfilled(value);
            })
        }
    }
    reject(reason) {
        if( this.PromiseState === mPromise.PANDING) {
            this.PromiseState = mPromise.REJECTED;
            this.PromiseResult = reason;
            this.onRejectedCallbacks.forEach(onRejected => {
                onRejected(reason);
            })
        }
    }
    static resolve(value) {
        if( value instanceof mPromise) {
            return value;
        }else{
            let promise2 = new mPromise((resolve, reject) => {
                if(value !== null && (typeof value === "object" || typeof value === "function")) {//value instanceof Object && 'then' in value
                    try{
                        value.then(resolve, reject);
                    }catch(error){
                        reject(error);
                    }
                }else{
                    resolve(value);
                }
            })
            return promise2;
        }
    }
    static reject(reason) {
        return new mPromise((resolve, reject) => {
            reject(reason);
        })
    }
    catch(onRejected) {
        return this.then(null, onRejected);
    }
    finally(callBack) {
        return this.then(callBack,callBack)
    }
    static all(promises) {
        return new mPromise((resolve, reject) => {
            if(Array.isArray(promises)) {
                if(promises.length === 0) {
                    return resolve(promises);
                }
                let result = [];
                let count = 0;
                let length = promises.length;

                promises.forEach((item,index) => {
                    mPromise.resolve(item).then(value => {
                        result[index] = value;
                        count++;
                        if(length === count) {
                            resolve(result);
                        }
                    }, error => {
                        reject(error);
                    })
                    
                })
            }else{
                return reject(new TypeError("Argument must be an array"));
            }
        })
    }
    static any(promises) {
        return new mPromise((resolve, reject) => {
            if(Array.isArray(promises)) {
                if(promises.length === 0) {
                    return reject(new AggregateError('All promises were rejected'));
                }
                let errors = [];
                let count = 0;
                let length = promises.length;
                promises.forEach(item => {
                    item.then(value => {
                        resolve(value);
                    },
                    reason => {
                        errors.push(reason);
                        count++;
                        if(length === count) {
                            reject(new AggregateError(errors));
                        }
                    })
                })
            }else{
                return reject(new TypeError("Argument must be an array"));
            }
        })
    }
    static race(promises) {
        return new mPromise((resolve, reject) => {
            if(Array.isArray(promises)) {
                if(promises.length > 0) {
                    promises.forEach(item => {
                        mPromise.resolve(item).then(resolve,reject)
                    })
                }
            }else{
                return reject(new TypeError("Argument must be an array"));
            }
        })
    }
}
function resolvePromise(promise, x, resolve, reject) {
    if(promise === x) {
        throw new TypeError("Chaining cycle detected for promise");
    }
    if(x instanceof mPromise) {
        x.then( y => {
            resolvePromise(promise, y, resolve, reject);
        }, reject);
    }else if(x !== null && (typeof x === "object" || typeof x === "function")) {
        let then = null;//放在捕获语句块里会造成访问不到then作用域
        try{
            then = x.then;
        }catch(error){
            return reject(error);
        }
        if(typeof then === "function") {
            let called = false;
            try{
                then.call(
                    x,
                    y => {
                        if(called) return;
                        called = true;
                        resolvePromise(promise, y, resolve, reject); 
                    },
                    r => {
                        if(called) return;
                        called = true;
                        reject(r);
                    }
                    );
            }catch(error){
                if( called) return;
                called = true;
                reject(error);
            }
        }else{
            resolve(x);
        }
    }else{
        return resolve(x);
    }
}

mPromise.deferred = function () {
    let result = {};
    result.promise = new mPromise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    return result;
}

module.exports = mPromise;

