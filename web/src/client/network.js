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

// @ts-check

import { DBusClient } from "./dbus";

const NM_SERVICE_NAME = "org.freedesktop.NetworkManager";
const NM_IFACE = "org.freedesktop.NetworkManager";
const NM_ACTIVE_CONNECTION_IFACE = "org.freedesktop.NetworkManager.Connection.Active";
const NM_IP4CONFIG_IFACE = "org.freedesktop.NetworkManager.IP4Config";

/**
 * Enum for the active connection state values
 *
 * @readonly
 * @enum { number }
 * https://networkmanager.dev/docs/api/latest/nm-dbus-types.html#NMActiveConnectionState
 */
const CONNECTION_STATE = {
  UNKWOWN: 0,
  ACTIVATING: 1,
  ACTIVATED: 2,
  DEACTIVATING: 3,
  DEACTIVATED: 4
};

// TODO: document
const CONNECTION_TYPES = {
  ETHERNET: "802-3-ethernet",
  WIFI: "802-11-wireless"
};

/**
 * @typedef {object} IPAddress
 * @property {string} address - like "129.168.1.2"
 * @property {string} prefix - like "16"
 */

/**
 * @typedef {object} Connection
 * @property {string} id
 * @property {string} path
 * @property {string} type
 * @property {number} state
 * @property {IPAddress[]} addresses
 */

/** @typedef {(conns: Connection[]) => void} ConnectionFn */
/** @typedef {(conns: string[]) => void} ConnectionPathsFn */

/**
 * @typedef {object} Handlers
 * @property {ConnectionFn[]} connectionAdded
 * @property {ConnectionFn[]} connectionRemoved
 * @property {ConnectionFn[]} connectionUpdated
 */

/**
 * Network client
 */
class NetworkClient {
  /**
   * @param {DBusClient} [dbusClient] - D-Bus client
   */
  constructor(dbusClient) {
    this.client = dbusClient || new DBusClient(NM_SERVICE_NAME);
    /** @type {!boolean} */
    this.subscribed = false;
    /** @type {string[]} */
    this.connectionsPaths = [];
    /** @type {Handlers} */
    this.handlers = {
      connectionAdded: [],
      connectionRemoved: [],
      connectionUpdated: []
    };
  }

  /**
   * Returns IP config overview - addresses and hostname
   * @return {Promise.<{ addresses: IPAddress[], hostname: string}>}
   */
  async config() {
    return {
      addresses: await this.addresses(),
      hostname: await this.hostname()
    };
  }

  /**
   * Registers a callback to run when a given event happens
   *
   * @property {"connectionAdded" | "connectionRemoved" | "connectionUpdated"} event
   * @property {ConnectionFn} handler - the callback to be executed
   * @return {function} a function to remove the callback
   */
  listen(event, handler) {
    if (!this.subscribed) {
      // FIXME: when/where should we unsubscribe?
      this.subscribe();
    }

    this.handlers[event].push(handler);
    return () => {
      this.handlers[event].filter(h => h !== handler);
    };
  }

  /**
   * FIXME: improve this documentation
   * Starts listening changes on active connections
   *
   * @private
   * @returns {void}
   */
  async subscribe() {
    this.susbcribed = true;
    this.connectionsPaths = await this.activeConnectionsPaths();

    this.client.onSignal(
      { interface: "org.freedesktop.NetworkManager.Connection.Active", member: "StateChanged" },
      (path, iface, signal, args) => {
        this.notifyConnectionUpdated(path);
      }
    );

    return this.client.onObjectChanged(
      "/org/freedesktop/NetworkManager",
      "org.freedesktop.NetworkManager",
      (changes, invalid) => {
        if ("ActiveConnections" in changes) {
          const oldActiveConnections = this.connectionsPaths;
          this.connectionsPaths = changes.ActiveConnections.v;
          const addedConnections = this.connectionsPaths.filter(
            c => !oldActiveConnections.includes(c)
          );
          const removedConnections = oldActiveConnections.filter(
            c => !this.connectionsPaths.includes(c)
          );
          if (addedConnections.length) this.notifyAddedConnections(addedConnections);
          if (removedConnections.length) this.notifyRemovedConnections(removedConnections);
        }
      }
    );
  }

  /**
   * When a connection is updated it calls all the subscribed handlers with the updated connection
   *
   * @private
   * @property {string} path
   * @returns {void}
   */
  async notifyConnectionUpdated(path) {
    const connection = await this.connection(path);
    this.handlers.connectionUpdated.forEach(handler => handler(connection));
  }

  /**
   * When a new connection is added it calls all the subscribed handlers with the added connections
   * Notifies subscribed handlers when a connection is added
   *
   * @private
   * @property {string[]} connectionsPaths
   * @returns {void}
   */
  notifyAddedConnections(connectionsPaths) {
    // FIXME: optimize this
    const promises = connectionsPaths.map(path => this.connection(path));
    Promise.all(promises).then(conns => {
      this.handlers.connectionAdded.forEach(handler => handler(conns));
    });
  }

  /**
   * When a connection is removed it calls all the subscribed handlers with the removed connections
   *
   * @private
   * @property {string[]} connectionsPaths
   * @returns {void}
   */
  notifyRemovedConnections(connectionsPaths) {
    this.handlers.connectionRemoved.forEach(handler => handler(connectionsPaths));
  }

  /**
   *
   * @property {string} path
   * @returns {Promise.<Connection>}
   */
  async connection(path) {
    const connection = await this.client.proxy(NM_ACTIVE_CONNECTION_IFACE, path);
    let addresses = [];

    if (connection.State === CONNECTION_STATE.ACTIVATED) {
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

  /**
   * @returns { Promise.<Connection[]> }
   */
  async activeConnections() {
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
   * @returns { Promise.<string> }
   *
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.Settings.html
   */
  async hostname() {
    const proxy = await this.client.proxy(NM_IFACE + ".Settings");
    return proxy.Hostname;
  }

  /*
   * Returns the list of active NM connections paths
   *
   * @returns { Promise.<string[]> }
   *
   * Private method.
   * See NM API documentation for details.
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.html
   */
  async activeConnectionsPaths() {
    const proxy = await this.client.proxy(NM_IFACE);

    return proxy.ActiveConnections;
  }

  /*
   * Returns NM IP config for the particular connection
   *
   * @private
   * See NM API documentation for details
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.Connection.Active.html
   * https://developer-old.gnome.org/NetworkManager/stable/gdbus-org.freedesktop.NetworkManager.IP4Config.html
   *
   * FIXME: improve type of data
   * @property {*} data
   * @returns {Promise.<IPAddress>}
   */
  connectionIPAddress(data) {
    return { address: data.address.v, prefix: data.prefix.v };
  }

  /*
   * Returns list of IP addresses for all active NM connections
   *
   * @private
   * @return {Promise.<IPAddress[]>}
   */
  async addresses() {
    const conns = await this.activeConnections();
    return conns.flatMap(c => c.addresses);
  }
}

export { CONNECTION_STATE, CONNECTION_TYPES, NetworkClient };
