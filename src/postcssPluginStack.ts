class Node {
}
class Declaration extends Node {
    constructor(public prop: string, value: string) {
        super();
    }
}
class Rule extends Node {
    nodes: Node = [];
}

class Root {
    nodes: Node = [];
}

const root = new Root();
const rule = new Rule();

rule.nodes = [
    new Declaration("color", "red"),
    new Declaration("font-size", "30px"),
]

root.nodes = [rule]

const plugins = [
    () => {
        return {
            Root(root) {
                console.log("root in");
            },
            RootExit(root) {
                console.log("root exit");
            },
            Rule(root) {
                console.log("Rule in");
            },
            RuleExit(root) {
                console.log("Rule exit");
            },
            Declaration(root){
                console.log("Declaration in",root.prop);
            },
            DeclarationExit(root){
                console.log("Declaration Exit",root.prop);
            }
        }
    }
]
//收集所有插件访问者
const getListening = (plugins) => {
    const listening = {};
    for (const plugin of plugins) {
        const pluginConfig = plugin();
        for (const config in pluginConfig) {
            (listening[config] || (listening[config] = [])).push(
                pluginConfig[config]
            )
        }
    }
    return listening;
}
const toStack = (root) => {
    let event = [
        //已函数名称为入口函数
        root.constructor.name,
        //0为是否需要递归子节点
        0,
        //已函数名称为入口函数拼接exit为退出函数
        root.constructor.name + 'Exit',
    ]
    if (root instanceof Declaration) {
        event = [
            root.constructor.name,
            root.constructor.name + 'Exit',
        ]
    }
    return {
        node: root,
        event,
        eventIndex: 0,
        visitors: [],
        runDeep: false
    }
}
const visitTick = (stack, listening) => {
    const lastNode = stack.at(-1);
    //执行所有的入口访问者函数
    if (lastNode.visitors.length) {
        lastNode.visitors.forEach(v => v(lastNode.node))
        lastNode.visitors = [];
        return;
    }
    //跑子元素
    if (lastNode.runDeep && lastNode.node.nodes) {
        lastNode.node.nodes.forEach((child) => {
            stack.push(toStack(child))
        })
        lastNode.runDeep = false;
        return
    }
    //为当前迭代者赋值需要执行的访问者函数
    while (lastNode.eventIndex < lastNode.event.length) {
        const index = lastNode.event[lastNode.eventIndex];
        const visitor = listening[index];
        //当前事件为0时是需要去标记可以跑子元素了
        if (index === 0) {
            lastNode.runDeep = true;
        } else if(visitor){
            lastNode.visitors = visitor;
        }
        lastNode.eventIndex++;
        return
    }
    //抛出
    stack.pop();
}

const runningPlugins = (root, plugins) => {
    const listening = getListening(plugins)
    const stack = [toStack(root)]
    while (stack.length) {
        visitTick(stack, listening);
    }
}
runningPlugins(root, plugins);

export default {}