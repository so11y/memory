
interface TokenResult {
    newIndex: number;
    ordIndex: number;
    value: string;
}

interface ParseToken {
    (context: Readonly<Context>): {
        resole: () => TokenResult,
        addToken: (v: Omit<Token, "type">) => void;
    }
}
export interface Token {
    type: string;
    value: string;
    start: number;
    end: number
}

interface Context {
    index: number;
    source: string;
    push: (t: Token) => void;
    getIndexSource: (i: number) => string;
}
interface TokenizerLinkReturnType {
    addTokenizer(t: ParseToken): TokenizerLinkReturnType;
    runParse(): Array<Token>;
}
interface TokenizerLink {
    (source: string): TokenizerLinkReturnType
}

class LinkNode {
    constructor(public context: Context, public _parse?: ParseToken, public next?: LinkNode) {
        this.context = context;
        this._parse = _parse || null;
        this.next = next || null;
    }
    parse() {
        const p = this._parse(this.context);
        const result = p.resole();
        if (result?.value) {
            this.context.index = result.newIndex;
            p.addToken({
                value: result.value,
                start: result.ordIndex,
                end: result.newIndex,
            })
        }
        if (this.next) {
            this.next.parse();
        }
    }
}
const includeDot = [",", "{", "}", "[", "]", "(", ")",":","=",";",".","+","-","*","/",">","<"];
const nameIgnore = [" ", "'", "\n", ",", ...includeDot];

const tokenizerLink: TokenizerLink = (source: string) => {
    const tokens: Array<Token> = []
    const context: Context = {
        index: 0,
        source,
        push(t) {
            tokens.push(t);
        },
        getIndexSource(this: Context, i: number) {
            return this.source.charAt(i);
        }
    };
    const head = new LinkNode(context);
    let prev = head;
    return {
        addTokenizer(t: ParseToken) {
            const p = new LinkNode(context, t);
            prev.next = p;
            prev = p;
            return this;
        },
        runParse() {
            while (context.index < source.length) {
                head.next.parse();
            }
            return tokens;
        },
    };
};

const enterTokenizer: ParseToken = (context: Context) => {
    return {
        resole() {
            let newIndex = context.index;
            let next = context.getIndexSource(newIndex);
            let value = "";
            while (next && next === "\n") {
                value += next;
                next = context.getIndexSource(++newIndex);
            }
            return {
                newIndex,
                ordIndex: context.index,
                value
            }
        },
        addToken(value) {
        },
    };
};
const numberTokenizer: ParseToken = (context: Context) => {
    return {
        //用于解析是否为这个token需要解析
        resole() {
            let newIndex = context.index;
            let next = context.source.charAt(newIndex);
            let value = "";
            let textNum = /^[0-9]+.?[0-9]*$/;
            while (next && textNum.test(next)) {
                value += next;
                newIndex++;
                next = context.getIndexSource(newIndex);
            }
            return {
                newIndex,
                ordIndex: context.index,
                value
            }
        },
        //添加token
        addToken(value) {
            context.push({
                type: 'number',
                ...value,
            });
        },
    };
};
const stringTokenizer: ParseToken = (context: Context) => {
    return {
        resole() {
            let newIndex = context.index;
            let current = context.source.charAt(newIndex);
            let next = context.source.charAt(newIndex + 1);
            let value = "";
            const isStringSymbol = "'";
            if (current === isStringSymbol) {
                while (next && next != isStringSymbol) {
                    value += current;
                    next = context.getIndexSource(++newIndex);
                    current = context.getIndexSource(newIndex);
                }
                if (next === isStringSymbol) {
                    value += next;
                    newIndex++;
                }
            }
            return {
                newIndex,
                ordIndex: context.index,
                value
            }
        },
        addToken(value) {
            context.push({
                type: 'string',
                ...value
            });
        },
    };
};
const spaceTokenizer: ParseToken = (context: Context) => {
    return {
        resole() {
            let newIndex = context.index;
            let next = context.getIndexSource(newIndex);
            let value = "";
            while (next && next === " ") {
                value += next;
                next = context.getIndexSource(++newIndex);
            }
            return {
                newIndex,
                ordIndex: context.index,
                value
            }
        },
        addToken(value) {
        }
    };
};
const dotTokenizer: ParseToken = (context: Context) => {

    return {
        resole() {
            let newIndex = context.index;
            let next = context.getIndexSource(newIndex);
            let value = "";
            if (includeDot.includes(next)) {
                value = next;
                newIndex++;
            }

            return {
                newIndex,
                ordIndex: context.index,
                value
            }
        },
        addToken(value) {
            context.push({
                type: 'symbol',
                ...value,
            });
        },
    };
};
const nameTokenizer: ParseToken = (context: Context) => {

    return {
        resole() {
            let newIndex = context.index;
            let next = context.getIndexSource(newIndex);
            let value = "";
            while (next && nameIgnore.every(v => next !== v)) {
                value += next;
                next = context.getIndexSource(++newIndex);
            }
            return {
                newIndex,
                ordIndex: context.index,
                value
            }
        },
        addToken(value) {
            context.push({
                type: 'name',
                ...value
            });
        },
    };
};


export const tokenizer = (source: string) => {
    const parse = tokenizerLink(source);
    parse
        .addTokenizer(spaceTokenizer)
        .addTokenizer(enterTokenizer)
        .addTokenizer(dotTokenizer)
        .addTokenizer(stringTokenizer)
        .addTokenizer(numberTokenizer)
        .addTokenizer(nameTokenizer);
    return parse.runParse();
}
