import { convertToJson, parse } from 'fast-xml-parser';
import { readFileSync } from 'fs';
import * as vscode from 'vscode';

const indent = require('indent');

type int = number & {};
type guid = string;
const CLASS_PREFIX = 'TestComplete.';

interface IObject
{
    at_Name: string;
    at_Owner: guid;
    Child: Array<IObject> | IObject;
};

interface IProperty
{
    at_Name: string;
    Value: {
        at_Value: string;
        /** Type of property */
        at_PropertyType?: string;
        /** Type of value */
        at_Type?: string;
    };
};

interface IKeyObject
{
    at_Name: string;
    at_Key: guid;
    Children?: {
        Child: Array<IKeyObject> | IKeyObject;
    };
    Properties?: {
        Property: Array<IProperty> | IProperty;
    };
};

interface INameMapping
{
    Root: {
        at_NameMappingVersion: int;
        at_SaveImages: int;
        at_Signature: guid;
        LogicalNodes: IObject;
        Nodes: IKeyObject;
        Storages: {
            at_Current: int;
            Child: {
                at_Name: string;
            };
        };
    };
};

const windowClasses = [
    'wxWindowNR',
    'DirectUIHWND',
    'MsiDialogCloseClass',
    'UnityWndClass',
    'Chrome_WidgetWin_1',
];

const elementClasses = [
    'wxGLCanvas',
    'AfxControlBar80u',
    'ToolbarWindow32',
    'TkChild',
];

function convertWndClass(wndClass: string): string
{
    if (windowClasses.some(entry => entry == wndClass))
        return 'Window';

    if (elementClasses.some(entry => entry == wndClass))
        return 'Element';

    if (wndClass.startsWith('Afx:') || wndClass.startsWith('Shell '))
        return 'Element';

    switch (wndClass)
    {
        case '#32770': return 'Dialog';
        case 'ComboLBox': return 'ComboBox';
        case 'SysTreeView32': return 'TreeView';
    }

    return wndClass;
}

const KnownTypes =
[
    "Window",
    "Form",
    "Dialog",
    "ContentPresenter",
    "StackPanel",
    "Panel",
    "Pane",
    "TabItem",
    "CheckBox",
    "ComboBox",
    "TextBlock",
    "ProgressBar",
    "ListBoxItem",
    "ListItem",
    "TreeView",
    "List",
    "MenuControl",
    "MenuItem",
    "RadioButton",
    "ImageButton",
    "Button",
    "Menu",
    "TextBox",
    "Label",
    "Text",
    "Edit",
    "Control",
];

function castToKnownTypes(type: string): string
{
    const bypass = !vscode.workspace
        .getConfiguration("testcomplete", null)
        .get("castMappedItemsToKnownTypes", true);

    if (bypass || KnownTypes.includes(type))
        return type;

    for (let knownType of KnownTypes)
    {
        if (type.includes(knownType))
            return knownType;
    }

    return "Element";
}

function getTypeFromProperties(el: IKeyObject): string
{
    let type = getTypeFromPropertiesImpl(el).replace(" ", "");
    return castToKnownTypes(type);
}

function getTypeFromPropertiesImpl(el: IKeyObject): string
{
    if (!el?.Properties)
        return "";

    if ('forEach' in el.Properties.Property)
    {
        for (let i = 0; i < el.Properties.Property.length; i++)
        {
            let property = el.Properties.Property[i];
            switch (property.at_Name)
            {
                case 'ObjectType':
                case 'ClrClassName':
                case 'RootVisual.ClrClassName':
                    return property.Value.at_Value;
                case 'WndClass':
                    return convertWndClass(property.Value.at_Value);
                case 'ClrFullClassName':
                    let splitted = property.Value.at_Value.split('.');
                    return splitted[splitted.length - 1];
                // default:
                //     return property.Value.at_Value;
            };
        }
    }
    else
    {
        let property = el.Properties.Property;
        if ('at_Name' in property)
        {
            switch (property.at_Name)
            {
                case 'ObjectType':
                case 'ClrClassName':
                case 'RootVisual.ClrClassName':
                    return property.Value.at_Value;
                case 'WndClass':
                    return convertWndClass(property.Value.at_Value);
                case 'ClrFullClassName':
                    let splitted = property.Value.at_Value.split('.');
                    return splitted[splitted.length - 1];
                // default:
                //     return property.Value.at_Value;
            }
        }
    }

    return 'Element';
}

/** Parse all objects into one dict */
function getAllMappedObjects(root: IKeyObject, allObjects: Record<string, IKeyObject>): void
{
    if (!root?.Children?.Child)
        return;

    processChildren(root.Children.Child, (obj: IKeyObject) =>
    {
        if ('at_Key' in obj)
            allObjects[obj.at_Key] = obj;
        getAllMappedObjects(obj, allObjects);
    });

    // if ('forEach' in root.Children.Child)
    // {
    //     root.Children.Child.forEach(obj =>
    //     {
    //         allObjects[obj.at_Key] = obj;
    //         getAllMappedObjects(obj, allObjects);
    //     });
    // }
    // else
    // {
    //     if ('at_Key' in root.Children.Child)
    //         allObjects[root.Children.Child.at_Key] = root.Children.Child;
    //     getAllMappedObjects(root.Children.Child, allObjects);
    // }
}

function containsKeywords(elName: string, keywords: string[]): boolean
{
    return keywords.some(keyword => containsKeyword(elName, keyword));
}

/** Checks if given elName contains one of the given keywords. */
function containsKeyword(elName: string, keyword: string): boolean
{
    return elName.startsWith(keyword) || elName.endsWith(keyword);
}

/** Tries to guess type of element by its name. */
function inferTypeFromName(elName: string): string
{
    elName = elName.toLowerCase();

    if (containsKeywords(elName, ['radiobutton', 'rb']))
        return 'RadioButton';
    else if (containsKeyword(elName, 'combobox'))
        return 'ComboBox';
    else if (containsKeywords(elName, ['checkbox', 'cb']))
        return 'CheckBox';
    else if (containsKeywords(elName, ['button', 'btn']))
        return 'Button';
    else if (containsKeyword(elName, 'form'))
        return 'Form';
    else if (containsKeywords(elName, ['window', 'wnd']))
        return 'Window';
    else if (containsKeywords(elName, ['dialog', 'dlg']))
        return 'Dialog';
    else if (containsKeywords(elName, ['edit', 'textbox', 'input']))
        return 'Edit';

    return 'Element';
}

function convertPropertyType(propertyType: string): string
{
    switch (propertyType)
    {
        case '0': return 'int';
        case '5': return 'string';
        // FIXME: this is for Captions particularily. Don't know actual type
        case '7': return 'string';
        default: return propertyType;
    }
}

/** Applies func to all items if children is array, or only on children if it is an item itself. */
function processChildren<T>(children: T | Array<T>, func: Function)
{
    if (!children)
        return;

    if ('forEach' in children)
    {
        children.forEach(child => func(child));
    }
    else func(children);
}

function printDotPath(elements: string[], indent: string, type: string): string
{
    if (elements.length == 1)
        return indent + elements[0] + `: ${type};\n`;

    let result = indent + elements[0] + ": {\n";
    if (elements.length > 1)
        result += printDotPath(elements.slice(1), indent + "    ", type);

    result += indent + "}\n"
    return result;
}

function generatePropsDeclarations(obj: IKeyObject): string
{
    let result = "";
    function processProperty(property: IProperty)
    {
        let type = property.Value.at_PropertyType
            ? convertPropertyType(property.Value.at_PropertyType)
            : 'string';

        let parts = property.at_Name.split('.');
        result += printDotPath(parts, "    ", type);
    }

    processChildren(obj.Properties?.Property, processProperty);
    return result;
}

function generateChildrenDeclaration(el: IObject, allObjects: Record<string, IKeyObject>): string
{
    let content = '';
    processChildren(el?.Child, (child: IObject) =>
    {
        let childContent = generateElementDeclaration(child, allObjects);
        childContent = indent(childContent, '    ');
        if (content)
            content += '\n';

        content += childContent;
    });

    return content;
}

/** Returns generated text for element definition including children. */
function generateElementDeclaration(el: IObject, allObjects: Record<string, IKeyObject>): string
{
    let id = el.at_Owner;
    let mappedName = el.at_Name;
    let obj = allObjects[id];

    let content = '/**\n';
    if (mappedName != obj.at_Name)
        content += ` * - Original element name: \`${obj.at_Name}\`\n`;

    content += ` * - Element GUID: \`${id}\`\n`;
    content += ' */\n';
    content += mappedName + ": ";

    let type = getTypeFromProperties(obj);

    // last chance to deduce type
    if (type == 'Element')
        type = inferTypeFromName(obj.at_Name)

    content += `${CLASS_PREFIX}${type} & ${CLASS_PREFIX}MappedObject & {\n`;
    content += generatePropsDeclarations(obj);
    let children = generateChildrenDeclaration(el, allObjects);
    if (children)
        content += '\n' + children;

    return content + '};\n';
}

/**
 * Implementation of TestedApps code generation
 * @param baseFile Absolute path to TestedApps.tcTAs
 */
export function generateNameMappingImpl(baseFile: string): string
{
    let file = readFileSync(baseFile, 'utf8');
    let parsedXml: INameMapping = parse(file, {
        ignoreAttributes: false,
        parseAttributeValue: true,
        attributeNamePrefix: "at_",
    }, true);

    let content = `/**
 * Declaration of all tested apps.
 * NOTE: Auto-generated from ${vscode.workspace.asRelativePath(baseFile)}
 */\n\n`;

    let allObjects: Record<string, IKeyObject> = {};
    getAllMappedObjects(parsedXml.Root.Nodes, allObjects);

    content += "declare namespace Aliases {\n";

    /** Handles top-level declaration in Aliases (most likely it's an app). */
    function writeInterfaceDeclaration(el: IObject): string
    {
        if (!el)
            return "";

        let id = el.at_Owner;
        let obj = allObjects[id];

        content += `    interface ${obj.at_Name} extends TestComplete.Process, TestComplete.MappedObject {\n`;

        let text = "";
        function processTopChild(child: IObject)
        {
            if (!child)
                return;

            let children = generateElementDeclaration(child, allObjects);
            text += '\n' + indent(children, '    ');
        }

        processChildren(el.Child, (child: IObject) => processTopChild(child));

        content += indent(text, '    ');
        content += '    }\n\n';
        return obj.at_Name;
    };

    let allInterfaces: string[] = [];
    processChildren(parsedXml.Root.LogicalNodes.Child, (child: IObject) =>
    {
        allInterfaces.push(writeInterfaceDeclaration(child));
    });

    allInterfaces.forEach(name =>
    {
        if (name)
            content += `    const ${name}: ${name};\n`;
    });

    content += "}\n";
    return content;
}
