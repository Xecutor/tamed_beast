export function caseInsensetiveFilter(value:string, filter:string) {
    if(filter.substr(0,1)=='!') {
        filter=filter.substr(1)
        return value.toUpperCase().indexOf(filter.toUpperCase())<0
    }
    return value.toUpperCase().indexOf(filter.toUpperCase())>=0
}
