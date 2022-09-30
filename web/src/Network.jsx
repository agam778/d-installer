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

// TODO: improve props once own interna device structure/representation is defined
const NetworkDevice = ({ Interface: iface, dbusPath: deviceDbusPath, State, ...props }) => {
  const client = useInstallerClient();
  const [state, setState] = useState(State);

  const onDeviceChange = changes => {
    const { State: { v: newState } = {} } = changes;

    if (newState) setState(newState);
  };

  useEffect(() => {
    return client.network.onDeviceChange(deviceDbusPath, onDeviceChange);
  }, [client.network, deviceDbusPath]);

  const renderState = () => {
    if (!state) return null;

    if (state == "40") return "Connecting...";
    if (state == "100") return <a href="#">Connected</a>;

    return <a href="#">not connected</a>;
  };

  // Does not show devices in UNKNOWN and DISCONNECTED state by now
  if (state == 0) return null;
  if (state == 20) return null;

  return (
    <ListItem>
      {iface} {renderState()}
    </ListItem>
  );
};

export default function Network() {
  const client = useInstallerClient();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    client.network.managedDevices().then(setDevices);
    //   client.network.managedDevices().then(devices => {
    //     // We kept connected and disconnected devices only.
    //     setDevices(devices.filter(d => d.State >= 30));
    //   });
  }, [client.network]);

  return (
    <Stack className="overview-network">
      <StackItem>Devices:</StackItem>

      <StackItem>
        <List>
          {devices.map(device => (
            <NetworkDevice key={device.Interface} {...device} />
          ))}
        </List>
      </StackItem>
    </Stack>
  );
}
