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
import { screen } from "@testing-library/react";
import { installerRender } from "./test-utils";
import { CONNECTION_STATE, CONNECTION_TYPES } from "./client/network";
import NetworkWifiStatus from "./NetworkWifiStatus";

describe("when there are no active connections", () => {
  it("displays 'WiFi not connected'", async () => {
    const conns = [
      {
        id: "Wifi Network",
        path: "/active/connection/wifi/2",
        state: CONNECTION_STATE.DEACTIVATED,
        type: CONNECTION_TYPES.WIFI,
        addresses: [{ address: "10.0.0.4", prefix: "22" }]
      }
    ];

    installerRender(<NetworkWifiStatus connections={conns} />);
    await screen.findByText("WiFi not connected");
  });
});

describe("when there are active connections", () => {
  it("displays active connectionsn ids along their ips", async () => {
    const conns = [
      {
        id: "WifiNet1",
        path: "/active/connection/wifi/2",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.WIFI,
        addresses: [{ address: "10.0.0.4", prefix: "22" }]
      },
      {
        id: "WifiNet2",
        path: "/active/connection/wifi/3",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.WIFI,
        addresses: [{ address: "10.0.0.5", prefix: "22" }]
      }
    ];

    installerRender(<NetworkWifiStatus connections={conns} />);
    await screen.findByText("WiFi connected: WifiNet1 10.0.0.4/22 - WifiNet2 10.0.0.5/22");
  });
});
