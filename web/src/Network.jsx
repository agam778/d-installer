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

const NetworkDevice = ({ Interface: iface, dbusPath: deviceDbusPath, ...props }) => {
  const client = useInstallerClient();

  console.log(`Props for ${iface}`, props);

  const noop = () => {};

  useEffect(() => {
    return client.network.onDeviceChange(deviceDbusPath, noop);
  }, [client.network]);

  return <li>{iface}</li>;
};

export default function Network() {
  const client = useInstallerClient();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    client.network.connectedAndActiveDevices().then(setDevices);
  }, [client.network]);

  // useEffect(() => {
  //   const noop = (...args) => {
  //     console.log("args", args);
  //   };
  //   return client.network.onStateChange(dbusPath, noop);
  // }, [client.network]);

  const renderDevices = () => {
    return devices.map(device => <NetworkDevice {...device} />);
  };

  return (
    <Stack className="overview-network">
      <StackItem>
        Wired <a href="#">connected</a> (127.0.0.1)
      </StackItem>
      <StackItem>
        Wifi <a href="#">not connected</a>
      </StackItem>
      <StackItem>Devices</StackItem>
      <StackItem>
        <ul>{renderDevices()}</ul>
      </StackItem>
    </Stack>
  );
}
