const postcssPluginFlatNode = (opts = {}) => {
    const walk = (root, postcss) => {
        if (root.nodes.length) {
            const children = [];
            root.walkRules((child) => {
                if (child.parent.type !== "root") {
                    child.selector = child.parent.selector + ' ' + child.selector;
                    const rule = new postcss.Rule({ selector: child.selector });
                    rule.nodes = child.nodes;
                    rule.nodes.forEach(v => {
                        v.raws = {}
                    })
                    children.push(rule);
                    child.remove();
                }
            })
            children.forEach(v => root.append(v))
        }
    }
    return {
        postcssPlugin: "postcssPlugin-flat-node",
        Once(root, postcss) {
            walk(root, postcss);
        }
    }
}
postcssPluginFlatNode.postcss = true;

module.exports = postcssPluginFlatNode;