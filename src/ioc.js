// // run `node index.js` in the terminal
const { transformSync } = require('@babel/core');
const code = `
function inject(d){
   console.log("------hao",d);
   return  function (a,b,c){

   }
}
class Context{
}
class b22{
    @inject context1:Context;

}
`
const tsCompile = ({ types }) => {
    return {
        inherits: require("@babel/plugin-syntax-decorators").default,
        visitor: {
            Class: {
                enter(path) {
                    const body = path.node.body.body;
                    if (body.length) {

                        const classProperties = body.filter(v => types.isClassProperty(v));
                        classProperties.forEach(classProperty => {
                            const { decorators, typeAnnotation, } = classProperty;
                            if (decorators && decorators.some(v => v.expression.name === "inject" && !types.isCallExpression(v.expression))) {
                                const injectNode = decorators.find(v => v.expression.name === "inject");
                                injectNode.expression = types.callExpression(
                                    types.identifier("inject"),
                                    [
                                        types.identifier(typeAnnotation.typeAnnotation.typeName.name)
                                    ]
                                )
                            }
                        })
                    }

                }
            }
        }
    }
}

let v = transformSync(code, {
    presets: [
        ["babel-preset-typescript"],
    ],
    plugins: [
        [tsCompile, { "legacy": true }],
        ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ],
}).code;

eval(v);
// console.log(v);