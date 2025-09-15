const { exec } = require('child_process');
const ping = require('ping');
const os = require('os');

class NetworkScanner {
    constructor(wss) {
        this.wss = wss;
        this.devices = new Map();
        this.scanInterval = null;
    }

    // Get local network range
    getNetworkRange() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    const ip = iface.address;
                    const subnet = ip.substring(0, ip.lastIndexOf('.')) + '.';
                    return { subnet, gateway: ip };
                }
            }
        }
        return { subnet: '192.168.1.', gateway: '192.168.1.1' };
    }

    // Scan for active devices
    async scanNetwork() {
        const { subnet } = this.getNetworkRange();
        const activeDevices = [];

        console.log(`Scanning network: ${subnet}0/24`);

        // Ping sweep
        const promises = [];
        for (let i = 1; i <= 254; i++) {
            const ip = subnet + i;
            promises.push(this.pingHost(ip));
        }

        const results = await Promise.allSettled(promises);

        for (let i = 0; i < results.length; i++) {
            if (results[i].status === 'fulfilled' && results[i].value.alive) {
                const ip = subnet + (i + 1);
                const device = await this.getDeviceInfo(ip);
                activeDevices.push(device);
            }
        }

        this.updateDeviceList(activeDevices);
        return activeDevices;
    }

    async pingHost(ip) {
        try {
            const result = await ping.promise.probe(ip, { timeout: 2 });
            return result;
        } catch (error) {
            return { alive: false, host: ip };
        }
    }

    async getDeviceInfo(ip) {
        const device = {
            ip,
            hostname: 'Unknown',
            mac: 'Unknown',
            vendor: 'Unknown',
            lastSeen: new Date(),
            isNew: false
        };

        try {
            // Try to get hostname
            await new Promise((resolve) => {
                exec(`nslookup ${ip}`, (error, stdout) => {
                    if (!error && stdout) {
                        const lines = stdout.split('\n');
                        for (const line of lines) {
                            if (line.includes('name =')) {
                                device.hostname = line.split('name =')[1].trim().replace(/\.$/, '');
                                break;
                            }
                        }
                    }
                    resolve();
                });
            });

            // Try to get MAC address (works better on local network)
            await new Promise((resolve) => {
                exec(`arp -n ${ip}`, (error, stdout) => {
                    if (!error && stdout) {
                        const lines = stdout.split('\n');
                        for (const line of lines) {
                            if (line.includes(ip)) {
                                const parts = line.split(/\s+/);
                                if (parts.length >= 3) {
                                    device.mac = parts[2];
                                    break;
                                }
                            }
                        }
                    }
                    resolve();
                });
            });

        } catch (error) {
            console.log(`Error getting device info for ${ip}:`, error.message);
        }

        return device;
    }

    updateDeviceList(activeDevices) {
        const currentTime = new Date();

        // Mark existing devices as offline if not seen
        for (const [ip, device] of this.devices) {
            const timeDiff = currentTime - device.lastSeen;
            if (timeDiff > 300000) { // 5 minutes
                device.status = 'offline';
            }
        }

        // Update or add active devices
        activeDevices.forEach(device => {
            const existing = this.devices.get(device.ip);
            if (!existing) {
                device.isNew = true;
                device.status = 'online';
                console.log(`New device detected: ${device.ip} (${device.hostname})`);
            } else {
                device.isNew = false;
                device.status = 'online';
            }

            this.devices.set(device.ip, device);
        });

        // Broadcast updates via WebSocket
        this.broadcastDeviceUpdate();
    }

    broadcastDeviceUpdate() {
        const deviceList = Array.from(this.devices.values());
        const message = JSON.stringify({
            type: 'device_update',
            devices: deviceList,
            timestamp: new Date()
        });

        this.wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(message);
            }
        });
    }

    startScanning() {
        console.log('Starting network scanning...');

        // Initial scan
        this.scanNetwork();

        // Schedule regular scans every 2 minutes
        this.scanInterval = setInterval(() => {
            this.scanNetwork();
        }, 120000);
    }

    stopScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }

    getDevices() {
        return Array.from(this.devices.values());
    }
}

module.exports = NetworkScanner;