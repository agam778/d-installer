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

import React, { useEffect, useState, useMemo } from "react";
import { List, ListItem, Stack, StackItem } from "@patternfly/react-core";
import { useInstallerClient } from "./context/installer";
import { useCancellablePromise } from "./utils";
import { NetworkManager } from "./client/network_manager";

const ETHERNET = 1;
const WIRELESS = 2;

const DEVICE_TYPES = {
  ETHERNET,
  WIRELESS
};

const CONNECTION_TYPES = {
  ETHERNET: "802-3-ethernet",
  WIFI: "802-11-wireless"
};

// TODO: improve props once own internal device structure/representation is defined
const NetworkDevice = ({ Interface: iface, dbusPath: deviceDbusPath, State, ...props }) => {
  const client = useInstallerClient();
  const [state, setState] = useState(State);

  const onDeviceChange = changes => {
    const { State: { v: newState } = {} } = changes;

    if (newState) setState(newState);
  };

  useEffect(() => {
    // TODO: Unsuscribe also if a device change its state to 0, 10, or 20
    return client.network.onDeviceChange(deviceDbusPath, onDeviceChange);
  }, [client.network, deviceDbusPath]);

  const renderState = () => {
    if (!state) return null;

    if (state == "40") return "Connecting...";
    if (state == "100") return <a href="#">Connected</a>;

    return <a href="#">not connected ({state})</a>;
  };

  // Does not show devices in UNKNOWN, UNMANAGED, AND UNAVAILABLE states
  if ([0, 10, 20].includes(state)) return null;

  return (
    <ListItem>
      {iface} {renderState()}
    </ListItem>
  );
};

const WiredConnectionStatus = ({ connections }) => {
  if (connections.length === 0) {
    return "Wired not connnected";
  }

  return `Wired connected - ${connections.flatMap(c => c.addresses).join(", ")}`;
};

const WiFiConnectionStatus = ({ connections, onClick }) => {
  const conns = connections.filter(c => c.state === 2);

  if (conns.length === 0) {
    return (
      <>
        Wifi{" "}
        <a href="#" onClick={onClick}>
          not connected
        </a>
      </>
    );
  }

  // TODO: show the SSID
  return <>WiFi connected {conns.flatMap(c => c.addresses).join(", ")}</>;
};

export default function Network() {
  const client = useInstallerClient();
  const [connections, setConnections] = useState();

  useEffect(() => {
    const manager = new NetworkManager(client.network);
    manager.onConnectionsChange(setConnections);
  }, [client.network]);

  if (!connections) {
    return "Retrieving network information...";
  }

  const activeWiredConnections = connections.filter(c => c.isWired); // c.type === CONNECTION_TYPES.ETHERNET);
  const activeWifiConnections = connections.filter(c => c.isWifi); // c.type === CONNECTION_TYPES.WIFI);

  return (
    <Stack className="overview-network">
      <StackItem>
        <WiredConnectionStatus connections={activeWiredConnections} />
      </StackItem>
      <StackItem>
        <WiFiConnectionStatus connections={activeWifiConnections} />
      </StackItem>
    </Stack>
  );
}
