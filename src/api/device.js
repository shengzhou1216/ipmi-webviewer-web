import request from '@/utils/request'

export function getDevices(){
    return request({
        url: 'devices/',
        method: 'get',
    })
}

export function scan(network){
    return request({
        url: 'scan/',
        method: 'post',
        data: {
            network
        }
    })
}

export function powerctl(data){
    return request({
        url: 'powerctl/',
        method: 'post',
        data
    })
}

export function powerctl_patch(data){
    return request({
        url: 'powerctl_patch/',
        method: 'post',
        data
    })
}
export function getPowerStatus(data){
    return request({
        url: 'power_status/',
        method: 'post',
        data
    })
}

export function updateUsernameAndPassword(data){
    return request({
        url: 'credentials/',
        method: 'post',
        data
    })
}

export function getDeviceTemperature(ip){
    return request({
        url: `${ip}/temperature/`,
        method: 'get'
    })
}