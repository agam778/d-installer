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

const WiFiConnectionStatus = ({ connections }) => {
  const state = connections.map(c => c.state).join(", ");

  if (connections.length === 0) {
    return (
      <>
        ({state}) Wifi <a href="#">not connected</a>
      </>
    );
  }

  // TODO: show the SSID
  return (
    <>
      ({state}) WiFi connected {connections.flatMap(c => c.addresses).join(", ")};
    </>
  );
};

export default function Network() {
  const client = useInstallerClient();
  const { cancellablePromise } = useCancellablePromise();
  const [connections, setConnections] = useState(undefined);

  useEffect(() => {
    // TODO: FIXME: Something like ....
    //   client.network.connections(setConnection);
    //   return client.network.onConnectionsChange(() => {
    //     // change the state acccordingly
    //   });

    const loadConnections = async () => {
      console.log("reloading connections");
      cancellablePromise(client.network.activeConnections())
        .then(setConnections)
        .catch(e => console.log("Something went wrong", e));
    };

    loadConnections();
    // client.network.activeConnections().then(setConnections);
    // return client.network.onStateChange(async changes => {
    return client.network.onStateChange(changes => {
      console.log("An active connection has changed", changes);
      loadConnections();
    });
  }, [client.network, cancellablePromise]);

  console.log("connections", connections);
  if (!connections) {
    return "Retrieving network information...";
  }

  const activeWiredConnections = connections.filter(c => c.type === CONNECTION_TYPES.ETHERNET);
  const activeWifiConnections = connections.filter(c => c.type === CONNECTION_TYPES.WIFI);

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
