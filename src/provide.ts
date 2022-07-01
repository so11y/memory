// import 'reflect-metadata';

// interface IConstructor<T = any> {
//     new(...arg: any[]): T
// }

// interface InjectParams {
//     index: number;
//     value: IConstructor
// }


// class container {
//     created<T>(v: IConstructor<T>): T {
//         const params: InjectParams[] = Reflect.getMetadata("inject:params", v) || [];
//         const overwriteParent: IConstructor[] = Reflect.getMetadata("inject:overwrite", container) || [];
//         params.sort((prev, next) => prev.index - next.index);
//         const paramsInject = params.map(v => {
//             const findOverwrite = overwriteParent.find(vv => {
//                 return vv.prototype instanceof v.value
//             })
//             if (findOverwrite) {
//                 return findOverwrite
//             }
//             return v.value;
//         })
//         const injectValue = paramsInject.map(v => new container().created(v));
//         return new v(...injectValue);
//     }
// }

// function inject(v: IConstructor) {
//     return function (target: IConstructor, _, index: number) {
//         const params = Reflect.getMetadata("inject:params", target);
//         if (params && params.find(v => v.index !== index)) {
//             params.push({
//                 index,
//                 value: v
//             })
//         } else {
//             Reflect.defineMetadata("inject:params", [{
//                 index,
//                 value: v
//             }], target);
//         }
//     }
// }

// function overwriteInject(targe: IConstructor) {
//     const overwriteParent: IConstructor[] = Reflect.getMetadata("inject:overwrite", container);
//     if (overwriteParent) {
//         overwriteParent.push(targe);
//     } else {
//         Reflect.defineMetadata("inject:overwrite", [targe], container)
//     }
// }


// //标准
// class x2 {
//     say() {
//         console.log("x2");
//     }
// }

// // //超级版
// @overwriteInject
// class x2Plus extends x2 {
//     say() {
//         console.log("x2Plus");
//     }
// }


// class x1 {
//     //上来就直接用
//     constructor(
//         @canOverInject(x2) private x2: x2,
//         @Inject(x2) private x2: x2,
//     ) { }
//     handle() {
//         this.x2.say();
//     }
// }


// let xx1 = new container().created(x1);

// xx1.handle();

