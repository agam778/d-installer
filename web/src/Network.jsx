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

import React, { useEffect, useState } from "react";
import { List, ListItem, Stack, StackItem } from "@patternfly/react-core";
import { useInstallerClient } from "./context/installer";
import { useCancellablePromise } from "./utils";

export const ETHERNET = 1;
export const WIRELESS = 2;

const DEVICE_TYPES = {
  ETHERNET,
  WIRELESS
};

// TODO: improve props once own interna device structure/representation is defined
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

const WiredConnectionStatus = ({ devices }) => {
  const connectedDevices = devices.filter(d => d.activeConnection);

  console.log("Connected WIRED devices", connectedDevices);

  if (connectedDevices.length === 0) {
    return "Wired not connnected";
  }

  return `Wired connected - ${connectedDevices.flatMap(d => d.addresses).join(", ")}`;
};

const WiFiConnectionStatus = ({ devices }) => {
  const connectedDevices = devices.filter(d => d.activeConnection);

  console.log("Connected WiFi devices", connectedDevices);

  if (connectedDevices.length === 0) {
    return "WiFi not connnected";
  }

  return `WiFi connected - ${connectedDevices.flatMap(d => d.addresses).join(", ")}`;
};

export default function Network() {
  const client = useInstallerClient();
  const { cancellablePromise } = useCancellablePromise();
  const [wiredDevices, setWiredDevices] = useState([]);
  const [wifiDevices, setWifiDevices] = useState([]);
  const [devices, setDevices] = useState([]);
  //const [connections, setConnections] = useState([]);

  useEffect(() => {
    cancellablePromise(client.network.devices()).then(setDevices);
    // client.network.activeConnections().then(setConnections);
    return client.network.onStateChange(async changes => {
      console.log("nm activeConnections has changed", changes);
      cancellablePromise(client.network.devices())
        .then(result => {
          console.log("GOOD", result);
          setDevices(result);
        })
        .catch(e => console.log("BAD", e));
    });
  }, [client.network, cancellablePromise]);

  return (
    <Stack className="overview-network">
      <StackItem>
        <WiredConnectionStatus devices={devices.filter(d => d.type === DEVICE_TYPES.ETHERNET)} />
      </StackItem>
      <StackItem>
        <WiFiConnectionStatus devices={devices.filter(d => d.type === DEVICE_TYPES.WIRELESS)} />
      </StackItem>
    </Stack>
  );
}
