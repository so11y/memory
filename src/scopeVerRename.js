function putGetCode() {
  /**
      //感觉直接参考重命名实现更好
      let index2 = variable("index2", { a: 1 });
      console.log(index2);
      {
        console.log(index2);
      }


      to


      let index2 = variable("index2", { a: 1 });
      console.log(index2.get());
      {
        console.log(index2.get());
      }
   * 
   */
  return {
    visitor: {
      VariableDeclarator(path) {
        const t = types;
        if (
          t.isCallExpression(path.node.init) &&
          t.isIdentifier(path.node.init.callee, { name: "variable" })
        ) {
          const varName = path.node.id.name;
          path.scope.traverse(path.scope.block, {
            Identifier(innerPath) {
              if (
                innerPath.node.name === varName &&
                !t.isMemberExpression(innerPath.parent) &&
                !(
                  t.isVariableDeclarator(innerPath.parent) &&
                  innerPath.parent.id === innerPath.node
                )
              ) {
                innerPath.replaceWith(
                  t.callExpression(
                    t.memberExpression(innerPath.node, t.identifier("get")),
                    []
                  )
                );
              }
            },
          });
        }
      },
    },
  };
}
