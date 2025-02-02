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

const USERS_SERVICE = "org.opensuse.DInstaller.Users";
const USERS_IFACE = "org.opensuse.DInstaller.Users1";
const USERS_PATH = "/org/opensuse/DInstaller/Users1";

/**
 * @typedef {object} User
 * @property {string} fullName - User full name
 * @property {string} userName - userName
 * @property {string} [password] - user password
 * @property {boolean} autologin - Whether autologin is enabled
 */

/**
* @typedef {object} UserSettings
* @property {User} [firstUser] - first user
* @property {boolean} [rootPasswordSet] - whether the root password is set
* @property {string} [rootSSHKey] - root SSH public key
*/

/**
 * Users client
 */
class UsersClient {
  /**
   * @param {DBusClient} [dbusClient] - D-Bus client
   */
  constructor(dbusClient) {
    this.client = dbusClient || new DBusClient(USERS_SERVICE);
  }

  /**
   * Returns the first user structure
   *
   * @return {Promise<User>}
   */
  async getUser() {
    const proxy = await this.client.proxy(USERS_IFACE);
    const [fullName, userName, autologin] = proxy.FirstUser;
    return { fullName, userName, autologin };
  }

  /**
   * Returns true if the root password is set
   *
   * @return {Promise<Boolean>}
   */
  async isRootPasswordSet() {
    const proxy = await this.client.proxy(USERS_IFACE);
    return proxy.RootPasswordSet;
  }

  /**
   * Sets the languages to install
   *
   * @param {User} user - object with full name, user name, password and boolean for autologin
   * @return {Promise<boolean>} whether the operation was successful or not
   */
  async setUser(user) {
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
   * Removes the first user
   *
   * @return {Promise<boolean>} whether the operation was successful or not
   */
  async removeUser() {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.RemoveFirstUser();
    return result === 0;
  }

  /**
   * Sets the root password
   *
   * @param {String} password - plain text root password ( maybe allow client side encryption?)
   * @return {Promise<boolean>} whether the operation was successful or not
   */
  async setRootPassword(password) {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.SetRootPassword(password, false);
    return result === 0;
  }

  /**
   * Clears the root password
   *
   * @return {Promise<boolean>} whether the operation was successful or not
   */
  async removeRootPassword() {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.RemoveRootPassword();
    return result === 0;
  }

  /**
   * Returns the root's public SSH key
   *
   * @return {Promise<String>} SSH public key or an empty string if it is not set
   */
  async getRootSSHKey() {
    const proxy = await this.client.proxy(USERS_IFACE);
    return proxy.RootSSHKey;
  }

  /**
   * Sets root's public SSH Key
   *
   * @param {String} key - plain text root ssh key. Empty string means disabled
   * @return {Promise<boolean>} whether the operation was successful or not
   */
  async setRootSSHKey(key) {
    const proxy = await this.client.proxy(USERS_IFACE);
    const result = await proxy.SetRootSSHKey(key);
    return result === 0;
  }

  /**
   * Registers a callback to run when user properties change
   *
   * @param {(userSettings: UserSettings) => void} handler - callback function
   * @return {import ("./dbus").RemoveFn} function to disable the callback
   */
  onUsersChange(handler) {
    return this.client.onObjectChanged(USERS_PATH, USERS_IFACE, changes => {
      if (changes.RootPasswordSet) {
        // @ts-ignore
        return handler({ rootPasswordSet: changes.RootPasswordSet.v });
      } else if (changes.RootSSHKey) {
        return handler({ rootSSHKey: changes.RootSSHKey.v.toString() });
      } else if (changes.FirstUser) {
        // @ts-ignore
        const [fullName, userName, autologin] = changes.FirstUser.v;
        return handler({ firstUser: { fullName, userName, autologin } });
      }
    });
  }
}

export { UsersClient };
