function log(d) {
    console.log(d);
}


const types = {
    isFunction: opt => typeof opt == "function",
    isPromise: opt => opt instanceof Promise,
    isArray: opt => Array.isArray(opt),
    isFlow: opt => types.isFunction(opt.run) && opt.run.name === "run"
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const NOOP = () => { };

const createFlow = (effects) => {
    let pormise = Promise.resolve();
    return {
        //async
        run(cb = NOOP) {
            while (effects.length) {
                const effect = effects.shift();
                if (types.isFunction(effect) || types.isPromise(effect)) {
                    // await effect();
                    pormise = pormise.then(effect)
                } else if (types.isArray(effect)) {
                    pormise = pormise.then(createFlow(effect).run);
                    // await createFlow(effect).run();
                } else if (types.isFlow(effect)) {
                    pormise = pormise.then(effect.run);
                    // await effect.run();
                }
            }
            return pormise.then(cb)
        }
    }
}



const subFlow = createFlow([
    () => delay(2000).then(() => log("c"))
])




createFlow([
    () => log('a'),
    () => log('b'),
    subFlow,
    [
        () => delay(1500).then(() => log("d")),
        () => log('e'),
    ]
]).run(() => {
    log("done");
})
