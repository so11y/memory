const postcssPluginsFor = (opts = {}) => {
    const needRemoveNode = new Set();
    const replace = (str, form, to) => {
        return str.replace(form, to)
    }
    return {
        postcssPlugin: "postcssPlugins-for",
        AtRule: {
            for(root, postcss) {
                let [indexKey, iteration] = root.params.split("in").map(v => v.trim());
                iteration = Number(iteration)
                for (let index = 0; index < iteration; index++) {
                    root.walkRules((rule) => {
                        if (rule.selector.includes(`(${indexKey})`)) {
                            needRemoveNode.add(rule);
                            const selector = replace(rule.selector, `(${indexKey})`, `${index}`)
                            const newRule = new postcss.Rule({ selector })
                            root.append(newRule);
                            rule.walkDecls((decl) => {
                                if (decl.value.includes(`(${indexKey})`)) {
                                    needRemoveNode.add(decl);
                                    const cloneDecl = decl.clone();
                                    cloneDecl.value = replace(cloneDecl.value, `(${indexKey})`, `${index}`)
                                    newRule.append(cloneDecl);
                                } else {
                                    const declaration = new postcss.Declaration({
                                        prop: decl.prop,
                                        value: decl.value
                                    })
                                    newRule.append(declaration);
                                }
                            })
                        }
                        return false;
                    })
                }
                Array.from(needRemoveNode).forEach(v => v.remove());
                root.nodes.forEach(v => {
                    v.raws = {};
                    root.parent.append(v)
                })
                root.remove();
            }
        }
    }
}
postcssPluginsFor.postcss = true;

module.exports = postcssPluginsFor;