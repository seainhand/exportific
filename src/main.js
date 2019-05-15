import recast from "recast";
const {
    variableDeclaration,
    variableDeclarator,
    functionExpression
} = recast.types.builders;
// const a = a => a;
const code = `
  function add(a, b) {
    return a +
      // 有什么奇怪的东西混进来了
      b
  }
  `;
// 用螺丝刀解析机器
const ast = recast.parse(code);

// ast可以处理很巨大的代码文件
// 但我们现在只需要代码块的第一个body，即add函数
const add = ast.program.body[0];
ast.program.body[0] = variableDeclaration("const", [
    variableDeclarator(add.id, functionExpression(null, add.params, add.body))
]);
const output = recast.prettyPrint(ast, { tabWidth: 4 }).code;
console.log(output);
