import {parse} from 'fast-xml-parser';
import {readFileSync} from 'fs';
import * as vscode from 'vscode';

interface IRunAsParams extends ITestedAppParams {
	at_name: 'RunAs';
	at_domain: string;
	at_password: string;
	at_userName: string;
}

interface IProfileParams extends ITestedAppParams {
	at_name: 'Profile';
	at_AQtimeVersion?: number;
	at_forceRunMode?: boolean;
	at_overrideProfiler?: boolean;
	at_profilerName?: string;
	/** @todo Get all enum values */
	at_profileRunMode?: 'Normal' | 'Silent' | string;
	at_projectFileName?: string;
	at_useProject?: boolean;
}

interface ISimpleParams extends ITestedAppParams {
	at_name: 'Simple';
	at_fileName: string;
	at_filePath: string;
}

interface IDebugParams extends ITestedAppParams {
	at_name: 'Debug';
}

interface ITestedAppParams {
	at_parameters: string;
	at_workFolder: string;
};

interface ITestedAppConfig {
	at_key: string;
	config: {
		at_autorunOnRecording: boolean; // bool
		at_count: number;
		at_enabled: boolean; // bool
		at_nodeName: string; // ~ AutoCad2020
		at_useFeaturedRuntimeObject: string; // bool
		at_userChangeName: boolean; // bool

		runModeParams: {
			at_activeRunMode: string;
			param: Array<ISimpleParams | IRunAsParams | IDebugParams | IProfileParams>;
		};
	};
};

interface ITestedApps {
	Root: {
		at_key: string;
		at_signature: string;
		at_typeId: string;
		at_version: number;
		data: any;
		testData: any;
		config: {
			at_nodeName: string;
		};

		children: {
			child: Array<ITestedAppConfig>;
		};
	};
};

/**
 * Implementation of TestedApps code generation
 * @param baseFile Absolute path to TestedApps.tcTAs
 */
export function generateTestedAppsImpl(baseFile: string): string
{
	let file = readFileSync(baseFile, 'utf8');
	let parsedXml: ITestedApps = parse(file, {
		ignoreAttributes: false,
		parseAttributeValue: true,
		attributeNamePrefix: "at_",
	}, true);

	let content = `/**
 * Declaration of all tested apps.
 * NOTE: Auto-generated from ${vscode.workspace.asRelativePath(baseFile)}
 */\n\n`;

	content += "declare namespace TestedApps {\n";

	parsedXml.Root.children.child.forEach(child =>
	{
		let active = child.config.runModeParams.at_activeRunMode;
		child.config.runModeParams.param.forEach(param =>
		{
			switch (param.at_name)
			{
				case 'Simple':
					content += "    /**\n";
					content += "     * `" + param.at_filePath + param.at_fileName;
					if (param.at_parameters)
						content += " " + param.at_parameters;
					content += "`\n     */\n";
					break;
			}
		});
		content += `    const ${child.config.at_nodeName}: TestComplete.TestedApp;\n`;
	});

	content += "}\n";

	return content;
}
