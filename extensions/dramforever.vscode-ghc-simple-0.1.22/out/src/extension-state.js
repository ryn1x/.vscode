"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const vscode = require("vscode");
const session_1 = require("./session");
function getWorkspaceType(ext, folder) {
    if (!ext.workspaceTypeMap.has(folder))
        ext.workspaceTypeMap.set(folder, computeWorkspaceType(folder));
    return ext.workspaceTypeMap.get(folder);
}
function startSession(ext, doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
        const type = folder === undefined
            ? yield computeFileType()
            : yield getWorkspaceType(ext, folder);
        const session = (() => {
            if (-1 !== ['custom-workspace', 'stack', 'cabal', 'cabal new', 'cabal v2'].indexOf(type)) {
                // stack or cabal
                if (!ext.workspaceManagers.has(folder))
                    ext.workspaceManagers.set(folder, new session_1.Session(ext, type, 'workspace', folder.uri));
                return ext.workspaceManagers.get(folder);
            }
            else {
                // bare or bare-stack
                if (!ext.documentManagers.has(doc))
                    ext.documentManagers.set(doc, new session_1.Session(ext, type, 'file', doc.uri));
                return ext.documentManagers.get(doc);
            }
        })();
        ext.documentAssignment.set(doc, session);
        session.addFile(doc.uri.fsPath);
        return session;
    });
}
exports.startSession = startSession;
function stopSession(ext, doc) {
    const session = ext.documentAssignment.get(doc);
    if (session.resourceType === 'workspace') {
        const workspace = vscode.workspace.getWorkspaceFolder(session.resource);
        vscode.workspace.getWorkspaceFolder(session.resource);
        if (ext.workspaceManagers.has(workspace))
            ext.workspaceManagers.get(workspace).removeFile(doc.uri.fsPath);
    }
    else {
        if (ext.documentManagers.has(doc)) {
            ext.documentManagers.get(doc).dispose();
            ext.documentManagers.delete(doc);
        }
    }
}
exports.stopSession = stopSession;
function hasStack(cwd) {
    const cwdOpt = cwd === undefined ? {} : { cwd };
    return new Promise((resolve, reject) => {
        const cp = child_process.exec('stack --help', Object.assign({ timeout: 5000 }, cwdOpt), (err, stdout, stderr) => {
            if (err)
                resolve(false);
            else
                resolve(true);
        });
    });
}
function computeFileType() {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield hasStack())
            return 'bare-stack';
        else
            return 'bare';
    });
}
exports.computeFileType = computeFileType;
function computeWorkspaceType(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        const customCommand = vscode.workspace.getConfiguration('ghcSimple', folder.uri).replCommand;
        if (customCommand !== "") {
            const customScope = vscode.workspace.getConfiguration('ghcSimple', folder.uri).replScope;
            if (customScope == "workspace")
                return 'custom-workspace';
            else
                return 'custom-file';
        }
        const oldConfigType = vscode.workspace.getConfiguration('ghcSimple', folder.uri).workspaceType;
        if (oldConfigType !== 'detect')
            return oldConfigType;
        const find = (file) => vscode.workspace.findFiles(new vscode.RelativePattern(folder, file));
        const isStack = yield find('stack.yaml');
        if (isStack.length > 0)
            return 'stack';
        const isCabal = yield find('*.cabal');
        if (isCabal.length > 0)
            return 'cabal new';
        if (yield hasStack(folder.uri.fsPath))
            return 'bare-stack';
        else
            return 'bare';
    });
}
exports.computeWorkspaceType = computeWorkspaceType;
//# sourceMappingURL=extension-state.js.map