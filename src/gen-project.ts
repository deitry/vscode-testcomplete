import {parse} from 'fast-xml-parser';
import {readFileSync} from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

type guid = string & {};
type int = number & {};

interface ITestItem {
    at_count: int;
    at_description: string;
    at_enabled: boolean;
    at_group: boolean;
    at_key: guid;
    at_name: string;
    at_stopOnError: int;
    at_stopOnException: int;
    at_testCase: boolean;
    at_testMoniker: string;
    at_timeout: int;
    at_tmsData: '';
    children: {
        testItem: Array<ITestItem>;
    }
};

interface ISetting {
    at_name: string;
};

interface IBoolSetting extends ISetting {
    at_type: 1;
    at_value: boolean;
};

interface IIntSetting extends ISetting {
    at_type: 2;
    at_value: int;
};

interface IStrSetting extends ISetting {
    at_type: 5;
    at_value: string;
};

interface ITableSetting extends ISetting {
    at_type: 6;
    at_colIndex: int;
    at_rowIndex: int;
    columns: {
        column: {
            at_enabled: boolean;
            at_type: int;
        };
    };
    data: {
        row: Array<{
            at_val0: string;
        }>;
    }
};

interface IVariable {
    at_Descr?: string;
    at_Local: boolean;
    at_Name: string;
};


const stringGuid = '{123F0C0F-44B4-4BAF-B0E6-F3F89FD873B5}';
type stringGuid = '{123F0C0F-44B4-4BAF-B0E6-F3F89FD873B5}';

const passwordGuid = '{B06407F3-6641-45A9-9692-DDE5B231F2CD}';
type passwordGuid = '{B06407F3-6641-45A9-9692-DDE5B231F2CD}';

const booleanGuid = '{D25FDC80-E78F-4209-88B6-6FE2B0771206}';
type booleanGuid = '{D25FDC80-E78F-4209-88B6-6FE2B0771206}';

const integerGuid = '{88422C25-DDF4-4EA1-B7CC-95779A023F5D}';
type integerGuid = '{88422C25-DDF4-4EA1-B7CC-95779A023F5D}';

const floatGuid = '{8562FD50-0B6E-489C-95A2-9C144116BD78}';
type floatGuid = '{8562FD50-0B6E-489C-95A2-9C144116BD78}';

interface IStrVariable extends IVariable {
    at_Type: 'String' | stringGuid;
    DefValue: {
        at_StrValue: string;
    };
};

interface IPasswordVariable extends IVariable {
    at_Type: 'Password' | passwordGuid;
    DefValue: {
        at_StrValue: string;
    };
};

interface IBoolVariable extends IVariable {
    at_Type: 'Boolean' | booleanGuid;
    DefValue: {
        at_BoolValue: boolean;
    };
};

interface IFloatVariable extends IVariable {
    at_Type: 'Double' | floatGuid;
    DefValue: {
        at_FloatValue: number;
    };
};

interface IIntVariable extends IVariable {
    at_Type: 'Integer' | integerGuid;
    DefValue: {
        at_IntValue: string;
    };
};

type IVarTypeEnum = IBoolVariable | IFloatVariable | IIntVariable | IStrVariable | IPasswordVariable;

interface ITestedApps {
	Root: {
        analysis: {
            at_key: string;
        };
        at_signature: guid;
        at_version: int;
        children: {
            child: Array<{
                at_key: guid;
                at_name: 'NameMapping' | 'Stores' | 'TestedApps' | string;
                at_pluginName: string;
                at_type: string;
                at_typeId: guid;
            }>;
            folder: {
                at_moniker: guid;
                at_name: 'Advanced';
                child: Array<{
                    at_key: guid;
                    at_name: 'Script' | 'Events' | string;
                    at_path: string;
                    at_pluginName: string;
                    at_typeId: guid;
                }>;
            };
        };
        config: {
            at_language: guid;
        };
        issueTracking: {
            at_key: guid;
            Templates: {
                Template: {
                    at_Id: guid;
                    // TODO
                };
            };
        };
        settings: {
            setting: Array<IBoolSetting | IStrSetting | IIntSetting | ITableSetting>;
        };
        testItems: {
            at_key: string;
            at_version: int;
            children: {
                testItem: Array<ITestItem>;
            }
        };
        variables: {
            at_key: guid;
            data: {
                at_Version: 3 | 4 | number;
                Items: {
                    Variable: Array<IVarTypeEnum>;
                }
            };
        };
	};
};

function getVarType(variable: IVarTypeEnum): string
{
    switch (variable.at_Type)
    {
        case 'String':
        case 'Password':
        case stringGuid:
        case passwordGuid:
            return 'string';
        case 'Boolean':
        case booleanGuid:
            return 'boolean';
        case 'Integer':
        case integerGuid:
            return 'int';
        case 'Double':
        case floatGuid:
            return 'number';
        default:
            return 'any';
    };
}

function getVarValue(variable: IVarTypeEnum): string
{
    switch (variable.at_Type)
    {
        case "String":
        case "Password":
        case stringGuid:
        case passwordGuid:
            let value: string = "" + variable.DefValue.at_StrValue;
            return value;
            // return value.replace("\\", "\\\\");
        case "Integer":
        case integerGuid:
            return variable.DefValue.at_IntValue.toString();
        case "Double":
        case floatGuid:
            return variable.DefValue.at_FloatValue.toString();
        case "Boolean":
        case booleanGuid:
            return "" + variable.DefValue.at_BoolValue;
        default:
            return "";
    };
}

/**
 * Implementation of Project module code generation
 * @param baseFile Absolute path to <ProjectName>.mds
 */
export function generateProjectImpl(baseFile: string): string
{
	let file = readFileSync(baseFile, 'utf8');
	let parsedXml: ITestedApps = parse(file, {
		ignoreAttributes: false,
		parseAttributeValue: true,
		attributeNamePrefix: "at_",
	}, true);

	let content = `/**
 * Declaration of Project variables.
 * NOTE: Auto-generated from ${baseFile}
 */\n\n`;

	content += "declare namespace TestComplete.Generated {\n";
    content += '    interface Variables extends TestComplete.ProjectVariables {\n';

	parsedXml.Root.variables.data.Items.Variable.forEach(variable =>
	{
        const description = variable.at_Descr;
        const type = getVarType(variable);
        const value = getVarValue(variable);

        if (description || value)
            content += `        /**\n`;
        if (description)
            content += `         * ${description}\n`;
        if (description && value)
            content += `         *\n`;
        if (value)
            content += `         * @default ${value}\n`;
        if (description || value)
            content += `         */\n`;
        content += `        ${variable.at_Name}: ${type};\n`;
	});

	content +=
`    }

    interface Project extends TestComplete.Project {
        /**
         * Returns the name of the current project's .mds file.
         *
         * @constant \`${path.basename(baseFile)}\`
         */
        readonly FileName: string;
        /**
         * The full path to the folder that contains the file of the current TestComplete project.
         *
         * @constant \`${path.dirname(path.resolve(baseFile))}\`
         */
        readonly Path: string;
        /** Returns the collection of local variables defined in the current project. */
        readonly Variables: Variables;
    }
}

/**
 * Provides interface to current project parameters.
 *
 * NOTE: Auto-generated from ${vscode.workspace.asRelativePath(path.resolve(baseFile))}
 */
declare const Project: TestComplete.Generated.Project;
`;


	return content;
}
