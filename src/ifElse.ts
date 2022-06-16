{
    interface ExpectFn<T> {
        maybe(value: T): boolean;
        expect(value: T): void;
    }
    enum Mode {
        If = "IF",
        IfElse = "IfElse"
    }
    class User {
        constructor(public name: string) {
        }
    }
    class ExpectLink<T> {
        public expect: ExpectFn<T>;
        public next: ExpectLink<T> | null;
        private composeConfig: ComposeLink<T>;
        constructor(config: ComposeLink<T>) {
            //存储当前配置
            this.composeConfig = config;
        }
        runTest(value: T) {
            //判断是否满足执行条件
            const isMaybe = this.expect.maybe(value);
            if (isMaybe) {
                //if分支
                if (this.composeConfig.mode === Mode.If) {
                    this.expect.expect(value);
                    //ifElse模式,并且之前没有满足执行过才执行
                } else if (!this.composeConfig.isLock) {
                    this.composeConfig.isLock = true;
                    this.expect.expect(value);
                }
            }
            //判断是否有下一个链表
            //并且不是锁状态
            if (this.next && !this.composeConfig.isLock) {
                this.next.runTest(value);
            }
        }
    }
    class ComposeLink<T> {
        //前一个节点
        private prev: ExpectLink<T> = null;
        //任务头节点
        private head: ExpectLink<T> = null;
        //入参
        private value: T;
        //是否锁状态
        public isLock: boolean = false;
        //当前模式 "if"|"ifElse"
        public mode: Mode;
        constructor(value: T, mode: Mode = Mode.If) {
            this.value = value;
            this.mode = mode;
        }
        public use(fn: ExpectFn<T>) {
            //创建链表
            const link = new ExpectLink(this);
            //存储逻辑
            link.expect = fn;
            //没有头节点的时候创建头节点
            if (!this.head) this.head = link;
            //上一个节点存在的时候,当前节点和前一个节点形成关联
            if (this.prev) this.prev.next = link;
            //把当前节点存储,如果下一个节点进来,那么这个prev就是下一个节点的前一个
            this.prev = link;
            return this;
        }
        public run() {
            //执行头节点的入口函数
            //然后头节点开始已链表的链式去执行接下来的所有任务
            this.head.runTest(this.value);
        }
    }
    const composeTask = new ComposeLink(new User("nihao"), Mode.IfElse);

    const userLiHao = {
        maybe(value: User) {
            return value.name === "nihao";
        },
        expect(value: User) {
            console.log('用户是你好,要去吃饭');
        }
    }
    const userGoodOrLiHao = {
        maybe(value: User) {
            return value.name === "good" || value.name === "nihao";
        },
        expect(value: User) {
            console.log('用户是good或者nihao,要去睡觉');
        }
    }
    composeTask
        .use(userGoodOrLiHao)
        .use(userLiHao)
        .run();


}