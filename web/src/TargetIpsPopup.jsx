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
import { useInstallerClient } from "./context/installer";
import Popup from "./Popup";
import { Button, List, ListItem, Text } from "@patternfly/react-core";

function formatIp(addr) {
  return addr.address + "/" + addr.prefix;
}

export default function TargetIpsPopup() {
  const client = useInstallerClient();
  const [addresses, setAddresses] = useState([]);
  const [hostname, setHostname] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    client.network.config().then(data => {
      console.log(data);
      setHostname(data.hostname);
      setAddresses(data.addresses);
    });

    // FIXME: If we want to have this component "subscribed" to active
    // connections changes too, it should "listen" changes in connections and
    // work with them instead of asking for current network#config. Why? to
    // avoid extra requests to DBus
    // For this example, let's just reload the configuration to see it in action
    const reloadConfig = (...args) => {
      client.network.config().then(data => {
        console.log(data);
        setHostname(data.hostname);
        setAddresses(data.addresses);
      });
    };
    const f1 = client.network.listen("connectionAdded", reloadConfig);
    const f2 = client.network.listen("connectionRemoved", reloadConfig);
    const f3 = client.network.listen("connectionUpdated", reloadConfig);
    // Read above ^^^
    // Additional question: are we going to keep that component once we have a
    // Networking section in the summary?
  }, [client.network]);

  const ips = addresses.map(formatIp);
  let label = ips[0];
  let title = "IP addresses";

  if (hostname) {
    label += ` (${hostname})`;
    title += ` for ${hostname}`;
  }

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  if (addresses.length === 0) return null;

  if (ips.length === 1)
    return (
      <Text component="small" className="host-ip">
        {label}
      </Text>
    );

  return (
    <>
      <Button variant="link" onClick={open}>
        {label}
      </Button>

      <Popup isOpen={isOpen} title={title}>
        <List>
          {ips.map(ip => (
            <ListItem key={ip}>{ip}</ListItem>
          ))}
        </List>
        <Popup.Actions>
          <Popup.Confirm onClick={close} autoFocus>
            Close
          </Popup.Confirm>
        </Popup.Actions>
      </Popup>
    </>
  );
}
