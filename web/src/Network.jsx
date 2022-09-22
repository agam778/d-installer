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
import { Stack, StackItem } from "@patternfly/react-core";
import { useInstallerClient } from "./context/installer";

export default function Network() {
  const client = useInstallerClient();
  const [connections, setConnections] = useState([]);
  const [ifaces, setIfaces] = useState([]);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    client.network.config().then(c => {
      setDevices(c.devices);
      setIfaces(c.interfaces);
      setConnections(c.connections);
    });
  }, [client.network]);

  return (
    <Stack className="overview-network">
      <StackItem>Connections</StackItem>
      {connections.map(conn => (
        <StackItem key={conn.id}>
          {conn.id} / {conn.addresses.join(",")}
        </StackItem>
      ))}
      <StackItem>Interfaces</StackItem>
      {devices.map(device => (
        <StackItem key={device.mac}>{device.iface}</StackItem>
      ))}
    </Stack>
  );
}
