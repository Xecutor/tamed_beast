import * as React from "react";

import {StringRenderer, TableRefRenderer, ColorRenderer, NestedTableRenderer, SpriteRenderer} from '../components/data-renderers'

export interface TypeDef{
    renderValue(value:any):JSX.Element|JSX.Element[]
}

export type FieldDef={
    name:string,
    type:TypeDef
}

class TString implements TypeDef{
    renderValue(value:string) {
        return <StringRenderer value={value}/>
    }
}

class TBoolean implements TypeDef{
    renderValue(value:boolean) {
        return <StringRenderer value={value.toString()}/>
    }
}

class TNumber implements TypeDef{
    renderValue(value:number) {
        return <StringRenderer value={typeof(value)==='number'?value.toString():typeof(value)==='string'?value:''}/>
    }
}

class TColor implements TypeDef{
    renderValue(value:string) {
        return <ColorRenderer value={value}/>
    }
}

class TTableRef implements TypeDef {
    constructor(public refTable:string) {
    }
    renderValue(value:string) {
        return <TableRefRenderer table={this.refTable} id={value}/>
    }
}

class TNested implements TypeDef {
    constructor(public def:Array<FieldDef>) {
    }
    renderValue(value:any) {
        if(value && value.length===undefined) {
            value=[value]
        }
        return value?<NestedTableRenderer table={value} typeDef={this.def}/>:<span></span>
    }
}

class TArrayOf implements TypeDef {
    constructor(public itemType:TypeDef) {
    }
    renderValue(value:string[]) {
        return value.map(id=>this.itemType.renderValue(id) as JSX.Element)
    }
}

class TSpriteId implements TypeDef {
    constructor(public transform?:(val:string)=>string) {
    }
    renderValue(value:string) {
        return <SpriteRenderer id={this.transform?this.transform(value):value} />
    }
}

class TOneOf implements TypeDef{
    constructor(public defs:{detector?:(value:any)=>boolean, def:TypeDef}[]) {

    }
    renderValue(value:any) {
        for(let td of this.defs) {
            if(!td.detector || td.detector(value)) {
                return td.def.renderValue(value)
            }
        }
        return <span>ERROR</span>
    }
}

class TCustomObject implements TypeDef{
    renderValue(value:any) {
        return <StringRenderer value={JSON.stringify(value)}/>
    }
}

const stateModifierScheme=[
    {name:'Type', type:new TString},
    {name:'Attribute', type: new TString},
    {name:'Value', type:new TNumber}
]

const needsStatesScheme=[
    {name:'ID', type:new TString},
    {name:'Threshold', type:new TNumber},
    {name:'Priority', type: new TNumber},
    {name:'ThoughtBubble', type: new TSpriteId((id)=>'Status'+id)},
    {name:'Modifiers', type: new TNested(stateModifierScheme)},
    {name:'Action', type:new TString}
]

const plantsStatesScheme=[
    {name:'ID', type:new TString},
    {name:'SpriteID', type:new TSpriteId},
    {name:'Harvest', type:new TBoolean}
]

const plantsHarvestedItemScheme=[
    {name:'ItemID', type:new TString},
    {name:'MaterialID', type:new TString},
    {name:'Chance', type:new TNumber},
]
const plantsOnHarvestScheme=[
    {name:'HarvestedItem', type:new TNested(plantsHarvestedItemScheme)},
    {name:'Action', type:new TString}
]

const treeLayoutScheme=[
    {name:'SpriteID', type:new TSpriteId},
    {name:'Offset', type:new TString},
    {name:'Rotation', type:new TString}
]

const actionSpriteIdScheme=[
    {name:'SpriteID', type:new TSpriteId},
    {name:'Offset', type:new TString},
    {name:'Rotate', type:new TBoolean},
]

const actionTestTileScheme=[
    {name:'Offset', type:new TString},
    {name:'Floor', type:new TBoolean},
    {name:'FloorSoil', type:new TBoolean},
    {name:'Tree', type:new TBoolean},
    {name:'Plant', type:new TBoolean},
    {name:'PlantHasFruit', type:new TBoolean},
    {name:'Wall', type:new TBoolean},
    {name:'WallFree', type:new TBoolean},
    {name:'Construction', type:new TBoolean},
    {name:'Designation', type:new TBoolean},
    {name:'Job', type:new TBoolean},
    {name:'Ramp', type:new TBoolean},
    {name:'StairsTop', type:new TBoolean},
]

const constructionsSpritesScheme=[
    {name:'SpriteID', type:new TSpriteId},
    {name:'Offset', type:new TString},
    {name:'Type', type:new TString},
]

const constructionComponentsScheme=[
    {name:'ItemID', type:new TTableRef('Items')},
]

const constructionsIntermediateSpritesScheme=[
    {name:'SpriteID', type:new TSpriteId},
    {name:'Offset', type:new TString},
    {name:'Type', type:new TString},
    {name:'Percent', type:new TNumber},
]

const craftsComponentsScheme=[
    {name:'ItemID', type:new TTableRef('Items')},
    {name:'Amount', type:new TNumber},
    {name:'AllowedMaterial', type:new TString},
]

const craftsTechGainScheme=[
    {name:'TechID', type:new TTableRef('Tech')},
    {name:'Formula', type:new TString},
    {name:'Args', type:new TCustomObject},
]

const craftsSkillGainScheme=[
    {name:'SkillID', type:new TTableRef('Skill')},
    {name:'Formula', type:new TString},
    {name:'Args', type:new TCustomObject},
]

const craftsPrereqsScheme=[
    {name:'Category', type:new TString},
    {name:'TechGroup', type:new TString},
    {name:'Value', type:new TString},
]

const stringDetector=(value:any)=>typeof(value)==='string'

const jobsTasksScheme=[
    {name:'Task', type:new TString},
    {name:'Duration', type:new TNumber},
    {name:'Offset', type:new TString},
    
]

const jobsSpriteIdScheme=[
    {name:'SpriteID', type:new TSpriteId},
    {name:'Offset', type:new TString},
    {name:'Type', type:new TString},
    {name:'Rotate', type:new TBoolean},
    {name:'ConstructionID', type:new TTableRef('Construction')},
    {name:'Material', type:new TString},
    {name:'Duration', type:new TNumber},
]

const workshopsComponentsScheme=[
    {name:'Offset', type:new TString},
    {name:'SpriteID', type:new TSpriteId},
    {name:'ItemID', type:new TTableRef('Items')},
    {name:'MaterialItem', type:new TArrayOf(new TNumber)},
    {name:'WallRotation', type:new TString},
]

const workshopsTestTileScheme=[
    {name:'Offset', type:new TString},
    {name:'Floor', type:new TBoolean},
    {name:'WallFree', type:new TBoolean},
]

const itemsComponentsScheme=[
    {name:'ItemID', type:new TTableRef('Items')},
    {name:'NoMaterial', type:new TBoolean},
]

const itemGroupingGroupsScheme=[
    {name:'GroupID', type:new TString},
    {name:'Items', type:new TArrayOf(new TTableRef('Items'))},
]

const containersSpritesScheme=[
    {name:'SpriteID', type:new TSpriteId},
    {name:'Offset', type:new TString},
    {name:'Type', type:new TString},
    {name:'MaterialItem', type:new TNumber},
]

const containerComponentsScheme=[
    {name:'ItemID', type:new TTableRef('Items')},
    {name:'Type', type:new TString},
]

const containerTestTileScheme=[
    {name:'Offset', type:new TString},
    {name:'Construction', type:new TBoolean},
    {name:'Stockpile', type:new TBoolean},
    {name:'Job', type:new TBoolean},
]

const gameStartComponentsScheme=[
    {name:'ItemID', type:new TTableRef('Items')},
    {name:'MaterialID', type:new TTableRef('Materials')},
]

const gameStartContentScheme=[
    {name:'Type', type:new TString},
    {name:'ItemID', type:new TTableRef('Items')},
    {name:'MaterialID', type:new TTableRef('Materials')},
    {name:'Amount', type:new TNumber},
]

export const dbScheme : {[key:string]:Array<FieldDef>}={
    Attributes:[
        {name:'ID', type:new TString},
    ],
    Skills:[
        {name:'ID', type:new TString},
        {name:'RequiredToolItemID',type:new TTableRef('Items')}
    ],
    SkillGroups:[
        {name:'ID', type:new TString},
        {name:'Text', type:new TString},
        {name:'Position', type:new TNumber},
        {name:'Color', type:new TColor},
        {name:'SkillID', type:new TArrayOf(new TTableRef('Skills'))}
    ],
    Needs:[
        {name:'ID', type:new TString},
        {name:'Max', type:new TNumber},
        {name:'BarColor', type:new TColor},
        {name:'DecayPerMinute', type:new TNumber},
        {name:'GainFromSleep', type:new TNumber},
        {name:'States', type:new TNested(needsStatesScheme)}
    ],
    Names:[
        {name:'ID', type:new TString},
        {name:'Names', type:new TArrayOf(new TString)},
    ],
    Animals:[
        {name:'ID', type:new TString},
        {name:'SpriteID', type:new TSpriteId},
        {name:'Behavior', type:new TString},
        {name:'Speed', type:new TNumber},
        {name:'HungerPerTick', type:new TNumber},
        {name:'EatTime', type:new TNumber},
    ],
    Plants:[
        {name:'ID', type:new TString},
        {name:'Material', type:new TString},
        {name:'Type', type:new TString},
        {name:'AllowInWild', type:new TBoolean},
        {name:'States', type:new TNested(plantsStatesScheme)},
        {name:'OnHarvest', type:new TNested(plantsOnHarvestScheme)},
        {name:'SeedItemID', type:new TString},
        {name:'GrowTimeMin', type:new TNumber},
        {name:'GrowTimeMax', type:new TNumber},
        {name:'LosesFruitInSeason', type:new TString},
        {name:'GrowsInSeason', type:new TArrayOf(new TString)},
        {name:'GrowsIn', type:new TString},
    ],
    TreeLayouts:[
        {name:'ID', type:new TString},
        {name:'Layout', type:new TNested(treeLayoutScheme)},
    ],
    Actions:[
        {name:'ID', type:new TString},
        {name:'Job', type:new TString},
        {name:'ConstructionType', type:new TString},
        {name:'Multi', type:new TBoolean},
        {name:'Rotate', type:new TBoolean},
        {name:'Floor', type:new TBoolean},
        {name:'SpriteID', type:new TOneOf([{detector:stringDetector,def:new TSpriteId},{def:new TNested(actionSpriteIdScheme)}])},
        {name:'TestTile', type:new TNested(actionTestTileScheme)},
    ],
    Constructions:[
        {name:'ID', type:new TString},
        {name:'Type', type:new TString},
        {name:'Sprites', type:new TNested(constructionsSpritesScheme)},
        {name:'Rotation', type:new TBoolean},
        {name:'Components', type:new TNested(constructionComponentsScheme)},
        {name:'IntermediateSprites', type:new TNested(constructionsIntermediateSpritesScheme)},
    ],
    ConstructionTypes:[
        {name:'ID', type:new TString},
    ],
    Crafts:[
        {name:'ID', type:new TString},
        {name:'ItemID', type:new TTableRef('Items')},
        {name:'SkillID', type:new TTableRef('Skills')},
        {name:'ProductionTime', type:new TNumber},
        {name:'AttributeUsed', type:new TOneOf([{detector:stringDetector,def:new TString}, {def:new TArrayOf(new TString)}])},
        {name:'ConversionMaterial', type:new TString},
        {name:'Components', type:new TNested(craftsComponentsScheme)},
        {name:'TechGain', type:new TNested(craftsTechGainScheme)},
        {name:'SkillGain', type:new TNested(craftsSkillGainScheme)},
        {name:'Prereqs', type:new TNested(craftsPrereqsScheme)}
    ],
    Jobs:[
        {name:'ID', type:new TString},
        {name:'SkillID', type:new TTableRef('Skills')},
        {name:'WorkPosition', type:new TArrayOf(new TArrayOf(new TNumber))},
        {name:'Tasks', type:new TNested(jobsTasksScheme)},
        {name:'RequiredToolItemID', type:new TTableRef('Items')},
        {name:'RequiredToolLevel', type:new TString},
        {name:'Ticks', type:new TNumber},
        {name:'SpriteID', type:new TNested(jobsSpriteIdScheme)},
        {name:'SkillGain', type:new TString},
        {name:'TechGain', type:new TString},
    ],
    Workshops:[
        {name:'ID', type:new TString},
        {name:'Size', type:new TString},
        {name:'InputTile', type:new TString},
        {name:'OutputTile', type:new TString},
        {name:'Crafts', type:new TArrayOf(new TTableRef('Items'))},
        {name:'Components', type:new TNested(workshopsComponentsScheme)},
        {name:'TestTile', type:new TNested(workshopsTestTileScheme)},
    ],
    Items:[
        {name:'ID', type:new TString},
        {name:'Value', type:new TNumber},
        {name:'HasQuality', type:new TBoolean},
        {name:'SpriteID', type:new TSpriteId},
        {name:'StackSize', type:new TNumber},
        {name:'LightIntensity', type:new TNumber},
        {name:'DrinkValue', type:new TNumber},
        {name:'Components', type:new TNested(itemsComponentsScheme)},
    ],
    Furniture:[
        {name:'ID', type:new TString},
    ],
    Doors:[
        {name:'ID', type:new TString},
    ],
    ItemGrouping:[
        {name:'ID', type:new TString},
        {name:'Color', type:new TColor},
        {name:'ClassID', type:new TString},
        {name:'Groups', type:new TNested(itemGroupingGroupsScheme)},
    ],
    Materials:[
        {name:'ID', type:new TString},
        {name:'Name', type:new TString},
        {name:'Type', type:new TString},
        {name:'Color', type:new TColor},
        {name:'Value', type:new TNumber},
        {name:'Strength', type:new TNumber},
    ],
    TerrainMaterials:[
        {name:'ID', type:new TString},
        {name:'Type', type:new TString},
        {name:'Highest', type:new TNumber},
        {name:'Lowest', type:new TNumber},
        {name:'RequiredToolLevel', type:new TNumber},
        {name:'WallSprite', type:new TSpriteId},
        {name:'FloorSprite', type:new TSpriteId},
        {name:'ShortWallSprite', type:new TSpriteId},
    ],
    EmbeddedMaterials:[
        {name:'ID', type:new TString},
        {name:'Type', type:new TString},
        {name:'Highest', type:new TNumber},
        {name:'Lowest', type:new TNumber},
        {name:'WallSprite', type:new TSpriteId},
    ],
    MaterialToToolLevel:[
        {name:'ID', type:new TString},
        {name:'RequiredToolLevel', type:new TNumber},
        {name:'ToolLevel', type:new TNumber},
    ],
    Containers:[
        {name:'ID', type:new TString},
        {name:'Type', type:new TString},
        {name:'Buildable', type:new TBoolean},
        {name:'Capacity', type:new TNumber},
        {name:'RequireSame', type:new TBoolean},
        {name:'Sprites', type:new TNested(containersSpritesScheme)},
        {name:'Components', type:new TNested(containerComponentsScheme)},
        {name:'TestTile', type:new TNested(containerTestTileScheme)},
        {name:'AllowedItems', type:new TArrayOf(new TTableRef('Items'))},
    ],
    Gamestart:[
        {name:'Offset', type:new TString},
        {name:'Type', type:new TString},
        {name:'ItemID', type:new TTableRef('Items')},
        {name:'Components', type:new TNested(gameStartComponentsScheme)},
        {name:'MaterialID', type:new TTableRef('Materials')},
        {name:'Amount', type:new TNumber},
        {name:'Content', type:new TNested(gameStartContentScheme)},
    ],
    Tech:[
        {name:'ID', type:new TString},
    ],
    Seasons:[
        {name:'ID', type:new TString},
        {name:'NextSeason', type:new TTableRef('Seasons')},
        {name:'NumDays', type:new TNumber},
        {name:'SunRiseFirst', type:new TString},
        {name:'SunsetFirst', type:new TString},
    ],
    Time:[
        {name:'ID', type:new TString},
        {name:'Value', type:new TNumber},
    ]
}
