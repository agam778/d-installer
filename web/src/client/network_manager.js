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

const CONNECTION_TYPES = {
  ETHERNET: "802-3-ethernet",
  WIRELESS: "802-11-wireless"
};

export class NetworkManager {
  connections = {};
  subscriptions = [];

  constructor(networkClient) {
    this.subscriptions = [];
    this.client = networkClient;

    // TODO: delay these subscriptions until the consumer register an #onConnectionsChange
    this.client.onActiveConnectionsChange(() => this.loadConnections());
  }

  onConnectionsChange(handler) {
    this.subscriptions.push(handler);
    // Return unsubscribers
  }

  async loadConnections() {
    const conns = await this.client.activeConnections();
    conns.forEach(connection => this.addConnection(connection));
    this.triggerSubscriptions();
  }

  updateConnection(path, state) {
    this.connections[path].state = state;
    this.triggerSubscriptions();
  }

  triggerSubscriptions() {
    const data = Object.values(this.connections);

    for (const handler of this.subscriptions) {
      handler(data);
    }
  }

  addConnection(data) {
    const connection = {
      id: data.id,
      path: data.path,
      type: data.type,
      state: data.state,
      isWired: data.type === CONNECTION_TYPES.ETHERNET,
      isWifi: data.type === CONNECTION_TYPES.WIRELESS
    };

    this.client.onConnectionStateChange(connection.path, (path, state) =>
      this.updateConnection(path, state)
    );
    this.connections[connection.path] = connection;
  }
}
