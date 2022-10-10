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

import React from "react";
import { List, ListItem } from "@patternfly/react-core";
import { CONNECTION_STATE } from "./client/network";

// TODO: copy/pasted from TargetIpsPopup, should we move it to utils or so?
function formatIp(addr) {
  return addr.address + "/" + addr.prefix;
}

const renderConnections = conns => {
  return conns.map(connection => {
    return (
      <ListItem key={connection.path}>
        {connection.id} - {connection.addresses.map(formatIp).join(", ")}
      </ListItem>
    );
  });
};

export default function NetworkWiFiStatus({ connections }) {
  const conns = connections.filter(c => c.state === CONNECTION_STATE.ACTIVATED);

  if (conns.length === 0) {
    return "Wifi not connected";
  }

  return (
    <>
      WiFi connected:
      <List>{renderConnections(conns)}</List>
    </>
  );
}
