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

// @ts-check

import { DBusClient } from "./dbus";
import cockpit from "../lib/cockpit";

const proxyObject = {
  wait: jest.fn().mockResolvedValue(null)
};

const cockpitDBusClient = {
  proxy: jest.fn().mockReturnValue(proxyObject),
  call: jest.fn().mockReturnValue(true)
};

describe("DBusClient", () => {
  beforeEach(() => {
    cockpit.dbus = jest.fn().mockImplementation(() => cockpitDBusClient);
  });

  describe("#proxy", () => {
    it("returns a proxy for the given iface and path", async () => {
      const client = new DBusClient("org.opensuse.DInstaller");
      const proxy = await client.proxy(
        "org.opensuse.DInstaller.Manager", "/org/opensuse/DInstaller/Manager"
      );
      expect(cockpitDBusClient.proxy).toHaveBeenCalledWith(
        "org.opensuse.DInstaller.Manager", "/org/opensuse/DInstaller/Manager",
        { watch: true }
      );
      expect(proxy).toBe(proxyObject);
    });
  });

  describe("#call", () => {
    it("calls to the given D-Bus method", async () => {
      const client = new DBusClient("org.opensuse.DInstaller");
      const result = await client.call(
        "org.opensuse.DInstaller.Software",
        "/org/opensuse/DInstaller/Software",
        "SelectProduct",
        ["alp"]
      );
      expect(cockpitDBusClient.call).toHaveBeenCalledWith(
        "org.opensuse.DInstaller.Software",
        "/org/opensuse/DInstaller/Software",
        "SelectProduct",
        ["alp"]
      );
      expect(result).toEqual(true);
    });
  });
});
