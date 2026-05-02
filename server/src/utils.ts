import os from 'os';

export function getIPAddress() {
    const interfaces = os.networkInterfaces();
    let ipAddress = 'localhost';

    for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName];
        if (!interfaceInfo) continue;
        if (
            interfaceName.includes('Wi-Fi') ||
            interfaceName.includes('Wireless')
        ) {
            for (const iface of interfaceInfo) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    return ipAddress;
}
