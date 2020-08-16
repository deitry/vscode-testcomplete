/**
 * Code generator instead of python scripts.
 *
 * NOTE: must be generated in .vscode/tc-api/*.d.ts files with unique names
 */

import * as vscode from "vscode";
import * as path from "path";
import { generateTestedAppsImpl } from "./gen-testedaps";
import { generateProjectImpl } from "./gen-project";
import { generateNameMappingImpl } from "./gen-nameMapping";

/** Entry point for project-related modules generation */
export async function codeGeneration(projectPath: string)
{
	// TODO: parse projects and target folders from configuration
	generateProject(projectPath);
	generateNameMapping(path.resolve(path.dirname(projectPath), './NameMapping/NameMapping.tcNM'));
	generateTestedApps(path.resolve(path.dirname(projectPath), './TestedApps/TestedApps.tcTAs'));
}

/** Generates TypeScript module for name mapping */
export async function generateNameMapping(filePath: string)
{
	console.log("generateNameMapping()");

	let targetFile = await getTargetName(filePath, "nameMapping.d.ts");
	if (!targetFile)
		return;

	// - generate
	let content = generateNameMappingImpl(filePath);
	await vscode.workspace.fs.writeFile(targetFile, Buffer.from(content, 'utf8'));
}

/** Generates TypeScript module for project variables */
export async function generateProject(filePath: string)
{
	console.log("generateProject()");

	let targetFile = await getTargetName(filePath, "project.d.ts");
	if (!targetFile)
		return;

	// - generate
	let content = generateProjectImpl(filePath);
	await vscode.workspace.fs.writeFile(targetFile, Buffer.from(content, 'utf8'));

}

export async function getProjectName(filePath: string): Promise<string>
{
	// if given file is project itself
	if (filePath.endsWith(".mds"))
		return path.basename(filePath, ".mds");

	let pattern = path.dirname(filePath);
	pattern = filePath.endsWith('Script\\') || filePath.endsWith('Script/')
		? path.resolve(pattern, "*.mds")
		: path.resolve(pattern, "../*.mds");
	pattern = vscode.workspace.asRelativePath(pattern);

	let files = await vscode.workspace.findFiles(pattern);
	if (files.length > 0)
		return path.basename(files[0].fsPath, ".mds");

	return "";
}

async function getTargetName(baseFilePath: string, targetFileName: string): Promise<vscode.Uri | undefined>
{
	let projectName = await getProjectName(baseFilePath);

	if (!vscode.workspace.workspaceFolders?.length)
		return;

	let folder = vscode.workspace.workspaceFolders[0];
	let targetFile = vscode.Uri.file(folder.uri.fsPath + "/.vscode/.tc/" + projectName + "/" + targetFileName);

	let wsedit = new vscode.WorkspaceEdit();
	wsedit.createFile(targetFile, { overwrite: true });
	await vscode.workspace.applyEdit(wsedit);

	return targetFile;
}

/**
 * Generates TypeScript module for tested apps
 * @param filePath Absolute path to file
 */
export async function generateTestedApps(filePath: string)
{
console.log("generateTestedApps()");

	let targetFile = await getTargetName(filePath, "testedApps.d.ts");
	if (!targetFile)
		return;

	// - generate
	let content = generateTestedAppsImpl(filePath);
	await vscode.workspace.fs.writeFile(targetFile, Buffer.from(content, 'utf8'));
}
