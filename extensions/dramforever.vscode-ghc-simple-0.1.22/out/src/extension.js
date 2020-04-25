'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const range_type_1 = require("./range-type");
const completion_1 = require("./completion");
const diagnostics_1 = require("./diagnostics");
const definition_1 = require("./definition");
const reference_1 = require("./reference");
const inline_repl_1 = require("./inline-repl");
const status_bar_1 = require("./status-bar");
const hover_1 = require("./hover");
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('GHC');
    const documentAssignment = new WeakMap();
    const statusBar = new status_bar_1.StatusBar(documentAssignment);
    const ext = {
        context,
        outputChannel,
        statusBar,
        documentManagers: new Map(),
        workspaceManagers: new Map(),
        workspaceTypeMap: new Map(),
        documentAssignment
    };
    context.subscriptions.push(outputChannel, statusBar);
    range_type_1.registerRangeType(ext);
    completion_1.registerCompletion(ext);
    definition_1.registerDefinition(ext);
    reference_1.registerReference(ext);
    inline_repl_1.registerInlineRepl(ext);
    hover_1.registerHover(ext);
    const diagInit = diagnostics_1.registerDiagnostics(ext);
    function restart() {
        for (const [doc, session] of ext.documentManagers) {
            session.dispose();
        }
        ext.documentManagers.clear();
        for (const [ws, session] of ext.workspaceManagers) {
            session.dispose();
        }
        ext.workspaceManagers.clear();
        ext.documentAssignment = new WeakMap();
        diagInit();
    }
    function openOutput() {
        ext.outputChannel.show();
    }
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('ghcSimple'))
            restart();
    }), vscode.commands.registerCommand('vscode-ghc-simple.restart', restart), vscode.commands.registerCommand('vscode-ghc-simple.openOutput', openOutput));
    vscode.workspace.onDidChangeWorkspaceFolders((changeEvent) => {
        for (const folder of changeEvent.removed)
            if (ext.workspaceManagers.has(folder))
                ext.workspaceManagers.get(folder).dispose();
    });
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map