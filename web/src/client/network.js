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

const NM_IFACE = "org.freedesktop.NetworkManager";

/**
 * Network client
 */
class NetworkClient {
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
    const conns = await this.#connections();
    const addresses = conns.map(c => c.ip4.map(ip => ip.address).join(","));

    return {
      addresses,
      devices: await this.devices(),
      interfaces: await this.interfaces(),
      connections: conns,
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

  async devices() {
    const proxy = await this.proxy(NM_IFACE);

    let devices = [];

    for (const devicePath of proxy.AllDevices) {
      const device = await this.proxy(`${NM_IFACE}.Device`, devicePath);

      devices = [
        ...devices,
        {
          dbusPath: devicePath,
          iface: device.Interface,
          mac: device.HwAddress
        }
      ];
    }

    return devices;
  }

  async interfaces() {
    const d = await this.devices();

    return d.map(device => device.iface);

    // let result = [];
    //
    // // for (const device of this.#devices()) {
    //   const device = await this.proxy(`${NM_IFACE}.Device`, devicePath);
    //   result = [...result, device.Interface];
    // }
    //
    // return result;
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

    let conns = [];

    for (const connectionPath of proxy.ActiveConnections) {
      const connection = await this.proxy(`${NM_IFACE}.Connection.Active`, connectionPath);

      conns = [
        ...conns,
        {
          id: connection.Id,
          devices: connection.Devices,
          ip4: await this.#address(connection.Ip4Config),
          configPaths: {
            ip4: connection.Ip4Config,
            ip6: connection.Ip6Config
          }
        }
      ];
    }

    return conns;
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
  async #address(path) {
    const { AddressData } = await this.proxy(NM_IFACE + ".IP4Config", path);
    return AddressData;
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
    return conns.map(c => c.ip4);

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
