#!/usr/bin/env node
import recast from "recast";

recast.run(function(ast, printSourse) {
    recast.visit(ast, {
        visitExpressionStatement: function(path) {
            const node = path.node;
            printSourse(node);
            this.traverse(path);
        }
    });
});
