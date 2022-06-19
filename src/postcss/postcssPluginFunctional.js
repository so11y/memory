const registerKeyWord = new Map();

class Node {
    params;
}
class VariableDeclaration extends Node {
    constructor(kind) {
        super();
        this.kind = kind;
    }
    print() {
        return `${this.kind} ${this.params};\n`
    }
}
class ReturnStatement extends Node {
    print() {
        return `return ${this.params};\n`
    }
}
class IfStatement extends Node {
    nodes = [];
    print() {
        return `if ${this.params} {
            ${this.nodes.map(v => v.print()).join("")}
        }\n`
    }
}
class FunctionDeclaration extends Node {
    nodes = [];
    print() {
        return `function ${this.params}{
            ${this.nodes.map(v => v.print()).join("")}
        }`
    }
    exec(...arg) {
        return eval(`(()=>{
            return ${this.print()}
        })()`)(...arg)
    }
}

registerKeyWord.set("let", () => new VariableDeclaration("let"));
registerKeyWord.set("const", () => new VariableDeclaration("const"));
registerKeyWord.set("var", () => new VariableDeclaration("var"));
registerKeyWord.set("return", () => new ReturnStatement());
registerKeyWord.set("if", () => new IfStatement());
registerKeyWord.set("function", () => new FunctionDeclaration());

const execFunctions = new Map();

const postcssPluginFunctional = (opt = {
}) => {
    const walk = (root, parent) => {
        root.walkAtRules((atRule) => {
            if (atRule.parent === root) {
                const createGrammar = registerKeyWord.get(atRule.name);
                const child = createGrammar()
                child.params = atRule.params;
                if (child.nodes) {
                    walk(atRule, child);
                }
                parent.nodes.push(child);
            }
        })
    }
    return {
        postcssPlugin: "postcssPlugin-functional",
        Once(root, postcss) {
            root.walkAtRules((atRule) => {
                if (atRule.name === "function") {
                    const [functionName] = atRule.params.split("(");
                    if (!execFunctions.has(functionName)) {
                        const createFunction = registerKeyWord.get("function");
                        const newFunction = createFunction();
                        newFunction.params = atRule.params;
                        execFunctions.set(functionName, {
                            node: atRule,
                            functional: newFunction
                        });
                        walk(atRule, newFunction);
                    }
                    return false;
                }
            })
            for (const [key, value] of execFunctions) {
                value.node.remove();
            }
        },
        AtRule: {
            include(root, postcss) {
                const [functionName, needParseArg] = root.params.split("(");
                const args = needParseArg.split(")").join("").split(",");
                const result = execFunctions.get(functionName).functional.exec(...args);
                const [prop, value] = result.split(":")
                const newDecl = new postcss.Declaration({
                    prop,
                    value
                })
                root.parent.append(newDecl);
                root.remove()
            }
        }
    }
}
postcssPluginFunctional.postcss = true;

module.exports = postcssPluginFunctional