export type Settings = {
    pageSize:number
}

const defaultSettings : Settings = {
    pageSize:20
}

export function getSettings():Settings {
    let settingsJson = localStorage.getItem('settings')
    if(!settingsJson) {
        return {...defaultSettings}
    }
    let settings : Settings = JSON.parse(settingsJson)
    return settings
}

export function storeSettings(settings:Settings) {
    localStorage.setItem('settings', JSON.stringify(settings))
}

export function updateSetting<K extends keyof(Settings)>(key:K, value:Settings[K]) {
    let settings = getSettings()
    settings[key] = value
    storeSettings(settings)
}
