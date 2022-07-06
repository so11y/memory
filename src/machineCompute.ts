// import { tokenizer, parse, generator } from "./ledad";
import { Token,tokenizer } from "./ledad/tokenizer";

class ComputeNode {
    type: string = null;
    value: string | number
}

enum Expression {
    Add = "Add",
    Minus = "Minus",
    Multiply = "Multiply",
    Divide = "Divide"
}

enum Compute {
    Text = "Text",
    bracketsStart = "bracketsStart",
    bracketsEnd = "bracketsEnd",
    Expression = "Expression"
}

const getExpression = (token: Token) => {
    switch (token.value) {
        case "+":
            return Expression.Add;
        case "-":
            return Expression.Minus;
        case "*":
            return Expression.Multiply;
        case "/":
            return Expression.Divide;
    }
}

const getTokenType = (token: Token) => {
    if (!token) {
        return null;
    }
    switch (token.type) {
        case "symbol":
            switch (token.value) {
                case "(":
                    return Compute.bracketsStart
                case ")":
                    return Compute.bracketsEnd
                default:
                    return Compute.Expression
            }
        case "number":
            return Compute.Text
    }
}

const parseText = (context: MachineContext) => {
    const node = new ComputeNode();
    node.value = context.currentToken().value;
    const stack = context.getStack();
    const lastStack = stack[stack.length - 1];
    if (context.haveBracketsStack()) {
        const lastBracketsStack = context.getLastBracketsStack();
        lastBracketsStack.push(node);
    } else if (Array.isArray(lastStack)) {
        let sl = lastStack[lastStack.length - 1];
        while (Array.isArray(sl)) {
            sl = sl[sl.length - 1];
        }
        if (sl.type && ![Expression.Add, Expression.Minus].some(v => v === sl.type)) {
            lastStack.push(node)
        } else {
            context.push(node);
        }
    } else {
        context.push(node);
    }
    context.eatToken()
    //可以在這里加可以跳转的白名单
    context.setState(context.tokenType())

}

const parseExpression = (context: MachineContext) => {
    const currentToken = context.currentToken();
    const currentTokenType = getExpression(currentToken)
    const stack = context.getStack();
    let lastStack = stack[stack.length - 1];
    //判断当前符号是否是优先级运算符,如果是则把前一个token进行重新构建
    if (currentTokenType && ![Expression.Add, Expression.Minus].some(v => v === currentTokenType)) {
        if (!Array.isArray(lastStack)) {
            const node = stack.pop();
            if (!Array.isArray(node)) {
                node.type = currentTokenType;
                context.push([node])
                lastStack = [node];
            }
        }
    }
    if (context.haveBracketsStack()) {
        const last = context.getLastBracketsStack();
        last[last.length - 1].type = currentTokenType;
    } else if (Array.isArray(lastStack)) {
        let sl = lastStack[lastStack.length - 1];
        while (Array.isArray(sl)) {
            sl = sl[sl.length - 1];
        }
        sl.type = currentTokenType;
    } else {
        lastStack.type = currentTokenType;
    }
    context.eatToken();
    //可以在這里加可以跳转的白名单
    context.setState(context.tokenType())
}

const parseBracketsStart = (context: MachineContext) => {
    const stack = context.getStack();
    let lastStack = stack[stack.length - 1];
    if (Array.isArray(lastStack)) {
        if (context.getBrackets().length) {
            context.addBrackets(true);
        } else {
            let last = lastStack as any;
            while (Array.isArray(last)) {
                last = last[last.length - 1];
            }
            if (![Expression.Add, Expression.Minus].some(v => v === last.type)) {
                context.addBrackets(true);
            } else {
                context.addBrackets();
            }
        }
    } else {
        context.addBrackets();
    }
    context.eatToken();
    //可以在這里加可以跳转的白名单
    context.setState(context.tokenType())
}

const parseBracketsEnd = (context: MachineContext) => {
    const nextToken = context.nextToken();
    if (nextToken) {
        const nextTokenType = getExpression(nextToken);
        if (context.haveBracketsStack()) {
            let last = context.getLastBracketsStack();
            while (Array.isArray(last)) {
                last = last[last.length - 1];
            }
            last.type = nextTokenType;
        }
    }
    context.eatToken();
    context.getBrackets().pop();
    //可以在這里加可以跳转的白名单
    context.setState(context.tokenType())
}

class MachineContext {
    bracketsStack = [];
    stack: Array<ComputeNode | ComputeNode[]> = []
    _currentToken: Token = null;
    currentState: Compute;
    tokens: Token[] = [];
    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this._currentToken = this.tokens[0];
        this.setState(getTokenType(this._currentToken));
    }
    setState(state: Compute) {
        this.currentState = state;
    }
    nextToken() {
        return this.tokens[1];
    }
    eatToken() {
        this.tokens.shift();
        this._currentToken = this.tokens[0];
    }
    tokenType(token?: Token) {
        return getTokenType(token || this._currentToken);
    }
    currentToken() {
        return this._currentToken;
    }
    push(node: ComputeNode | ComputeNode[]) {
        this.stack.push(node);
    }
    getStack() {
        return this.stack
    }
    haveBracketsStack() {
        return this.bracketsStack.length > 0;
    }
    getLastBracketsStack() {
        return this.bracketsStack[this.bracketsStack.length - 1];
    }
    addBrackets(deep = false) {
        const brackets = []
        if (deep) {
            let last = this.bracketsStack[this.bracketsStack.length - 1];
            if (!last) {
                last = this.stack[this.stack.length - 1];
            }
            if (Array.isArray(last)) {
                last.push(brackets as any)
            }
        } else {
            this.stack.push(brackets);
        }
        this.bracketsStack.push(brackets);
    }
    getBrackets() {
        return this.bracketsStack;
    }
}

const machine = (tokens: Token[]) => {
    const context = new MachineContext(tokens);
    while (tokens.length && context.currentToken) {
        switch (context.currentState) {
            case Compute.Text:
                parseText(context);
                break;
            case Compute.Expression:// + - * /
                parseExpression(context);
                break
            case Compute.bracketsStart:
                parseBracketsStart(context);
                break
            case Compute.bracketsEnd:
                parseBracketsEnd(context);
                break
        }
    }
    if (context.haveBracketsStack()) {
        console.error(`括号语法错误 可能多写了或者少了括号`);
    }
    return context.stack
}


const traverse = (nodes: MachineContext["stack"]) => {
    const ComputeFn = {
        [Expression.Add](a: string, b: string) {
            return Number(a) + Number(b);
        },
        [Expression.Minus](a: string, b: string) {
            return Number(a) - Number(b);
        },
        [Expression.Multiply](a: string, b: string) {
            return Number(a) * Number(b);
        },
        [Expression.Divide](a: string, b: string) {
            return Number(a) / Number(b);
        }
    }
    const walkFlat = (nodes: MachineContext["stack"]) => {
        const havePriorityHight = nodes.filter(v => Array.isArray(v));
        if (havePriorityHight.length) {
            nodes = nodes.map(v => {
                if (Array.isArray(v)) {
                    const result = walkFlat(v);
                    if (Array.isArray(result)) {
                        return walkFlat(result);
                    }
                    return result
                }
                return v;
            })
        }
        const value = nodes.reduce((prev: ComputeNode, next: ComputeNode) => {
            const value = ComputeFn[prev.type](prev.value, next.value)
            return {
                value: value,
                type: next.type
            }
        })
        return value;
    }
    const result = walkFlat(nodes) as any
    return result.value;
}



const runComputeExpression = (text: string) => {
    const tokens = tokenizer(text);
    const nodes = machine(tokens);
    return traverse(nodes);
}
const result = runComputeExpression(`(1 + (1 + 2))`)
console.log(result);

//3个
//4个
