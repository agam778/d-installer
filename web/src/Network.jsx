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

// TODO: copy/pasted from TargetIpsPopup, should we move it to utils or so?
function formatIp(addr) {
  return addr.address + "/" + addr.prefix;
}

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
  const conns = connections.filter(c => c.state === 2);

  if (conns.length === 0) {
    return "Wired not connnected";
  }

  return `Wired connected - ${conns.map(c => c.addresses.map(formatIp)).join(", ")} ${conns.map(
    c => c.id
  )}`;
};

const WiFiConnectionStatus = ({ connections, onClick }) => {
  const conns = connections.filter(c => c.state === 2);

  if (conns.length === 0 && connections.length > 0) {
    return <>There is at least a WiFi connection active.</>;
  }

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
  return (
    <>
      WiFi connected {conns.map(c => c.addresses.map(formatIp)).join(", ")} {conns.map(c => c.id)}
    </>
  );
};

export default function Network() {
  const client = useInstallerClient();
  const [connections, setConnections] = useState([]);

  // ¿Tendre que obtener las conexiones inicialmente, no?
  // Si me subscribo mas tarde solo voy a obtener las nuevas
  // que se han añadido o me equivoco?
  useEffect(() => {
    const loadConnections = async () => {
      const conns = await client.network.activeConnections();

      setConnections(conns);
    };

    const onConnectionAdded = connections => {
      setConnections(conns => [...conns, ...connections]);
    };

    const onConnectionRemoved = connectionPaths => {
      setConnections(conns => conns.filter(c => !connectionPaths.includes(c.path)));
    };

    const onConnectionUpdated = connection => {
      setConnections(conns => {
        const newConnections = conns.filter(c => c.path !== connection.path);
        return [...newConnections, connection];
      });
    };

    const f1 = client.network.listen("connectionAdded", onConnectionAdded);
    const f2 = client.network.listen("connectionRemoved", onConnectionRemoved);
    const f3 = client.network.listen("connectionUpdated", onConnectionUpdated);

    loadConnections();

    return () => {
      f1();
      f2();
      f3();
    };
  }, [client.network]);

  if (!connections) {
    return "Retrieving network information...";
  }

  console.log("connections are", connections);

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
