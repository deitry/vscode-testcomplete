import * as path from 'path';
import * as vscode from 'vscode';
import { getProjectName } from './codegen';
import * as fs from 'fs';

/**
 * Generates both jsconfig.json and tsconfig.json for project-related modules
 * @param path Path to scripts location where jsconfig should be created
 */
export async function generateJsConfig(baseFilePath: string)
{
	if (!vscode.workspace.workspaceFolders?.length)
		return;

	const folder = vscode.workspace.workspaceFolders[0];
    const projectName = await getProjectName(baseFilePath);
    const generatedApiFolderPath = folder.uri.fsPath + "/.vscode/.tc/" + projectName;
    const generatedApiFolder = vscode.Uri.file(folder.uri.fsPath + "/.vscode/.tc/" + projectName);
    const generatedApiTsConfig = vscode.Uri.file(generatedApiFolderPath + '/tsconfig.json');

    const generatedApiFolderRelPath = path.relative(baseFilePath, generatedApiFolder.fsPath);
    console.log("generateJsConfig for " + baseFilePath);

    const extension = vscode.extensions.getExtension("deitry.testcomplete");
    const extensionPath = path.resolve(extension?.extensionPath ?? __filename, `../..`)

	const targetFile = vscode.Uri.file(baseFilePath + path.sep + "jsconfig.json");

    
    if (!UpdatePathIfFileExists(targetFile, extensionPath))
    {
        let wsedit = new vscode.WorkspaceEdit();
        wsedit.createFile(targetFile, { overwrite: true });
        await vscode.workspace.applyEdit(wsedit);
        
        const jsConfigContent = getJsConfigContent(extensionPath, generatedApiFolderRelPath);

        await vscode.workspace.fs.writeFile(targetFile, Buffer.from(jsConfigContent, 'utf8'));
    }

    if (!UpdatePathIfFileExists(generatedApiTsConfig, extensionPath))
    {
        let wsedit = new vscode.WorkspaceEdit();
        wsedit.createFile(generatedApiTsConfig, { overwrite: true });
        await vscode.workspace.applyEdit(wsedit);

        const tsConfigContent = getTsConfigContent(extensionPath);

        await vscode.workspace.fs.writeFile(generatedApiTsConfig, Buffer.from(tsConfigContent, 'utf8'));
    }
}

function UpdatePathIfFileExists(targetFile: vscode.Uri, extensionPath: string): boolean
{
    if (fs.existsSync(targetFile.fsPath))
    {
        let fileContent = fs.readFileSync(targetFile.fsPath);
        let newContent = "";
        for (let line of fileContent.toString().split(/[\r\n]+/))
        {
            if (line.indexOf("testcomplete-ts-api/api/*.d.ts") >= 0)
                line = `        "${extensionPath.split('\\').join('/')}/testcomplete-ts-api/api/*.d.ts",`;
            
            newContent += line + '\n';
        }

        fs.writeFileSync(targetFile.fsPath, newContent);
        return true;
    }

    return false;
}

function getJsConfigContent(extensionPath: string, generatedApiFolderRelPath: string): string
{ 
    return `{
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
}

function getTsConfigContent(extensionPath: string): string
{
    return `{
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
}
