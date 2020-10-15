import * as vscode from 'vscode';
import * as path from 'path';
import { codeGeneration, generateNameMapping, generateProject, generateTestedApps } from './codegen';
import { generateJsConfig } from './jsconf';

/**
 * Extension entry point
 */
export function activate(context: vscode.ExtensionContext)
{
	// TODO: if (config.regenerate && filesChanged)
	// codeGeneration();

	let projectWatcher = vscode.workspace.createFileSystemWatcher("**/*.mds", true, false, true);
	projectWatcher.onDidChange(uri => generateProject(uri.fsPath));

	let testedAppsWatcher = vscode.workspace.createFileSystemWatcher("**/TestedApps.tcTAs", true, false, true);
	testedAppsWatcher.onDidChange(uri => generateTestedApps(uri.fsPath));

	let nameMappingWatcher = vscode.workspace.createFileSystemWatcher("**/NameMapping.tcNM", true, false, true);
	nameMappingWatcher.onDidChange(uri => generateNameMapping(uri.fsPath));

	context.subscriptions.push(projectWatcher);
	context.subscriptions.push(testedAppsWatcher);
	context.subscriptions.push(nameMappingWatcher);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'testcomplete.codeGeneration', async () =>
	{
		let projectFiles = await vscode.workspace.findFiles('**/*.mds');
		projectFiles.forEach(projectFile => codeGeneration(projectFile.fsPath));
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'testcomplete.initialize', async () =>
	{
		let projectFiles = await vscode.workspace.findFiles('**/*.mds');
		projectFiles.forEach(projectFile =>
		{
			const scriptPath = path.dirname(projectFile.fsPath) + path.sep + 'Script' + path.sep;
			generateJsConfig(scriptPath);
			codeGeneration(projectFile.fsPath);
		});
	}));
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate() { }
