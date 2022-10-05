/*
const USERS_IFACE = "org.opensuse.DInstaller.Users1";
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

import { DBusClient } from "./dbus";

const USERS_SERVICE = "org.opensuse.DInstaller.Users";
const USERS_IFACE = "org.opensuse.DInstaller.Users1";
const USERS_PATH = "/org/opensuse/DInstaller/Users1";

type User = {
  fullName: string,
  userName: string,
  password?: string,
  autologin: boolean
}

/**
 * Users client
 */
class UsersClient {
  client: DBusClient;

  constructor(dbusClient?: DBusClient) {
    this.client = dbusClient || new DBusClient(USERS_SERVICE);
  }

  /**
   * Return the first user structure
   */
  async getUser(): Promise<User> {
    const proxy = await this.client.proxy(USERS_IFACE);
    const [fullName, userName, autologin] = proxy.FirstUser;
    return { fullName, userName, autologin };
  }

  /**
   * Return true if root password is set
   */
  async isRootPasswordSet(): Promise<boolean> {
    const proxy = await this.client.proxy(USERS_IFACE);
    return proxy.RootPasswordSet;
  }

  /**
   * Set the languages to install
   *
   * @param user - object with full name, user name, password and boolean for autologin
   */
  async setUser(user: User): Promise<boolean> {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.SetFirstUser(
      user.fullName,
      user.userName,
      user.password,
      user.autologin,
      {}
    );
    return result === 0;
  }

  /**
   * Remove the first user
   */
  async removeUser(): Promise<boolean> {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.RemoveFirstUser();
    return result === 0;
  }

  /**
   * Set the root password
   *
   * @param {String} password - plain text root password ( maybe allow client side encryption?)
   */
  async setRootPassword(password): Promise<boolean> {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.SetRootPassword(password, false);
    return result === 0;
  }

  /**
   * Clear the root password
   */
  async removeRootPassword(): Promise<boolean> {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.RemoveRootPassword();
    return result === 0;
  }

  /**
   * Return string with ssh key or empty string
   */
  async getRootSSHKey(): Promise<string> {
    const proxy = await this.client.proxy(USERS_IFACE);
    return proxy.RootSSHKey;
  }

  /**
   * Set the root SSH Key
   *
   * @param key - plain text root ssh key. Empty string means disabled
   */
  async setRootSSHKey(key: string): Promise<boolean> {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.SetRootSSHKey(key);
    return result === 0;
  }

  /**
   * Register a callback to run when properties in the Users object change
   *
   * @param handler - callback function
   */
  onUsersChange(handler: ((changes: any) => void)) {
    return this.client.onObjectChanged(USERS_PATH, USERS_IFACE, changes => {
      if (changes.RootPasswordSet) {
        return handler({ rootPasswordSet: changes.RootPasswordSet.v });
      } else if (changes.RootSSHKey) {
        return handler({ rootSSHKey: changes.RootSSHKey.v });
      } else if (changes.FirstUser) {
        const [fullName, userName, autologin] = changes.FirstUser.v;
        return handler({ firstUser: { fullName, userName, autologin } });
      }
    });
  }
}

export default UsersClient;
