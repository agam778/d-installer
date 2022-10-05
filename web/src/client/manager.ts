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

import cockpit from "../lib/cockpit";
import { WithStatus, WithProgress } from "./mixins";
import { DBusClient } from "./dbus";

const MANAGER_SERVICE = "org.opensuse.DInstaller";
const MANAGER_IFACE = "org.opensuse.DInstaller.Manager1";
const MANAGER_PATH = "/org/opensuse/DInstaller/Manager1";

/**
 * Manager client
 */
class ManagerClient {
  client: DBusClient;

  constructor(dbusClient?: DBusClient) {
    this.client = dbusClient || new DBusClient(MANAGER_SERVICE);
  }

  /**
   * Run probing process
   *
   * The progress of the probing process can be tracked through installer
   * signals (see {onSignal}).
   */
  async startProbing(): Promise<void> {
    const proxy = await this.client.proxy(MANAGER_IFACE);
    return proxy.Probe();
  }

  /**
   * Start the installation process
   *
   * The progress of the installation process can be tracked through installer
   * signals (see {onSignal}).
   *
   * @return {Promise}
   */
  async startInstallation(): Promise<void> {
    const proxy = await this.client.proxy(MANAGER_IFACE);
    return proxy.Commit();
  }

  /**
   * Return the installer status
   */
  async getPhase(): Promise<number> {
    const proxy = await this.client.proxy(MANAGER_IFACE);
    return proxy.CurrentInstallationPhase;
  }

  /**
   * Register a callback to run when the "CurrentInstallationPhase" changes
   *
   * @param handler - callback function
   * @return function to disable callback
   */
  onPhaseChange(handler: (phase: string) => void): () => void {
    return this.client.onObjectChanged(MANAGER_PATH, MANAGER_IFACE, (changes: object) => {
      if ("CurrentInstallationPhase" in changes) {
        handler((changes as any).CurrentInstallationPhase.v);
      }
    });
  }

  /**
   * Returns whether calling the system reboot suceeded or not.
   */
  rebootSystem(): Promise<boolean> {
    return cockpit.spawn(["/usr/sbin/shutdown", "-r", "now"]);
  }
}

export default WithProgress(WithStatus(ManagerClient, MANAGER_PATH), MANAGER_PATH);
