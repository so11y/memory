class Assert {
    gl(a: number, b: number) {
        return a > b;
    }
    contain<T extends Array<P>, P>(a: T, b: P): boolean;
    contain(a: string, b: string): boolean {
        return a.includes(b);
    }
}
class Operation {
    protected kind = {
        not: false,
        have: false
    }
    get not() {
        this.kind.not = true;
        return this;
    }

    get have() {
        this.kind.have = true;
        return this;
    }
}
//这里理论上不继承操作符
class Expect<T = any> extends Operation {
    private assertValue: T;
    private _Assert = new Assert();

    public assertType = true;

    constructor(assertValue: T) {
        super();
        this.assertValue = assertValue;
    }

    gl(expectValue: T) {
        this.assert("gl", expectValue);
    }

    contain<Z>(expectValue: Z) {
        this.assert("contain", expectValue);
    }

    private assert<Z>(v: string, expectValue: Z) {
        if (this._Assert[v]) {
            let result = this._Assert[v](this.assertValue, expectValue)
            if ((this.kind.not && result) || (!this.kind.not && !result)) {
                this.assertType = false;
            } else {
                this.assertType = true;
            }
        }
    }
}
interface Test {
    (v: string, k: () => void): void;
    active: Array<TestClass>;
}
class TestClass {
    collect: Expect[] = [];
}
const expect = <T>(assertValue: T) => {
    const expect = new Expect(assertValue);
    test.active[test.active.length - 1].collect.push(expect);
    return expect;
}
const test: Test = (v: string, k: () => void) => {
    const testClass = new TestClass();
    test.active.push(testClass);
    k();
    test.active.pop();
    const errorAssert = testClass.collect.filter(v => !v.assertType);
    console.log(v);
    if (errorAssert.length) {
        console.error(errorAssert);
    }
}
test.active = [];

test("验证比较大小", () => {
    expect(1).not.gl(2);
    test("验证是否存在", () => {
        expect("123,456").not.contain(456);
    })
    expect(1).gl(2);
    expect(1).gl(2);
    expect(1).gl(2);
})
