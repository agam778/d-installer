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

import React, { useState } from "react";
import { Stack, StackItem, TreeView } from "@patternfly/react-core";
import {
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell
} from "@patternfly/react-core";
import {
  TableComposable,
  Caption,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent
} from "@patternfly/react-table";

import {
  EOS_WIFI as WifiIcon,
  EOS_CABLE as EthernetIcon // EOS_LAN is available in eos-icons >= 2.3
} from "eos-icons-react";

const ICONS = {
  wifi: WifiIcon,
  ethernet: EthernetIcon,
  bridge: () => null
};

const WIFI = "wifi";
const ETHERNET = "ethernet";
const BRIDGE = "bridge";
const CONNECTED = "connected";
const UNAVAILABLE = "unavailable";

const fakeConnection = {
  IPv4: {
    dhcp: true,
    address: "192.168.1.1"
  },
  IPv6: {
    dhcp: false,
    address: "0:0:0:0:0:ffff:c0a8:0102"
  },
  addresses() {
    return [this.IPv4?.address, this.IPv6?.address].filter(ip => ip !== undefined).join(", ");
  }
};

// const devices = [
//   { id: "wlp2s0", type: WIFI, status: CONNECTED, connection: fakeConnection },
//   { id: "virbr0", type: BRIDGE, status: CONNECTED, connection: fakeConnection },
//   { id: "enp0s31f6", type: ETHERNET, status: UNAVAILABLE }
// ];
//
const devices = [
  { id: "wlp2s0", type: WIFI, status: CONNECTED, connection: fakeConnection },
  { id: "enp0s31f6", type: ETHERNET, status: UNAVAILABLE }
];

const treeOptions = devices.map(device => {
  const deviceOptions = { id: device.id, name: device.id };
  const connectionDetails = [
    { title: "IPv4", name: "192.168.0.1" },
    { title: "IPv6", name: "DHCP" }
  ];

  if (device.status === CONNECTED) {
    deviceOptions["children"] = connectionDetails;
  }

  return deviceOptions;
});

const renderDevicesTree = () => <TreeView data={treeOptions} variant="compactNoBackground" />;

const renderDevicesDataList = () => {
  if (devices?.length === 0) {
    return (
      <StackItem>
        <Text>No network devices found</Text>
      </StackItem>
    );
  }

  return (
    <StackItem className="network-devices-table">
      <DataList isCompact aria-label="Network devices">
        {devices.map(device => {
          const Icon = ICONS[device.type];
          const Cell = ({ children, ...props }) => (
            <DataListCell {...props}>{children}</DataListCell>
          );

          return (
            <DataListItem key={device.id}>
              <DataListItemRow>
                <DataListItemCells
                  dataListCells={[
                    <Cell isIcon isFilled={false}>
                      <Icon />
                    </Cell>,
                    <Cell>{device.id}</Cell>,
                    <Cell>{device.status}</Cell>
                  ]}
                />
              </DataListItemRow>
            </DataListItem>
          );
        })}
      </DataList>
    </StackItem>
  );
};

export default function Network() {
  const [expandedDevices, setExpandedDevices] = useState([]);
  const isDeviceExpanded = device => expandedDevices.includes(device.id);
  const toggleExpandedDevice = device => {
    if (isDeviceExpanded(device)) {
      setExpandedDevices(expandedDevices.filter(d => d !== device.id));
    } else {
      setExpandedDevices([...expandedDevices, device.id]);
    }
  };

  const renderDevices = () => {
    if (devices?.length === 0) {
      return (
        <StackItem>
          <Text>No network devices found</Text>
        </StackItem>
      );
    }

    return (
      <StackItem>
        <TableComposable
          aria-label="Network devices"
          variant="compact"
          borders={false}
          className="network-devices-table"
        >
          <Thead>
            <Tr>
              <Th />
              <Th>Device ex.</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Addresses</Th>
            </Tr>
          </Thead>
          {devices.map((device, rowIndex) => {
            const detailsExpanded = isDeviceExpanded(device);
            const expandSettings = {
              rowIndex,
              isExpanded: detailsExpanded,
              onToggle: () => toggleExpandedDevice(device),
              expandId: `details-for-device-${device.id}`
            };

            return (
              <Tbody>
                <Tr key={device.id}>
                  <Td expand={expandSettings} />
                  <Td dataLabel="Device Id">{device.id}</Td>
                  <Td dataLabel="Device type">{device.type}</Td>
                  <Td dataLabel="Device status">{device.status}</Td>
                  <Td dataLabel="Addresses">{device.connection?.addresses()}</Td>
                </Tr>
                <Tr isExpanded={detailsExpanded}>
                  <Td />
                  <Td dataLabel={`Connection details for ${device.id}`} colSpan={3}>
                    <ExpandableRowContent>Whatever here</ExpandableRowContent>
                  </Td>
                </Tr>
              </Tbody>
            );
          })}
        </TableComposable>
      </StackItem>
    );
  };

  return (
    <Stack hasGutter className="overview-network">
      {renderDevices()}
    </Stack>
  );
}
