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
import { WithStatus, WithProgress } from "./mixins";
import cockpit from "../lib/cockpit";

const MANAGER_SERVICE = "org.opensuse.DInstaller.Manager";
const MANAGER_IFACE = "org.opensuse.DInstaller.Manager1";
const MANAGER_PATH = "/org/opensuse/DInstaller/Manager1";

/**
 * Manager base client
 *
 * @ignore
 */
class ManagerBaseClient {
  /**
   * @param {DBusClient} [dbusClient] - D-Bus client
   */
  constructor(dbusClient) {
    this.client = dbusClient || new DBusClient(MANAGER_SERVICE);
  }

  /**
   * Run probing process
   *
   * The progress of the probing process can be tracked through installer signals.
   *
   * @return {Promise<void>}
   */
  async startProbing() {
    const proxy = await this.client.proxy(MANAGER_IFACE);
    return proxy.Probe();
  }

  /**
   * Start the installation process
   *
   * The progress of the installation process can be tracked through installer signals.
   *
   * @return {Promise}
   */
  async startInstallation() {
    const proxy = await this.client.proxy(MANAGER_IFACE);
    return proxy.Commit();
  }

  /**
   * Return the installer status
   *
   * @return {Promise<number>}
   */
  async getPhase() {
    const proxy = await this.client.proxy(MANAGER_IFACE);
    return proxy.CurrentInstallationPhase;
  }

  /**
   * Register a callback to run when the "CurrentInstallationPhase" changes
   *
   * @param {function} handler - callback function
   * @return {import ("./dbus").RemoveFn} function to disable the callback
   */
  onPhaseChange(handler) {
    return this.client.onObjectChanged(MANAGER_PATH, MANAGER_IFACE, (changes) => {
      if ("CurrentInstallationPhase" in changes) {
        handler(changes.CurrentInstallationPhase.v);
      }
    });
  }

  /**
   * Returns whether calling the system reboot succeeded or not.
   *
   * @return {Promise<boolean>}
   */
  rebootSystem() {
    return cockpit.spawn(["/usr/sbin/shutdown", "-r", "now"]);
  }
}

/**
  * Client to interact with the D-Installer manager service
  */
class ManagerClient extends WithProgress(WithStatus(ManagerBaseClient, MANAGER_PATH), MANAGER_PATH) {}

export { ManagerClient };
