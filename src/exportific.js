#!/usr/bin/env node
const recast = require("recast");
const {
    identifier: id,
    expressionStatement,
    memberExpression,
    assignmentExpression,
    arrowFunctionExpression,
    blockStatement
} = recast.types.builders;

const fs = require("fs");
const path = require("path");
//命令行参数
const options = process.argv.slice(2);

if (
    options.length === 0 ||
    options.includes("-h") ||
    options.includes("--help")
) {
    console.log(
        `
                采用es6规则，将.js文件内所有函数修改为导出形式（export.xxx = (x,x) => {}）。

                选项： -r  或 --rewrite 可直接覆盖原有文件
        `
    );
}
//覆盖原文件的指令为 -r或--rewrite
let rewriteMode = options.includes("-r") || options.includes("--rewrite");

//获取文件名列表
const clearFileArg = options.filter(item => {
    return !["-r", "--rewrite", "--help", "-h"].includes(item);
});

//获取文件名
let filename = clearFileArg[0];

//写文件方法
const writeASTFile = function(ast, filename, rewriteMode) {
    const newCode = recast.print(ast).code;
    if (!rewriteMode) {
        filename = filename
            .split(".")
            .slice(0, -1)
            .concat(["export", "js"])
            .join(".");
    }
    fs.writeFileSync(path.join(process.cwd(), filename), newCode);
};

recast.run(function(ast, printSource) {
    let funcIds = [];
    recast.types.visit(ast, {
        visitFunctionDeclaration(path) {
            const node = path.node;
            const funcName = node.id;
            const params = node.params;
            const body = node.body;

            funcIds.push(funcName.name);
            const rep = expressionStatement(
                assignmentExpression(
                    "=",
                    memberExpression(id("exports"), funcName),
                    arrowFunctionExpression(params, body)
                )
            );
            path.replace(rep);
            return false;
        }
    });
    recast.types.visit(ast, {
        // 遍历所有的函数调用
        visitCallExpression(path) {
            const node = path.node;
            // 如果函数调用出现在函数定义中，则修改ast结构
            if (funcIds.includes(node.callee.name)) {
                node.callee = memberExpression(id("exports"), node.callee);
            }
            // 停止遍历
            return false;
        }
    });
    writeASTFile(ast, filename, rewriteMode);
});
