import * as path from 'path';
import * as vscode from 'vscode';
import { getProjectName } from './codegen';

/**
 * Generates both jsconfig.json and tsconfig.json for project-related modules
 * @param path Path to scripts location where jsconfig should be created
 */
export async function generateJsConfig(baseFilePath: string)
{
	if (!vscode.workspace.workspaceFolders?.length)
		return;

	let folder = vscode.workspace.workspaceFolders[0];
    let projectName = await getProjectName(baseFilePath);
    let generatedApiFolderPath = folder.uri.fsPath + "/.vscode/.tc/" + projectName;
    let generatedApiFolder = vscode.Uri.file(folder.uri.fsPath + "/.vscode/.tc/" + projectName);
    let generatedApiTsConfig = vscode.Uri.file(generatedApiFolderPath + '/tsconfig.json');

    let generatedApiFolderRelPath = path.relative(baseFilePath, generatedApiFolder.fsPath);
    console.log("generateJsConfig for " + baseFilePath);

	let targetFile = vscode.Uri.file(baseFilePath + path.sep + "jsconfig.json");
	let wsedit = new vscode.WorkspaceEdit();
	wsedit.createFile(targetFile, { overwrite: true });
	wsedit.createFile(generatedApiTsConfig, { overwrite: true });
	await vscode.workspace.applyEdit(wsedit);

    let extension = vscode.extensions.getExtension("deitry.testcomplete");
    let extensionPath = path.resolve(extension?.extensionPath ?? __filename, `../..`)

    const jsConfigContent =
`{
    "compilerOptions": {
        "target": "es6",
        "checkJs": true,
        "strict": true,
        "strictFunctionTypes": false,
        "baseUrl": ".",
    },
    "include": [
        "${extensionPath.split('\\').join('/')}/testcomplete-ts-api/api/*.d.ts",
        "${generatedApiFolderRelPath.split('\\').join('/')}/*.ts",
        "./*.js",
    ],
}
`;

    const tsConfigContent =
`{
    "compilerOptions": {
        "noLib": false,
        "target": "es6",
        "baseUrl": ".",
        "strict": true,
        "strictFunctionTypes": true,
        "diagnostics": true,
        "noImplicitAny": true,
        "noEmitHelpers": true,
    },
    "include": [
        "${extensionPath.split('\\').join('/')}/testcomplete-ts-api/api/*.d.ts",
        "./*.d.ts",
    ],
}
`;
    await vscode.workspace.fs.writeFile(targetFile, Buffer.from(jsConfigContent, 'utf8'));
    await vscode.workspace.fs.writeFile(generatedApiTsConfig, Buffer.from(tsConfigContent, 'utf8'));
}
