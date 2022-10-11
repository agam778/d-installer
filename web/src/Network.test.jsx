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
import { createClient } from "./client";
import { CONNECTION_STATE, CONNECTION_TYPES } from "./client/network";

import Network from "./Network";

jest.mock("./client");

let connections = [];

const networkMock = {
  activeConnections: () => Promise.resolve(connections),
  listen: jest.fn()
};

beforeEach(() => {
  // if defined outside, the mock is cleared automatically
  createClient.mockImplementation(() => {
    return {
      network: {
        ...networkMock
      }
    };
  });
});

describe("when there both active connections, wifi and ethernet", () => {
  beforeEach(() => {
    connections = [
      {
        id: "active-wifi-connection",
        path: "/active/connection/wifi/1",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.WIFI,
        addresses: [{ address: "10.0.0.2", prefix: "22" }]
      },
      {
        id: "another-wifi-connection",
        path: "/active/connection/wifi/2",
        state: CONNECTION_STATE.DEACTIVATED,
        type: CONNECTION_TYPES.WIFI,
        addresses: [{ address: "10.0.0.3", prefix: "22" }]
      },
      {
        id: "active-wired-connection",
        path: "/active/connection/wired/1",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.ETHERNET,
        addresses: [{ address: "10.0.0.1", prefix: "22" }]
      }
    ];
  });

  it("displays active connections IDs and their IPs", async () => {
    installerRender(<Network />);
    await screen.findByText("Wired connected: active-wired-connection 10.0.0.1/22");
    await screen.findByText("WiFi connected: active-wifi-connection 10.0.0.2/22");
  });
});
describe("when there are no active connections", () => {
  beforeEach(() => {
    connections = [
      {
        id: "another-wifi-connection",
        path: "/active/connection/wifi/2",
        state: CONNECTION_STATE.DEACTIVATED,
        type: CONNECTION_TYPES.WIFI,
        addresses: [{ address: "10.0.0.3", prefix: "22" }]
      }
    ];
  });

  it("displays 'no connected' information", async () => {
    installerRender(<Network />);
    await screen.findByText("Wired not connected");
    await screen.findByText("WiFi not connected");
  });
});

describe("when there are only WiFi active connections", () => {
  beforeEach(() => {
    connections = [
      {
        id: "active-wifi-connection",
        path: "/active/connection/wifi/1",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.WIFI,
        addresses: [{ address: "10.0.0.2", prefix: "22" }]
      },
      {
        id: "another-wired-connection",
        path: "/active/connection/wired/2",
        state: CONNECTION_STATE.DEACTIVATING,
        type: CONNECTION_TYPES.ETHERNET,
        addresses: [{ address: "10.0.0.4", prefix: "22" }]
      }
    ];
  });

  it("displays 'Wired not connected'", async () => {
    installerRender(<Network />);
    await screen.findByText("Wired not connected");
  });

  it("displays IDs and IPs for active WiFi connection", async () => {
    installerRender(<Network />);
    await screen.findByText("WiFi connected: active-wifi-connection 10.0.0.2/22");
  });
});

describe("when there are only Wired active connections", () => {
  beforeEach(() => {
    connections = [
      {
        id: "active-wired-connection",
        path: "/active/connection/wired/1",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.ETHERNET,
        addresses: [{ address: "10.0.0.1", prefix: "22" }]
      },
      {
        id: "another-wifi-connection",
        path: "/active/connection/wifi/2",
        state: CONNECTION_STATE.DEACTIVATED,
        type: CONNECTION_TYPES.WIFI,
        addresses: [{ address: "10.0.0.3", prefix: "22" }]
      },
      {
        id: "another-wired-conn",
        path: "/active/connection/wired/2",
        state: CONNECTION_STATE.ACTIVATED,
        type: CONNECTION_TYPES.ETHERNET,
        addresses: [{ address: "10.0.0.4", prefix: "22" }]
      }
    ];
  });

  it("displays 'WiFi not connected'", async () => {
    installerRender(<Network />);
    await screen.findByText("WiFi not connected");
  });

  it("displays IDs and IPs for active Wired connections", async () => {
    installerRender(<Network />);
    await screen.findByText("Wired connected: active-wired-connection 10.0.0.1/22 - another-wired-conn 10.0.0.4/22");
  });
});
