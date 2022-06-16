interface ExpectFn<T> {
    (value: T, next: ExpectLink<T>["running"])
}
class User {
    constructor(public name: string) {
    }
}
class ExpectLink<T = any> {
    public expect: ExpectFn<T>;
    public next: ExpectLink<T> | null;
    running(value?: T) {
        const next = async (value?: T) => {
            if (this.next) {
                await this.next.running(value)
            }
        }
        return this.expect(value, next);
    }
}

class ComposeLink<T> {
    private prev: ExpectLink<T> = null;
    private head: ExpectLink<T> = null;
    private value: T;
    constructor(value: T) {
        this.value = value;
    }
    public use(fn: ExpectFn<T>) {
        const link = new ExpectLink();
        link.expect = fn;
        if (!this.head) this.head = link;
        if (this.prev) this.prev.next = link;
        this.prev = link;
        return this;
    }
    public run() {
        //执行头节点的入口函数
        return this.head.running(this.value)
    }
}
const composeTask = new ComposeLink(new User("nihao"));
const delay = () => {
    return new Promise<void>((r, s) => {
        setTimeout(() => {
            console.log("delay")
            r();
        }, 500)
    })
}
composeTask
    .use(async (value, next) => {
        console.log(1);
        await next(value);
        console.log(2);
    })
    .use(async (value, next) => {
        console.log(3);
        await delay();
        console.log(4);
        next();
    })
    .run().then(() => {
        console.log(5);
    })

