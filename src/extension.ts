import * as vscode from 'vscode';
import { codeGeneration, codeGeneration as generateProjectModules, generateNameMapping, generateProject, generateTestedApps } from './codegen';
import { generateJsConfig } from './jsconf';

/**
 * Extension entry point
 */
export function activate(context: vscode.ExtensionContext)
{
	// TODO: if (config.regenerate && filesChanged)
	generateProjectModules();

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
			'testcomplete.codeGeneration',
			generateProjectModules));

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'testcomplete.initialize', () =>
	{
		generateProjectModules();
		generateJsConfig();
	}));
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate() { }
