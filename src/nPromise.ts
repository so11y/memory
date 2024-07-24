enum PromiseType {
  Pending = "fulfilled",
  Resolved = "resolved",
  Rejected = "rejected",
}

type PromiseCallBack<T> = (
  resolve: (v: T) => void,
  reject: (v: T) => void
) => void;

type PromiseTaskCallback<T> = {
  resolved: ThenCallBack<T>;
  rejected: ThenCallBack<T>;
};

type ThenCallBack<T> = (item: T | null) => any;

const PromisePromiseResult = Symbol("PromiseResult");

const NOOP = () => null;

const throwError = (error: unknown) => {
  throw `(in promise) ${error}`;
};

class Promise_<T = any> {
  PromiseState: PromiseType = PromiseType.Pending;
  [PromisePromiseResult]: T | null = null;
  private PendingTask: Array<PromiseTaskCallback<T>> = [];

  private notify(taskCallbackKey: keyof PromiseTaskCallback<T>) {
    while (this.PendingTask.length) {
      const current = this.PendingTask.shift()!;
      current[taskCallbackKey](this[PromisePromiseResult]);
    }
  }

  constructor(callback: PromiseCallBack<T>) {
    const template = (
      value: T,
      state: PromiseType,
      key: keyof PromiseTaskCallback<T>
    ) => {
      if (this.PromiseState === PromiseType.Pending) {
        setTimeout(() => {
          if (state === PromiseType.Rejected && this.PendingTask.length === 0) {
            throwError(value);
          }
          this[PromisePromiseResult] = value;
          this.PromiseState = state;
          this.notify(key);
        });
      }
    };
    const resolve = (v: T) => {
      template(v, PromiseType.Resolved, "resolved");
    };
    const reject = (v: T) => {
      template(v, PromiseType.Rejected, "rejected");
    };
    try {
      callback(resolve, reject);
    } catch (error) {
      reject(error as any);
    }
  }

  then(resolve: ThenCallBack<T>, reject?: ThenCallBack<T>) {
    let nextResolve: ThenCallBack<T>;
    let nextReject: ThenCallBack<T>;
    const nextPromise = new Promise_<T>((resolve, reject) => {
      nextResolve = resolve as ThenCallBack<T>;
      nextReject = reject as ThenCallBack<T>;
    });

    const handleResult = (
      value: T | null,
      callback: (value: T | null) => any
    ) => {
      try {
        const result = callback(value);
        if (result && result.then && result instanceof Promise_) {
          result.then(nextResolve, nextReject);
        } else {
          nextResolve(result);
        }
      } catch (error) {
        nextReject(error as any);
      }
    };
    this.PendingTask.push({
      resolved(value) {
        handleResult(value, resolve);
      },
      rejected(value) {
        if (reject === undefined) {
          handleResult(value, (value) => {
            throw value;
          });
        } else {
          handleResult(value, reject);
        }
      },
    });

    if (this.PromiseState !== PromiseType.Pending) {
      this.notify(this.PromiseState);
    }

    return nextPromise;
  }

  catch(reject: ThenCallBack<T>) {
    return this.then(NOOP, reject);
  }

  finally(resolve: ThenCallBack<null>) {
    return this.then(
      () => resolve(null),
      (value) => {
        resolve(null);
        throwError(value);
      }
    );
  }

  static resolve<T>(value: T) {
    return new Promise_((r) => r(value));
  }

  static reject<T>(value: T) {
    return new Promise_((_, s) => s(value));
  }

  static all(tasks: Array<Promise_>) {
    const result: Array<any> = [];
    return new Promise_((r, s) => {
      let resolved = 0;
      for (let index = 0; index < tasks.length; index++) {
        const task = tasks[index];
        task.then((value) => {
          result[index] = value;
          resolved++;
          if (resolved === tasks.length) {
            r(result);
          }
        }, s);
      }
    });
  }

  static race(tasks: Array<Promise_>) {
    return new Promise_((r, s) => {
      for (let index = 0; index < tasks.length; index++) {
        const task = tasks[index];
        task.then(r, s);
      }
    });
  }

  static any(tasks: Array<Promise_>) {
    return new Promise_((r, s) => {
      let reject = 0;
      for (let index = 0; index < tasks.length; index++) {
        const task = tasks[index];
        task.then(r, () => {
          reject++;
          if (reject === tasks.length) {
            s("AggregateError: All promises were rejected");
          }
        });
      }
    });
  }

  static allSettled<
    T extends Array<{
      status: PromiseType;
      value: any;
    }>
  >(tasks: Array<Promise_>): Promise_<T> {
    let result = [] as any;
    return new Promise_((r, s) => {
      for (let index = 0; index < tasks.length; index++) {
        const task = tasks[index];
        const onResolved = (value: any) => {
          result[index] = {
            status: PromiseType.Resolved,
            value,
          };
        };
        const onRejected = (value: any) => {
          result[index] = {
            status: PromiseType.Resolved,
            value,
          };
        };
        const onFinally = () => {
          if (index === tasks.length - 1) {
            r(result);
          }
        };
        task.then(onResolved, onRejected).finally(onFinally);
      }
    });
  }
}

export {};
