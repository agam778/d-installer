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

import { DBusClient } from "./dbus";

const NM_IFACE = "org.freedesktop.NetworkManager";
const NM_ACTIVE_CONNECTION_IFACE = "org.freedesktop.NetworkManager.Connection.Active";
const NM_IP4CONFIG_IFACE = "org.freedesktop.NetworkManager.IP4Config";
const SERVICE_NAME = "org.freedesktop.NetworkManager";

/**
 * @typedef {Object} IPConfig
 * @property {IPAddress[]} addresses
 * @property {string} hostname
 */
type IPConfig = {
  addresses: IPAddress[],
  hostname: string
}

/**
 * @typedef {Object} IPAddress
 * @property {string} address - like "129.168.1.2"
 * @property {string} prefix - like "16"
 */
type IPAddress = {
  address: string,
  prefix: string
}

type Connection = {
  path: string,
  type: string,
  state: number,
  addresses: string[]
}

type ConnectionFn = (conn: Connection) => void

/**
 * Network client
 */
class NetworkClient {
  client: DBusClient;
  handlers: ConnectionFn[] = [];

  constructor() {
    this.client = new DBusClient(SERVICE_NAME);
  }

  /**
   * Returns IP config overview - addresses and hostname
   */
  async config(): Promise<IPConfig> {
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

    // TODO: document
  formattedAddress(ip: any): string {
    return `${ip.address.v}/${ip.prefix.v}`;
  }

  onConnectionChange(handler: ConnectionFn) {
    this.handlers.push(handler);
  }

  listen() {
    const signal = {
      interface: "org.freedesktop.DBus.Properties",
      path: "/org/freedesktop/NetworkManager",
      member: "PropertiesChanged",
    }

    return this.client.onSignal(signal, (...args) => {
      console.log("StateChanged!", args)
      this.handlers.forEach(handler => handler(...args));
    });
  }

  async connection(path: string): Promise<Connection> {
    const connection = await this.client.proxy(NM_ACTIVE_CONNECTION_IFACE, path);
    let addresses: string[] = [];

    if (connection.State === 2) {
      const ip4Config = await this.client.proxy(NM_IP4CONFIG_IFACE, connection.Ip4Config);
      addresses = ip4Config.AddressData.map(this.formattedAddress);
    }

    return {
      path,
      addresses,
      type: connection.Type,
      state: connection.State
    };
  }

   async activeConnections(): Promise<Connection[]> {
    const proxy = await this.client.proxy(NM_IFACE);

    let connections: Connection[] = [];

    for (const path of proxy.ActiveConnections) {
      connections = [...connections, await this.connection(path)];
    }

    return connections;
  }

  /**
   * Returns the computer's hostname
   *
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.Settings.html
   */
  async hostname(): Promise<string> {
    const proxy = await this.client.proxy(NM_IFACE + ".Settings");

    return proxy.Hostname;
  }

  /*
   * Returns list of active NM connections
   *
   * Private method.
   * See NM API documentation for details.
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.html
   */
  async #connections(): Promise<any[]> {
    const proxy = await this.client.proxy(NM_IFACE);

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
  async #address(connection): Promise<any[]> {
    const configPath = await this.client.proxy(NM_IFACE + ".Connection.Active", connection);
    const ipConfigs = await this.client.proxy(NM_IFACE + ".IP4Config", configPath.Ip4Config);

    return ipConfigs.AddressData;
  }

  /*
   * Returns list of IP addresses for all active NM connections
   *
   * Private method.
   *
   * @return {Promise.<Array>}
   */
  async #addresses(): Promise<any[]> {
    const conns = await this.#connections();

    let result = [];

    for (const i in conns) {
      const addr = await this.#address(conns[i]);
      result = [...result, ...addr];
    }

    return result;
  }
}

export { NetworkClient };
