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
  id: string,
  path: string,
  type: string,
  state: number,
  addresses: IPAddress[]
}

type ConnectionFn = (conns: Connection[]) => void
type ConnectionPathsFn = (conns: string[]) => void

type Handlers = {
  connectionAdded: ConnectionFn[],
  connectionRemoved: ConnectionFn[],
  connectionUpdated: ConnectionFn[]
}

/**
 * Network client
 */
class NetworkClient {
  client: DBusClient;
  subscribed: boolean = false;
  connectionsPaths: string[] = [];
  handlers: Handlers = {
    connectionAdded: [],
    connectionRemoved: [],
    connectionUpdated: [],
  }

  constructor() {
    this.client = new DBusClient(SERVICE_NAME);
  }

  /**
   * Returns IP config overview - addresses and hostname
   */
  async config(): Promise<IPConfig> {
    return {
      addresses: await this.addresses(),
      hostname: await this.hostname()
    };
  }

  listen(event: "connectionAdded" | "connectionRemoved" | "connectionUpdated", handler) {
    if (!this.subscribed) {
      // FIXME: when/where should we unsubscribe?
      this.subscribe();
    }

    this.handlers[event].push(handler);
    return () => { this.handlers[event].filter(h => h !== handler) }
  }

  async subscribe() {
    this.susbcribed = true;
    this.connectionsPaths = await this.activeConnectionsPaths(); 

    this.client.onSignal({ interface: "org.freedesktop.NetworkManager.Connection.Active", member: "StateChanged" }, (path, iface, signal, args) => {
      this.notifyConnectionUpdated(path);
    });

    return this.client.onObjectChanged("/org/freedesktop/NetworkManager", "org.freedesktop.NetworkManager", (changes: DBusChanges, invalid?: string[]) => {
      if ("ActiveConnections" in changes) {
        const oldActiveConnections = this.connectionsPaths;
        this.connectionsPaths = changes.ActiveConnections.v;
        
        const addedConnections = this.connectionsPaths.filter(c => !oldActiveConnections.includes(c));
        const removedConnections = oldActiveConnections.filter(c => !this.connectionsPaths.includes(c));
        if (addedConnections.length) this.notifyAddedConnections(addedConnections);
        if (removedConnections.length) this.notifyRemovedConnections(removedConnections);
      }
    })
  }

  private async notifyConnectionUpdated(path: string): Connection {
    const connection = await this.connection(path);
    this.handlers.connectionUpdated.forEach(handler => handler(connection));
  }

  private notifyAddedConnections(connections: string[]) {
    // FIXME: optimize this
    const promises = connections.map(path => this.connection(path));
    Promise.all(promises).then(conns => {
      this.handlers.connectionAdded.forEach(handler => handler(conns))
    });
  }

  private notifyRemovedConnections(connections: string[]) {
    this.handlers.connectionRemoved.forEach(handler => handler(connections));
  }

  async connection(path: string): Promise<Connection> {
    const connection = await this.client.proxy(NM_ACTIVE_CONNECTION_IFACE, path);
    let addresses: string[] = [];

    if (connection.State === 2) {
      const ip4Config = await this.client.proxy(NM_IP4CONFIG_IFACE, connection.Ip4Config);
      addresses = ip4Config.AddressData.map(this.connectionIPAddress);
    }

    return {
      id: connection.Id,
      path,
      addresses,
      type: connection.Type,
      state: connection.State
    };
  }

  async activeConnections(): Promise<Connection[]> {
    let connections = [];
    const paths = await this.activeConnectionsPaths();

    for (const path of paths) {
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
  private async activeConnectionsPaths(): Promise<string[]> {
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

  private connectionIPAddress(data: any): IPAddress {
    return { address: data.address.v, prefix: data.prefix.v }
  }

  /*
   * Returns list of IP addresses for all active NM connections
   *
   * Private method.
   *
   * @return {Promise.<Array>}
   */
  private async addresses(): IPAddress[] {
    const conns = await this.activeConnections();
    return conns.flatMap(c => c.addresses)
  }
}

export { NetworkClient };
