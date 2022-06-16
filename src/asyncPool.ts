const fristPeomise = (task) => {
    return new Promise((r) => {
        let isFrist = false;
        task.forEach((v) => {
            v.then(() => {
                if (!isFrist) {
                    isFrist = true;
                    r(void 0);
                }
            });
        });
    });
};
const asyncPool = (tasks, limit) => {
    let completeIndex = tasks.length;
    const pendingTask = [];
    const running = () => {
        return new Promise((r) => {
            while (tasks.length) {
                if (pendingTask.length < limit) {
                    const taskItem = tasks.shift();
                    const handle = taskItem().then(() => {
                        pendingTask.splice(pendingTask.indexOf(handle), 1);
                        completeIndex--;
                    }).finally(() => {
                        if (!completeIndex) r(void 0);
                    })
                    pendingTask.push(handle);
                } else {
                    break;
                }
            }
            fristPeomise(pendingTask).then(() => running().then(r));
        });
    }
    return running();
};

const logTime = (tiem) => {
    return new Promise((r, s) =>
        setTimeout(() => {
            console.log(tiem);
            r(void 0);
        }, tiem)
    );
};
const tasks = [
    () => logTime(100),
    () => logTime(200),
    () => logTime(200),
    () => logTime(200),
    () => logTime(100),
    () => logTime(100),
    () => logTime(100),
    () => logTime(600),
    () => logTime(100),
    () => logTime(100),
    () => logTime(600),
];

asyncPool(tasks, 5).then(() => {
    console.log("task end");
});



