interface Attributes {
  name: string;
  value: string;
}
interface Element1 {
  children: Array<Element1 | string>;
  attribute: Array<Attributes>;
  type: string;
  name: string;
}
interface Element1Operation {
  pop: () => Element1;
  parent: Element1;
}
interface Context {
  get program(): Element1;
  get currentElement(): Element1;
  get getCurrentType(): parseType;
  get EOF(): boolean;
  get currentIndex(): number;
  get getText(): string;
  setText(newText: string): void;
  setCurrentElement(el: Element1): void;
  setCurrentType(type1: parseType): void;
  getCurrentIdentifier(next?: boolean): string;
  getNextIdentifier(): string | undefined;
  getEqualIdentifier(identifier: string): string;
  getNextType(): parseType;
}

enum parseType {
  HTMLSTART = "HTMLSTART", //元素开始
  HTMLEnd = "HTMLEnd", //元素结束
  ATTRIBUTESSTART = "ATTRIBUTESSTART", //属性开始
  ATTRIBUTESEND = "ATTRIBUTESEND", //属性结束
  TEXT = "TEXT", //文本结束
  EOF = "EOF", //结束
}

const elementCreateContainer = () => {
  const elementMap = new WeakMap<Element1, Element1Operation>();
  const createElement = (name = "", parent?: Element1): Element1 => {
    const element = {
      children: [],
      attribute: [],
      type: "element",
      name,
    };
    elementMap.set(element, {
      pop() {
        return parent!;
      },
      parent: parent!,
    });
    return element;
  };
  const getElement = (el: Element1) => {
    return elementMap.get(el);
  };
  return {
    createElement,
    getElement,
  };
};

const parseHtmlInline = (str: string) => {
  const [htmlTag, ...attrs] = str.split(" ");
  const obj = {
    name: htmlTag,
    attribute: [] as Array<{ name: string; value: string }>,
  };
  if (attrs) {
    const splitAttrs = attrs.map((v: string) => v.split("="));
    obj.attribute = splitAttrs.map((v) => {
      const [name, value] = v;
      return {
        name,
        value,
      };
    });
  }
  return obj;
};

const createContext = (str: string, initEl: Element1): Context => {
  const program = initEl;
  let type: parseType = str[0] !== "<" ? parseType.TEXT : parseType.HTMLSTART;
  let currentIndex = 0;
  let current = initEl;
  let text = "";
  const context: Context & ThisType<Context> = {
    get program() {
      return program;
    },
    get currentElement() {
      return current;
    },
    get getCurrentType() {
      return type;
    },
    get EOF() {
      return currentIndex < str.length;
    },
    get currentIndex() {
      return currentIndex;
    },
    get getText() {
      return text;
    },
    setText(newText: string) {
      text = newText;
    },
    setCurrentElement(el: Element1) {
      current = el;
    },
    setCurrentType(type1: parseType) {
      type = type1;
    },
    getCurrentIdentifier(next = true) {
      let str1 = str[currentIndex];
      if (next) {
        currentIndex++;
      }
      return str1;
    },
    getNextIdentifier() {
      let str1 = str[currentIndex + 1];
      if (str1 !== undefined) {
        return str1;
      }
    },
    getEqualIdentifier(identifier: string) {
      let str = "";
      let token = "";
      while ((token = this.getCurrentIdentifier()) !== identifier && this.EOF) {
        str += token;
      }
      return str;
    },
    getNextType() {
      const htmlEnd =
        this.getCurrentIdentifier(false) === "<" &&
        this.getNextIdentifier() === "/";
      const htmlStart = this.getCurrentIdentifier(false) === "<";
      if (htmlEnd) return parseType.HTMLEnd;
      if (htmlStart) return parseType.HTMLSTART;
      if (!this.EOF) return parseType.EOF;
      return parseType.TEXT;
    },
  };
  return context;
};

const parseHtml = (str: string) => {
  const container = elementCreateContainer();
  const context = createContext(str, container.createElement("program"));
  while (context.EOF) {
    switch (context.getCurrentType) {
      case parseType.HTMLSTART: {
        context.getCurrentIdentifier(); //eat <
        const textInline = context.getEqualIdentifier(">");
        const parseObjStart = parseHtmlInline(textInline);
        const element = container.createElement(
          parseObjStart.name,
          context.currentElement
        );
        element.attribute = parseObjStart.attribute;
        context.currentElement.children.push(element);
        context.setCurrentElement(element);
        break;
      }
      case parseType.HTMLEnd: {
        context.getCurrentIdentifier(); //eat <
        context.getCurrentIdentifier(); //eat /
        const parseObjEnd = parseHtmlInline(context.getEqualIdentifier(">"));
        if (context.currentElement.name === parseObjEnd.name) {
          context.setCurrentElement(
            container.getElement(context.currentElement)!.pop()
          );
        }
        break;
      }
      default:
        context.setText(context.getText + context.getCurrentIdentifier());
        context.setCurrentType(context.getNextType());
        //@ts-ignore
        if (context.getCurrentType !== parseType.TEXT) {
          context.currentElement.children.push(context.getText);
          context.setText("");
        }
        break;
    }
    context.setCurrentType(context.getNextType());
  }
  return context.program;
};

console.log(parseHtml(`<div>1</div>`));
