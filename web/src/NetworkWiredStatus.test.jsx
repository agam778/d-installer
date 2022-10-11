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
import NetworkWiredStatus from "./NetworkWiredStatus";

describe("when there are no active connections", () => {
  it("displays 'Wired not connected'", async () => {
    const conns = [
      {
        id: "wired-connection",
        path: "/active/connection/wired/2",
        state: CONNECTION_STATE.DEACTIVATED,
        type: CONNECTION_TYPES.ETHERNET,
        addresses: [{ address: "10.0.0.4", prefix: "22" }]
      }
    ];

    installerRender(<NetworkWiredStatus connections={conns} />);
    await screen.findByText("Wired not connected");
  });
});

describe("when there are active connections", () => {
  it("displays active connectionsn ids along their ips", async () => {
    const conns = [
      {
        id: "Blue cable",
        path: "/active/connection/wired/2",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.ETHERNET,
        addresses: [{ address: "10.0.0.4", prefix: "22" }]
      },
      {
        id: "Wired connection 2",
        path: "/active/connection/wired/3",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.ETHERNET,
        addresses: [{ address: "10.0.0.5", prefix: "22" }]
      }
    ];

    installerRender(<NetworkWiredStatus connections={conns} />);
    await screen.findByText(
      "Wired connected: Blue cable 10.0.0.4/22 - Wired connection 2 10.0.0.5/22"
    );
  });
});
