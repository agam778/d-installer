/*
 * Copyright (c) [2022] SUSE LLC
 *
 * All Rights Reserved.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of version 2 of the GNU General Public License as published
 * by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, contact SUSE LLC.
 *
 * To contact SUSE LLC about this file by physical or electronic mail, you may
 * find current contact information at www.suse.com.
 */

import { applyMixin, withDBus } from "./mixins";

const NM_PATH = "/org/freedesktop/NetworkManager";
const NM_IFACE = "org.freedesktop.NetworkManager";
const NM_DEVICE_IFACE = "org.freedesktop.NetworkManager.Device";
const NM_ACTIVE_CONNECTION_IFACE = "org.freedesktop.NetworkManager.Connection.Active";

/**
 * Network client */ class NetworkClient {
  constructor(dbusClient) {
    this._client = dbusClient;
  }

  /**
   * @typedef {Object} IPAddress
   * @property {string} address - like "129.168.1.2"
   * @property {string} prefix - like "16"
   */
  /**
   * @typedef {Object} IPConfig
   * @property {IPAddress[]} addresses
   * @property {string} hostname
   */

  /**
   * Returns IP config overview - addresses and hostname
   * @return {Promise.<IPConfig>}
   */
  async config() {
    const data = await this.#addresses();
    const addresses = data.map(a => {
      return {
        address: a.address.v,
        prefix: a.prefix.v
      };
    });

    return {
      addresses,
      hostname: await this.hostname()
    };
  }

  /**
   * Returns the computer's hostname
   *
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.Settings.html
   *
   * @return {Promise.<String>}
   */
  async hostname() {
    const proxy = await this.proxy(NM_IFACE + ".Settings");

    return proxy.Hostname;
  }

  // TODO: document
  formattedAddress(ip) {
    return `${ip.address.v}/${ip.prefix.v}`;
  }

  async wiredDevices() {
    const devices = await this.devices();
    return devices.filter(d => d.type === 1);
  }

  // TODO: document
  async devices() {
    const proxy = await this.proxy(NM_IFACE);
    let devices = [];

    for (const path of proxy.Devices) {
      let ipAddresses = [];

      const device = await this.proxy(NM_DEVICE_IFACE, path);
      const activeConnectionPath = device.ActiveConnection;
      const activeConnection = activeConnectionPath !== "/";

      if (activeConnection) {
        const addresses = await this.#address(activeConnectionPath);
        ipAddresses = addresses.map(a => this.formattedAddress(a));
      }

      const d = {
        path,
        activeConnection,
        activeConnectionPath,
        addresses: ipAddresses,
        iface: device.Interface,
        type: device.DeviceType,
        managed: device.Managed
      };

      devices = [...devices, d];
    }

    return devices;
  }

  // TODO: document
  async managedDevices() {
    const devices = await this.devices();
    return devices.filter(device => device.managed);
  }

  /**
   * Register a callback to run when properties in NetworkManager object change
   *
   * @param {function} handler - callback function
   */
  onActiveConnectionsChange(handler) {
    return this.onObjectChanged(NM_PATH, NM_IFACE, changes => {
      if ("ActiveConnections" in changes) {
        handler(changes.ActiveConnections.v);
      }
    });
  }

  /**
   * Register a callback to run when properties in NetworkManager object change
   *
   * @param {function} handler - callback function
   */
  onDevicesChange(handler) {
    return this.onObjectChanged(NM_PATH, NM_IFACE, changes => {
      if ("Devices" in changes) {
        handler(changes.Devices);
      }
    });
  }

  /**
   * Register a callback to run when properties in NetworkManager object change
   *
   * @param {function} handler - callback function
   */
  onStateChange(handler) {
    return this.onObjectChanged(NM_PATH, NM_IFACE, changes => {
      console.log("Something in NetworkManager has changed", changes);
      handler(changes);
    });
  }

  // getDevices();
  // [{
  //   path:,
  //   iface:,
  //   type:,
  //   ...
  // }]
  // getActiveConnections();
  // {
  //   path:,
  //   devicesPaths: ["",""],
  // }
  //
  //
  // ethernetConnected = () => {
  //   const lanDevices = getDevices().filter(d => d.type === NM_LAN).map(d => d.path);
  //   const connectedDevices = getActiveConnections().flatmap(c => c.devicesPath);
  //
  //   return lanDevices & connectedDevices;
  // }
  //
  //
  // wifiConnected = () => {
  //   const lanDevices = getDevices().filter(d => d.type === NM_WIFI).map(d => d.path);
  //   const connectedDevices = getActiveConnections().flatmap(c => c.devicesPath);
  //
  //   return lanDevices & connectedDevices;
  // }
  //

  // TODO: document
  async activeConnections() {
    const paths = await this.#connections();
    let connections = [];

    for (const path of paths) {
      const connection = await this.proxy(NM_ACTIVE_CONNECTION_IFACE, path);

      connections = [
        ...connections,
        {
          path,
          devicesPaths: connection.Devices,
          address: this.#address(path)
        }
      ];
    }

    return connections;
  }

  /**
   * Register a callback to run when properties for a device matching given
   * device path changes
   *
   * @property {string} devicePath - like "/org/freedesktop/NetworManager/Devices/1"
   * @param {function} handler - callback function
   */
  onDeviceChange(devicePath, handler) {
    return this.onObjectChanged(devicePath, NM_DEVICE_IFACE, changes => {
      handler(changes);
    });
  }

  /*
   * Returns list of active NM connections
   *
   * Private method.
   * See NM API documentation for details.
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.html
   *
   * @return {Promise.<Array>}
   */
  async #connections() {
    const proxy = await this.proxy(NM_IFACE);

    return proxy.ActiveConnections;
  }

  /*
   * Returns NM IP config for the particular connection
   *
   * Private method.
   * See NM API documentation for details
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.Connection.Active.html
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.IP4Config.html
   *
   * @return {Promise.<Map>}
   */
  async #address(connection) {
    const configPath = await this.proxy(NM_IFACE + ".Connection.Active", connection);
    const ipConfigs = await this.proxy(NM_IFACE + ".IP4Config", configPath.Ip4Config);

    return ipConfigs.AddressData;
  }

  /*
   * Returns list of IP addresses for all active NM connections
   *
   * Private method.
   *
   * @return {Promise.<Array>}
   */
  async #addresses() {
    const conns = await this.#connections();

    let result = [];

    for (const i in conns) {
      const addr = await this.#address(conns[i]);
      result = [...result, ...addr];
    }

    return result;
  }
}

applyMixin(NetworkClient, withDBus);
export default NetworkClient;
