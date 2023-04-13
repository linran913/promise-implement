const myPromise = require('./mPromise.js');


const promise1 = myPromise.resolve(3);
const promise2 = 42;
const promise3 = new myPromise((resolve, reject) => {
    setTimeout(resolve, 100, 'foo');
});

myPromise.all([promise1, promise2, promise3]).then((values) => {
    console.log(values);
});
// expected output: Array [3, 42, "foo"]