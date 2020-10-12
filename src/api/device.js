import request from '@/utils/request'

export function getDevices(){
    return request({
        url: 'devices',
        method: 'get',
    })
}