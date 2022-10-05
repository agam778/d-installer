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

type RemoveFn = () => void;
type ChangesFn = (changes: DBusChanges, invalid?: string[]) => void;
type signalFn = (path: string, iface: string, signal: string, args: any[]) => void;

type SignalMatch = {
  interface?: string,
  path?: string,
  path_namespace?: string,
  member?: string,
  arg0?: string
}

type DBusValue = {
  t: string,
  v: DBusValue | DBusValue[] | number | string | boolean | number[] | string[] | boolean[]
}

type DBusChanges = {
  [index: string]: DBusValue
}

class DBusClient {
  readonly client: any;

  constructor(service: string) {
    this.client = cockpit.dbus(service, { bus: "system", superuser: "try" });
  }

  /**
   * Registers a proxy for given iface
   *
   * @param iface - D-Bus iface
   * @param path - D-Bus object path
   * @return a cockpit DBusProxy
   */
  async proxy(iface: string, path?: string | undefined) {
    const proxy = this.client.proxy(iface, path, { watch: true });
    await proxy.wait();

    return proxy;
  }

  /**
   * Register a callback to run when properties change for given D-Bus path
   *
   * @param path - D-Bus path
   * @param iface - D-Bus interface name
   * @param handler - callback function
   * @return function to unsubscribe
   */
  onObjectChanged(path: string, iface: string, handler: ChangesFn): RemoveFn {
    const { remove } = this.client.subscribe(
      {
        path,
        interface: "org.freedesktop.DBus.Properties",
        member: "PropertiesChanged"
      },
      (_path: string, _iface: string, _signal: string, args: [string, DBusChanges, string[]]) => {
        const [source_iface, changes, invalid] = args;
        if (iface === source_iface) {
          handler(changes, invalid);
        }
      }
    );
    return remove;
  }

  /**
   * Register a callback to run when some D-Bus signal is emitted
   *
   * @param match - object decribing the signal
   * @param handler - callback function
   * @return function to unsubscribe
   */
  onSignal(match: SignalMatch, handler: signalFn): RemoveFn {
    const { remove } = this.client.subscribe(match, handler);
    return remove;
  }
}

export {
  DBusClient,
  type ChangesFn,
  type DBusChanges,
  type DBusValue,
  type SignalMatch,
  type RemoveFn,
};
