import * as React from "react";

import {StringRenderer, TableRefRenderer, ColorRenderer, NestedTableRenderer, TileRenderer} from '../components/data-renderers'

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
        return <StringRenderer value={typeof(value)==='number'?value.toString():''}/>
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
        return <TableRefRenderer id={value}/>
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

class TTileId implements TypeDef {
    constructor(public transform?:(val:string)=>string) {
    }
    renderValue(value:string) {
        return <TileRenderer id={this.transform?this.transform(value):value} />
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
    {name:'ThoughtBubble', type: new TTileId((id)=>'Status'+id)},
    {name:'Modifiers', type: new TNested(stateModifierScheme)},
    {name:'Action', type:new TString}
]

const plantsStatesScheme=[
    {name:'ID', type:new TString},
    {name:'SpriteID', type:new TTileId},
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
    {name:'SpriteID', type:new TTileId},
    {name:'Offset', type:new TString},
    {name:'Rotation', type:new TString}
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
        {name:'SpriteID', type:new TTileId},
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
}
