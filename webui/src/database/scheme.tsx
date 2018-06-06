import * as React from "react";

import { StringRenderer, TableRefRenderer, ColorRenderer, NestedTableRenderer, SpriteRenderer } from '../components/data-renderers'

import { StringEditor, NumberEditor, BoolEditor, ColorEditor, NestedTableEditor, SpriteIDEditor, TableRefEditor, ArrayEditor, StringChoiceEditor } from '../components/data-editors'
import { getSprite } from "../utils/sprites-loader";

export interface TypeDef {
    renderValue(value: any): JSX.Element | JSX.Element[]
    renderEditor?(name: string, value: any, onChange: (newValue: any) => void): JSX.Element
    validate(value: any): boolean
    copy(value: any): any
}

export type FieldDef = {
    name: string,
    type: TypeDef
}

class TString implements TypeDef {
    renderValue(value: string) {
        return <StringRenderer value={value} />
    }
    renderEditor(name: string, value: string, onChange: (newValue: string) => void) {
        return <StringEditor key={name} name={name} value={value} onChange={onChange} />
    }
    validate(value: any) {
        return typeof (value) === "string"
    }
    copy(value: string) {
        return value
    }
}

class TStringChoice implements TypeDef {
    constructor(public values:string[]){}
    renderValue(value: string) {
        return <StringRenderer value={value} />
    }
    renderEditor(name: string, value: string, onChange: (newValue: string) => void) {
        return <StringChoiceEditor key={name} name={name} value={value} values={this.values} onChange={onChange} />
    }
    validate(value: any) {
        return typeof (value) === "string" && this.values.includes(value)
    }
    copy(value: string) {
        return value
    }
}

class TBoolean implements TypeDef {
    renderValue(value: boolean) {
        return <StringRenderer value={value.toString()} />
    }
    renderEditor(name: string, value: boolean, onChange: (newValue: boolean) => void) {
        return <BoolEditor key={name} name={name} value={value} onChange={onChange} />
    }

    validate(value: any) {
        return typeof (value) === "boolean"
    }
    copy(value: boolean) {
        return value;
    }
}

class TNumber implements TypeDef {
    renderValue(value: number) {
        return <StringRenderer value={typeof (value) === 'number' ? value.toString() : typeof (value) === 'string' ? value : ''} />
    }
    renderEditor(name: string, value: number, onChange: (newValue: number) => void) {
        return <NumberEditor key={name} name={name} value={value} onChange={onChange} />
    }
    validate(value: any) {
        return typeof (value) === "number" || typeof (value) === "string"
    }
    copy(value: number) {
        return value;
    }
}

class TColor implements TypeDef {
    constructor(public isHex:boolean = false){}
    renderValue(value: string) {
        return <ColorRenderer value={value} />
    }
    renderEditor(name: string, value: string, onChange: (newValue: string) => void) {
        return <ColorEditor hexColor={this.isHex} key={name} name={name} value={value} onChange={onChange} />
    }
    validate(value: any) {
        return typeof (value) === "string"
    }
    copy(value: string) {
        return value;
    }
}

class TTableRef implements TypeDef {
    constructor(public refTable: string) {
    }
    renderValue(value: string) {
        return <TableRefRenderer table={this.refTable} id={value} />
    }
    renderEditor(name: string, value: string, onChange: (newValue: string) => void) {
        return <TableRefEditor key={name} name={name} value={value} tableName={this.refTable} onChange={onChange} />
    }
    validate(value: any) {
        return typeof (value) === "string"
    }
    copy(value: string) {
        return value;
    }
}

export function validateScheme(table: any[], scheme: FieldDef[]) {
    let schemeMap: { [key: string]: FieldDef } = {}
    for (let item of scheme) {
        schemeMap[item.name] = item
    }
    schemeMap['_filename'] = scheme[0]
    for (let idx = 0; idx < table.length; ++idx) {
        let item = table[idx]
        for (let key of Object.keys(item)) {
            if (!schemeMap[key]) {
                throw new Error(`Missing key '${key}', ID=${item.ID ? item.ID : idx}, file ${item._filename}`)
            }
            if (!schemeMap[key].type.validate(item[key])) {
                throw new Error(`Validation of key '${key}' failed, ID=${item.ID ? item.ID : idx}, file ${item._filename}`)
            }
        }
    }
    return true
}

class TNestedTable implements TypeDef {
    constructor(public def: FieldDef[]) {
    }
    renderValue(value: any) {
        return value ? <NestedTableRenderer table={value} typeDef={this.def} /> : <span></span>
    }
    renderEditor(name: string, value: any, onChange: (newValue: any) => void) {
        return <NestedTableEditor key={name} name={name} value={value} tableDef={this.def} onChange={onChange} />
    }
    validate(value: any) {
        return validateScheme(value, this.def)
    }
    copy(value: any[]) {
        return copyTable(value, this.def)
    }
}

class TNestedObject implements TypeDef {
    constructor(public def: FieldDef[]) {
    }
    renderValue(value: any) {
        return value ? <NestedTableRenderer table={value?[value]:[]} typeDef={this.def} /> : <span></span>
    }
    renderEditor(name: string, value: any, onChange: (newValue: any) => void) {
        return <NestedTableEditor key={name} name={name} value={value?[value]:[]} tableDef={this.def} onChange={newValue=>onChange(newValue[0])} />
    }
    validate(value: any) {
        return validateScheme(value?[value]:[], this.def)
    }
    copy(value: any) {
        return copyRecord(value, this.def)
    }
}


class TArrayOf implements TypeDef {
    constructor(public itemType: TypeDef, public plainSingleItem:boolean = false) {
    }
    renderValue(value: any[]) {
        if(this.plainSingleItem && !(value instanceof Array)) {
            value = [value]
        }
        return value.map(item => this.itemType.renderValue(item) as JSX.Element)
    }
    renderEditor(name: string, value: any, onChange: (newValue: any) => void) {
        if(this.plainSingleItem && !(value instanceof Array)) {
            value = [value]
        }
        return <ArrayEditor plainSingleItem={this.plainSingleItem} key={name} name={name} value={value} onChange={onChange} type={this.itemType}/>
    }
    validate(value: any) {
        return (value instanceof Array) || (this.plainSingleItem && this.itemType.validate(value))
    }
    copy(value: any[]) {
        if(this.plainSingleItem && !(value instanceof Array)) {
            return this.itemType.copy(value)
        }
        let rv: any[] = []
        for (let item of value) {
            rv.push(this.itemType.copy(item))
        }
        return rv
    }
}

class TSpriteID implements TypeDef {
    constructor(public transform?: (val: string) => string) {
    }
    renderValue(value: string) {
        return <SpriteRenderer id={this.transform ? this.transform(value) : value} />
    }
    renderEditor(name: string, value: string, onChange: (newValue: string) => void) {
        return <SpriteIDEditor key={name} name={name} value={this.transform?this.transform(value):value} onChange={onChange} />
    }
    validate(value: any) {
        return typeof (value) === "string"
    }
    copy(value: string) {
        return value;
    }
}

class TOneOf implements TypeDef {
    constructor(public defs: { detector?: (value: any) => boolean, def: TypeDef }[]) {

    }
    renderValue(value: any) {
        for (let td of this.defs) {
            if (!td.detector || td.detector(value)) {
                return td.def.renderValue(value)
            }
        }
        return <span>ERROR</span>
    }
    validate(value: any) {
        for (let def of this.defs) {
            if ((!def.detector || def.detector(value)) && def.def.validate(value)) {
                return true
            }
        }
        return false
    }
    copy(value: any) {
        for (let def of this.defs) {
            if (!def.detector || def.detector(value)) {
                return def.def.copy(value)
            }
        }
        return value
    }
}

class TCustomObject implements TypeDef {
    renderValue(value: any) {
        return <StringRenderer value={JSON.stringify(value)} />
    }
    onChange(onChange: (newValue: string) => void, newValue:string) {
        onChange(JSON.parse(newValue))
    }
    renderEditor(name: string, value: any, onChange: (newValue: string) => void) {
        return <StringEditor 
            key={name}
            name={name}
            value={JSON.stringify(value)}
            onChange={(val)=>this.onChange(onChange, val)} />
    }
    validate(value: any) {
        return typeof (value) === "object"
    }
    copy(value: any) {
        return { ...value }
    }
}

export function copyRecord(record: any, defs: FieldDef[]) {
    if (record === undefined) {
        return record
    }
    let rv: any = {}
    for (let def of defs) {
        if (record[def.name] !== undefined) {
            rv[def.name] = def.type.copy(record[def.name])
        }
    }
    return rv
}

export function copyTable(table:any[], defs:FieldDef[]) {
    if (table === undefined) {
        return table
    }
    if (!table.map) {
        console.log(table)
    }
    return table.map((item:any)=>copyRecord(item, defs))
}

const stateModifierScheme = [
    { name: 'Type', type: new TStringChoice(['Attribute', 'Need']) },
    { name: 'Attribute', type: new TString },
    { name: 'Value', type: new TNumber }
]

function needsSpriteIDTransform(id:string) {
    if (getSprite('Status' + id)) {
        return 'Status' + id
    }
    return id
}

const needsStatesScheme = [
    { name: 'ID', type: new TString },
    { name: 'Threshold', type: new TNumber },
    { name: 'Priority', type: new TNumber },
    { name: 'ThoughtBubble', type: new TSpriteID(needsSpriteIDTransform) },
    { name: 'Modifiers', type: new TNestedTable(stateModifierScheme) },
    { name: 'Action', type: new TString }
]

const plantsStatesScheme = [
    { name: 'ID', type: new TString },
    { name: 'SpriteID', type: new TSpriteID },
    { name: 'Harvest', type: new TBoolean },
    { name: 'Layout', type: new TString },
    { name: 'Fell', type: new TBoolean },
]

const plantsHarvestedItemScheme = [
    { name: 'ItemID', type: new TString },
    { name: 'MaterialID', type: new TString },
    { name: 'Chance', type: new TNumber },
]
const plantsOnHarvestScheme = [
    { name: 'HarvestedItem', type: new TNestedTable(plantsHarvestedItemScheme) },
    { name: 'Action', type: new TString }
]

const plantsOnFell = [
    { name: 'ItemID', type: new TTableRef('Items') },
    { name: 'MaterialID', type: new TTableRef('Materials') }
]

const treeLayoutScheme = [
    { name: 'SpriteID', type: new TSpriteID },
    { name: 'Offset', type: new TString },
    { name: 'Rotation', type: new TString },
    { name: 'FruitPos', type: new TBoolean },
]

const actionSpriteIdScheme = [
    { name: 'SpriteID', type: new TSpriteID },
    { name: 'Offset', type: new TString },
    { name: 'Rotate', type: new TBoolean },
    { name: 'type', type: new TString }, //???
]

let testTileValues = [
    'Floor', 
    'FloorSoil', 
    'Tree', 
    'Plant', 
    'PlantHasFruit', 
    'Wall', 
    'WallFree', 
    'Construction', 
    'Designation', 
    'Job', 
    'Ramp', 
    'StairsTop', 
    'Stairs', 
    'TreeClip', 
    'Stockpile', 
    'Room',
    'AnyWall'
]

const actionTestTileScheme = [
    { name: 'Offset', type: new TString },
    { name: 'Required', type: new TArrayOf(new TStringChoice(testTileValues))},
    { name: 'Forbidden', type: new TArrayOf(new TStringChoice(testTileValues))}
]

const constructionsSpritesScheme = [
    { name: 'SpriteID', type: new TSpriteID },
    { name: 'Offset', type: new TString },
    { name: 'Type', type: new TString },
]

const constructionComponentsScheme = [
    { name: 'ItemID', type: new TTableRef('Items') },
    { name: 'Amount', type: new TNumber},
    { name: 'MaterialTypes', type: new TArrayOf(new TString)}
]

const constructionsIntermediateSpritesScheme = [
    { name: 'SpriteID', type: new TSpriteID },
    { name: 'Offset', type: new TString },
    { name: 'Type', type: new TString },
    { name: 'Percent', type: new TNumber },
]

const craftsComponentsScheme = [
    { name: 'ItemID', type: new TTableRef('Items') },
    { name: 'ClassID', type: new TString },
    { name: 'GroupID', type: new TString },
    { name: 'Amount', type: new TNumber },
    { name: 'AllowedMaterial', type: new TString },
    { name: 'AllowedMaterialType', type: new TArrayOf(new TString) },
]

const craftsTechGainScheme = [
    { name: 'TechID', type: new TTableRef('Tech') },
    { name: 'Formula', type: new TString },
    { name: 'Args', type: new TCustomObject },
]

const craftsSkillGainScheme = [
    { name: 'SkillID', type: new TTableRef('Skills') },
    { name: 'Formula', type: new TString },
    { name: 'Args', type: new TCustomObject },
]

const craftsPrereqsScheme = [
    { name: 'Category', type: new TString },
    { name: 'TechGroup', type: new TString },
    { name: 'Value', type: new TNumber },
]

const stringDetector = (value: any) => typeof (value) === 'string'

const jobsTasksScheme = [
    { name: 'Task', type: new TString },
    { name: 'Duration', type: new TNumber },
    { name: 'Offset', type: new TString },
    { name: 'ConstructionID', type: new TString },
    { name: 'Material', type: new TString },
]

const jobsSpriteIdScheme = [
    { name: 'SpriteID', type: new TSpriteID },
    { name: 'Offset', type: new TString },
    { name: 'Type', type: new TString },
    { name: 'Rotate', type: new TBoolean },
    { name: 'ConstructionID', type: new TTableRef('Construction') },
    { name: 'Material', type: new TString },
    { name: 'Duration', type: new TNumber },
]

const workshopsComponentsScheme = [
    { name: 'Offset', type: new TString },
    { name: 'SpriteID', type: new TSpriteID },
    { name: 'SpriteID2', type: new TSpriteID },
    { name: 'ItemID', type: new TTableRef('Items') },
    { name: 'MaterialItem', type: new TArrayOf(new TNumber) },
    { name: 'WallRotation', type: new TString },
    { name: 'Required', type: new TArrayOf(new TStringChoice(testTileValues)) },
    { name: 'Forbidden', type: new TArrayOf(new TStringChoice(testTileValues)) },
]

const workshopsTestTileScheme = [
    { name: 'Offset', type: new TString },
    { name: 'Required', type: new TArrayOf(new TStringChoice(testTileValues)) },
    { name: 'Forbidden', type: new TArrayOf(new TStringChoice(testTileValues)) },
]

const itemsComponentsScheme = [
    { name: 'ItemID', type: new TTableRef('Items') },
    { name: 'NoMaterial', type: new TBoolean },
]

const itemGroupingGroupsScheme = [
    { name: 'GroupID', type: new TString },
    { name: 'Items', type: new TArrayOf(new TTableRef('Items')) },
]

const containersSpritesScheme = [
    { name: 'SpriteID', type: new TSpriteID },
    { name: 'Offset', type: new TString },
    { name: 'Type', type: new TString },
    { name: 'MaterialItem', type: new TNumber },
]

const containerComponentsScheme = [
    { name: 'ItemID', type: new TTableRef('Items') },
    { name: 'Type', type: new TString },
]

const containerTestTileScheme = [
    { name: 'Offset', type: new TString },
    { name: 'Construction', type: new TBoolean },
    { name: 'Stockpile', type: new TBoolean },
    { name: 'Job', type: new TBoolean },
]

const gameStartComponentsScheme = [
    { name: 'ItemID', type: new TTableRef('Items') },
    { name: 'MaterialID', type: new TTableRef('Materials') },
]

const gameStartContentScheme = [
    { name: 'Type', type: new TString },
    { name: 'ItemID', type: new TTableRef('Items') },
    { name: 'MaterialID', type: new TTableRef('Materials') },
    { name: 'Amount', type: new TNumber },
]

export const dbScheme: { [key: string]: FieldDef[] } = {
    Attributes: [
        { name: 'ID', type: new TString },
    ],
    Skills: [
        { name: 'ID', type: new TString },
        { name: 'RequiredToolItemID', type: new TTableRef('Items') }
    ],
    SkillGroups: [
        { name: 'ID', type: new TString },
        { name: 'Text', type: new TString },
        { name: 'Position', type: new TNumber },
        { name: 'Color', type: new TColor },
        { name: 'SkillID', type: new TArrayOf(new TTableRef('Skills')) }
    ],
    Needs: [
        { name: 'ID', type: new TString },
        { name: 'Max', type: new TNumber },
        { name: 'BarColor', type: new TColor(true) },
        { name: 'DecayPerMinute', type: new TNumber },
        { name: 'GainFromSleep', type: new TNumber },
        { name: 'States', type: new TNestedTable(needsStatesScheme) }
    ],
    Names: [
        { name: 'ID', type: new TString },
        { name: 'Names', type: new TArrayOf(new TString) },
    ],
    Animals: [
        { name: 'ID', type: new TString },
        { name: 'AllowInWild', type: new TBoolean },
        { name: 'SpriteID', type: new TSpriteID },
        { name: 'Behavior', type: new TString },
        { name: 'Speed', type: new TNumber },
        { name: 'HungerPerTick', type: new TNumber },
        { name: 'EatTime', type: new TNumber },
    ],
    Plants: [
        { name: 'ID', type: new TString },
        { name: 'Material', type: new TString },
        { name: 'Type', type: new TString },
        { name: 'AllowInWild', type: new TBoolean },
        { name: 'States', type: new TNestedTable(plantsStatesScheme) },
        { name: 'OnHarvest', type: new TNestedObject(plantsOnHarvestScheme) },
        { name: 'SeedItemID', type: new TString },
        { name: 'GrowTimeMin', type: new TNumber },
        { name: 'GrowTimeMax', type: new TNumber },
        { name: 'LosesFruitInSeason', type: new TTableRef('Seasons') },
        { name: 'GrowsInSeason', type: new TArrayOf(new TTableRef('Seasons')) },
        { name: 'GrowsIn', type: new TString },
        { name: 'IsKilledInSeason', type: new TTableRef('Seasons') },
        { name: 'ToolButtonSprite', type: new TString },
        { name: 'OnFell', type: new TNestedObject(plantsOnFell) },
        { name: 'FruitItemID', type: new TTableRef('Items') },
        { name: 'NumFruitsPerSeason', type: new TNumber },
    ],
    TreeLayouts: [
        { name: 'ID', type: new TString },
        { name: 'Layout', type: new TNestedTable(treeLayoutScheme) },
    ],
    Actions: [
        { name: 'ID', type: new TString },
        { name: 'Job', type: new TString },
        { name: 'ConstructionType', type: new TString },
        { name: 'Multi', type: new TBoolean },
        { name: 'MultiZ', type: new TBoolean },
        { name: 'Rotate', type: new TBoolean },
        { name: 'Floor', type: new TBoolean },
        { name: 'SpriteID', type: new TOneOf([{ detector: stringDetector, def: new TSpriteID }, { def: new TNestedTable(actionSpriteIdScheme) }]) },
        { name: 'TestTile', type: new TNestedTable(actionTestTileScheme) },
        { name: 'ConstructionSelect', type: new TBoolean }
    ],
    Constructions: [
        { name: 'ID', type: new TString },
        { name: 'Type', type: new TString },
        { name: 'Sprites', type: new TNestedTable(constructionsSpritesScheme) },
        { name: 'Rotation', type: new TBoolean },
        { name: 'Components', type: new TNestedTable(constructionComponentsScheme) },
        { name: 'IntermediateSprites', type: new TNestedTable(constructionsIntermediateSpritesScheme) },
    ],
    ConstructionTypes: [
        { name: 'ID', type: new TString },
    ],
    Crafts: [
        { name: 'ID', type: new TString },
        { name: 'ItemID', type: new TTableRef('Items') },
        { name: 'SkillID', type: new TTableRef('Skills') },
        { name: 'ProductionTime', type: new TNumber },
        { name: 'AttributeUsed', type: new TArrayOf(new TString, true) },
        { name: 'ConversionMaterial', type: new TString },
        { name: 'Components', type: new TNestedTable(craftsComponentsScheme) },
        { name: 'TechGain', type: new TNestedObject(craftsTechGainScheme) },
        { name: 'SkillGain', type: new TNestedObject(craftsSkillGainScheme) },
        { name: 'Prereqs', type: new TNestedTable(craftsPrereqsScheme) },
        { name: 'Amount', type: new TNumber },
        { name: 'BlueprintID', type: new TString },
        { name: 'MaterialItems', type: new TArrayOf(new TNumber) },
        { name: 'AllowedMaterialType', type: new TArrayOf(new TString) },
        { name: 'AllowedMaterial', type: new TArrayOf(new TString) },
    ],
    Jobs: [
        { name: 'ID', type: new TString },
        { name: 'SkillID', type: new TTableRef('Skills') },
        { name: 'WorkPosition', type: new TArrayOf(new TArrayOf(new TNumber)) },
        { name: 'Tasks', type: new TNestedTable(jobsTasksScheme) },
        { name: 'RequiredToolItemID', type: new TTableRef('Items') },
        { name: 'RequiredToolLevel', type: new TString },
        { name: 'Ticks', type: new TNumber },
        { name: 'SpriteID', type: new TNestedTable(jobsSpriteIdScheme) },
        { name: 'SkillGain', type: new TString },
        { name: 'TechGain', type: new TString },
        { name: 'ConstructionType', type: new TString },
        { name: 'Staging', type: new TArrayOf(new TArrayOf(new TNumber)) },
    ],
    Workshops: [
        { name: 'ID', type: new TString },
        { name: 'Size', type: new TString },
        { name: 'InputTile', type: new TString },
        { name: 'OutputTile', type: new TString },
        { name: 'Crafts', type: new TArrayOf(new TTableRef('Items')) },
        { name: 'Components', type: new TNestedTable(workshopsComponentsScheme) },
        { name: 'SpecialGui', type: new TString }
    ],
    Items: [
        { name: 'ID', type: new TString },
        { name: 'Value', type: new TNumber },
        { name: 'HasQuality', type: new TBoolean },
        { name: 'SpriteID', type: new TSpriteID },
        { name: 'StackSize', type: new TNumber },
        { name: 'LightIntensity', type: new TNumber },
        { name: 'DrinkValue', type: new TNumber },
        { name: 'Components', type: new TNestedTable(itemsComponentsScheme) },
        { name: 'IsContainer', type: new TBoolean },
        { name: 'IsTool', type: new TBoolean },
        { name: 'Nutrition', type: new TNumber }
    ],
    Furniture: [
        { name: 'ID', type: new TString },
    ],
    Doors: [
        { name: 'ID', type: new TString },
    ],
    ItemGrouping: [
        { name: 'ID', type: new TString },
        { name: 'Color', type: new TColor },
        { name: 'ClassID', type: new TString },
        { name: 'Groups', type: new TNestedTable(itemGroupingGroupsScheme) },
    ],
    Materials: [
        { name: 'ID', type: new TString },
        { name: 'Name', type: new TString },
        { name: 'Type', type: new TString },
        { name: 'Color', type: new TColor },
        { name: 'Value', type: new TNumber },
        { name: 'Strength', type: new TNumber },
        { name: 'GroupName', type: new TString }
    ],
    TerrainMaterials: [
        { name: 'ID', type: new TString },
        { name: 'Type', type: new TString },
        { name: 'Highest', type: new TNumber },
        { name: 'Lowest', type: new TNumber },
        { name: 'RequiredToolLevel', type: new TNumber },
        { name: 'WallSprite', type: new TSpriteID },
        { name: 'FloorSprite', type: new TSpriteID },
        { name: 'ShortWallSprite', type: new TSpriteID },
    ],
    EmbeddedMaterials: [
        { name: 'ID', type: new TString },
        { name: 'Type', type: new TString },
        { name: 'Highest', type: new TNumber },
        { name: 'Lowest', type: new TNumber },
        { name: 'WallSprite', type: new TSpriteID },
        { name: 'RequiredToolLevel', type: new TNumber },
    ],
    MaterialToToolLevel: [
        { name: 'ID', type: new TString },
        { name: 'RequiredToolLevel', type: new TNumber },
        { name: 'ToolLevel', type: new TNumber },
    ],
    Containers: [
        { name: 'ID', type: new TString },
        { name: 'Type', type: new TString },
        { name: 'Buildable', type: new TBoolean },
        { name: 'Capacity', type: new TNumber },
        { name: 'RequireSame', type: new TBoolean },
        { name: 'Sprites', type: new TNestedTable(containersSpritesScheme) },
        { name: 'Components', type: new TNestedTable(containerComponentsScheme) },
        { name: 'TestTile', type: new TNestedTable(containerTestTileScheme) },
        { name: 'AllowedItems', type: new TArrayOf(new TTableRef('Items')) },
    ],
    // Gamestart: [
    //     { name: 'Offset', type: new TString },
    //     { name: 'Type', type: new TString },
    //     { name: 'ItemID', type: new TTableRef('Items') },
    //     { name: 'Components', type: new TNestedTable(gameStartComponentsScheme) },
    //     { name: 'MaterialID', type: new TTableRef('Materials') },
    //     { name: 'Amount', type: new TNumber },
    //     { name: 'Content', type: new TNestedTable(gameStartContentScheme) },
    //     { name: 'Color', type: new TColor },
    // ],
    Tech: [
        { name: 'ID', type: new TString },
    ],
    Seasons: [
        { name: 'ID', type: new TString },
        { name: 'NextSeason', type: new TTableRef('Seasons') },
        { name: 'NumDays', type: new TNumber },
        { name: 'SunRiseFirst', type: new TString },
        { name: 'SunsetFirst', type: new TString },
    ],
    Time: [
        { name: 'ID', type: new TString },
        { name: 'Value', type: new TNumber },
    ],
}
