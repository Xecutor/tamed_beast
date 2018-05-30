import * as React from "react";
import * as ReactDOM from "react-dom";

import {Segment, List, Pagination, Label, Input, Dropdown} from 'semantic-ui-react'

interface FilteredListState{
    filter:string
    page:number
}

interface FilteredListProps<T>{
    data:Array<T>
    pageSize?:number
    inverted?:boolean
    simple?:boolean
    filterItem:(val:T, filter:string)=>boolean
    onClick:(val:T)=>void
    getItemImageURL?:(val:T)=>string
    getItemText:(val:T)=>string
}

const defaultPageSize = 20

export class FilteredList<T> extends React.Component<FilteredListProps<T>, FilteredListState>{
    constructor(props:FilteredListProps<T>) {
        super(props)
        this.state = {
            filter:'',
            page:1
        }
    }
    onFilterChange(filter:string) {
        this.setState({filter})
    }
    
    onPageChange(page:number) {
        this.setState({page})
    }

    pageSize() {
        return this.props.pageSize?this.props.pageSize:defaultPageSize
    }

    render() {
        let fltFunc = this.props.filterItem
        let fltVal = this.state.filter
        let lst = this.props.data.filter((val:T)=>fltFunc(val, fltVal))
        let pageSize = this.pageSize()
        
        let pages = Math.floor(lst.length/pageSize)
        if (pages * pageSize != lst.length) {
            ++pages;
        }
        let page = this.state.page
        if (page > pages) {
            page = pages
        }

        lst = lst.slice((page-1)*pageSize, page*pageSize)

        let paginator
        if(pages>1) {
            paginator=<Pagination 
                    inverted={this.props.inverted}
                    totalPages={pages}
                    activePage={page}
                    firstItem={null}
                    lastItem={null}
                    ellipsisItem={null}
                    boundaryRange={0}
                    pointing
                    secondary
                    onPageChange={(e,{activePage})=>this.onPageChange(activePage as number)}/>
        }

        let getImg=this.props.getItemImageURL
        let getTxt=this.props.getItemText
        let onClick=this.props.onClick

        return <Segment basic={this.props.simple} inverted={this.props.inverted}>
            <Input
                inverted={this.props.inverted}
                icon='search'
                value={this.state.filter}
                onChange={(e,{value})=>this.onFilterChange(value)}/>
            <br/>
            {paginator}
            <List selection inverted={this.props.inverted}>
                {
                    lst.map(val=><List.Item 
                                    style={{minHeight:'32px'}} 
                                    as='a'
                                    key={getTxt(val)}
                                    image={getImg?getImg(val):undefined}
                                    content={getTxt(val)}
                                    onClick={()=>onClick(val)}/>
                            )
                }
            </List>
        </Segment>
    }
}