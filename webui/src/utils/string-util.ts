export function caseInsensetiveFilter(value:string, filter:string) {
    return value.toUpperCase().indexOf(filter.toUpperCase())>=0
}